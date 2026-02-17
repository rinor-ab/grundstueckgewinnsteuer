"""Zürich pilot canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.zh import ZuerichEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return ZuerichEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="ZH",
        commune="Zürich",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("100000"),
        sale_price=Decimal(str(100000 + gain)),
    )


class TestZHSimpleTax:
    def test_below_minimum_gain(self, engine):
        """Gain < 5000 → tax-free in ZH."""
        inputs = _make_inputs(4999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_10000(self, engine):
        """10k gain → 4000*10% + 6000*15% = 400+900 = 1300."""
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        # 10 years → 20% discount: 1300 * 0.80 = 1040
        assert result.simple_tax == Decimal("1040.00")

    def test_gain_150000(self, engine):
        """150k → fills all brackets + 50k at 40%."""
        inputs = _make_inputs(150000)
        result = engine.compute(inputs)
        # Brackets: 4000*10%+6000*15%+8000*20%+12000*25%+20000*30%+50000*35%
        # = 400+900+1600+3000+6000+17500 = 29400
        # + 50000*40% = 20000 → total brackets = 49400
        # But has 10yr discount of 20%: 49400 * 0.80 = 39520
        assert result.simple_tax == Decimal("39520.00")


class TestZHSurcharge:
    def test_surcharge_6_months(self, engine):
        """6 months → 50% surcharge."""
        inputs = _make_inputs(10000, months=6)
        result = engine.compute(inputs)
        # Base: 1300, surcharge 50%: 1300 * 1.50 = 1950
        assert result.simple_tax == Decimal("1950.00")
        assert result.surcharge_rate == Decimal("0.50")


class TestZHDiscount:
    def test_discount_20_years(self, engine):
        """240 months (20 years) → max 50% discount."""
        inputs = _make_inputs(10000, months=240)
        result = engine.compute(inputs)
        # Base: 1300, discount 50%: 1300 * 0.50 = 650
        assert result.simple_tax == Decimal("650.00")
        assert result.discount_rate == Decimal("0.50")
