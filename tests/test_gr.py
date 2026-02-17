"""Graubünden canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.gr import GraubuendenEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return GraubuendenEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="GR",
        commune="Chur",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestGRBrackets:
    def test_below_minimum(self, engine):
        """Gain < 4200 → no tax."""
        inputs = _make_inputs(4199)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_first_bracket(self, engine):
        """5000 gain, 10 years → first bracket only (5%), then 1.5% discount.
        Base tax = 5000 * 0.05 = 250.00
        Discount (yr10, 1.5%): 250 * 0.985 = 246.25
        """
        inputs = _make_inputs(5000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("246.25")

    def test_two_brackets(self, engine):
        """15000 gain, 10 years → brackets 1+2, then 1.5% discount.
        Base: 9100*0.05 + 5900*0.06 = 455 + 354 = 809.00
        Discount (yr10, 1.5%): 809 * 0.985 = 796.865 → 796.86
        """
        inputs = _make_inputs(15000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("796.86")


class TestGRSurcharge:
    def test_surcharge_6_months(self, engine):
        """5000 gain, 6 months → surcharge 38%.
        Base: 250.00
        With surcharge: 250 * 1.38 = 345.00
        """
        inputs = _make_inputs(5000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.38")
        assert result.simple_tax == Decimal("345.00")


class TestGRDiscount:
    def test_discount_15_years(self, engine):
        """5000 gain, 180 months (15 years) → discount.
        15 years → 9% discount (6 years past yr10: 6*1.5%)
        Base: 250.00
        After discount: 250 * 0.91 = 227.50
        """
        inputs = _make_inputs(5000, months=180)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.090")
        assert result.simple_tax == Decimal("227.50")
