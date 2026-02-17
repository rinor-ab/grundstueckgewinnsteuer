"""Basel-Landschaft canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.bl import BaselLandEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return BaselLandEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="BL",
        commune="Liestal",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestBLFormulaRate:
    def test_zero_gain(self, engine):
        """Zero gain → no tax."""
        inputs = _make_inputs(0)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_10000(self, engine):
        """10k gain, 120 months (no surcharge).
        Rate: base 3% + 100 * 0.03% = 3% + 3% = 6%
        Tax = 10000 * 0.06 = 600.00
        """
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        assert result.extra["formula_rate"] == "0.0600"
        assert result.simple_tax == Decimal("600.00")

    def test_gain_30000(self, engine):
        """30k gain, 120 months.
        Rate: 3% + 300*0.03% = 3% + 9% = 12%
        Tax = 30000 * 0.12 = 3600.00
        """
        inputs = _make_inputs(30000)
        result = engine.compute(inputs)
        assert result.extra["formula_rate"] == "0.1200"
        assert result.simple_tax == Decimal("3600.00")

    def test_gain_50000(self, engine):
        """50k gain, 120 months.
        Crosses into tier 2: base 12% + (50000-30000)/100 * 0.02% = 12% + 4% = 16%
        Tax = 50000 * 0.16 = 8000.00
        """
        inputs = _make_inputs(50000)
        result = engine.compute(inputs)
        assert result.extra["formula_rate"] == "0.1600"
        assert result.simple_tax == Decimal("8000.00")

    def test_gain_150000(self, engine):
        """150k gain → max rate 25%.
        Tax = 150000 * 0.25 = 37500.00
        """
        inputs = _make_inputs(150000)
        result = engine.compute(inputs)
        assert result.extra["formula_rate"] == "0.25"
        assert result.simple_tax == Decimal("37500.00")


class TestBLSurcharge:
    def test_surcharge_short_hold(self, engine):
        """10k gain, 12 months → surcharge of (60-12) * 1.667% = 80%.
        Base tax: 600.00
        Surcharge factor: 48 * 0.01667 = 0.80016
        Tax after surcharge: 600 * 1.80016 = 1080.10
        """
        inputs = _make_inputs(10000, months=12)
        result = engine.compute(inputs)
        assert result.surcharge_rate is not None
        assert result.simple_tax > Decimal("600")

    def test_no_surcharge_long_hold(self, engine):
        """10k gain, 120 months → no surcharge."""
        inputs = _make_inputs(10000, months=120)
        result = engine.compute(inputs)
        assert result.surcharge_rate is None
