"""Materials API endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db, Material, Settings

router = APIRouter()


@router.get("/materials")
async def get_materials(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Get all active materials.
    
    Returns:
        List of materials with prices
    """
    materials = db.query(Material).filter(Material.is_active == True).all()
    
    result = []
    for mat in materials:
        result.append({
            "id": f"{mat.name.lower().replace(' ', '_')}",
            "name": mat.name,
            "price_per_kg": mat.price_per_kg,
            "density_g_cm3": mat.density_g_cm3,
            "waste_pct": mat.waste_pct,
            "color": mat.color,
            "notes": mat.notes,
            "title_fa": mat.title_fa,
        })
    
    return result


@router.get("/settings")
async def get_settings(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get all settings.
    
    Returns:
        Dictionary of settings
    """
    settings_db = db.query(Settings).all()
    
    result = {}
    for s in settings_db:
        try:
            # Try to parse as JSON for complex values
            import json
            result[s.key] = json.loads(s.value)
        except (json.JSONDecodeError, TypeError):
            # Use as-is for simple values
            result[s.key] = s.value
    
    return result


@router.get("/settings/{key}")
async def get_setting(key: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Get a specific setting.
    
    Args:
        key: Setting key
        
    Returns:
        Setting value
    """
    setting = db.query(Settings).filter(Settings.key == key).first()
    
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    
    return {"key": key, "value": setting.value}


class SettingUpdate(BaseModel):
    value: str

@router.put("/settings/{key}")
async def update_setting(key: str, update: SettingUpdate, db: Session = Depends(get_db)):
    """
    Update a specific setting.
    
    Args:
        key: Setting key
        update: New value
        
    Returns:
        Updated setting
    """
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    setting.value = update.value
    db.commit()
    return {"key": key, "value": setting.value}
