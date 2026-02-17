"""Basel-Stadt canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.bs import BaselStadtEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return BaselStadtEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="BS",
        commune="Basel",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestBSNotSelfUsed:
    def test_below_minimum_gain(self, engine):
        """Gain < 500 → tax-free in BS."""
        inputs = _make_inputs(499)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_short_hold_3_years(self, engine):
        """100k gain, 36 months (3 years) → rate 60%, no gain reduction.
        Tax = 100000 * 0.60 = 60000.00
        """
        inputs = _make_inputs(100000, months=36)
        result = engine.compute(inputs)
        assert result.extra["holding_period_rate"] == "0.6"
        assert result.simple_tax == Decimal("60000.00")

    def test_hold_10_years(self, engine):
        """100k gain, 120 months (10 years) → rate 40.5%, gain reduced by 15%.
        Gain reduction: year 10: (10-6+1)*3% = 15%
        Adjusted gain: 100000 * 0.85 = 85000
        Tax = 85000 * 0.405 = 34425.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.extra["holding_period_rate"] == "0.405"
        assert result.extra["gain_reduction_rate"] == "0.15"
        assert result.simple_tax == Decimal("34425.00")

    def test_hold_25_plus_years(self, engine):
        """100k gain, 360 months (30 years) → rate 12% (floor), gain reduced by 60%.
        Adjusted gain: 100000 * 0.40 = 40000
        Tax = 40000 * 0.12 = 4800.00
        """
        inputs = _make_inputs(100000, months=360)
        result = engine.compute(inputs)
        assert result.extra["holding_period_rate"] == "0.12"
        assert result.extra["gain_reduction_rate"] == "0.6"
        assert result.simple_tax == Decimal("4800.00")


class TestBSGainReduction:
    def test_gain_reduction_year_6(self, engine):
        """Year 6: (6-6+1)*3% = 3% reduction."""
        inputs = _make_inputs(100000, months=72)  # 6 years
        result = engine.compute(inputs)
        assert result.extra["gain_reduction_rate"] == "0.03"

    def test_gain_reduction_capped_at_60(self, engine):
        """Year 40: would be 105% but capped at 60%."""
        inputs = _make_inputs(100000, months=480)  # 40 years
        result = engine.compute(inputs)
        assert result.extra["gain_reduction_rate"] == "0.6"
