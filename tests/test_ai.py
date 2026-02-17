"""Appenzell Innerrhoden canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ai import AppenzellIREngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return AppenzellIREngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="AI",
        commune="Appenzell",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestAIBrackets:
    def test_below_minimum(self, engine):
        """Gain < 4000 → no tax."""
        inputs = _make_inputs(3999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_first_bracket(self, engine):
        """4000 gain, 10yrs → first bracket 10%.
        Tax = 4000 * 0.10 = 400.00
        Discount yr10 = 20%: 400 * 0.80 = 320.00
        """
        inputs = _make_inputs(4000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("320.00")


class TestAISurcharge:
    def test_surcharge_6_months(self, engine):
        """4000 gain, 6 months → surcharge 31%.
        Base: 400 * 1.31 = 524.00
        """
        inputs = _make_inputs(4000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.31")
        assert result.simple_tax == Decimal("524.00")


class TestAIDiscount:
    def test_discount_year20(self, engine):
        """4000 gain, 240 months (20 yrs) → max discount 50%.
        Base: 400 * 0.50 = 200.00
        """
        inputs = _make_inputs(4000, months=240)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.5")
        assert result.simple_tax == Decimal("200.00")
