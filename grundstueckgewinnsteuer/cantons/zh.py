"""Zürich Grundstückgewinnsteuer engine.

Source: § 227 StG ZH, ESTV Kantonsblatt zh-de.pdf
https://www.zh.ch/de/steuern-finanzen/steuern/grundstueckgewinnsteuer.html

ZH is a communal-uniform canton: the tax tariff is set by the canton and
applies identically for all communes.  There is no separate canton/commune
Steuerfuss split — the full tax goes to the commune.  Church tax is not
part of the GGSt in ZH.
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
    with open(_DATA_DIR / "cantons" / "zh" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class ZuerichEngine(CantonEngine):
    """Canton ZH – communal-uniform Grundstückgewinnsteuer."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff["brackets"]
        ]
        self._top_rate = Decimal(str(self._tariff["top_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
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
        return "ZH"

    @property
    def canton_name(self) -> str:
        return "Zürich"

    def get_communes(self, tax_year: int) -> list[str]:
        # ZH has ~160 communes; placeholder returns a short list
        # TODO: load from BFS commune dataset
        return ["Zürich", "Winterthur", "Wädenswil", "Uster", "Dietikon"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []  # Church tax not part of GGSt in ZH

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        # ZH: gains below minimum are tax-free
        if taxable_gain <= 0 or taxable_gain < self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        # Progressive brackets
        base_tax, steps, flat_amount, flat_tax = evaluate_brackets(
            taxable_gain, self._brackets, self._top_rate,
        )
        simple_tax_before_adj = base_tax

        # Surcharge
        base_tax, surcharge_rate = apply_surcharge(
            base_tax, total_months, self._surcharges, self._surcharge_threshold,
        )

        # Discount
        base_tax, discount_rate = apply_discount(
            base_tax, total_months, self._discounts, self._discount_min_years,
        )

        simple_tax = finalize_simple_tax(base_tax)

        # ZH: simple tax IS the total tax (communal uniform, no Steuerfuss split)
        eff_rate = (Decimal("100") * simple_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=simple_tax,
            canton_share=Decimal("0"),  # No separate canton share in ZH
            commune_share=simple_tax,  # Full tax goes to commune
            church_tax_total=Decimal("0"),
            church_tax_breakdown={},
            total_tax=simple_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=steps,
            flat_rate_amount=flat_amount,
            flat_rate_tax=flat_tax,
            surcharge_rate=surcharge_rate,
            discount_rate=discount_rate,
            simple_tax_before_adjustments=simple_tax_before_adj,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="ZH",
                canton_name="Zürich",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.zh.ch/de/steuern-finanzen/steuern/grundstueckgewinnsteuer.html",
                    "https://www.estv2.admin.ch/stp/kb/zh-de.pdf",
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
            metadata=ResultMetadata(canton="ZH", canton_name="Zürich", commune=inputs.commune, tax_year=inputs.tax_year),
        )
