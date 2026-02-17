"""Appenzell Ausserrhoden Grundstückgewinnsteuer engine.

Source: StG AR
AR uses a flat 30% rate with surcharges for <4 years and
discounts from year 10 (2.5%/yr, max 50%). Gain is rounded
down to nearest CHF 500.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import (
    DiscountEntry,
    SurchargeEntry,
    apply_discount,
    apply_surcharge,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "ar" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class AppenzellAREngine(CantonEngine):
    """Canton AR – flat 30% rate with surcharges and discounts."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._base_rate = Decimal(str(self._tariff["base_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._gain_rounding = int(self._tariff.get("gain_rounding", 1))
        self._surcharge_threshold = self._tariff["surcharge_threshold_months"]
        self._surcharges = [
            SurchargeEntry(max_months=s["max_months"], rate=Decimal(str(s["rate"])))
            for s in self._tariff.get("surcharges", [])
        ]
        self._discount_min = self._tariff["discount_min_years"]
        self._discounts = [
            DiscountEntry(years=d["years"], rate=Decimal(str(d["rate"])))
            for d in self._tariff.get("discounts", [])
        ]

    @property
    def canton_code(self) -> str:
        return "AR"

    @property
    def canton_name(self) -> str:
        return "Appenzell Ausserrhoden"

    def get_communes(self, tax_year: int) -> list[str]:
        return ["Herisau", "Teufen", "Speicher", "Heiden", "Urnäsch"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _round_gain_down(self, gain: Decimal) -> Decimal:
        """Round gain down to nearest CHF 500."""
        r = self._gain_rounding
        return (gain // r) * r

    def compute(self, inputs: TaxInputs) -> TaxResult:
        raw_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if raw_gain <= 0 or raw_gain < self._min_gain:
            return self._zero_result(inputs, raw_gain, total_months)

        # Round gain down to nearest 500
        taxable_gain = self._round_gain_down(raw_gain)
        if taxable_gain < self._min_gain:
            return self._zero_result(inputs, raw_gain, total_months)

        # Base tax = gain * 30%
        base_tax = taxable_gain * self._base_rate
        simple_tax_before = base_tax

        base_tax, surcharge_rate = apply_surcharge(
            base_tax, total_months, self._surcharges, self._surcharge_threshold,
        )
        base_tax, discount_rate = apply_discount(
            base_tax, total_months, self._discounts, self._discount_min,
        )

        simple_tax = finalize_simple_tax(base_tax)
        eff_rate = (Decimal("100") * simple_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=simple_tax,
            canton_share=simple_tax,
            commune_share=Decimal("0"),
            church_tax_total=Decimal("0"),
            church_tax_breakdown={},
            total_tax=simple_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=[],
            surcharge_rate=surcharge_rate,
            discount_rate=discount_rate,
            simple_tax_before_adjustments=simple_tax_before,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="AR",
                canton_name="Appenzell Ausserrhoden",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
            ),
            extra={"base_rate": str(self._base_rate), "gain_rounded_to": str(taxable_gain)},
        )

    def _zero_result(self, inputs: TaxInputs, gain: Decimal, months: int) -> TaxResult:
        return TaxResult(
            taxable_gain=gain,
            simple_tax=Decimal("0"),
            canton_share=Decimal("0"),
            commune_share=Decimal("0"),
            church_tax_total=Decimal("0"),
            total_tax=Decimal("0"),
            holding_months=months,
            holding_years=months // 12,
            metadata=ResultMetadata(canton="AR", canton_name="Appenzell Ausserrhoden", commune=inputs.commune, tax_year=inputs.tax_year),
        )
