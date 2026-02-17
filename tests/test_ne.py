"""Neuenburg canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ne import NeuenburgEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return NeuenburgEngine()


def _make_inputs(gain: int, months: int = 72) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="NE",
        commune="Neuchâtel",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestNEBrackets:
    def test_below_minimum(self, engine):
        inputs = _make_inputs(4999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_first_bracket(self, engine):
        """5000 gain, 72 months (6yr) → 5000 * 0.10 = 500.
        Discount yr6: 12% → 500 * 0.88 = 440.00
        """
        inputs = _make_inputs(5000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("440.00")


class TestNESurcharge:
    def test_surcharge_6_months(self, engine):
        """5000 gain, 6 months → +40%.
        500 * 1.40 = 700.00
        """
        inputs = _make_inputs(5000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.4")
        assert result.simple_tax == Decimal("700.00")


class TestNEDiscount:
    def test_max_discount(self, engine):
        """5000 gain, 180 months (15yr) → max discount 60%.
        500 * 0.40 = 200.00
        """
        inputs = _make_inputs(5000, months=180)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.60")
        assert result.simple_tax == Decimal("200.00")
