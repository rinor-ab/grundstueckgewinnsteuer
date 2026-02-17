"""St. Gallen Grundstückgewinnsteuer engine.

Source: StG SG Art. 130–141
https://www.sg.ch/steuern-finanzen/steuern/grundstueckgewinnsteuer.html

SG uses a 12-bracket progressive tariff for the "einfache Steuer".
Additional brackets apply for gains above CHF 248'000.
Gains >= CHF 600'000 are taxed at a flat 10% on the entire gain.

The holding-period surcharges are additive percentage points to the
effective tax rate (not multiplicative).  Discounts depend on gain size.
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import (
    Bracket,
    evaluate_brackets,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "sg" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class StGallenEngine(CantonEngine):
    """Canton SG – progressive brackets with additive surcharges and two-tier discounts."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff["brackets"]
        ]
        # Additional high-gain brackets
        self._high_brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff.get("high_gain_brackets", [])
        ]
        self._flat_rate_threshold = Decimal(str(self._tariff["flat_rate_threshold"]))
        self._flat_rate = Decimal(str(self._tariff["flat_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
        self._surcharge_threshold = self._tariff["surcharge_threshold_months"]
        self._surcharges_by_year = self._tariff.get("surcharges_by_year", [])
        self._discount_min_years = self._tariff["discount_min_years"]
        self._discount_per_year_low = Decimal(str(self._tariff["discount_per_year_low"]))
        self._discount_per_year_high = Decimal(str(self._tariff["discount_per_year_high"]))
        self._discount_gain_threshold = Decimal(str(self._tariff["discount_gain_threshold"]))
        self._discount_max_low = Decimal(str(self._tariff["discount_max_low"]))
        self._discount_max_high = Decimal(str(self._tariff["discount_max_high"]))

    @property
    def canton_code(self) -> str:
        return "SG"

    @property
    def canton_name(self) -> str:
        return "St. Gallen"

    def get_communes(self, tax_year: int) -> list[str]:
        # TODO: load from BFS commune dataset for SG
        return ["St. Gallen", "Rapperswil-Jona", "Wil", "Gossau", "Buchs"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return self._tariff.get("confessions", [])

    def _compute_surcharge_rate(self, total_months: int) -> Decimal | None:
        """SG surcharges are additive pp on effective rate, applied to the tax."""
        if total_months >= self._surcharge_threshold:
            return None
        ownership_years = total_months // 12
        for entry in self._surcharges_by_year:
            # "year: 1" means within the first year (0 completed years)
            if ownership_years < entry["year"]:
                return Decimal(str(entry["rate"]))
        return None

    def _compute_discount_rate(self, total_months: int, gain: Decimal) -> Decimal | None:
        """Discount from year 17, rate depends on gain threshold."""
        ownership_years = total_months // 12
        if ownership_years < self._discount_min_years:
            return None

        discount_years = ownership_years - self._discount_min_years + 1
        if gain >= self._discount_gain_threshold:
            rate = min(self._discount_per_year_high * discount_years, self._discount_max_high)
        else:
            rate = min(self._discount_per_year_low * discount_years, self._discount_max_low)
        return rate

    def compute(self, inputs: TaxInputs) -> TaxResult:
        taxable_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if taxable_gain <= 0 or taxable_gain <= self._min_gain:
            return self._zero_result(inputs, taxable_gain, total_months)

        # Check flat rate threshold: gains >= 600k → flat 10%
        if taxable_gain >= self._flat_rate_threshold:
            base_tax = taxable_gain * self._flat_rate
            steps = []
            flat_amount = taxable_gain
            flat_tax = base_tax
        else:
            # Use combined bracket list
            all_brackets = self._brackets + self._high_brackets
            base_tax, steps, flat_amount, flat_tax = evaluate_brackets(
                taxable_gain, all_brackets, None,
            )

        simple_tax_before_adj = base_tax

        # Surcharge (additive pp, applied as multiplicative factor on tax for simplicity)
        surcharge_rate = self._compute_surcharge_rate(total_months)
        if surcharge_rate is not None:
            # The surcharge adds percentage points to the effective rate
            # Implemented as: tax += gain × surcharge_rate
            surcharge_amount = taxable_gain * surcharge_rate
            base_tax = base_tax + surcharge_amount

        # Discount
        discount_rate = self._compute_discount_rate(total_months, taxable_gain)
        if discount_rate is not None:
            base_tax = base_tax * (1 - discount_rate)

        simple_tax = finalize_simple_tax(base_tax)

        # SG uses Steuerfuss, but for now simple tax = total (placeholder 100%)
        eff_rate = (Decimal("100") * simple_tax / taxable_gain) if taxable_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=taxable_gain,
            simple_tax=simple_tax,
            canton_share=simple_tax,
            commune_share=Decimal("0"),  # placeholder until Steuerfuss data loaded
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
                canton="SG",
                canton_name="St. Gallen",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.sg.ch/steuern-finanzen/steuern/grundstueckgewinnsteuer.html",
                    "https://www.estv2.admin.ch/stp/kb/sg-de.pdf",
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
            metadata=ResultMetadata(canton="SG", canton_name="St. Gallen", commune=inputs.commune, tax_year=inputs.tax_year),
        )
