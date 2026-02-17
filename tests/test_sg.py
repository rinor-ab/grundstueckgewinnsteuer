"""St. Gallen canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.sg import StGallenEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return StGallenEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="SG",
        commune="St. Gallen",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("100000"),
        sale_price=Decimal(str(100000 + gain)),
    )


class TestSGSimpleTax:
    def test_below_minimum_gain(self, engine):
        """Gain <= 2200 → tax-free in SG."""
        inputs = _make_inputs(2200)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_10000_no_surcharge(self, engine):
        """10k gain, 120 months (10 years), no surcharge/discount.
        Brackets: 2200*0 + 2800*0.005 + 2700*0.01 + 2100*0.02 + 200*0.03
        = 0 + 14 + 27 + 42 + 6 = 89.00
        """
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("89.00")

    def test_gain_50000_no_adj(self, engine):
        """50k gain, 120 months (10 years), no surcharge/discount.
        Brackets: 2200*0 + 2800*0.005 + 2700*0.01 + 2100*0.02 + 2100*0.03
        + 2600*0.04 + 3700*0.05 + 6900*0.06 + 9600*0.07 + 15300*0.08
        = 0 + 14 + 27 + 42 + 63 + 104 + 185 + 414 + 672 + 1224 = 2745.00
        """
        inputs = _make_inputs(50000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("2745.00")


class TestSGSurcharge:
    def test_surcharge_year1(self, engine):
        """10k gain, 6 months → +5% surcharge (additive on gain).
        Base brackets: 89.00 (from test above)
        Surcharge: 10000 * 0.05 = 500
        Total simple tax: 589.00
        """
        inputs = _make_inputs(10000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.05")
        assert result.simple_tax == Decimal("589.00")


class TestSGDiscount:
    def test_discount_year20_low_gain(self, engine):
        """10k gain, 240 months (20 years) → discount.
        Years from 17th: 20 - 17 + 1 = 4 years → 4 * 1.5% = 6% discount
        Base tax: 89.00
        After discount: 89 * 0.94 = 83.66
        """
        inputs = _make_inputs(10000, months=240)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.060")
        assert result.simple_tax == Decimal("83.66")


class TestSGFlatRate:
    def test_gain_above_600k(self, engine):
        """700k gain, 120 months → flat 10% on entire gain.
        Tax = 700000 * 0.10 = 70000.00
        """
        inputs = _make_inputs(700000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("70000.00")
