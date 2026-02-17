"""Waadt canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.vd import WaadtEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return WaadtEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="VD",
        commune="Lausanne",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestVDRates:
    def test_below_minimum(self, engine):
        inputs = _make_inputs(4999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_short_hold_6_months(self, engine):
        """100k gain, 6 months → rate 30%.
        100000 * 0.30 = 30000.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("30000.00")

    def test_10_years(self, engine):
        """100k gain, 120 months (10yr) → rate 14%.
        100000 * 0.14 = 14000.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("14000.00")

    def test_long_hold_30yr(self, engine):
        """100k gain, 360 months → floor rate 7%.
        100000 * 0.07 = 7000.00
        """
        inputs = _make_inputs(100000, months=360)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("7000.00")
