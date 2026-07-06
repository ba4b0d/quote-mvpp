"""Materials & Settings API endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.core.database import get_db, Material, Settings

router = APIRouter()


# ── Materials ──────────────────────────────────────────────

class MaterialCreate(BaseModel):
    name: str
    price_per_kg: float
    density_g_cm3: float = 1.24
    waste_pct: float = 0.05
    color: Optional[str] = None
    notes: Optional[str] = None
    title_fa: Optional[str] = None

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    price_per_kg: Optional[float] = None
    density_g_cm3: Optional[float] = None
    waste_pct: Optional[float] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    title_fa: Optional[str] = None
    is_active: Optional[bool] = None


def mat_to_dict(mat: Material) -> Dict[str, Any]:
    return {
        "id": mat.id,
        "slug": f"{mat.name.lower().replace(' ', '_')}",
        "name": mat.name,
        "price_per_kg": mat.price_per_kg,
        "density_g_cm3": mat.density_g_cm3,
        "waste_pct": mat.waste_pct,
        "color": mat.color,
        "notes": mat.notes,
        "title_fa": mat.title_fa,
        "is_active": mat.is_active,
    }


@router.get("/materials/all")
async def get_all_materials(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    materials = db.query(Material).all()
    return [mat_to_dict(m) for m in materials]


@router.get("/materials")
async def get_materials(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    materials = db.query(Material).filter(Material.is_active == True).all()
    return [mat_to_dict(m) for m in materials]


@router.post("/materials")
async def create_material(data: MaterialCreate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    mat = Material(
        name=data.name,
        price_per_kg=data.price_per_kg,
        density_g_cm3=data.density_g_cm3,
        waste_pct=data.waste_pct,
        color=data.color,
        notes=data.notes,
        title_fa=data.title_fa,
    )
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat_to_dict(mat)


@router.put("/materials/{material_id}")
async def update_material(material_id: int, data: MaterialUpdate, db: Session = Depends(get_db)) -> Dict[str, Any]:
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(mat, field, value)
    
    db.commit()
    db.refresh(mat)
    return mat_to_dict(mat)


@router.delete("/materials/{material_id}")
async def delete_material(material_id: int, db: Session = Depends(get_db)):
    mat = db.query(Material).filter(Material.id == material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")
    
    db.delete(mat)
    db.commit()
    return {"success": True, "message": f"Material '{mat.name}' deleted"}


# ── Settings ───────────────────────────────────────────────

@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    settings_db = db.query(Settings).all()
    result = {}
    for s in settings_db:
        try:
            import json
            result[s.key] = json.loads(s.value)
        except (json.JSONDecodeError, TypeError):
            result[s.key] = s.value
    return result


@router.get("/settings/{key}")
async def get_setting(key: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return {"key": key, "value": setting.value}


class SettingUpdate(BaseModel):
    value: str

@router.put("/settings/{key}")
async def update_setting(key: str, update: SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        setting = Settings(key=key, value=update.value)
        db.add(setting)
    else:
        setting.value = update.value
    db.commit()
    return {"key": key, "value": setting.value}
