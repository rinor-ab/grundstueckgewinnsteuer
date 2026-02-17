"""Tests for rounding functions – parity with JavaScript behavior."""

from decimal import Decimal

import pytest

from grundstueckgewinnsteuer.engine.rounding import round_up_to_005, to_fixed_2


# ---------------------------------------------------------------------------
# to_fixed_2: equivalent to JS Number.toFixed(2)
# ---------------------------------------------------------------------------

class TestToFixed2:
    def test_exact_value(self):
        assert to_fixed_2(Decimal("123.45")) == Decimal("123.45")

    def test_truncates_third_decimal(self):
        assert to_fixed_2(Decimal("123.454")) == Decimal("123.45")

    def test_rounds_up_third_decimal(self):
        assert to_fixed_2(Decimal("123.456")) == Decimal("123.46")

    def test_rounds_half_even_down(self):
        # Banker's rounding: 0.5 rounds to even
        assert to_fixed_2(Decimal("123.445")) == Decimal("123.44")

    def test_rounds_half_even_up(self):
        assert to_fixed_2(Decimal("123.455")) == Decimal("123.46")

    def test_zero(self):
        assert to_fixed_2(Decimal("0")) == Decimal("0.00")

    def test_large_value(self):
        assert to_fixed_2(Decimal("999999.999")) == Decimal("1000000.00")

    def test_small_value(self):
        assert to_fixed_2(Decimal("0.001")) == Decimal("0.00")

    def test_negative(self):
        assert to_fixed_2(Decimal("-5.555")) == Decimal("-5.56")


# ---------------------------------------------------------------------------
# round_up_to_005: equivalent to JS Math.ceil(x * 20) / 20
# ---------------------------------------------------------------------------

class TestRoundUpTo005:
    def test_exact_multiple(self):
        assert round_up_to_005(Decimal("10.00")) == Decimal("10.00")

    def test_exact_005(self):
        assert round_up_to_005(Decimal("10.05")) == Decimal("10.05")

    def test_rounds_up_from_001(self):
        assert round_up_to_005(Decimal("10.01")) == Decimal("10.05")

    def test_rounds_up_from_002(self):
        assert round_up_to_005(Decimal("10.02")) == Decimal("10.05")

    def test_rounds_up_from_003(self):
        assert round_up_to_005(Decimal("10.03")) == Decimal("10.05")

    def test_rounds_up_from_004(self):
        assert round_up_to_005(Decimal("10.04")) == Decimal("10.05")

    def test_rounds_up_from_006(self):
        assert round_up_to_005(Decimal("10.06")) == Decimal("10.10")

    def test_rounds_up_from_007(self):
        assert round_up_to_005(Decimal("10.07")) == Decimal("10.10")

    def test_zero(self):
        assert round_up_to_005(Decimal("0")) == Decimal("0")

    def test_large_value(self):
        assert round_up_to_005(Decimal("12345.67")) == Decimal("12345.70")

    def test_exact_10(self):
        assert round_up_to_005(Decimal("10.10")) == Decimal("10.10")

    def test_real_world_share(self):
        # e.g., 1000 * 83/100 = 830.00 → already exact
        val = Decimal("830.00")
        assert round_up_to_005(val) == Decimal("830.00")

    def test_real_world_share_fractional(self):
        # e.g., 1234.56 * 76/100 = 938.2656 → ceil to 938.30
        val = Decimal("938.2656")
        assert round_up_to_005(val) == Decimal("938.30")
