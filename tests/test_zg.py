"""Zug canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.zg import ZugEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return ZugEngine()


def _make_inputs(
    gain: int, months: int = 120, purchase_price: int = 500000,
) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="ZG",
        commune="Zug",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal(str(purchase_price)),
        sale_price=Decimal(str(purchase_price + gain)),
    )


class TestZGYieldRate:
    def test_below_minimum_gain(self, engine):
        """Gain < 5000 → tax-free in ZG."""
        inputs = _make_inputs(4999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_min_rate_long_hold(self, engine):
        """Small gain over long period → min rate 10%.
        50k gain on 500k cost over 10 years.
        total_yield = 50000 * 100 / 500000 = 10%
        annual_yield = 10 / 10 = 1% → clamped to min 10%
        Tax = 50000 * 10 / 100 = 5000.00
        """
        inputs = _make_inputs(50000, months=120, purchase_price=500000)
        result = engine.compute(inputs)
        assert result.extra["yield_rate_percent"] == "10"
        assert result.simple_tax == Decimal("5000.00")

    def test_moderate_yield(self, engine):
        """100k gain on 500k cost over 10 years.
        total_yield = 100000 * 100 / 500000 = 20%
        annual_yield = 20 / 10 = 2% → clamped to min 10%
        Tax = 100000 * 10 / 100 = 10000.00
        """
        inputs = _make_inputs(100000, months=120, purchase_price=500000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("10000.00")

    def test_high_yield_short_hold(self, engine):
        """200k gain on 300k cost over 2 years (24 months).
        total_yield = 200000 * 100 / 300000 = 66.67%
        annual_yield = 66.67 * 12 / 24 = 33.33%
        Max rate = 60% → rate = 33.33%, clamped → 33.33%
        Tax = 200000 * 33.33 / 100 ≈ not > 60% so use that
        """
        inputs = _make_inputs(200000, months=24, purchase_price=300000)
        result = engine.compute(inputs)
        assert result.simple_tax > Decimal("0")
        # Rate should be between 10 and 60
        rate = Decimal(result.extra["yield_rate_percent"])
        assert Decimal("10") <= rate <= Decimal("60")

    def test_max_rate_capped(self, engine):
        """Extreme gain short hold → capped at 60%.
        500k gain on 100k cost over 12 months.
        total_yield = 500000 * 100 / 100000 = 500%
        annual_yield = 500 * 12 / 12 = 500% → capped at 60%
        Tax = 500000 * 60 / 100 = 300000.00
        """
        inputs = _make_inputs(500000, months=12, purchase_price=100000)
        result = engine.compute(inputs)
        assert result.extra["yield_rate_percent"] == "60"
        assert result.simple_tax == Decimal("300000.00")

    def test_max_rate_reduced_long_hold(self, engine):
        """After 25 years, max rate = 60 - 35 = 25%.
        500k gain on 100k cost over 25 years.
        total_yield = 500% → annual = 500/25 = 20% (within bounds)
        Max rate at 25 years: 60 - (25-12+1)*2.5 = 60 - 35 = 25%
        Rate = min(20, 25) → 20%
        Tax = 500000 * 20 / 100 = 100000.00
        """
        inputs = _make_inputs(500000, months=300, purchase_price=100000)
        result = engine.compute(inputs)
        assert result.extra["max_rate_percent"] == "25.0"
        assert result.simple_tax == Decimal("100000.00")
