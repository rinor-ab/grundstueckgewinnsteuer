"""Solothurn canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.so import SolothurnEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return SolothurnEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="SO",
        commune="Solothurn",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestSOSimpleTax:
    def test_below_minimum_gain(self, engine):
        """Gain <= 10000 → tax-free."""
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_above_310k(self, engine):
        """400k gain, 10 years → top rate 10.5% on excess.
        Uses bracket evaluation with top rate.
        """
        inputs = _make_inputs(400000)
        result = engine.compute(inputs)
        assert result.simple_tax > Decimal("0")

    def test_no_surcharge(self, engine):
        """10k gain, 6 months → no surcharge in SO (unique)."""
        inputs = _make_inputs(20000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate is None


class TestSODiscount:
    def test_no_discount_below_5(self, engine):
        """20k gain, 48 months (4 years) → no discount."""
        inputs = _make_inputs(20000, months=48)
        result = engine.compute(inputs)
        assert result.discount_rate is None

    def test_discount_year5(self, engine):
        """20k gain, 60 months (5 years) → 2% discount."""
        inputs = _make_inputs(20000, months=60)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.02")

    def test_discount_year20(self, engine):
        """20k gain, 240 months (20 years) → 32% discount."""
        inputs = _make_inputs(20000, months=240)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.32")
