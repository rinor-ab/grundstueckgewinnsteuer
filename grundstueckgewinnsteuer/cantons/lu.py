"""Luzern Grundstückgewinnsteuer engine.

Source: StG LU § 195ff
https://www.lu.ch/verwaltung/FD/Dienststellen/steuern/grundstueckgewinnsteuer

LU uses the income tax tariff for single persons to compute a "simple tax",
which is then multiplied by a uniform canton-wide rate of 4.2 Steuereinheiten.
There is no per-commune Steuerfuss variation for GGSt.

The holding-period discount applies to the tax (not the gain).
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import (
    Bracket,
    DiscountEntry,
    SurchargeEntry,
    apply_discount,
    apply_surcharge,
    evaluate_brackets,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "lu" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class LuzernEngine(CantonEngine):
    """Canton LU – income-tariff based with uniform canton rate."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff["brackets"]
        ]
        self._top_rate = Decimal(str(self._tariff["top_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._canton_mult = Decimal(str(self._tariff.get("canton_multiplier", "4.2")))
        self._surcharges = [
            SurchargeEntry(max_months=s["max_months"], rate=Decimal(str(s["rate"])))
            for s in self._tariff["surcharges_by_months"]
        ]
        self._discounts = [
            DiscountEntry(years=d["years"], rate=Decimal(str(d["rate"])))
            for d in self._tariff["discounts_by_years"]
        ]
        self._surcharge_threshold = self._tariff["surcharge_threshold_months"]
        self._discount_min_years = self._tariff["discount_min_years"]

    @property
    def canton_code(self) -> str:
        return "LU"

    @property
    def canton_name(self) -> str:
        return "Luzern"

    def get_communes(self, tax_year: int) -> list[str]:
        # LU has uniform rate, but communes still exist for location
        # TODO: load from BFS commune dataset for LU
        return ["Luzern", "Emmen", "Kriens", "Horw", "Sursee"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return self._tariff.get("confessions", [])

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0 or taxable_gain < self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        # Step 1: compute "Einfache Steuer" using income tariff brackets
        base_tax, steps, flat_amount, flat_tax = evaluate_brackets(
            taxable_gain, self._brackets, self._top_rate,
        )
        simple_tax_before_adj = base_tax

        # Step 2: surcharge for short ownership
        base_tax, surcharge_rate = apply_surcharge(
            base_tax, total_months, self._surcharges, self._surcharge_threshold,
        )

        # Step 3: discount for long ownership
        base_tax, discount_rate = apply_discount(
            base_tax, total_months, self._discounts, self._discount_min_years,
        )

        simple_tax = finalize_simple_tax(base_tax)

        # Step 4: multiply by canton-wide Steuereinheit (4.2)
        canton_tax = finalize_simple_tax(simple_tax * self._canton_mult)

        eff_rate = (Decimal("100") * canton_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=simple_tax,
            canton_share=canton_tax,
            commune_share=Decimal("0"),  # Uniform – no separate commune share
            church_tax_total=Decimal("0"),  # TODO: implement LU church tax
            church_tax_breakdown={},
            total_tax=canton_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=steps,
            flat_rate_amount=flat_amount,
            flat_rate_tax=flat_tax,
            surcharge_rate=surcharge_rate,
            discount_rate=discount_rate,
            simple_tax_before_adjustments=simple_tax_before_adj,
            effective_tax_rate_percent=eff_rate,
            canton_multiplier_percent=self._canton_mult,
            metadata=ResultMetadata(
                canton="LU",
                canton_name="Luzern",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.lu.ch/verwaltung/FD/Dienststellen/steuern/grundstueckgewinnsteuer",
                    "https://www.estv2.admin.ch/stp/kb/lu-de.pdf",
                ],
            ),
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
            metadata=ResultMetadata(canton="LU", canton_name="Luzern", commune=inputs.commune, tax_year=inputs.tax_year),
        )
