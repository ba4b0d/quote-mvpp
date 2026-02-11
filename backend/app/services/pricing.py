"""Pricing calculation service."""

from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class CostBreakdown:
    """Detailed cost breakdown."""
    material_cost: float
    electricity_cost: float
    labor_cost: float
    overhead: float
    markup: float
    total: float


def calculate_material_cost(
    grams: float,
    price_per_kg: float,
    waste_pct: float = 0.05
) -> float:
    """Calculate material cost including waste."""
    total_grams = grams * (1 + waste_pct)
    return (total_grams / 1000) * price_per_kg


def calculate_electricity_cost(
    print_time_minutes: float,
    power_watts: float = 200,  # Average 3D printer power
    rate_per_kwh: int = 812  # IRT per kWh
) -> float:
    """Calculate electricity cost."""
    kwh = (print_time_minutes / 60) * (power_watts / 1000)
    return kwh * rate_per_kwh


def calculate_labor_cost(
    print_time_minutes: float,
    cost_per_minute: float = 2500  # IRT per minute
) -> float:
    """Calculate labor/handling cost."""
    return print_time_minutes * cost_per_minute


def calculate_total_cost(
    material_cost: float,
    electricity_cost: float,
    labor_cost: float,
    overhead_pct: float = 0.3,
    markup_pct: float = 2.0
) -> CostBreakdown:
    """Calculate complete cost breakdown."""
    
    subtotal = material_cost + electricity_cost + labor_cost
    
    overhead = subtotal * overhead_pct
    markup = subtotal * markup_pct
    total = subtotal + overhead + markup
    
    return CostBreakdown(
        material_cost=round(material_cost, 0),
        electricity_cost=round(electricity_cost, 0),
        labor_cost=round(labor_cost, 0),
        overhead=round(overhead, 0),
        markup=round(markup, 0),
        total=round(total, 0)
    )


def format_currency(amount: float, currency: str = "IRT") -> str:
    """Format currency for display."""
    return f"{amount:,.0f} {currency}"


def generate_quote(
    volume_cm3: float,
    material_grams: float,
    print_time_minutes: float,
    material_price_per_kg: float,
    settings: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Generate complete quote with all details.
    
    Args:
        volume_cm3: Model volume in cm³
        material_grams: Material needed in grams
        print_time_minutes: Estimated print time
        material_price_per_kg: Price per kg of material
        settings: Optional settings override
        
    Returns:
        Complete quote dictionary
    """
    if settings is None:
        settings = {}
    
    # Get settings with defaults
    electricity_rate = settings.get('electricity_rate_per_kwh', 812)
    overhead_pct = settings.get('overhead_pct', 0.3)
    markup_pct = settings.get('markup_pct', 2.0)
    coloring_cost = settings.get('coloring_cost_per_hour', 150000)
    
    # Calculate costs
    material_cost = calculate_material_cost(
        grams=material_grams,
        price_per_kg=material_price_per_kg
    )
    
    electricity_cost = calculate_electricity_cost(
        print_time_minutes=print_time_minutes,
        rate_per_kwh=electricity_rate
    )
    
    labor_cost = calculate_labor_cost(
        print_time_minutes=print_time_minutes,
        cost_per_minute=coloring_cost / 60
    )
    
    breakdown = calculate_total_cost(
        material_cost=material_cost,
        electricity_cost=electricity_cost,
        labor_cost=labor_cost,
        overhead_pct=overhead_pct,
        markup_pct=markup_pct
    )
    
    # Format for response
    return {
        "input": {
            "volume_cm3": round(volume_cm3, 2),
            "material_grams": round(material_grams, 2),
            "print_time_minutes": round(print_time_minutes, 1),
        },
        "costs": {
            "material": format_currency(breakdown.material_cost),
            "electricity": format_currency(breakdown.electricity_cost),
            "labor": format_currency(breakdown.labor_cost),
            "overhead": format_currency(breakdown.overhead),
            "markup": format_currency(breakdown.markup),
            "total": format_currency(breakdown.total),
        },
        "breakdown": {
            "material_cost": breakdown.material_cost,
            "electricity_cost": breakdown.electricity_cost,
            "labor_cost": breakdown.labor_cost,
            "overhead": breakdown.overhead,
            "markup": breakdown.markup,
            "total": breakdown.total,
        },
        "print_time": {
            "minutes": round(print_time_minutes, 1),
            "hours": int(print_time_minutes // 60),
            "remaining_minutes": int(print_time_minutes % 60),
        }
    }
