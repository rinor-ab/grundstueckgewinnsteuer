"""Schaffhausen Grundstückgewinnsteuer engine – exact port of calculatetax.js.

This module faithfully mirrors the JavaScript reference implementation at
https://github.com/rinor-ab/steuerrechnerSHCH for parity.
"""

from __future__ import annotations

import json
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
    compute_church_tax,
    compute_share,
    evaluate_brackets,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    tariff_path = _DATA_DIR / "cantons" / "sh" / "tariff.yaml"
    with open(tariff_path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _load_steuerfuesse() -> dict:
    sf_path = _DATA_DIR / "communes" / "sh" / "steuerfuesse.json"
    with open(sf_path, encoding="utf-8") as f:
        return json.load(f)


def _months_between(d1, d2) -> int:
    """Calculate total months between two dates (same as JS month difference)."""
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class SchaffhausenEngine(CantonEngine):
    """Canton SH – exact parity with the JavaScript reference calculator."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._steuerfuesse = _load_steuerfuesse()

        # Parse tariff into typed structures
        self._brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff["brackets"]
        ]
        self._top_rate = Decimal(str(self._tariff["top_rate"]))
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

    # -- CantonEngine interface --

    @property
    def canton_code(self) -> str:
        return "SH"

    @property
    def canton_name(self) -> str:
        return "Schaffhausen"

    def get_communes(self, tax_year: int) -> list[str]:
        year_data = self._steuerfuesse.get(str(tax_year), [])
        return [e["Gemeinde"] for e in year_data if e["Gemeinde"] != "Kanton"]

    def get_available_years(self) -> list[int]:
        return sorted(int(y) for y in self._steuerfuesse)

    def get_confessions(self) -> list[str]:
        return self._tariff.get("confessions", ["evangR", "roemK", "christK", "Andere"])

    def compute(self, inputs: TaxInputs) -> TaxResult:
        # --- Taxable gain ---
        taxable_gain = inputs.taxable_gain
        if taxable_gain <= 0:
            return self._zero_result(inputs, taxable_gain)

        # --- Holding period ---
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        # --- Step 1: progressive brackets (mirrors JS calculatetax) ---
        base_tax, steps, flat_amount, flat_tax = evaluate_brackets(
            taxable_gain, self._brackets, self._top_rate,
        )

        simple_tax_before_adj = base_tax

        # --- Step 2: surcharge ---
        base_tax, surcharge_rate = apply_surcharge(
            base_tax, total_months, self._surcharges, self._surcharge_threshold,
        )

        # --- Step 3: discount ---
        base_tax, discount_rate = apply_discount(
            base_tax, total_months, self._discounts, self._discount_min_years,
        )

        # --- Step 4: finalize simple tax (toFixed(2)) ---
        simple_tax = finalize_simple_tax(base_tax)

        # --- Step 5: load commune/canton multipliers ---
        year_str = str(inputs.tax_year)
        year_data = self._steuerfuesse.get(year_str, [])

        commune_data = next((e for e in year_data if e["Gemeinde"] == inputs.commune), None)
        kanton_data = next((e for e in year_data if e["Gemeinde"] == "Kanton"), None)

        if commune_data is None or kanton_data is None:
            raise ValueError(
                f"No Steuerfuss data for commune '{inputs.commune}' / year {inputs.tax_year} in SH"
            )

        kanton_mult = Decimal(kanton_data["natPers"])
        commune_mult = Decimal(commune_data["natPers"])

        # --- Step 6: shares via roundUpTo005 ---
        kanton_share = compute_share(simple_tax, kanton_mult)
        commune_share = compute_share(simple_tax, commune_mult)

        # --- Step 7: church tax ---
        confession_rates: dict[str, Decimal] = {}
        for key in ("evangR", "roemK", "christK"):
            confession_rates[key] = Decimal(commune_data.get(key, "0"))
        confession_rates["Andere"] = Decimal("0")

        church_total, church_breakdown = compute_church_tax(
            simple_tax, confession_rates, inputs.confessions,
        )

        # --- Step 8: total ---
        total_tax = kanton_share + commune_share + church_total

        # --- Effective tax rate ---
        eff_rate = (Decimal("100") * simple_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=simple_tax,
            canton_share=kanton_share,
            commune_share=commune_share,
            church_tax_total=church_total,
            church_tax_breakdown=church_breakdown,
            total_tax=total_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=steps,
            flat_rate_amount=flat_amount,
            flat_rate_tax=flat_tax,
            surcharge_rate=surcharge_rate,
            discount_rate=discount_rate,
            simple_tax_before_adjustments=simple_tax_before_adj,
            effective_tax_rate_percent=eff_rate,
            canton_multiplier_percent=kanton_mult,
            commune_multiplier_percent=commune_mult,
            metadata=ResultMetadata(
                canton="SH",
                canton_name="Schaffhausen",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://sh.ch/CMS/get/file/ca0d9d0b-64f9-45fc-9754-a186094ed97e",
                    "https://www.estv2.admin.ch/stp/kb/sh-de.pdf",
                    "https://sh.ch/CMS/get/file/b665cf35-ca62-4439-b485-5a7391cd072d",
                ],
            ),
        )

    def _zero_result(self, inputs: TaxInputs, gain: Decimal) -> TaxResult:
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        return TaxResult(
            taxable_gain=gain,
            simple_tax=Decimal("0"),
            canton_share=Decimal("0"),
            commune_share=Decimal("0"),
            church_tax_total=Decimal("0"),
            church_tax_breakdown={},
            total_tax=Decimal("0"),
            holding_months=total_months,
            holding_years=total_months // 12,
            metadata=ResultMetadata(
                canton="SH",
                canton_name="Schaffhausen",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
            ),
        )
