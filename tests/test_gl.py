"""Glarus canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.gl import GlarusEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return GlarusEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="GL",
        commune="Glarus",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestGLBrackets:
    def test_below_minimum(self, engine):
        """Gain < 5000 → no tax (Freigrenze)."""
        inputs = _make_inputs(4999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_first_bracket(self, engine):
        """5000 gain, 10 years → first bracket 10%.
        Tax = 5000 * 0.10 = 500
        Discount 20%: 500 * 0.80 = 400.00
        """
        inputs = _make_inputs(5000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("400.00")

    def test_all_brackets_plus_top(self, engine):
        """30000 gain, 10 years → all brackets + top rate.
        5000*0.10 + 5000*0.15 + 5000*0.20 + 5000*0.25 + 10000*0.30
        = 500 + 750 + 1000 + 1250 + 3000 = 6500
        Discount 20%: 6500 * 0.80 = 5200.00
        """
        inputs = _make_inputs(30000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("5200.00")


class TestGLSurcharge:
    def test_surcharge_6_months(self, engine):
        """5000 gain, 6 months → surcharge +30%.
        Base: 500 * 1.3 = 650.00
        """
        inputs = _make_inputs(5000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.3")
        assert result.simple_tax == Decimal("650.00")


class TestGLDiscount:
    def test_discount_year5(self, engine):
        """5000 gain, 60 months (5 years) → discount 5%.
        Base: 500 * 0.95 = 475.00
        """
        inputs = _make_inputs(5000, months=60)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.05")
        assert result.simple_tax == Decimal("475.00")

    def test_discount_year34(self, engine):
        """5000 gain, 408 months (34 years) → discount 90%.
        Base: 500 * 0.10 = 50.00
        """
        inputs = _make_inputs(5000, months=408)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.90")
        assert result.simple_tax == Decimal("50.00")
