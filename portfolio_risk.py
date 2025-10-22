"""Utility functions for calculating portfolio risk."""

from typing import Any, Dict, List

import numpy as np


def calculate_weighted_portfolio_risk(positions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate weighted risk score for a portfolio.

    Parameters
    ----------
    positions : list of dict
        Each dict must contain 'symbol', 'quantity', 'price', and 'risk_score'.

    Returns
    -------
    dict
        Dictionary with total portfolio risk and per-stock details.
    """
    values = [pos.get("quantity", 0) * pos.get("price", 0.0) for pos in positions]
    total_value = sum(values)

    if total_value == 0:
        return {"portfolio_risk": 0.0, "details": []}

    details: List[Dict[str, Any]] = []
    portfolio_risk = 0.0

    for pos, value in zip(positions, values):
        weight = value / total_value
        risk_score = pos.get("risk_score", 0.0)
        weighted_risk = risk_score * weight
        portfolio_risk += weighted_risk
        details.append({
            "symbol": pos.get("symbol"),
            "weight": weight,
            "weighted_risk": weighted_risk,
        })

    return {"portfolio_risk": portfolio_risk, "details": details}


def value_at_risk(returns: List[float], confidence: float = 0.95) -> float:
    """Calculate the Value-at-Risk (VaR) for a list of returns."""
    if not returns:
        return 0.0
    percentile = np.percentile(returns, (1 - confidence) * 100)
    return abs(percentile)


def conditional_value_at_risk(returns: List[float], confidence: float = 0.95) -> float:
    """Calculate the Conditional VaR (Expected Shortfall)."""
    if not returns:
        return 0.0
    var_threshold = np.percentile(returns, (1 - confidence) * 100)
    tail_losses = [r for r in returns if r <= var_threshold]
    if not tail_losses:
        return 0.0
    return abs(float(np.mean(tail_losses)))


def calculate_portfolio_risk_advanced(positions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Estimate portfolio risk using weights, volatility and correlations.

    Each position dictionary may include ``volatility`` (daily standard
    deviation of returns), ``beta`` and a list of ``returns`` for optional
    correlation calculations.

    The resulting risk score combines weighted portfolio volatility and
    average beta as a simple proxy for systematic risk.
    """

    if not positions:
        return {"portfolio_risk": 0.0, "weighted_beta": 0.0}

    values = [pos.get("quantity", 0) * pos.get("price", 0.0) for pos in positions]
    total_value = float(sum(values))

    if total_value == 0:
        return {"portfolio_risk": 0.0, "weighted_beta": 0.0}

    weights = [v / total_value for v in values]
    volatilities = [pos.get("volatility", 0.0) for pos in positions]
    betas = [pos.get("beta", 1.0) for pos in positions]
    returns = [pos.get("returns") for pos in positions if pos.get("returns")]

    # Correlation matrix if returns are provided
    if len(returns) == len(positions):
        min_len = min(len(r) for r in returns)
        aligned = [r[-min_len:] for r in returns]
        corr_matrix = list(
            map(list, (  # type: ignore[list-item]
                __import__("numpy").corrcoef(aligned)
            ))
        )
    else:
        corr_matrix = [[1.0 if i == j else 0.0 for j in range(len(positions))] for i in range(len(positions))]

    # Portfolio variance
    port_var = 0.0
    for i in range(len(positions)):
        for j in range(len(positions)):
            port_var += (
                weights[i]
                * weights[j]
                * volatilities[i]
                * volatilities[j]
                * corr_matrix[i][j]
            )

    weighted_beta = sum(w * b for w, b in zip(weights, betas))
    # Simple risk score scaled between 0 and 1
    risk_score = min(1.0, (port_var ** 0.5) * 0.5 + weighted_beta * 0.5)

    return {
        "portfolio_risk": risk_score,
        "weighted_beta": weighted_beta,
        "portfolio_volatility": port_var ** 0.5,
    }


if __name__ == "__main__":
    example = [
        {"symbol": "AAPL", "quantity": 3, "price": 100.0, "risk_score": 0.8},
        {"symbol": "MSFT", "quantity": 2, "price": 250.0, "risk_score": 0.3},
    ]
    from pprint import pprint

    pprint(calculate_weighted_portfolio_risk(example))

