"""Aargau Grundstückgewinnsteuer engine.

Source: StG AG §§ 95–111
https://www.ag.ch/de/verwaltung/dfr/steuern/grundstueckgewinnsteuer

AG uses a degressive flat rate determined solely by holding period.
There are NO progressive brackets — the tax is simply ``gain × rate``.
Rate starts at 40% (≤1 year) and decreases to a floor of 5% (>25 years).
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
    with open(_DATA_DIR / "cantons" / "ag" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class AargauEngine(CantonEngine):
    """Canton AG – holding-period-based flat rate (no progressive brackets)."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        # Build rate lookup: completed years → Decimal rate
        self._rates: dict[int, Decimal] = {
            int(k): Decimal(str(v))
            for k, v in self._tariff["rates_by_holding_years"].items()
        }
        self._min_rate = Decimal(str(self._tariff["min_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))

    @property
    def canton_code(self) -> str:
        return "AG"

    @property
    def canton_name(self) -> str:
        return "Aargau"

    def get_communes(self, tax_year: int) -> list[str]:
        # TODO: load from BFS commune dataset for AG
        return ["Aarau", "Baden", "Wettingen", "Brugg", "Lenzburg"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _get_rate(self, ownership_years: int) -> Decimal:
        """Look up the tax rate for the given number of completed ownership years."""
        if ownership_years <= 0:
            # Less than one completed year → use year-1 rate
            return self._rates.get(1, Decimal("0.40"))
        if ownership_years > 25:
            return self._min_rate
        return self._rates.get(ownership_years, self._min_rate)

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0:
            return self._zero_result(inputs, taxable_gain, total_months)

        rate = self._get_rate(ownership_years)
        simple_tax = finalize_simple_tax(taxable_gain * rate)

        # AG: simple tax IS the total tax (uniform canton rate, no Steuerfuss)
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
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="AG",
                canton_name="Aargau",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.ag.ch/de/verwaltung/dfr/steuern/grundstueckgewinnsteuer",
                    "https://www.estv2.admin.ch/stp/kb/ag-de.pdf",
                ],
            ),
            extra={"holding_period_rate": str(rate)},
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
            metadata=ResultMetadata(canton="AG", canton_name="Aargau", commune=inputs.commune, tax_year=inputs.tax_year),
        )
