"""3D Mesh Analysis Service for Accurate Estimation."""

import trimesh
import numpy as np
from typing import Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class MeshMetrics:
    """Metrics extracted from a 3D mesh."""
    volume_mm3: float
    volume_cm3: float
    surface_area_mm2: float
    surface_area_cm2: float
    width_mm: float
    depth_mm: float
    height_mm: float
    centroid_x: float
    centroid_y: float
    centroid_z: float
    is_watertight: bool
    is_convex: bool
    face_count: int
    vertex_count: int
    estimated_grams: float
    estimated_layers: int


class MeshAnalyzer:
    """Analyze 3D meshes for print estimation."""
    
    def __init__(self, density_g_cm3: float = 1.24, waste_pct: float = 0.05):
        self.density_g_cm3 = density_g_cm3
        self.waste_pct = waste_pct
    
    def load(self, file_path: str) -> trimesh.Trimesh:
        """Load a 3D file and return mesh."""
        mesh = trimesh.load(file_path)
        
        if isinstance(mesh, trimesh.Scene):
            meshes = list(mesh.geometry.values())
            if not meshes:
                raise ValueError("No geometry found in file")
            mesh = trimesh.util.concatenate(meshes)
        
        return mesh
    
    def load_file(self, file_obj) -> trimesh.Trimesh:
        """Load from file object (upload). Accepts bytes or file-like object."""
        import tempfile
        import os
        
        # Accept raw bytes directly
        if isinstance(file_obj, (bytes, bytearray)):
            content = file_obj
        else:
            content = file_obj.read()
        
        with tempfile.NamedTemporaryFile(suffix=".stl", delete=False) as f:
            f.write(content)
            temp_path = f.name
        
        try:
            mesh = self.load(temp_path)
            os.unlink(temp_path)
            return mesh
        except Exception as e:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
    
    def analyze(self, mesh: trimesh.Trimesh, layer_height: float = 0.2) -> MeshMetrics:
        """Analyze mesh and extract metrics."""
        volume_mm3 = mesh.volume
        volume_cm3 = volume_mm3 / 1000
        surface_area_mm2 = mesh.area
        surface_area_cm2 = surface_area_mm2 / 100
        
        bounds = mesh.bounds
        width_mm = bounds[1][0] - bounds[0][0]
        depth_mm = bounds[1][1] - bounds[0][1]
        height_mm = bounds[1][2] - bounds[0][2]
        
        centroid = mesh.centroid
        is_watertight = mesh.is_watertight
        is_convex = mesh.is_convex
        face_count = len(mesh.faces)
        vertex_count = len(mesh.vertices)
        
        base_grams = volume_cm3 * self.density_g_cm3
        waste_grams = base_grams * self.waste_pct
        total_grams = base_grams + waste_grams
        
        estimated_layers = int(height_mm / layer_height) + 1
        
        return MeshMetrics(
            volume_mm3=volume_mm3,
            volume_cm3=volume_cm3,
            surface_area_mm2=surface_area_mm2,
            surface_area_cm2=surface_area_cm2,
            width_mm=width_mm,
            depth_mm=depth_mm,
            height_mm=height_mm,
            centroid_x=centroid[0],
            centroid_y=centroid[1],
            centroid_z=centroid[2],
            is_watertight=is_watertight,
            is_convex=is_convex,
            face_count=face_count,
            vertex_count=vertex_count,
            estimated_grams=total_grams,
            estimated_layers=estimated_layers
        )
    
    def to_dict(self, metrics: MeshMetrics) -> Dict[str, Any]:
        """Convert metrics to dictionary."""
        return {
            "volume_cm3": round(metrics.volume_cm3, 2),
            "surface_area_cm2": round(metrics.surface_area_cm2, 2),
            "dimensions_mm": {
                "width": round(metrics.width_mm, 1),
                "depth": round(metrics.depth_mm, 1),
                "height": round(metrics.height_mm, 1),
            },
            "centroid_mm": {
                "x": round(metrics.centroid_x, 1),
                "y": round(metrics.centroid_y, 1),
                "z": round(metrics.centroid_z, 1),
            },
            "properties": {
                "is_watertight": metrics.is_watertight,
                "is_convex": metrics.is_convex,
                "face_count": metrics.face_count,
                "vertex_count": metrics.vertex_count,
            },
            "material_grams": round(metrics.estimated_grams, 2),
            "estimated_layers": metrics.estimated_layers,
        }


def estimate_print_time(
    volume_cm3: float,
    surface_cm2: float,
    height_mm: float,
    layer_height: float = 0.2,
    infill_pct: float = 0.20,
    speed_mm_s: float = 50.0,
) -> Dict[str, Any]:
    """Estimate print time based on mesh metrics."""
    total_layers = max(1, int(height_mm / layer_height))
    base_time_per_layer = 20
    volume_per_layer = volume_cm3 / total_layers if total_layers > 0 else volume_cm3
    extrusion_time = volume_per_layer * 2.8
    cooling_time = surface_cm2 * 0.3
    infill_time = volume_cm3 * infill_pct * 1.5
    time_per_layer = base_time_per_layer + extrusion_time + cooling_time
    time_per_layer *= (1 + infill_pct * 0.5)
    total_seconds = total_layers * time_per_layer
    support_time = total_seconds * 0.1
    total_seconds += support_time
    total_minutes = total_seconds / 60
    hours = int(total_minutes // 60)
    minutes = int(total_minutes % 60)
    
    return {
        "total_minutes": round(total_minutes, 1),
        "hours": hours,
        "minutes": minutes,
        "total_layers": total_layers,
        "time_per_layer_sec": round(time_per_layer, 1),
    }


def estimate_support_material(
    mesh: trimesh.Trimesh,
    layer_height: float = 0.2,
    support_angle: float = 45.0,
    density_g_cm3: float = 1.24
) -> Dict[str, Any]:
    """Estimate support material needed."""
    normals = mesh.face_normals
    angles_from_vertical = np.arccos(np.abs(normals[:, 2])) * 180 / np.pi
    support_faces = np.where(angles_from_vertical > support_angle)[0]
    support_ratio = len(support_faces) / len(normals) if len(normals) > 0 else 0
    support_volume_ratio = support_ratio * 0.5
    support_volume_cm3 = mesh.volume / 1000 * support_volume_ratio
    support_grams = support_volume_cm3 * density_g_cm3
    support_layers = int(mesh.bounds[1][2] / layer_height * support_ratio)
    
    return {
        "support_volume_cm3": round(support_volume_cm3, 3),
        "support_grams": round(support_grams, 2),
        "support_ratio_pct": round(support_ratio * 100, 1),
        "support_layers": support_layers,
        "needs_support": support_ratio > 0.1,
    }
