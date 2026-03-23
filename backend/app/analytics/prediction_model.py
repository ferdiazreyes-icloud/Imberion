"""
Prediction model for pricing scenarios.

Uses elasticity coefficients to predict volume, revenue, and margin
under different pricing assumptions.
"""
from __future__ import annotations

import numpy as np


def predict_scenario(
    base_price: float,
    base_volume: float,
    price_change_pct: float,
    elasticity: float,
    cost_pct: float = 0.70,
) -> dict:
    """
    Predict outcomes for a pricing scenario.

    Args:
        base_price: Current average price
        base_volume: Current total volume
        price_change_pct: Proposed price change (e.g., 5 for +5%)
        elasticity: Price elasticity coefficient
        cost_pct: Cost as % of revenue (default 70%)

    Returns:
        Dict with predicted volume, revenue, margin, and deltas.
    """
    change = price_change_pct / 100.0

    # Volume response
    volume_response = elasticity * change
    new_volume = base_volume * (1 + volume_response)
    new_volume = max(0, new_volume)

    # Revenue
    new_price = base_price * (1 + change)
    base_revenue = base_price * base_volume
    new_revenue = new_price * new_volume

    # Margin (assuming cost is fixed per unit)
    unit_cost = base_price * cost_pct
    base_margin = (base_price - unit_cost) * base_volume
    new_margin = (new_price - unit_cost) * new_volume

    return {
        "new_price": round(new_price, 2),
        "new_volume": round(new_volume, 2),
        "new_revenue": round(new_revenue, 2),
        "new_margin": round(new_margin, 2),
        "delta_price_pct": round(price_change_pct, 2),
        "delta_volume_pct": round(volume_response * 100, 2),
        "delta_revenue": round(new_revenue - base_revenue, 2),
        "delta_revenue_pct": round((new_revenue / base_revenue - 1) * 100, 2) if base_revenue else 0,
        "delta_margin": round(new_margin - base_margin, 2),
        "delta_margin_pct": round((new_margin / base_margin - 1) * 100, 2) if base_margin else 0,
    }


def optimal_price_search(
    base_price: float,
    base_volume: float,
    elasticity: float,
    objective: str = "margin",
    cost_pct: float = 0.70,
    price_range: tuple[float, float] = (-15.0, 15.0),
) -> dict:
    """
    Search for the optimal price change that maximizes revenue, margin, or volume.

    Args:
        objective: "revenue", "margin", or "volume"
        price_range: min/max price change % to search
    """
    best_value = float("-inf")
    best_pct = 0.0
    results = []

    for pct_x10 in range(int(price_range[0] * 10), int(price_range[1] * 10) + 1):
        pct = pct_x10 / 10.0
        pred = predict_scenario(base_price, base_volume, pct, elasticity, cost_pct)

        if objective == "margin":
            value = pred["new_margin"]
        elif objective == "volume":
            value = pred["new_volume"]
        else:
            value = pred["new_revenue"]
        results.append({"price_change_pct": pct, "value": round(value, 2)})

        if value > best_value:
            best_value = value
            best_pct = pct

    return {
        "optimal_change_pct": round(best_pct, 1),
        "optimal_value": round(best_value, 2),
        "objective": objective,
        "prediction": predict_scenario(base_price, base_volume, best_pct, elasticity, cost_pct),
    }


def suggest_improvements(
    planned_changes: list,
    base_data: dict,
    elasticities: dict,
    objective: str = "margin",
    threshold_pct: float = 1.0,
) -> list:
    """
    Compare planned price changes against optimal and suggest improvements.

    Args:
        planned_changes: list of {product_id, change_pct}
        base_data: {product_id: {price, volume}} from transactions
        elasticities: {product_id: elasticity_coefficient}
        objective: what to optimize for
        threshold_pct: min difference in change_pct to suggest (default 1%)

    Returns:
        List of suggestions where optimal differs from planned by > threshold.
    """
    suggestions = []
    for pc in planned_changes:
        pid = pc["product_id"]
        planned_pct = pc["change_pct"]

        base = base_data.get(pid)
        if not base:
            continue

        base_price = float(base.get("price", 100))
        base_volume = float(base.get("volume", 0))
        coeff = elasticities.get(pid, -1.0)

        optimal = optimal_price_search(
            base_price=base_price,
            base_volume=base_volume,
            elasticity=coeff,
            objective=objective,
            price_range=(-20.0, 20.0),
        )

        opt_pct = optimal["optimal_change_pct"]
        if abs(opt_pct - planned_pct) > threshold_pct:
            planned_pred = predict_scenario(base_price, base_volume, planned_pct, coeff)
            opt_pred = optimal["prediction"]

            suggestions.append({
                "product_id": pid,
                "planned_pct": planned_pct,
                "suggested_pct": opt_pct,
                "planned_margin": planned_pred["new_margin"],
                "suggested_margin": opt_pred["new_margin"],
                "delta_margin": round(opt_pred["new_margin"] - planned_pred["new_margin"], 2),
                "planned_revenue": planned_pred["new_revenue"],
                "suggested_revenue": opt_pred["new_revenue"],
                "delta_revenue": round(opt_pred["new_revenue"] - planned_pred["new_revenue"], 2),
                "reason": f"Optimizing for {objective}: {planned_pct:+.1f}% → {opt_pct:+.1f}%",
            })

    return suggestions
