"""Uri canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ur import UriEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return UriEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="UR",
        commune="Altdorf",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestURRates:
    def test_below_minimum(self, engine):
        """Gain < 7000 → no tax."""
        inputs = _make_inputs(6999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_equal_to_freibetrag(self, engine):
        """10000 gain = Freibetrag → 0 taxable → no tax."""
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_above_freibetrag_10yr(self, engine):
        """50000 gain, 10yr → after Freibetrag: 40000, round → 40000.
        Rate for 10yr = 21%.
        40000 * 0.21 = 8400.00
        """
        inputs = _make_inputs(50000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("8400.00")

    def test_short_hold_6_months(self, engine):
        """50000 gain, 6 months → rate 31%.
        After Freibetrag: 40000, 40000 * 0.31 = 12400.00
        """
        inputs = _make_inputs(50000, months=6)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("12400.00")

    def test_long_hold_25yr(self, engine):
        """50000 gain, 300 months (25yr) → floor rate 11%.
        40000 * 0.11 = 4400.00
        """
        inputs = _make_inputs(50000, months=300)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("4400.00")
