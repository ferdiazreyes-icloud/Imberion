"""
Confidence scoring module for pricing predictions and recommendations.

Assigns confidence levels based on statistical robustness,
sample size, and data quality indicators.
"""


def score_confidence(
    p_value: float,
    r_squared: float,
    sample_size: int,
    min_sample: int = 20,
) -> dict:
    """
    Score the confidence of an elasticity estimate.

    Returns confidence level (high/medium/low) and contributing factors.
    """
    factors = []
    score = 0

    # Statistical significance
    if p_value < 0.01:
        score += 3
        factors.append("p-value < 0.01: alta significancia estadistica")
    elif p_value < 0.05:
        score += 2
        factors.append("p-value < 0.05: significancia aceptable")
    elif p_value < 0.10:
        score += 1
        factors.append("p-value < 0.10: significancia marginal")
    else:
        factors.append("p-value >= 0.10: sin significancia estadistica")

    # Model fit
    if r_squared > 0.7:
        score += 3
        factors.append(f"R² = {r_squared:.3f}: buen ajuste del modelo")
    elif r_squared > 0.4:
        score += 2
        factors.append(f"R² = {r_squared:.3f}: ajuste moderado")
    elif r_squared > 0.2:
        score += 1
        factors.append(f"R² = {r_squared:.3f}: ajuste debil")
    else:
        factors.append(f"R² = {r_squared:.3f}: ajuste muy debil")

    # Sample size
    if sample_size >= min_sample * 5:
        score += 2
        factors.append(f"n = {sample_size}: muestra amplia")
    elif sample_size >= min_sample:
        score += 1
        factors.append(f"n = {sample_size}: muestra suficiente")
    else:
        factors.append(f"n = {sample_size}: muestra insuficiente (min: {min_sample})")

    # Determine level
    if score >= 7:
        level = "high"
    elif score >= 4:
        level = "medium"
    else:
        level = "low"

    return {
        "confidence_level": level,
        "score": score,
        "max_score": 8,
        "factors": factors,
    }


def recommendation_confidence(
    elasticity_confidence: str,
    margin_headroom: float,
    historical_consistency: bool,
) -> dict:
    """
    Score confidence for a pricing recommendation.
    Combines elasticity confidence with business factors.
    """
    score = 0
    factors = []

    # Elasticity base
    if elasticity_confidence == "high":
        score += 3
        factors.append("Elasticidad con alta confianza")
    elif elasticity_confidence == "medium":
        score += 2
        factors.append("Elasticidad con confianza media")
    else:
        score += 1
        factors.append("Elasticidad con baja confianza")

    # Margin headroom
    if margin_headroom > 15:
        score += 2
        factors.append(f"Headroom de margen alto ({margin_headroom:.1f}%)")
    elif margin_headroom > 5:
        score += 1
        factors.append(f"Headroom de margen moderado ({margin_headroom:.1f}%)")
    else:
        factors.append(f"Headroom de margen limitado ({margin_headroom:.1f}%)")

    # Historical consistency
    if historical_consistency:
        score += 1
        factors.append("Patron historico consistente")
    else:
        factors.append("Patron historico inconsistente")

    if score >= 5:
        level = "high"
    elif score >= 3:
        level = "medium"
    else:
        level = "low"

    return {
        "confidence_level": level,
        "score": score,
        "factors": factors,
    }
