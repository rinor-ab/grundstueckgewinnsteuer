"""Bern pilot canton tests – validation fixtures."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.be import BernEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return BernEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="BE",
        commune="Bern",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("100000"),
        sale_price=Decimal(str(100000 + gain)),
    )


class TestBESimpleTax:
    def test_below_minimum_gain(self, engine):
        """Gain < 5200 → tax-free in BE."""
        inputs = _make_inputs(5000)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_gain_10000_no_surcharge_discount(self, engine):
        """10k gain, 120 months (10 years, 10% discount on gain).
        Adjusted gain = 10000 * 0.90 = 9000.
        Brackets: 2700*0.0144 + 2700*0.024 + 3600*0.0408
        = 38.88 + 64.80 + 146.88 = 250.56
        """
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.10")
        assert result.simple_tax == Decimal("250.56")

    def test_gain_50000_with_surcharge(self, engine):
        """50k gain, 6 months → 70% surcharge.
        No discount (< 6 years), so full gain.
        Brackets: 2700*0.0144 + 2700*0.024 + 7900*0.0408 + 13000*0.0492
        + 23700*0.057
        = 38.88 + 64.80 + 322.32 + 639.60 + 1350.90 = 2416.50
        Surcharge: 2416.50 * 1.70 = 4108.05
        """
        inputs = _make_inputs(50000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.70")
        assert result.simple_tax == Decimal("4108.05")


class TestBEGainReduction:
    def test_discount_reduces_gain(self, engine):
        """BE discount reduces the taxable gain, not the tax."""
        inputs = _make_inputs(100000, months=360)  # 30 years → 50% discount
        result = engine.compute(inputs)
        assert result.discount_rate == Decimal("0.50")
        # Adjusted gain = 100000 * 0.50 = 50000
        # This should match the same brackets as a 50000 gain without discount
        assert Decimal(result.extra.get("adjusted_gain")) == Decimal("50000")
