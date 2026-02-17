"""Obwalden canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.ow import ObwaldenEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return ObwaldenEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="OW",
        commune="Sarnen",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestOWBaseTax:
    def test_below_minimum(self, engine):
        """Gain < 5000 → no tax."""
        inputs = _make_inputs(4999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_base_rate_no_surcharge(self, engine):
        """100k gain, 10yrs → einfache 2% × 3.15 = 6.3%.
        100000 * 0.02 * 3.15 = 6300.00
        """
        inputs = _make_inputs(100000)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("6300.00")
        assert result.surcharge_rate is None


class TestOWSurcharge:
    def test_surcharge_6_months(self, engine):
        """100k gain, 6 months → surcharge +50%.
        100000 * 0.02 = 2000 * 1.5 = 3000 * 3.15 = 9450.00
        """
        inputs = _make_inputs(100000, months=6)
        result = engine.compute(inputs)
        assert result.surcharge_rate == Decimal("0.5")
        assert result.simple_tax == Decimal("9450.00")
