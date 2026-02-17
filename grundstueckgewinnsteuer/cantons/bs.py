"""Basel-Stadt Grundstückgewinnsteuer engine.

Source: StG BS (revised 2023)
https://www.steuerverwaltung.bs.ch/grundstueckgewinnsteuer.html

BS uses degressive flat rates determined by holding period with two
schedules: one for self-used properties and one for non-self-used.
Additionally, the taxable gain is reduced by 3%/year from year 6.
BS is a city-canton (single commune).
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import finalize_simple_tax
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "bs" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class BaselStadtEngine(CantonEngine):
    """Canton BS – dual-schedule holding-period flat rate with gain reduction."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._rates_not_self: dict[int, Decimal] = {
            int(k): Decimal(str(v))
            for k, v in self._tariff["rates_not_self_used"].items()
        }
        self._rates_self: dict[int, Decimal] = {
            int(k): Decimal(str(v))
            for k, v in self._tariff["rates_self_used"].items()
        }
        self._min_rate = Decimal(str(self._tariff["min_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._gain_red_start = self._tariff["gain_reduction_start_year"]
        self._gain_red_per_year = Decimal(str(self._tariff["gain_reduction_per_year"]))
        self._gain_red_max = Decimal(str(self._tariff["gain_reduction_max"]))

    @property
    def canton_code(self) -> str:
        return "BS"

    @property
    def canton_name(self) -> str:
        return "Basel-Stadt"

    def get_communes(self, tax_year: int) -> list[str]:
        # BS is a city-canton with 3 municipalities
        return ["Basel", "Riehen", "Bettingen"]

    def get_available_years(self) -> list[int]:
        return [2023, 2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _get_rate(self, ownership_years: int, self_used: bool) -> Decimal:
        """Look up rate from the appropriate schedule."""
        rates = self._rates_self if self_used else self._rates_not_self
        if ownership_years <= 0:
            return rates.get(1, Decimal("0.60"))
        if ownership_years >= 25:
            return self._min_rate
        return rates.get(ownership_years, self._min_rate)

    def _gain_reduction(self, ownership_years: int) -> Decimal:
        """Gain reduction: 3%/year from year 6, max 60%."""
        if ownership_years < self._gain_red_start:
            return Decimal("0")
        reduction_years = ownership_years - self._gain_red_start + 1
        return min(self._gain_red_per_year * reduction_years, self._gain_red_max)

    def compute(self, inputs: TaxInputs) -> TaxResult:
        raw_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if raw_gain <= 0 or raw_gain < self._min_gain:
            return self._zero_result(inputs, raw_gain, total_months)

        # Determine self-used flag from extra inputs (default: not self-used)
        self_used = False
        if hasattr(inputs, "extra") and isinstance(getattr(inputs, "extra", None), dict):
            self_used = inputs.extra.get("self_used", False)  # type: ignore[attr-defined]

        # Apply gain reduction
        gain_reduction_rate = self._gain_reduction(ownership_years)
        adjusted_gain = raw_gain * (1 - gain_reduction_rate)

        # Get rate for holding period
        rate = self._get_rate(ownership_years, self_used)

        simple_tax = finalize_simple_tax(adjusted_gain * rate)

        eff_rate = (Decimal("100") * simple_tax / raw_gain) if raw_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=raw_gain,
            simple_tax=simple_tax,
            canton_share=simple_tax,
            commune_share=Decimal("0"),
            church_tax_total=Decimal("0"),
            church_tax_breakdown={},
            total_tax=simple_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=[],
            discount_rate=gain_reduction_rate if gain_reduction_rate > 0 else None,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="BS",
                canton_name="Basel-Stadt",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.steuerverwaltung.bs.ch/grundstueckgewinnsteuer.html",
                    "https://www.estv2.admin.ch/stp/kb/bs-de.pdf",
                ],
            ),
            extra={
                "rate_schedule": "self_used" if self_used else "not_self_used",
                "holding_period_rate": str(rate),
                "adjusted_gain": str(adjusted_gain),
                "gain_reduction_rate": str(gain_reduction_rate),
            },
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
            metadata=ResultMetadata(canton="BS", canton_name="Basel-Stadt", commune=inputs.commune, tax_year=inputs.tax_year),
        )
