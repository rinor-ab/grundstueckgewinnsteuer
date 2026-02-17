"""Tessin canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ti import TessinEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return TessinEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="TI",
        commune="Lugano",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestTIRates:
    def test_short_hold_6_months(self, engine):
        """100k gain, 6 months → rate 31%.
        100000 * 0.31 = 31000.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("31000.00")

    def test_10_years(self, engine):
        """100k gain, 120 months (10yr) → rate 13%.
        100000 * 0.13 = 13000.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("13000.00")

    def test_long_hold_35yr(self, engine):
        """100k gain, 420 months → floor rate 4%.
        100000 * 0.04 = 4000.00
        """
        inputs = _make_inputs(100000, months=420)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("4000.00")
