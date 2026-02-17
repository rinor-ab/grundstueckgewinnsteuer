"""Genf canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ge import GenfEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return GenfEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="GE",
        commune="Genève",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestGERates:
    def test_short_hold_6_months(self, engine):
        """100k gain, 6 months → rate 50%.
        100000 * 0.50 = 50000.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("50000.00")

    def test_10_years(self, engine):
        """100k gain, 120 months (10yr) → rate 10%.
        100000 * 0.10 = 10000.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("10000.00")

    def test_long_hold_30yr(self, engine):
        """100k gain, 360 months → floor rate 2%.
        100000 * 0.02 = 2000.00
        """
        inputs = _make_inputs(100000, months=360)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("2000.00")
