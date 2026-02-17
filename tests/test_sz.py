"""Schwyz canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.sz import SchwyzEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return SchwyzEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="SZ",
        commune="Schwyz",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestSZBrackets:
    def test_below_minimum(self, engine):
        """Gain < 2000 → no tax."""
        inputs = _make_inputs(1999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_first_bracket(self, engine):
        """3000 gain, 10 years → first bracket 8%.
        Tax = 3000 * 0.08 = 240.00
        Discount 25%: 240 * 0.75 = 180.00
        """
        inputs = _make_inputs(3000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("180.00")

    def test_above_top(self, engine):
        """50k gain, 10 years → uses top rate 30% for excess.
        Brackets: 3000*0.08 + 3000*0.10 + 4000*0.12 + 4000*0.15
        + 4000*0.18 + 6000*0.21 + 6000*0.24 + 10000*0.27 = 240+300+480+600+720+1260+1440+2700 = 7740
        Top rate: 10000 * 0.30 = 3000
        Base: 10740
        Discount 25%: 10740 * 0.75 = 8055.00
        """
        inputs = _make_inputs(50000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("8055.00")


class TestSZSurcharge:
    def test_surcharge_6_months(self, engine):
        """3000 gain, 6 months → surcharge +40%.
        Base: 240 * 1.4 = 336.00
        """
        inputs = _make_inputs(3000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.4")
        assert result.simple_tax == Decimal("336.00")


class TestSZDiscount:
    def test_discount_year5(self, engine):
        """3000 gain, 60 months (5 years) → discount 10%.
        Base: 240 * 0.90 = 216.00
        """
        inputs = _make_inputs(3000, months=60)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.10")
        assert result.simple_tax == Decimal("216.00")

    def test_discount_year25(self, engine):
        """3000 gain, 300 months (25 years) → discount 70%.
        Base: 240 * 0.30 = 72.00
        """
        inputs = _make_inputs(3000, months=300)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.70")
        assert result.simple_tax == Decimal("72.00")
