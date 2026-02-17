"""Thurgau canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.tg import ThurgauEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return ThurgauEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="TG",
        commune="Frauenfeld",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestTGBaseTax:
    def test_zero_gain(self, engine):
        inputs = _make_inputs(0)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_base_rate_no_adj(self, engine):
        """100k gain, 66 months (5.5 years) → base 40%, no surcharge/discount.
        Tax = 100000 * 0.40 = 40000.00
        """
        inputs = _make_inputs(100000, months=66)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("40000.00")
        assert result.surcharge_rate is None
        assert result.discount_rate is None


class TestTGSurcharge:
    def test_surcharge_under_1_year(self, engine):
        """100k gain, 6 months → surcharge +50%.
        Base: 40000, surcharges: 40000 * 1.5 = 60000.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.5")
        assert result.simple_tax == Decimal("60000.00")

    def test_surcharge_under_3_years(self, engine):
        """100k gain, 30 months → surcharge +30%.
        Base: 40000, surcharges: 40000 * 1.3 = 52000.00
        """
        inputs = _make_inputs(100000, months=30)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.3")
        assert result.simple_tax == Decimal("52000.00")


class TestTGDiscount:
    def test_discount_10_years(self, engine):
        """100k gain, 120 months (10 years) → discount 20%.
        Base: 40000, after: 40000 * 0.80 = 32000.00
        """
        inputs = _make_inputs(100000, months=120)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.20")
        assert result.simple_tax == Decimal("32000.00")

    def test_discount_23_years(self, engine):
        """100k gain, 276 months (23 years) → discount 72%.
        Base: 40000, after: 40000 * 0.28 = 11200.00
        """
        inputs = _make_inputs(100000, months=276)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.72")
        assert result.simple_tax == Decimal("11200.00")
