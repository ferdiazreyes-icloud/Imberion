"""
Elasticity calculation engine using log-log regression.

Price elasticity of demand: %ΔQ / %ΔP
Estimated via log-log regression: ln(Q) = α + ε * ln(P) + error
Where ε is the price elasticity coefficient.
"""
from __future__ import annotations

import numpy as np
from scipy import stats


def calculate_elasticity(prices: list[float], volumes: list[float]) -> dict:
    """
    Calculate price elasticity using log-log regression.

    Returns dict with coefficient, p_value, r_squared, confidence_level, sample_size.
    """
    prices_arr = np.array(prices, dtype=float)
    volumes_arr = np.array(volumes, dtype=float)

    # Filter out zeros and negatives
    mask = (prices_arr > 0) & (volumes_arr > 0)
    prices_arr = prices_arr[mask]
    volumes_arr = volumes_arr[mask]

    if len(prices_arr) < 5:
        return {
            "coefficient": 0.0,
            "p_value": 1.0,
            "r_squared": 0.0,
            "confidence_level": "low",
            "sample_size": len(prices_arr),
            "valid": False,
        }

    log_prices = np.log(prices_arr)
    log_volumes = np.log(volumes_arr)

    slope, intercept, r_value, p_value, std_err = stats.linregress(log_prices, log_volumes)

    r_squared = r_value ** 2

    if p_value < 0.05 and r_squared > 0.7:
        confidence = "high"
    elif p_value < 0.1 and r_squared > 0.4:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "coefficient": round(float(slope), 4),
        "intercept": round(float(intercept), 4),
        "p_value": round(float(p_value), 6),
        "r_squared": round(float(r_squared), 4),
        "std_err": round(float(std_err), 4),
        "confidence_level": confidence,
        "sample_size": len(prices_arr),
        "valid": True,
    }


def predict_volume_change(
    elasticity: float,
    price_change_pct: float,
    base_volume: float,
) -> dict:
    """
    Predict volume change given elasticity and price change.
    %ΔQ = ε × %ΔP
    """
    pct_change = price_change_pct / 100.0
    volume_change_pct = elasticity * pct_change
    new_volume = base_volume * (1 + volume_change_pct)

    return {
        "volume_change_pct": round(volume_change_pct * 100, 2),
        "new_volume": round(max(0, new_volume), 2),
        "base_volume": round(base_volume, 2),
    }


def generate_price_curve(
    elasticity: float,
    base_price: float,
    base_volume: float,
    margin_pct: float = 0.30,
    price_range: tuple[int, int] = (-20, 20),
    step: int = 2,
) -> list[dict]:
    """Generate a price-volume-margin curve for visualization."""
    curve = []
    for pct in range(price_range[0], price_range[1] + 1, step):
        change = pct / 100.0
        volume_change = elasticity * change
        new_price = base_price * (1 + change)
        new_volume = base_volume * (1 + volume_change)
        new_revenue = new_price * new_volume
        new_margin = new_revenue * margin_pct

        curve.append({
            "price_change_pct": pct,
            "price": round(new_price, 2),
            "volume": round(max(0, new_volume), 2),
            "revenue": round(max(0, new_revenue), 2),
            "margin": round(max(0, new_margin), 2),
        })

    return curve
