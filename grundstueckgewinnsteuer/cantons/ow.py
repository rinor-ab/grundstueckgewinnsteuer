"""Obwalden Grundstückgewinnsteuer engine.

Source: StG OW
OW uses a proportional 2% base rate multiplied by the Steuerfuss
(canton 3.15 + commune). Surcharges for <3 years, no discounts.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import (
    SurchargeEntry,
    apply_surcharge,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "ow" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class ObwaldenEngine(CantonEngine):
    """Canton OW – proportional 2% × Steuerfuss with surcharges."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._base_rate = Decimal(str(self._tariff["base_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._canton_sf = Decimal(str(self._tariff.get("default_canton_steuerfuss", 1)))
        self._surcharge_threshold = self._tariff["surcharge_threshold_months"]
        self._surcharges = [
            SurchargeEntry(max_months=s["max_months"], rate=Decimal(str(s["rate"])))
            for s in self._tariff.get("surcharges", [])
        ]

    @property
    def canton_code(self) -> str:
        return "OW"

    @property
    def canton_name(self) -> str:
        return "Obwalden"

    def get_communes(self, tax_year: int) -> list[str]:
        return ["Sarnen", "Kerns", "Sachseln", "Alpnach", "Giswil", "Lungern", "Engelberg"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0 or taxable_gain < self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        # einfache Steuer = gain * 2%
        einfache_steuer = taxable_gain * self._base_rate
        simple_tax_before = einfache_steuer

        # Apply surcharge
        einfache_steuer, surcharge_rate = apply_surcharge(
            einfache_steuer, total_months, self._surcharges, self._surcharge_threshold,
        )

        # Multiply by canton Steuerfuss (simplified — in practice commune SF is added)
        simple_tax = finalize_simple_tax(einfache_steuer * self._canton_sf)
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
            simple_tax_before_adjustments=simple_tax_before,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="OW",
                canton_name="Obwalden",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
            ),
            extra={"base_rate": str(self._base_rate), "canton_steuerfuss": str(self._canton_sf)},
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
            metadata=ResultMetadata(canton="OW", canton_name="Obwalden", commune=inputs.commune, tax_year=inputs.tax_year),
        )
