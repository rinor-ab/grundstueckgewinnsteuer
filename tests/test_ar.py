"""Appenzell Ausserrhoden canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ar import AppenzellAREngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return AppenzellAREngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="AR",
        commune="Herisau",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestARBaseTax:
    def test_below_minimum(self, engine):
        """Gain < 3000 → no tax."""
        inputs = _make_inputs(2999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_rounding(self, engine):
        """5700 gain → rounded to 5500, 10yr → discount 2.5%.
        5500 * 0.30 = 1650 * 0.975 = 1608.75
        """
        inputs = _make_inputs(5700)
        result = engine.compute(inputs)
        assert result.taxable_gain == Decimal("5500")
        assert result.discount_rate == Decimal("0.025")

    def test_base_rate_no_adj(self, engine):
        """10000 gain, 60 months (5yr) → no surcharge/discount.
        10000 * 0.30 = 3000.00
        """
        inputs = _make_inputs(10000, months=60)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("3000.00")


class TestARSurcharge:
    def test_surcharge_under_1_year(self, engine):
        """10000 gain, 6 months → surcharge +35%.
        10000 * 0.30 = 3000 * 1.35 = 4050.00
        """
        inputs = _make_inputs(10000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.35")
        assert result.simple_tax == Decimal("4050.00")


class TestARDiscount:
    def test_discount_29_years(self, engine):
        """10000 gain, 348 months (29yr) → max discount 50%.
        10000 * 0.30 = 3000 * 0.50 = 1500.00
        """
        inputs = _make_inputs(10000, months=348)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.5")
        assert result.simple_tax == Decimal("1500.00")
