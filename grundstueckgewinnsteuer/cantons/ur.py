"""Uri Grundstückgewinnsteuer engine.

Source: StG UR
UR uses a degressive holding-period rate schedule (31% down to 11%).
Features a Freibetrag of CHF 10'000 and gain rounding to CHF 100.
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
    with open(_DATA_DIR / "cantons" / "ur" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class UriEngine(CantonEngine):
    """Canton UR – degressive rate by holding period with Freibetrag."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._rate_schedule = [
            (entry["max_years"], Decimal(str(entry["rate"])))
            for entry in self._tariff["rate_schedule"]
        ]
        self._floor_rate = Decimal(str(self._tariff["floor_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._freibetrag = Decimal(str(self._tariff.get("freibetrag", 0)))
        self._gain_rounding = int(self._tariff.get("gain_rounding", 1))

    @property
    def canton_code(self) -> str:
        return "UR"

    @property
    def canton_name(self) -> str:
        return "Uri"

    def get_communes(self, tax_year: int) -> list[str]:
        return ["Altdorf", "Bürglen", "Erstfeld", "Schattdorf", "Flüelen"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _get_rate(self, years: int) -> Decimal:
        for max_yrs, rate in self._rate_schedule:
            if years < max_yrs:
                return rate
        return self._floor_rate

    def _round_gain_down(self, gain: Decimal) -> Decimal:
        r = self._gain_rounding
        return (gain // r) * r

    def compute(self, inputs: TaxInputs) -> TaxResult:
        raw_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if raw_gain <= 0 or raw_gain < self._min_gain:
            return self._zero_result(inputs, raw_gain, total_months)

        # Apply Freibetrag
        gain_after_fb = max(raw_gain - self._freibetrag, Decimal("0"))
        if gain_after_fb <= 0:
            return self._zero_result(inputs, raw_gain, total_months)

        # Round down to nearest 100
        taxable_gain = self._round_gain_down(gain_after_fb)
        if taxable_gain <= 0:
            return self._zero_result(inputs, raw_gain, total_months)

        rate = self._get_rate(ownership_years)
        simple_tax = to_fixed_2(taxable_gain * rate)
        eff_rate = (Decimal("100") * simple_tax / raw_gain) if raw_gain > 0 else Decimal("0")

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
                canton="UR",
                canton_name="Uri",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
            ),
            extra={"applied_rate": str(rate), "freibetrag_applied": str(self._freibetrag)},
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
            metadata=ResultMetadata(canton="UR", canton_name="Uri", commune=inputs.commune, tax_year=inputs.tax_year),
        )
