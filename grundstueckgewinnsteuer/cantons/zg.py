"""Zug Grundstückgewinnsteuer engine.

Source: StG ZG §§ 187ff
https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung/grundstueckgewinnsteuer

ZG uses a unique yield-based rate model: the tax rate equals the annual
return (Rendite) of the property transaction, clamped between 10% and a
degressive maximum (60% for short holding, down to 25% for 26+ years).

There are no progressive brackets.
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
    with open(_DATA_DIR / "cantons" / "zg" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class ZugEngine(CantonEngine):
    """Canton ZG – yield-based tax rate (no progressive brackets)."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._min_rate = Decimal(str(self._tariff["min_rate"]))
        self._max_rate = Decimal(str(self._tariff["max_rate"]))
        self._reduction_start = self._tariff["max_rate_reduction_start_year"]
        self._reduction_per_year = Decimal(str(self._tariff["max_rate_reduction_per_year"]))
        self._reduction_max = Decimal(str(self._tariff["max_rate_reduction_max"]))

    @property
    def canton_code(self) -> str:
        return "ZG"

    @property
    def canton_name(self) -> str:
        return "Zug"

    def get_communes(self, tax_year: int) -> list[str]:
        # TODO: load from BFS commune dataset for ZG
        return ["Zug", "Baar", "Cham", "Risch", "Steinhausen"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _effective_max_rate(self, ownership_years: int) -> Decimal:
        """Max rate reduces by 2.5pp/year from year 12."""
        if ownership_years < self._reduction_start:
            return self._max_rate
        reduction_years = ownership_years - self._reduction_start + 1
        reduction = min(self._reduction_per_year * reduction_years, self._reduction_max)
        return self._max_rate - reduction

    def _compute_rate(
        self, gain: Decimal, cost: Decimal, total_months: int, ownership_years: int,
    ) -> Decimal:
        """Compute yield-based tax rate in percent."""
        if cost <= 0 or total_months <= 0:
            return self._max_rate

        total_yield = gain * Decimal("100") / cost

        if ownership_years <= 5:
            annual_yield = total_yield * Decimal("12") / Decimal(str(total_months))
        else:
            annual_yield = total_yield / Decimal(str(ownership_years))

        max_rate = self._effective_max_rate(ownership_years)
        # Clamp to [min_rate, max_rate]
        rate = max(self._min_rate, min(annual_yield, max_rate))
        return rate

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0 or taxable_gain < self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        # Acquisition costs = purchase_price + acquisition_costs + investments
        cost = inputs.purchase_price + inputs.acquisition_costs + inputs.total_investments

        rate_percent = self._compute_rate(taxable_gain, cost, total_months, ownership_years)
        simple_tax = finalize_simple_tax(taxable_gain * rate_percent / Decimal("100"))

        eff_rate = (Decimal("100") * simple_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=simple_tax,
            canton_share=Decimal("0"),  # ZG: tax goes to commune
            commune_share=simple_tax,
            church_tax_total=Decimal("0"),
            church_tax_breakdown={},
            total_tax=simple_tax,
            holding_months=total_months,
            holding_years=ownership_years,
            brackets_applied=[],
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="ZG",
                canton_name="Zug",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung/grundstueckgewinnsteuer",
                    "https://www.estv2.admin.ch/stp/kb/zg-de.pdf",
                ],
            ),
            extra={
                "yield_rate_percent": str(rate_percent),
                "max_rate_percent": str(self._effective_max_rate(ownership_years)),
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
            metadata=ResultMetadata(canton="ZG", canton_name="Zug", commune=inputs.commune, tax_year=inputs.tax_year),
        )
