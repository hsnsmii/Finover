"""Advanced portfolio risk analysis utilities."""

from typing import Any, Dict, List, Tuple

import numpy as np

from portfolio_risk import calculate_weighted_portfolio_risk


def analyze_portfolio(positions: List[Dict[str, Any]], high_risk_threshold: float = 0.6) -> Dict[str, Any]:
    """Analyze a portfolio and return risk-based suggestions.

    Parameters
    ----------
    positions : list of dict
        Each dictionary should contain ``symbol``, ``quantity``, ``price``,
        ``risk_score`` and optionally ``sector`` and ``returns``.
    high_risk_threshold : float, optional
        Risk score above which a position is considered high risk.

    Returns
    -------
    dict
        Analysis results including high-risk percentage, sector concentration,
        diversification score and suggestions.
    """
    if not positions:
        return {
            "high_risk_percentage": 0.0,
            "sector_distribution": {},
            "diversification_score": 0.0,
            "suggestions": [],
        }

    values = [pos.get("quantity", 0) * pos.get("price", 0.0) for pos in positions]
    total_value = float(sum(values))
    if total_value == 0:
        return {
            "high_risk_percentage": 0.0,
            "sector_distribution": {},
            "diversification_score": 0.0,
            "suggestions": [],
        }

    # High risk share
    high_risk_value = 0.0
    sector_weights: Dict[str, float] = {}

    for pos, value in zip(positions, values):
        risk = pos.get("risk_score", 0.0)
        if risk >= high_risk_threshold:
            high_risk_value += value

        sector = pos.get("sector", "Unknown")
        sector_weights[sector] = sector_weights.get(sector, 0.0) + value

    high_risk_percentage = 100 * high_risk_value / total_value

    # Normalize sector weights
    for key in list(sector_weights.keys()):
        sector_weights[key] = sector_weights[key] / total_value

    # Diversification score using Herfindahl-Hirschman Index
    hhi = sum(weight ** 2 for weight in sector_weights.values())
    diversification_score = 1 - hhi

    suggestions: List[str] = []
    if high_risk_percentage > 50:
        suggestions.append(
            "Your portfolio contains a high proportion of risky stocks."
            " Consider diversifying with safer assets."
        )

    max_sector = max(sector_weights.items(), key=lambda x: x[1]) if sector_weights else (None, 0)
    if max_sector[1] > 0.5:
        suggestions.append(
            f"Your portfolio is heavily concentrated in the {max_sector[0]} sector."
            " Consider adding stocks from different sectors for better diversification."
        )

    if diversification_score < 0.5:
        suggestions.append(
            "Your portfolio diversification score is low. Consider spreading your"
            " investments across more sectors."
        )

    # Optional pairwise correlation analysis
    returns_data = [pos.get("returns") for pos in positions if pos.get("returns")]
    if len(returns_data) > 1:
        try:
            aligned_returns = np.array([r[-len(min(returns_data, key=len)) :] for r in returns_data])
            corr_matrix = np.corrcoef(aligned_returns)
            upper_triangle = corr_matrix[np.triu_indices_from(corr_matrix, k=1)]
            if np.nanmax(upper_triangle) > 0.8:
                suggestions.append(
                    "Some portfolio holdings are highly correlated. Diversifying into"
                    " less correlated assets could reduce risk."
                )
        except Exception:
            pass

    return {
        "high_risk_percentage": high_risk_percentage,
        "sector_distribution": sector_weights,
        "diversification_score": diversification_score,
        "suggestions": suggestions,
    }


def simulate_portfolio_change(
    positions: List[Dict[str, Any]],
    change: Dict[str, Any],
    action: str = "add",
    high_risk_threshold: float = 0.6,
) -> Dict[str, Any]:
    """Simulate adding or removing a position and return updated risk metrics."""
    new_positions = positions.copy()
    if action == "add":
        new_positions.append(change)
    elif action == "remove":
        new_positions = [p for p in new_positions if p.get("symbol") != change.get("symbol")]

    current = calculate_weighted_portfolio_risk(positions)
    updated = calculate_weighted_portfolio_risk(new_positions)

    suggestion = ""
    if updated["portfolio_risk"] > current["portfolio_risk"]:
        suggestion = "Portfolio risk has increased."
    elif updated["portfolio_risk"] < current["portfolio_risk"]:
        suggestion = "Portfolio risk has decreased."
    else:
        suggestion = "Portfolio risk is unchanged."

    analysis = analyze_portfolio(new_positions, high_risk_threshold)

    return {
        "new_risk": updated["portfolio_risk"],
        "old_risk": current["portfolio_risk"],
        "risk_change": updated["portfolio_risk"] - current["portfolio_risk"],
        "analysis": analysis,
        "summary": suggestion,
    }


def predict_risk_trend(
    risk_history: List[Tuple[str, float]], forecast_periods: int = 5
) -> Dict[str, Any]:
    """Predict portfolio risk trend using simple linear forecasting."""
    if len(risk_history) < 2:
        return {"predictions": [], "warning": None}

    dates = np.arange(len(risk_history))
    risks = np.array([r for _, r in risk_history])
    coef = np.polyfit(dates, risks, 1)
    future_dates = np.arange(len(risk_history), len(risk_history) + forecast_periods)
    predictions = coef[0] * future_dates + coef[1]

    warning = None
    if predictions[-1] - risks[-1] > 0.1:
        warning = (
            "Your portfolio risk is expected to rise over the next few periods."
            " Consider reducing high-risk holdings."
        )

    return {
        "predictions": predictions.tolist(),
        "warning": warning,
    }

