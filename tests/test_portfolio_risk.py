import unittest
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from portfolio_risk import (
    calculate_portfolio_risk_advanced,
    value_at_risk,
    conditional_value_at_risk,
)

class PortfolioRiskTest(unittest.TestCase):
    def test_risk_increases_with_volatility(self):
        base_positions = [
            {'symbol': 'A', 'quantity': 1, 'price': 100, 'volatility': 0.1, 'beta': 1},
            {'symbol': 'B', 'quantity': 1, 'price': 100, 'volatility': 0.1, 'beta': 1},
        ]
        low = calculate_portfolio_risk_advanced(base_positions)['portfolio_risk']
        high_positions = [
            {'symbol': 'A', 'quantity': 1, 'price': 100, 'volatility': 0.3, 'beta': 1},
            {'symbol': 'B', 'quantity': 1, 'price': 100, 'volatility': 0.3, 'beta': 1},
        ]
        high = calculate_portfolio_risk_advanced(high_positions)['portfolio_risk']
        self.assertGreater(high, low)

    def test_var_and_cvar(self):
        returns = [-0.02, 0.01, -0.05, 0.03, -0.01]
        var = value_at_risk(returns, confidence=0.95)
        cvar = conditional_value_at_risk(returns, confidence=0.95)
        self.assertGreaterEqual(cvar, var)

if __name__ == '__main__':
    unittest.main()
