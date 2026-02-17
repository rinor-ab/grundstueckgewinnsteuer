"""Aargau canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ag import AargauEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return AargauEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="AG",
        commune="Aarau",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("100000"),
        sale_price=Decimal(str(100000 + gain)),
    )


class TestAGHoldingPeriodRates:
    def test_zero_gain(self, engine):
        """Zero gain → no tax."""
        inputs = _make_inputs(0)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_negative_gain(self, engine):
        """Negative gain → no tax."""
        inputs = _make_inputs(-5000)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_short_holding_6_months(self, engine):
        """100k gain, 6 months (0 completed years) → 40% rate.
        Tax = 100000 * 0.40 = 40000.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("40000.00")
        assert result.extra["holding_period_rate"] == "0.4"

    def test_holding_5_years(self, engine):
        """100k gain, 60 months (5 years) → 32% rate.
        Tax = 100000 * 0.32 = 32000.00
        """
        inputs = _make_inputs(100000, months=60)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("32000.00")
        assert result.extra["holding_period_rate"] == "0.32"

    def test_holding_10_years(self, engine):
        """100k gain, 120 months (10 years) → 22% rate.
        Tax = 100000 * 0.22 = 22000.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("22000.00")
        assert result.extra["holding_period_rate"] == "0.22"

    def test_holding_25_years(self, engine):
        """100k gain, 300 months (25 years) → 6% rate.
        Tax = 100000 * 0.06 = 6000.00
        """
        inputs = _make_inputs(100000, months=300)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("6000.00")
        assert result.extra["holding_period_rate"] == "0.06"

    def test_holding_30_years(self, engine):
        """100k gain, 360 months (30 years) → min rate 5%.
        Tax = 100000 * 0.05 = 5000.00
        """
        inputs = _make_inputs(100000, months=360)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("5000.00")
        assert result.extra["holding_period_rate"] == "0.05"

    def test_no_minimum_gain(self, engine):
        """AG has no minimum taxable gain – even CHF 1 is taxable."""
        inputs = _make_inputs(1, months=120)
        result = engine.compute(inputs)
        assert result.total_tax > Decimal("0")
