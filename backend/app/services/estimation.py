"""Quote estimation service - combines mesh analysis and pricing."""

from typing import Dict, Any, Optional
from app.services.mesh_analysis import MeshAnalyzer, MeshMetrics, estimate_print_time
from app.services.pricing import calculate_material_cost, calculate_electricity_cost
from app.services.pricing import calculate_labor_cost, calculate_total_cost


class EstimationService:
    """Main service for generating quotes."""
    
    def __init__(
        self,
        default_layer_height: float = 0.2,
        default_infill_pct: float = 0.20,
        default_waste_pct: float = 0.05,
        default_density_g_cm3: float = 1.24,
    ):
        """
        Initialize estimation service.
        
        Args:
            default_layer_height: Default layer height in mm
            default_infill_pct: Default infill percentage
            default_waste_pct: Default waste percentage
            default_density_g_cm3: Default material density
        """
        self.analyzer = MeshAnalyzer(
            density_g_cm3=default_density_g_cm3,
            waste_pct=default_waste_pct
        )
        self.default_layer_height = default_layer_height
        self.default_infill_pct = default_infill_pct
    
    def estimate_from_file(
        self,
        file_obj,
        material_id: str,
        material_prices: Dict[str, float],
        settings: Dict[str, Any] = None,
        options: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate quote from uploaded file.
        
        Args:
            file_obj: Uploaded file object
            material_id: Selected material ID
            material_prices: Dictionary of material prices per kg
            settings: Global settings
            options: Print options (layer_height, infill, etc.)
            
        Returns:
            Complete quote dictionary
        """
        # Get options with defaults
        opts = options or {}
        layer_height = opts.get('layer_height', self.default_layer_height)
        infill_pct = opts.get('infill', self.default_infill_pct)
        
        # Load and analyze mesh
        mesh = self.analyzer.load_file(file_obj)
        metrics = self.analyzer.analyze(mesh, layer_height)
        
        # Calculate print time
        time_est = estimate_print_time(
            volume_cm3=metrics.volume_cm3,
            surface_cm2=metrics.surface_area_cm2,
            height_mm=metrics.height_mm,
            layer_height=layer_height,
            infill_pct=infill_pct
        )
        
        # Get material price
        material_price = material_prices.get(material_id, material_prices.get('pla_black', 1650000))
        
        # Calculate costs
        material_cost = calculate_material_cost(
            grams=metrics.estimated_grams,
            price_per_kg=material_price,
            waste_pct=0  # Already included in estimated_grams
        )
        
        electricity_cost = calculate_electricity_cost(
            print_time_minutes=time_est['total_minutes'],
            rate_per_kwh=settings.get('electricity_rate_per_kwh', 812) if settings else 812
        )
        
        labor_cost = calculate_labor_cost(
            print_time_minutes=time_est['total_minutes'],
            cost_per_minute=(settings.get('coloring_cost_per_hour', 150000) / 60) if settings else 2500
        )
        
        breakdown = calculate_total_cost(
            material_cost=material_cost,
            electricity_cost=electricity_cost,
            labor_cost=labor_cost,
            overhead_pct=settings.get('overhead_pct', 0.3) if settings else 0.3,
            markup_pct=settings.get('markup_pct', 2.0) if settings else 2.0
        )
        
        return {
            "success": True,
            "mesh_metrics": self.analyzer.to_dict(metrics),
            "print_time": {
                "total_minutes": time_est['total_minutes'],
                "hours": time_est['hours'],
                "minutes": time_est['minutes'],
                "total_layers": time_est['total_layers'],
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
                "material": f"{breakdown.material_cost:,.0f} IRT",
                "time": f"{time_est['hours']}h {time_est['minutes']}m",
            },
            "material": {
                "id": material_id,
                "price_per_kg": material_price,
            },
            "options": {
                "layer_height": layer_height,
                "infill_pct": infill_pct,
            }
        }
    
    def estimate_manual(
        self,
        grams: float,
        minutes: float,
        material_id: str,
        material_prices: Dict[str, float],
        settings: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate quote from manual input.
        
        Args:
            grams: Filament weight in grams
            minutes: Print time in minutes
            material_id: Selected material ID
            material_prices: Material prices
            settings: Global settings
            
        Returns:
            Complete quote dictionary
        """
        material_price = material_prices.get(material_id, material_prices.get('pla_black', 1650000))
        
        material_cost = calculate_material_cost(
            grams=grams,
            price_per_kg=material_price
        )
        
        electricity_cost = calculate_electricity_cost(
            print_time_minutes=minutes,
            rate_per_kwh=settings.get('electricity_rate_per_kwh', 812) if settings else 812
        )
        
        labor_cost = calculate_labor_cost(
            print_time_minutes=minutes,
            cost_per_minute=(settings.get('coloring_cost_per_hour', 150000) / 60) if settings else 2500
        )
        
        breakdown = calculate_total_cost(
            material_cost=material_cost,
            electricity_cost=electricity_cost,
            labor_cost=labor_cost,
            overhead_pct=settings.get('overhead_pct', 0.3) if settings else 0.3,
            markup_pct=settings.get('markup_pct', 2.0) if settings else 2.0
        )
        
        hours = int(minutes // 60)
        mins = int(minutes % 60)
        
        return {
            "success": True,
            "input": {
                "grams": grams,
                "minutes": minutes,
            },
            "print_time": {
                "total_minutes": minutes,
                "hours": hours,
                "minutes": mins,
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
                "material": f"{breakdown.material_cost:,.0f} IRT",
                "time": f"{hours}h {mins}m",
            },
        }
