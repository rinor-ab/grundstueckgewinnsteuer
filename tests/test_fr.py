"""Freiburg canton tests."""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.fr import FreiburgEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return FreiburgEngine()


def _make_inputs(gain: int, months: int = 120) -> TaxInputs:
    purchase = date(2010, 1, 1)
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    return TaxInputs(
        canton="FR",
        commune="Freiburg",
        tax_year=2025,
        purchase_date=purchase,
        sale_date=date(sale_year, sale_month, 1),
        purchase_price=Decimal("500000"),
        sale_price=Decimal(str(500000 + gain)),
    )


class TestFRRates:
    def test_below_minimum(self, engine):
        inputs = _make_inputs(5999)
        result = engine.compute(inputs)
        assert result.total_tax == Decimal("0")

    def test_short_hold_1yr(self, engine):
        """100k gain, 12 months → rate 22%.
        Canton: 100000*0.22 = 22000
        Commune: 22000*0.60 = 13200
        Total: 35200
        """
        inputs = _make_inputs(100000, months=12)
        result = engine.compute(inputs)
        assert result.canton_share == Decimal("22000.00")
        assert result.commune_share == Decimal("13200.00")
        assert result.total_tax == Decimal("35200.00")

    def test_long_hold_20yr(self, engine):
        """100k gain, 240 months → floor rate 10%.
        Canton: 10000, Commune: 6000, Total: 16000
        """
        inputs = _make_inputs(100000, months=240)
        result = engine.compute(inputs)
        assert result.canton_share == Decimal("10000.00")
        assert result.total_tax == Decimal("16000.00")
