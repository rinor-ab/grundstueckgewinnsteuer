"""Nidwalden canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.nw import NidwaldenEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return NidwaldenEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="NW",
        commune="Stans",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestNWRates:
    def test_zero_gain(self, engine):
        inputs = _make_inputs(0)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_short_hold_6_months(self, engine):
        """100k gain, 6 months → rate 36%.
        100000 * 0.36 = 36000.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("36000.00")

    def test_10_years(self, engine):
        """100k gain, 120 months (10yr) → rate 22%.
        100000 * 0.22 = 22000.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("22000.00")

    def test_long_hold_31_years(self, engine):
        """100k gain, 372 months (31yr) → floor rate 12%.
        100000 * 0.12 = 12000.00
        """
        inputs = _make_inputs(100000, months=372)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("12000.00")
