"""Quote API endpoints."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.services.estimation import EstimationService
from app.core.database import get_db, Material, Settings

router = APIRouter()

estimation_service = EstimationService()


def get_material_prices(db: Session) -> Dict[str, float]:
    """Load material prices from database, fallback to hardcoded."""
    materials = db.query(Material).filter(Material.is_active == True).all()
    if materials:
        return {m.name.lower().replace(' ', '_'): m.price_per_kg for m in materials}
    # Fallback if DB is empty
    return {"pla_black": 1650000}


def get_settings_dict(db: Session) -> Dict[str, Any]:
    """Load settings from database."""
    defaults = {
        "electricity_rate_per_kwh": 812,
        "overhead_pct": 0.3,
        "markup_pct": 2.0,
        "coloring_cost_per_hour": 150000,
    }
    settings_db = db.query(Settings).all()
    for s in settings_db:
        try:
            defaults[s.key] = float(s.value)
        except (ValueError, TypeError):
            pass
    return defaults


class ManualQuoteRequest(BaseModel):
    grams: float
    minutes: float
    material_id: str = "pla_black"


@router.post("/estimate")
async def estimate_from_file(
    file: UploadFile = File(...),
    material_id: str = "pla_black",
    layer_height: float = 0.2,
    infill: float = 0.20,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Generate quote from uploaded 3D file."""
    filename = file.filename.lower()
    if not any(ext in filename for ext in ['.stl', '.3mf', '.obj']):
        raise HTTPException(status_code=400, detail="Invalid file type. Supported: STL, 3MF, OBJ")
    
    try:
        file_bytes = await file.read()
        print(f"[ESTIMATE] File: {file.filename}, size: {len(file_bytes)} bytes")
        
        material_prices = get_material_prices(db)
        settings = get_settings_dict(db)
        
        result = estimation_service.estimate_from_file(
            file_obj=file_bytes,
            material_id=material_id,
            material_prices=material_prices,
            settings=settings,
            options={"layer_height": layer_height, "infill": infill}
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ESTIMATE ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/manual")
async def estimate_manual(request: ManualQuoteRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Generate quote from manual input."""
    try:
        material_prices = get_material_prices(db)
        settings = get_settings_dict(db)
        
        result = estimation_service.estimate_manual(
            grams=request.grams,
            minutes=request.minutes,
            material_id=request.material_id,
            material_prices=material_prices,
            settings=settings
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/calculate")
async def calculate_quote(
    volume_cm3: float,
    material_id: str = "pla_black",
    layer_height: float = 0.2,
    infill: float = 0.20,
    height_mm: float = 10.0,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Calculate quote from parameters (no file upload)."""
    from app.services.mesh_analysis import estimate_print_time
    from app.services.pricing import (
        calculate_material_cost, calculate_electricity_cost,
        calculate_labor_cost, calculate_total_cost
    )
    
    material_prices = get_material_prices(db)
    settings = get_settings_dict(db)
    material_price = material_prices.get(material_id, 1650000)
    
    density = 1.24
    waste = 0.05
    base_grams = volume_cm3 * density
    total_grams = base_grams * (1 + waste)
    
    time_est = estimate_print_time(
        volume_cm3=volume_cm3,
        surface_cm2=volume_cm3 * 5,
        height_mm=height_mm,
        layer_height=layer_height,
        infill_pct=infill
    )
    
    material_cost = calculate_material_cost(total_grams, material_price)
    electricity_cost = calculate_electricity_cost(time_est['total_minutes'])
    labor_cost = calculate_labor_cost(time_est['total_minutes'])
    breakdown = calculate_total_cost(
        material_cost, electricity_cost, labor_cost,
        overhead_pct=settings.get('overhead_pct', 0.3),
        markup_pct=settings.get('markup_pct', 2.0)
    )
    
    return {
        "success": True,
        "input": {
            "volume_cm3": volume_cm3,
            "material_grams": total_grams,
            "print_time_minutes": time_est['total_minutes'],
        },
        "costs": {
            "material_cost": breakdown.material_cost,
            "electricity_cost": breakdown.electricity_cost,
            "labor_cost": breakdown.labor_cost,
            "overhead": breakdown.overhead,
            "markup": breakdown.markup,
            "total": breakdown.total,
        },
        "formatted": {
            "total": f"{breakdown.total:,.0f} IRT",
            "time": f"{time_est['hours']}h {time_est['minutes']}m",
        }
    }
