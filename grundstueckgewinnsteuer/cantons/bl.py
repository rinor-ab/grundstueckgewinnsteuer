"""Basel-Landschaft Grundstückgewinnsteuer engine.

Source: StG BL §§ 71–80bis
https://www.baselland.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung/grundstueckgewinnsteuer

BL uses a formula-based progressive rate applied to the entire gain.
The rate increases with the gain amount according to a tiered formula.
Short holding (<5 years) triggers a surcharge of 1⅔% per month.
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
    with open(_DATA_DIR / "cantons" / "bl" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class BaselLandEngine(CantonEngine):
    """Canton BL – formula-based progressive rate with monthly surcharge."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._tiers = self._tariff["rate_tiers"]
        self._max_rate = Decimal(str(self._tariff["max_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._surcharge_threshold = self._tariff["surcharge_threshold_months"]
        self._surcharge_per_month = Decimal(str(self._tariff["surcharge_per_month"]))

    @property
    def canton_code(self) -> str:
        return "BL"

    @property
    def canton_name(self) -> str:
        return "Basel-Landschaft"

    def get_communes(self, tax_year: int) -> list[str]:
        # TODO: load from BFS commune dataset for BL
        return ["Liestal", "Allschwil", "Reinach", "Muttenz", "Pratteln"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return []

    def _compute_rate(self, gain: Decimal) -> Decimal:
        """Compute formula-based tax rate for the given gain.

        The rate is computed across tiers:
          - Up to 30k: starts at 3%, increases 0.03% per CHF 100
          - 30k–70k: starts at 12%, increases 0.02% per CHF 100
          - 70k–120k: starts at 20%, increases 0.01% per CHF 100
          - Above 120k: flat 25%
        """
        if gain <= 0:
            return Decimal("0")

        rate = Decimal("0")
        prev_limit = Decimal("0")

        for tier in self._tiers:
            limit = Decimal(str(tier["up_to"]))
            base = Decimal(str(tier["base_rate"]))
            increment = Decimal(str(tier["increment_per_100"]))

            if gain <= prev_limit:
                break

            if gain <= limit:
                # Within this tier
                amount_in_tier = gain - prev_limit
                hundreds = amount_in_tier / Decimal("100")
                rate = base + increment * hundreds
                # But rate must not exceed the base of next tier
                break
            else:
                prev_limit = limit

        # If gain exceeds all tiers
        if gain > Decimal("120000"):
            rate = self._max_rate

        return min(rate, self._max_rate)

    def _compute_surcharge(self, tax: Decimal, total_months: int) -> tuple[Decimal, Decimal | None]:
        """Surcharge: 1⅔% per month short of 60 months."""
        if total_months >= self._surcharge_threshold:
            return tax, None

        months_short = self._surcharge_threshold - total_months
        surcharge_factor = self._surcharge_per_month * months_short
        adjusted = tax * (1 + surcharge_factor)
        return adjusted, surcharge_factor

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0:
            return self._zero_result(inputs, taxable_gain, total_months)

        # Compute formula-based rate
        rate = self._compute_rate(taxable_gain)
        base_tax = taxable_gain * rate

        simple_tax_before_adj = base_tax

        # Apply surcharge for short holding
        base_tax, surcharge_rate = self._compute_surcharge(base_tax, total_months)

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
            brackets_applied=[],
            surcharge_rate=surcharge_rate,
            simple_tax_before_adjustments=simple_tax_before_adj,
            effective_tax_rate_percent=eff_rate,
            metadata=ResultMetadata(
                canton="BL",
                canton_name="Basel-Landschaft",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.baselland.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung/grundstueckgewinnsteuer",
                    "https://www.estv2.admin.ch/stp/kb/bl-de.pdf",
                ],
            ),
            extra={"formula_rate": str(rate)},
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
            metadata=ResultMetadata(canton="BL", canton_name="Basel-Landschaft", commune=inputs.commune, tax_year=inputs.tax_year),
        )
