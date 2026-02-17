"""Luzern pilot canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.lu import LuzernEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return LuzernEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="LU",
        commune="Luzern",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("100000"),
        sale_price=Decimal(str(100000 + gain)),
    )


class TestLUSimpleTax:
    def test_below_minimum_gain(self, engine):
        """Gain < 13000 → tax-free in LU (highest exemption in CH)."""
        inputs = _make_inputs(12999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_20000(self, engine):
        """20k gain, 120 months (10 years → 2% discount).
        Brackets: 6700*0 + 4700*0.02 + 4400*0.03 + 4200*0.04
        = 0 + 94 + 132 + 168 = 394
        Discount 2%: 394 * 0.98 = 386.12
        Canton tax: 386.12 * 4.2 = 1621.70
        """
        inputs = _make_inputs(20000)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.02")
        # Simple tax after discount
        assert result.simple_tax == Decimal("386.12")
        # Total = simple * 4.2
        assert result.total_tax == Decimal("1621.70")

    def test_gain_with_surcharge(self, engine):
        """20k gain, 6 months → 50% surcharge, no discount."""
        inputs = _make_inputs(20000, months=6)
        result = engine.compute(inputs)
        # Base brackets: 6700*0 + 4700*0.02 + 4400*0.03 + 4200*0.04 = 394
        # Surcharge: 394 * 1.50 = 591
        assert result.surcharge_rate == Decimal("0.50")
        assert result.simple_tax == Decimal("591.00")


class TestLUCantonMultiplier:
    def test_canton_rate_applied(self, engine):
        """Verify the 4.2 Steuereinheit is applied to total."""
        inputs = _make_inputs(20000)
        result = engine.compute(inputs)
        assert result.canton_multiplier_percent == Decimal("4.2")
        # total = simple_tax * 4.2
        expected_total = result.simple_tax * Decimal("4.2")
        # Allow for rounding
        from grundstueckgewinnsteuer.engine.rounding import to_fixed_2
        assert result.total_tax == to_fixed_2(expected_total)
