"""Freiburg Grundstückgewinnsteuer engine.

Source: DStG FR
FR uses a degressive flat rate by holding period (22% → 10%).
Commune receives 60% of the canton tax as a surcharge.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.rounding import to_fixed_2
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "fr" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class FreiburgEngine(CantonEngine):
    """Canton FR – degressive rate with commune surcharge."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._rate_schedule = [
            (entry["max_years"], Decimal(str(entry["rate"])))
            for entry in self._tariff["rate_schedule"]
        ]
        self._floor_rate = Decimal(str(self._tariff["floor_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._commune_surcharge = Decimal(str(self._tariff.get("commune_surcharge_rate", 0)))

    @property
    def canton_code(self) -> str:
        return "FR"

    @property
    def canton_name(self) -> str:
        return "Freiburg"

    def get_communes(self, tax_year: int) -> list[str]:
        return ["Freiburg", "Bulle", "Villars-sur-Glâne", "Düdingen", "Murten"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _get_rate(self, years: int) -> Decimal:
        for max_yrs, rate in self._rate_schedule:
            if years < max_yrs:
                return rate
        return self._floor_rate

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0 or taxable_gain < self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        rate = self._get_rate(ownership_years)
        canton_tax = to_fixed_2(taxable_gain * rate)
        commune_tax = to_fixed_2(canton_tax * self._commune_surcharge)
        total_tax = canton_tax + commune_tax
        eff_rate = (Decimal("100") * total_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=canton_tax,
            canton_share=canton_tax,
            commune_share=commune_tax,
            church_tax_total=Decimal("0"),
            church_tax_breakdown={},
            total_tax=total_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=[],
            simple_tax_before_adjustments=canton_tax,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="FR",
                canton_name="Freiburg",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
            ),
            extra={"applied_rate": str(rate), "commune_surcharge": str(self._commune_surcharge)},
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
            metadata=ResultMetadata(canton="FR", canton_name="Freiburg", commune=inputs.commune, tax_year=inputs.tax_year),
        )
