"""Genf Grundstückgewinnsteuer engine.

Source: LIPP GE
GE uses a degressive flat rate by holding period (50% down to 2%).
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
    with open(_DATA_DIR / "cantons" / "ge" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class GenfEngine(CantonEngine):
    """Canton GE – degressive flat rate by holding period."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._rate_schedule = [
            (entry["max_years"], Decimal(str(entry["rate"])))
            for entry in self._tariff["rate_schedule"]
        ]
        self._floor_rate = Decimal(str(self._tariff["floor_rate"]))

    @property
    def canton_code(self) -> str:
        return "GE"

    @property
    def canton_name(self) -> str:
        return "Genf"

    def get_communes(self, tax_year: int) -> list[str]:
        return ["Genève", "Carouge", "Lancy", "Vernier", "Meyrin", "Onex"]

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

        if taxable_gain <= 0:
            return self._zero_result(inputs, taxable_gain, total_months)

        rate = self._get_rate(ownership_years)
        simple_tax = to_fixed_2(taxable_gain * rate)
        eff_rate = Decimal("100") * rate

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
            simple_tax_before_adjustments=simple_tax,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="GE",
                canton_name="Genf",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
            ),
            extra={"applied_rate": str(rate)},
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
            metadata=ResultMetadata(canton="GE", canton_name="Genf", commune=inputs.commune, tax_year=inputs.tax_year),
        )
