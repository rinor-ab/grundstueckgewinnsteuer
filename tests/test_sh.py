"""Schaffhausen parity tests – golden-master tests proving Python matches JS.

Each test case is derived by manually computing the expected values using the
exact algorithm from calculatetax.js in the reference repository:
https://github.com/rinor-ab/steuerrechnerSHCH

Golden fixtures cover:
- 3 gains below 100k at different bracket levels
- 3 gains straddling multiple brackets
- 2 gains above 100k
- 2 holding-period surcharge cases (< 60 months)
- 2 holding-period discount cases (≥ 6 years)
- 2 church tax distributions with multiple people
"""

from datetime import date
from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.cantons.sh import SchaffhausenEngine
from grundstueckgewinnsteuer.models import TaxInputs


@pytest.fixture
def engine():
    return SchaffhausenEngine()


def _make_inputs(
    gain: int,
    months: int = 120,
    commune: str = "Schaffhausen",
    year: int = 2026,
    confessions: dict | None = None,
) -> TaxInputs:
    """Helper to create inputs with a given gain and holding period."""
    purchase = date(2010, 1, 1)
    # Approximate sale date based on months
    sale_year = purchase.year + months // 12
    sale_month = purchase.month + months % 12
    if sale_month > 12:
        sale_year += 1
        sale_month -= 12
    sale = date(sale_year, sale_month, 1)

    return TaxInputs(
        canton="SH",
        commune=commune,
        tax_year=year,
        purchase_date=purchase,
        sale_date=sale,
        purchase_price=Decimal("100000"),
        sale_price=Decimal(str(100000 + gain)),
        confessions=confessions or {},
    )


# ===================================================================
# A) Simple tax – gains below 100k
# ===================================================================

class TestSHSimpleTaxBelow100k:
    """Test gains that stay below the 100k top-bracket threshold."""

    def test_gain_1000_first_bracket(self, engine):
        """1000 CHF → all in first bracket (2%), 10yr → 25% discount."""
        inputs = _make_inputs(1000)
        result = engine.compute(inputs)
        # 1000 * 0.02 = 20.00, then 25% discount → 20 * 0.75 = 15.00
        assert result.simple_tax == Decimal("15.00")

    def test_gain_5000_three_brackets(self, engine):
        """5000 CHF → spans brackets 1-3, 10yr → 25% discount."""
        inputs = _make_inputs(5000)
        result = engine.compute(inputs)
        # 2000*0.02 + 2000*0.04 + 1000*0.06 = 40 + 80 + 60 = 180
        # After 25% discount: 180 * 0.75 = 135.00
        assert result.simple_tax == Decimal("135.00")

    def test_gain_50000_seven_brackets(self, engine):
        """50000 CHF → spans brackets 1-8, 10yr → 25% discount."""
        inputs = _make_inputs(50000)
        result = engine.compute(inputs)
        # 2000*0.02=40 + 2000*0.04=80 + 2000*0.06=120 + 2000*0.08=160
        # + 7000*0.10=700 + 15000*0.12=1800 + 15000*0.14=2100 + 5000*0.16=800
        # = 40+80+120+160+700+1800+2100+800 = 5800
        # After 25% discount: 5800 * 0.75 = 4350.00
        assert result.simple_tax == Decimal("4350.00")


# ===================================================================
# B) Simple tax – gains straddling multiple brackets
# ===================================================================

class TestSHMultipleBrackets:
    """Gains that straddle interesting bracket boundaries."""

    def test_gain_2000_exact_first(self, engine):
        """Exactly fills first bracket, 10yr → 25% discount."""
        inputs = _make_inputs(2000)
        result = engine.compute(inputs)
        # 2000 * 0.02 = 40.00 * 0.75 = 30.00
        assert result.simple_tax == Decimal("30.00")

    def test_gain_8000_four_brackets(self, engine):
        """8000 CHF → fills brackets 1-4 exactly, 10yr → 25% discount."""
        inputs = _make_inputs(8000)
        result = engine.compute(inputs)
        # 2000*0.02 + 2000*0.04 + 2000*0.06 + 2000*0.08
        # = 40 + 80 + 120 + 160 = 400
        # After 25% discount: 400 * 0.75 = 300.00
        assert result.simple_tax == Decimal("300.00")

    def test_gain_100000_all_brackets(self, engine):
        """100000 CHF → fills all brackets, no flat rate, 10yr → 25% discount."""
        inputs = _make_inputs(100000)
        result = engine.compute(inputs)
        # Sum: 40+80+120+160+700+1800+2100+2400+3600+4000 = 15000
        # After 25% discount: 15000 * 0.75 = 11250.00
        assert result.simple_tax == Decimal("11250.00")
        assert result.flat_rate_amount == Decimal("0")


# ===================================================================
# C) Simple tax – gains above 100k
# ===================================================================

class TestSHAbove100k:
    """Gains above 100k trigger the flat 15% rate on the excess."""

    def test_gain_150000(self, engine):
        """150k → 100k in brackets + 50k at 15%, 10yr → 25% discount."""
        inputs = _make_inputs(150000)
        result = engine.compute(inputs)
        # 15000 (brackets) + 50000 * 0.15 = 15000 + 7500 = 22500
        # After 25% discount: 22500 * 0.75 = 16875.00
        assert result.simple_tax == Decimal("16875.00")
        assert result.flat_rate_amount == Decimal("50000")
        assert result.flat_rate_tax == Decimal("7500")

    def test_gain_200000(self, engine):
        """200k → 100k in brackets + 100k at 15%, 10yr → 25% discount."""
        inputs = _make_inputs(200000)
        result = engine.compute(inputs)
        # 15000 + 100000 * 0.15 = 15000 + 15000 = 30000
        # After 25% discount: 30000 * 0.75 = 22500.00
        assert result.simple_tax == Decimal("22500.00")


# ===================================================================
# D) Holding period surcharges (< 60 months)
# ===================================================================

class TestSHSurcharges:
    """Surcharges for holdings shorter than 60 months."""

    def test_surcharge_3_months(self, engine):
        """3 months → first bracket surcharge 50%."""
        inputs = _make_inputs(10000, months=3)
        result = engine.compute(inputs)
        # Base tax: 2000*0.02 + 2000*0.04 + 2000*0.06 + 2000*0.08 + 2000*0.10
        # = 40 + 80 + 120 + 160 + 200 = 600
        # Surcharge: 600 * 1.50 = 900
        assert result.simple_tax == Decimal("900.00")
        assert result.surcharge_rate == Decimal("0.50")

    def test_surcharge_30_months(self, engine):
        """30 months → surcharge 30%."""
        inputs = _make_inputs(10000, months=30)
        result = engine.compute(inputs)
        # Base tax = 600 (same as above)
        # Surcharge: 600 * 1.30 = 780
        assert result.simple_tax == Decimal("780.00")
        assert result.surcharge_rate == Decimal("0.30")


# ===================================================================
# E) Holding period discounts (≥ 6 years)
# ===================================================================

class TestSHDiscounts:
    """Discounts for holdings of 6+ full years."""

    def test_discount_6_years(self, engine):
        """72 months (6 years) → 5% discount."""
        inputs = _make_inputs(10000, months=72)
        result = engine.compute(inputs)
        # Base tax = 600
        # Discount: 600 * 0.95 = 570
        assert result.simple_tax == Decimal("570.00")
        assert result.discount_rate == Decimal("0.05")

    def test_discount_17_years(self, engine):
        """204 months (17 years) → 60% discount (maximum)."""
        inputs = _make_inputs(10000, months=204)
        result = engine.compute(inputs)
        # Base tax = 600
        # Discount: 600 * 0.40 = 240
        assert result.simple_tax == Decimal("240.00")
        assert result.discount_rate == Decimal("0.60")


# ===================================================================
# F) Shares (canton & commune) with roundUpTo005 rounding
# ===================================================================

class TestSHShares:
    """Canton and commune shares use roundUpTo005 rounding."""

    def test_shares_schaffhausen_2026(self, engine):
        """Using Schaffhausen commune 2026: kanton=76%, gemeinde=83%."""
        inputs = _make_inputs(10000, commune="Schaffhausen", year=2026)
        result = engine.compute(inputs)
        # Simple tax = 600 (no surcharge/discount for 120 months = 10 years → 25% discount)
        # Actually 120 months = 10 years → discount 25%
        # Base: 600, after discount: 600 * 0.75 = 450
        simple = result.simple_tax
        # Kanton: roundUpTo005(simple * 76/100)
        # Gemeinde: roundUpTo005(simple * 83/100)
        # These are computed in the engine; just verify they use roundUpTo005
        assert result.canton_multiplier_percent == Decimal("76")
        assert result.commune_multiplier_percent == Decimal("83")
        # Verify total = kanton + gemeinde + church
        expected_total = result.canton_share + result.commune_share + result.church_tax_total
        assert result.total_tax == expected_total

    def test_shares_exact_rounding(self, engine):
        """Verify roundUpTo005 is applied: 450 * 76/100 = 342.00 (exact)."""
        inputs = _make_inputs(10000, commune="Schaffhausen", year=2026)
        result = engine.compute(inputs)
        # 10 years → 25% discount. Base 600 * 0.75 = 450
        assert result.simple_tax == Decimal("450.00")
        # 450 * 76/100 = 342.00 → no rounding needed
        assert result.canton_share == Decimal("342.00")
        # 450 * 83/100 = 373.50 → exact
        assert result.commune_share == Decimal("373.50")


# ===================================================================
# G) Church tax distribution
# ===================================================================

class TestSHChurchTax:
    """Church tax computed and distributed exactly as in JS reference."""

    def test_church_tax_single_evang(self, engine):
        """1 person evangR in Schaffhausen 2026 (evangR=13%)."""
        inputs = _make_inputs(
            10000, commune="Schaffhausen", year=2026,
            confessions={"evangR": 1},
        )
        result = engine.compute(inputs)
        # Simple tax = 450 (10 years discount)
        # Church: 450 * 13/100 / 1 * 1 = 58.5
        assert result.church_tax_total == Decimal("58.5")
        assert result.church_tax_breakdown["evangR"] == Decimal("58.5")

    def test_church_tax_two_people_mixed(self, engine):
        """2 people: 1 evangR + 1 roemK in Schaffhausen 2026."""
        inputs = _make_inputs(
            10000, commune="Schaffhausen", year=2026,
            confessions={"evangR": 1, "roemK": 1},
        )
        result = engine.compute(inputs)
        # Simple tax = 450
        # total_people = 2
        # evangR: 450 * 13/100 / 2 * 1 = 29.25
        # roemK: 450 * 13/100 / 2 * 1 = 29.25
        # Total: 58.5
        assert result.church_tax_breakdown["evangR"] == Decimal("29.25")
        assert result.church_tax_breakdown["roemK"] == Decimal("29.25")
        assert result.church_tax_total == Decimal("58.50")

    def test_church_tax_three_people_with_andere(self, engine):
        """3 people: 1 evangR + 1 roemK + 1 Andere in Schaffhausen 2026."""
        inputs = _make_inputs(
            10000, commune="Schaffhausen", year=2026,
            confessions={"evangR": 1, "roemK": 1, "Andere": 1},
        )
        result = engine.compute(inputs)
        # Simple tax = 450
        # total_people = 3
        # evangR: 450 * 13/100 / 3 * 1 = 19.5
        # roemK: 450 * 13/100 / 3 * 1 = 19.5
        # Andere: 450 * 0/100 / 3 * 1 = 0
        # Total: 39.0
        assert result.church_tax_breakdown["Andere"] == Decimal("0")
        assert result.church_tax_total == Decimal("39.0")


# ===================================================================
# H) No people → no church tax
# ===================================================================

class TestSHNoChurchTax:
    def test_no_confessions(self, engine):
        """No confessions → church tax 0."""
        inputs = _make_inputs(10000)
        result = engine.compute(inputs)
        assert result.church_tax_total == Decimal("0")


# ===================================================================
# I) Edge cases
# ===================================================================

class TestSHEdgeCases:
    def test_zero_gain(self, engine):
        """Zero gain → everything zero."""
        inputs = _make_inputs(0)
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("0")
        assert result.total_tax == Decimal("0")

    def test_negative_gain(self, engine):
        """Negative gain → everything zero (loss)."""
        inputs = TaxInputs(
            canton="SH",
            commune="Schaffhausen",
            tax_year=2026,
            purchase_date=date(2010, 1, 1),
            sale_date=date(2020, 1, 1),
            purchase_price=Decimal("500000"),
            sale_price=Decimal("400000"),
        )
        result = engine.compute(inputs)
        assert result.simple_tax == Decimal("0")
        assert result.total_tax == Decimal("0")
