"""Quote API endpoints."""

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
import json

from app.services.estimation import EstimationService

router = APIRouter()

# Initialize estimation service
estimation_service = EstimationService()

# Mock material prices (in production, load from database)
MATERIAL_PRICES = {
    "pla_black": 1650000,
    "pla_orange": 1650000,
    "pla_gray": 1650000,
    "pla_red": 1650000,
    "pla_white": 1650000,
    "pla_silk": 1750000,
    "petg": 1750000,
    "tpu": 2480000,
    "wood": 1750000,
    "pla_plus": 1650000,
}

# Default settings (in production, load from database)
DEFAULT_SETTINGS = {
    "electricity_rate_per_kwh": 812,
    "overhead_pct": 0.3,
    "markup_pct": 2.0,
    "coloring_cost_per_hour": 150000,
}


@router.post("/estimate")
async def estimate_from_file(
    file: UploadFile = File(...),
    material_id: str = "pla_black",
    layer_height: float = 0.2,
    infill: float = 0.20,
) -> Dict[str, Any]:
    """
    Generate quote from uploaded 3D file.
    
    Args:
        file: STL/3MF file upload
        material_id: Selected material
        layer_height: Layer height in mm
        infill: Infill percentage (0-1)
        
    Returns:
        Complete quote with metrics and costs
    """
    # Validate file type
    filename = file.filename.lower()
    if not any(ext in filename for ext in ['.stl', '.3mf', '.obj']):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Supported: STL, 3MF, OBJ"
        )
    
    try:
        result = estimation_service.estimate_from_file(
            file_obj=file,
            material_id=material_id,
            material_prices=MATERIAL_PRICES,
            settings=DEFAULT_SETTINGS,
            options={
                "layer_height": layer_height,
                "infill": infill,
            }
        )
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing file: {str(e)}"
        )


@router.post("/manual")
async def estimate_manual(
    grams: float,
    minutes: float,
    material_id: str = "pla_black",
) -> Dict[str, Any]:
    """
    Generate quote from manual input.
    
    Args:
        grams: Filament weight in grams
        minutes: Print time in minutes
        material_id: Selected material
        
    Returns:
        Complete quote with costs
    """
    result = estimation_service.estimate_manual(
        grams=grams,
        minutes=minutes,
        material_id=material_id,
        material_prices=MATERIAL_PRICES,
        settings=DEFAULT_SETTINGS
    )
    return result


@router.get("/calculate")
async def calculate_quote(
    volume_cm3: float,
    material_id: str = "pla_black",
    layer_height: float = 0.2,
    infill: float = 0.20,
    height_mm: float = 10.0,
) -> Dict[str, Any]:
    """
    Calculate quote from parameters (no file upload).
    
    Args:
        volume_cm3: Model volume in cm³
        material_id: Selected material
        layer_height: Layer height in mm
        infill: Infill percentage (0-1)
        height_mm: Model height for layer count
        
    Returns:
        Quote calculation
    """
    from app.services.mesh_analysis import estimate_print_time
    from app.services.pricing import (
        calculate_material_cost, calculate_electricity_cost,
        calculate_labor_cost, calculate_total_cost
    )
    
    # Get material price
    material_price = MATERIAL_PRICES.get(material_id, MATERIAL_PRICES['pla_black'])
    
    # Calculate material (estimate based on volume)
    density = 1.24  # PLA
    waste = 0.05
    base_grams = volume_cm3 * density
    total_grams = base_grams * (1 + waste)
    
    # Calculate print time
    time_est = estimate_print_time(
        volume_cm3=volume_cm3,
        surface_cm2=volume_cm3 * 5,  # Rough estimate
        height_mm=height_mm,
        layer_height=layer_height,
        infill_pct=infill
    )
    
    # Calculate costs
    material_cost = calculate_material_cost(total_grams, material_price)
    electricity_cost = calculate_electricity_cost(time_est['total_minutes'])
    labor_cost = calculate_labor_cost(time_est['total_minutes'])
    breakdown = calculate_total_cost(material_cost, electricity_cost, labor_cost)
    
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
