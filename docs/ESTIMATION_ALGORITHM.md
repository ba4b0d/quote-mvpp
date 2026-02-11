# 📊 Accurate 3D Print Estimation Algorithm

## Overview

This document explains how we calculate accurate 3D printing estimates for STL/3MF files.

## Estimation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │ →  │  Parse 3D   │ →  │  Analyze    │ →  │  Calculate  │
│   File      │    │    Mesh     │    │   Metrics   │    │    Costs    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Step 1: Parse 3D Mesh

```python
import trimesh

def load_mesh(file_path):
    """Load and validate 3D file."""
    mesh = trimesh.load(file_path)
    
    # Handle multiple meshes (compound objects)
    if isinstance(mesh, trimesh.Scene):
        meshes = list(mesh.geometry.values())
        combined = trimesh.util.concatenate(meshes)
        return combined
    
    return mesh
```

## Step 2: Analyze Metrics

```python
def analyze_mesh(mesh):
    """Extract key metrics for estimation."""
    
    # Volume (cm³)
    volume_cm3 = mesh.volume / 1000  # Convert mm³ to cm³
    
    # Surface area (cm²)
    surface_cm2 = mesh.area / 100
    
    # Dimensions (mm)
    bounds = mesh.bounds  # [[min_x, min_y, min_z], [max_x, max_y, max_z]]
    dimensions = {
        'width': bounds[1][0] - bounds[0][0],
        'depth': bounds[1][1] - bounds[0][1], 
        'height': bounds[1][2] - bounds[0][2]
    }
    
    # Centroid for bed placement
    centroid = mesh.centroid
    
    return {
        'volume_cm3': volume_cm3,
        'surface_cm2': surface_cm2,
        'dimensions': dimensions,
        'centroid': centroid,
        'is_watertight': mesh.is_watertight,
        'is_convex': mesh.is_convex
    }
```

## Step 3: Calculate Material

```python
def calculate_material(volume_cm3, density_g_cm3, waste_pct=0.05):
    """Calculate filament needed."""
    
    base_material = volume_cm3 * density_g_cm3
    waste = base_material * waste_pct
    
    return {
        'base_grams': base_material,
        'waste_grams': waste,
        'total_grams': base_material + waste
    }
```

## Step 4: Estimate Print Time

```python
def estimate_print_time(
    volume_cm3,
    surface_cm2,
    dimensions,
    layer_height=0.2,  # mm
    infill_pct=0.20,
    speed_mm_s=50,
    machine_speed=60  # mm/s max
):
    """Calculate estimated print time in minutes."""
    
    # Total layers
    total_layers = int(dimensions['height'] / layer_height)
    
    # Base time per layer (bed adhesion, travel, etc.)
    base_time_per_layer = 30  # seconds
    
    # Volume-based extrusion time
    volume_per_layer = volume_cm3 / total_layers
    extrusion_time = volume_per_layer * 2.8  # seconds per cm³
    
    # Surface area affects cooling time
    cooling_factor = surface_cm2 * 0.5  # seconds
    
    # Infill affects time
    infill_time = volume_cm3 * infill_pct * 1.5
    
    # Total time per layer
    time_per_layer = base_time_per_layer + extrusion_time + cooling_factor
    time_per_layer *= (1 + infill_pct * 0.5)  # Infill adds time
    
    # Total print time
    total_seconds = total_layers * time_per_layer
    
    # Convert to hours:minutes
    total_minutes = total_seconds / 60
    
    return {
        'total_minutes': total_minutes,
        'hours': total_minutes // 60,
        'minutes': total_minutes % 60,
        'total_layers': total_layers
    }
```

## Step 5: Calculate Support Material

```python
def estimate_support_material(mesh, layer_height=0.2, support_angle=45):
    """Estimate support material based on overhangs."""
    
    # Find faces with normal pointing upward (> support_angle from vertical)
    normals = mesh.face_normals
    
    # Calculate angle from vertical (z-axis)
    z_angles = np.arccos(np.abs(normals[:, 2])) * 180 / np.pi
    
    # Faces needing support
    support_faces = np.where(z_angles > support_angle)[0]
    
    # Approximate support volume (simplified)
    support_ratio = len(support_faces) / len(normals)
    support_volume = mesh.volume * support_ratio * 0.5  # Conservative estimate
    
    return {
        'support_volume_cm3': support_volume / 1000,
        'support_grams': support_volume / 1000 * 1.24,  # PLA density
        'support_pct': support_ratio * 100
    }
```

## Step 6: Calculate Costs

```python
def calculate_total_cost(
    material_grams,
    print_time_minutes,
    material_price_per_kg,
    electricity_rate_per_kwh,
    overhead_pct=0.3,
    markup_pct=2.0
):
    """Calculate total quote cost."""
    
    # Material cost
    material_cost = (material_grams / 1000) * material_price_per_kg
    
    # Electricity cost (assume 200W average power)
    electricity_kwh = (print_time_minutes / 60) * 0.2
    electricity_cost = electricity_kwh * electricity_rate_per_kwh
    
    # Labor/overhead
    labor_cost = print_time_minutes * 2500  # IRT per minute
    
    # Subtotal
    subtotal = material_cost + electricity_cost + labor_cost
    
    # Overhead
    overhead = subtotal * overhead_pct
    
    # Markup
    markup = subtotal * markup_pct
    
    # Total
    total = subtotal + overhead + markup
    
    return {
        'material_cost': material_cost,
        'electricity_cost': electricity_cost,
        'labor_cost': labor_cost,
        'overhead': overhead,
        'markup': markup,
        'total': total
    }
```

## Complete Pipeline

```python
def generate_quote(stl_path, material_id, settings):
    """Generate complete quote for a 3D file."""
    
    # Load and analyze
    mesh = load_mesh(stl_path)
    metrics = analyze_mesh(mesh)
    
    # Calculate material
    material = calculate_material(
        volume_cm3=metrics['volume_cm3'],
        density_g_cm3=1.24,  # PLA
        waste_pct=0.05
    )
    
    # Calculate time
    time = estimate_print_time(
        volume_cm3=metrics['volume_cm3'],
        surface_cm2=metrics['surface_cm2'],
        dimensions=metrics['dimensions'],
        layer_height=settings.get('layer_height', 0.2),
        infill_pct=settings.get('infill', 0.2)
    )
    
    # Calculate support
    support = estimate_support_material(mesh)
    
    # Get material price
    material_price = get_material_price(material_id)  # IRT per kg
    
    # Calculate costs
    costs = calculate_total_cost(
        material_grams=material['total_grams'],
        print_time_minutes=time['total_minutes'],
        material_price_per_kg=material_price
    )
    
    return {
        'metrics': metrics,
        'material': material,
        'time': time,
        'support': support,
        'costs': costs
    }
```

## Accuracy Tips

| Tip | Impact |
|-----|--------|
| Use actual machine profiles | +15% accuracy |
| Calibrate e-steps | +10% accuracy |
| Account for temp changes | +5% accuracy |
| Multiple test prints | +20% accuracy |

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Mesh not watertight | Use meshrepair (trimesh.repair) |
| Very thin walls | Warn user, reduce infill |
| Large overhangs | Auto-add support cost |
| Complex geometry | Use slicing software for calibration |

---

**This is the estimation engine we'll build into the new system! 🦖💻**
