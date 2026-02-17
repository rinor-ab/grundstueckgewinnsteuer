"""Jura canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ju import JuraEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return JuraEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="JU",
        commune="Delémont",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestJUBrackets:
    def test_below_minimum(self, engine):
        inputs = _make_inputs(3999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_first_bracket(self, engine):
        """30000 gain, 60 months → 30000 * 0.035 = 1050.
        No surcharge/discount at 5yr.
        """
        inputs = _make_inputs(30000, months=60)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("1050.00")


class TestJUSurcharge:
    def test_surcharge_1yr(self, engine):
        """30000 gain, 12 months → +50%.
        1050 * 1.50 = 1575.00
        """
        inputs = _make_inputs(30000, months=12)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.5")
        assert result.simple_tax == Decimal("1575.00")


class TestJUDiscount:
    def test_discount_year15(self, engine):
        """30000 gain, 180 months (15yr) → discount 6%.
        1050 * 0.94 = 987.00
        """
        inputs = _make_inputs(30000, months=180)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.06")
        assert result.simple_tax == Decimal("987.00")
