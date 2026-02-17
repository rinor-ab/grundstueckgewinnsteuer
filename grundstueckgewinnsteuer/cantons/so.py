"""Solothurn Grundstückgewinnsteuer engine.

Source: StG SO
https://so.ch/verwaltung/finanzdepartement/kantonales-steueramt/grundstueckgewinnsteuer/

SO uses a progressive tariff based on the income tax schedule.
Notable features: NO surcharges (unique in Switzerland), and a 2%/year
discount starting from the 5th year of ownership (max 50%).
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import (
    Bracket,
    DiscountEntry,
    apply_discount,
    evaluate_brackets,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "so" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class SolothurnEngine(CantonEngine):
    """Canton SO – progressive brackets, no surcharges, discount from year 5."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff["brackets"]
        ]
        self._top_rate = Decimal(str(self._tariff["top_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._discount_min = self._tariff["discount_min_years"]
        self._discounts = [
            DiscountEntry(years=d["years"], rate=Decimal(str(d["rate"])))
            for d in self._tariff.get("discounts", [])
        ]

    @property
    def canton_code(self) -> str:
        return "SO"

    @property
    def canton_name(self) -> str:
        return "Solothurn"

    def get_communes(self, tax_year: int) -> list[str]:
        return ["Solothurn", "Olten", "Grenchen", "Zuchwil", "Bettlach"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0 or taxable_gain <= self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        base_tax, steps, flat_amount, flat_tax = evaluate_brackets(
            taxable_gain, self._brackets, self._top_rate,
        )

        simple_tax_before = base_tax

        # No surcharges in SO

        # Discount
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
            brackets_applied=steps,
            flat_rate_amount=flat_amount,
            flat_rate_tax=flat_tax,
            discount_rate=discount_rate,
            simple_tax_before_adjustments=simple_tax_before,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="SO",
                canton_name="Solothurn",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://so.ch/verwaltung/finanzdepartement/kantonales-steueramt/grundstueckgewinnsteuer/",
                    "https://www.estv2.admin.ch/stp/kb/so-de.pdf",
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
            metadata=ResultMetadata(canton="SO", canton_name="Solothurn", commune=inputs.commune, tax_year=inputs.tax_year),
        )
