"""Tests for the generic tariff evaluator."""

from decimal import Decimal

from grundstueckgewinnsteuer.engine.tariff import (
    Bracket,
    DiscountEntry,
    SurchargeEntry,
    apply_discount,
    apply_surcharge,
    compute_church_tax,
    compute_share,
    evaluate_brackets,
)

# Schaffhausen brackets for reference testing
SH_BRACKETS = [
    Bracket(Decimal("2000"), Decimal("0.02")),
    Bracket(Decimal("4000"), Decimal("0.04")),
    Bracket(Decimal("6000"), Decimal("0.06")),
    Bracket(Decimal("8000"), Decimal("0.08")),
    Bracket(Decimal("15000"), Decimal("0.10")),
    Bracket(Decimal("30000"), Decimal("0.12")),
    Bracket(Decimal("45000"), Decimal("0.14")),
    Bracket(Decimal("60000"), Decimal("0.16")),
    Bracket(Decimal("80000"), Decimal("0.18")),
    Bracket(Decimal("100000"), Decimal("0.20")),
]


class TestEvaluateBrackets:
    def test_first_bracket_only(self):
        """1000 CHF gain → fully in first bracket at 2%."""
        tax, steps, flat_amt, flat_tax = evaluate_brackets(
            Decimal("1000"), SH_BRACKETS, Decimal("0.15"),
        )
        assert tax == Decimal("20.00")
        assert len(steps) == 1
        assert flat_amt == Decimal("0")

    def test_exact_first_bracket(self):
        """2000 CHF → exactly fills first bracket."""
        tax, steps, _, _ = evaluate_brackets(Decimal("2000"), SH_BRACKETS, Decimal("0.15"))
        assert tax == Decimal("40.00")  # 2000 * 0.02

    def test_two_brackets(self):
        """3000 CHF → 2000 at 2% + 1000 at 4%."""
        tax, steps, _, _ = evaluate_brackets(Decimal("3000"), SH_BRACKETS, Decimal("0.15"))
        expected = Decimal("2000") * Decimal("0.02") + Decimal("1000") * Decimal("0.04")
        assert tax == expected

    def test_all_brackets_exact_100k(self):
        """100,000 CHF → fills all brackets exactly."""
        tax, steps, flat_amt, _ = evaluate_brackets(Decimal("100000"), SH_BRACKETS, Decimal("0.15"))
        assert len(steps) == 10
        assert flat_amt == Decimal("0")
        # Manual calculation:
        # 2000*0.02 + 2000*0.04 + 2000*0.06 + 2000*0.08 + 7000*0.10 + 15000*0.12 + 15000*0.14
        # + 15000*0.16 + 20000*0.18 + 20000*0.20
        # = 40+80+120+160+700+1800+2100+2400+3600+4000 = 15000
        assert tax == Decimal("15000")

    def test_above_all_brackets(self):
        """150,000 CHF → all brackets + 50k at 15%."""
        tax, steps, flat_amt, flat_tax = evaluate_brackets(
            Decimal("150000"), SH_BRACKETS, Decimal("0.15"),
        )
        assert flat_amt == Decimal("50000")
        assert flat_tax == Decimal("7500")
        assert tax == Decimal("22500")  # 15000 + 7500


class TestApplySurcharge:
    SURCHARGES = [
        SurchargeEntry(6, Decimal("0.50")),
        SurchargeEntry(12, Decimal("0.45")),
        SurchargeEntry(18, Decimal("0.40")),
        SurchargeEntry(24, Decimal("0.35")),
        SurchargeEntry(60, Decimal("0.05")),
    ]

    def test_no_surcharge_above_threshold(self):
        tax, rate = apply_surcharge(Decimal("1000"), 72, self.SURCHARGES, 60)
        assert tax == Decimal("1000")
        assert rate is None

    def test_surcharge_3_months(self):
        tax, rate = apply_surcharge(Decimal("1000"), 3, self.SURCHARGES, 60)
        assert tax == Decimal("1500")  # 1000 * 1.5
        assert rate == Decimal("0.50")

    def test_surcharge_10_months(self):
        tax, rate = apply_surcharge(Decimal("1000"), 10, self.SURCHARGES, 60)
        assert tax == Decimal("1450")  # 1000 * 1.45
        assert rate == Decimal("0.45")


class TestApplyDiscount:
    DISCOUNTS = [
        DiscountEntry(6, Decimal("0.05")),
        DiscountEntry(7, Decimal("0.10")),
        DiscountEntry(10, Decimal("0.25")),
        DiscountEntry(17, Decimal("0.60")),
    ]

    def test_no_discount_below_min(self):
        tax, rate = apply_discount(Decimal("1000"), 48, self.DISCOUNTS, 6)
        assert tax == Decimal("1000")
        assert rate is None

    def test_discount_6_years(self):
        tax, rate = apply_discount(Decimal("1000"), 72, self.DISCOUNTS, 6)
        assert tax == Decimal("950")
        assert rate == Decimal("0.05")

    def test_discount_10_years(self):
        tax, rate = apply_discount(Decimal("1000"), 120, self.DISCOUNTS, 6)
        assert tax == Decimal("750")
        assert rate == Decimal("0.25")

    def test_discount_20_years(self):
        tax, rate = apply_discount(Decimal("1000"), 240, self.DISCOUNTS, 6)
        assert tax == Decimal("400")
        assert rate == Decimal("0.60")


class TestComputeShare:
    def test_basic_share(self):
        # 1000 * 76/100 = 760 → no rounding needed
        result = compute_share(Decimal("1000"), Decimal("76"))
        assert result == Decimal("760")

    def test_share_with_rounding(self):
        # 1234.56 * 76/100 = 938.2656 → roundUpTo005 → 938.30
        result = compute_share(Decimal("1234.56"), Decimal("76"))
        assert result == Decimal("938.30")


class TestComputeChurchTax:
    def test_no_people(self):
        total, breakdown = compute_church_tax(Decimal("1000"), {"evangR": Decimal("13")}, {})
        assert total == Decimal("0")

    def test_single_person_single_conf(self):
        total, breakdown = compute_church_tax(
            Decimal("1000"),
            {"evangR": Decimal("13"), "roemK": Decimal("13")},
            {"evangR": 1},
        )
        # 1000 * 13/100 / 1 * 1 = 130
        assert total == Decimal("130")

    def test_two_people_mixed(self):
        total, breakdown = compute_church_tax(
            Decimal("1000"),
            {"evangR": Decimal("13"), "roemK": Decimal("13"), "Andere": Decimal("0")},
            {"evangR": 1, "Andere": 1},
        )
        # total_people = 2
        # evangR: 1000 * 13/100 / 2 * 1 = 65
        # Andere: 1000 * 0/100 / 2 * 1 = 0
        assert total == Decimal("65")
        assert breakdown["evangR"] == Decimal("65")
        assert breakdown["Andere"] == Decimal("0")
