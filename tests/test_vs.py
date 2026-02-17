"""Wallis canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.vs import WallisEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return WallisEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="VS",
        commune="Sion",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestVSBrackets:
    def test_first_tier(self, engine):
        """30000 gain, 60 months (5yr) → 12%.
        30000 * 0.12 = 3600.00
        """
        inputs = _make_inputs(30000, months=60)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("3600.00")

    def test_second_tier(self, engine):
        """80000 gain, 60 months (5yr) → mixed brackets.
        50000*0.12 + 30000*0.18 = 6000 + 5400 = 11400.00
        """
        inputs = _make_inputs(80000, months=60)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("11400.00")

    def test_third_tier(self, engine):
        """200000 gain, 60 months → all tiers.
        50000*0.12 + 50000*0.18 + 100000*0.24 = 6000+9000+24000 = 39000.00
        """
        inputs = _make_inputs(200000, months=60)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("39000.00")


class TestVSSurcharge:
    def test_surcharge_under_1_year(self, engine):
        """30000 gain, 6 months → +60%.
        3600 * 1.60 = 5760.00
        """
        inputs = _make_inputs(30000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.6")
        assert result.simple_tax == Decimal("5760.00")


class TestVSDiscount:
    def test_discount_year10(self, engine):
        """30000 gain, 120 months (10yr) → discount 20%.
        3600 * 0.80 = 2880.00
        """
        inputs = _make_inputs(30000, months=120)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.20")
        assert result.simple_tax == Decimal("2880.00")

    def test_minimum_tax_threshold(self, engine):
        """Tiny gain, long hold → tax < 100 → not collected."""
        # Very small gain will produce < 100 after high discount
        # Let's try a carefully computed case
        # Actually 500 gain * 0.12 = 60 CHF → below 100 → 0
        inputs = _make_inputs(500, months=60)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")
