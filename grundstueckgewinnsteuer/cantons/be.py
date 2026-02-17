"""Bern Grundstückgewinnsteuer engine.

Source: StG BE Art. 142ff
https://www.be.ch/de/start/themen/steuern/grundstueckgewinnsteuer.html

BE uses a Steuerfuss model: einfache Steuer is computed from progressive
brackets, then multiplied by commune and canton Steuerfuss.  The holding-
period discount in BE reduces the **taxable gain** (not the tax itself).
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path

import yaml

from grundstueckgewinnsteuer.engine.base import CantonEngine
from grundstueckgewinnsteuer.engine.tariff import (
    Bracket,
    DiscountEntry,
    SurchargeEntry,
    apply_surcharge,
    evaluate_brackets,
    finalize_simple_tax,
)
from grundstueckgewinnsteuer.models import ResultMetadata, TaxInputs, TaxResult

_DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def _load_tariff() -> dict:
    with open(_DATA_DIR / "cantons" / "be" / "tariff.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _months_between(d1, d2) -> int:
    return (d2.year - d1.year) * 12 + (d2.month - d1.month)


class BernEngine(CantonEngine):
    """Canton BE – Steuerfuss model with gain-reduction discount."""

    def __init__(self) -> None:
        self._tariff = _load_tariff()
        self._brackets = [
            Bracket(limit=Decimal(str(b["limit"])), rate=Decimal(str(b["rate"])))
            for b in self._tariff["brackets"]
        ]
        self._top_rate = Decimal(str(self._tariff["top_rate"]))
        self._min_gain = Decimal(str(self._tariff.get("minimum_taxable_gain", 0)))
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

    @property
    def canton_code(self) -> str:
        return "BE"

    @property
    def canton_name(self) -> str:
        return "Bern"

    def get_communes(self, tax_year: int) -> list[str]:
        # TODO: load from BFS commune dataset for BE
        return ["Bern", "Biel/Bienne", "Thun", "Köniz", "Burgdorf"]

    def get_available_years(self) -> list[int]:
        return [2024, 2025, 2026]

    def get_confessions(self) -> list[str]:
        return self._tariff.get("confessions", [])

    def compute(self, inputs: TaxInputs) -> TaxResult:
        raw_gain = inputs.taxable_gain
        total_months = _months_between(inputs.purchase_date, inputs.sale_date)
        ownership_years = total_months // 12

        if raw_gain <= 0 or raw_gain < self._min_gain:
            return self._zero_result(inputs, raw_gain, total_months)

        # --- BE special: discount reduces the taxable GAIN ---
        discount_rate = None
        taxable_gain = raw_gain
        if ownership_years >= self._discount_min_years:
            for entry in reversed(self._discounts):
                if ownership_years >= entry.years:
                    discount_rate = entry.rate
                    taxable_gain = raw_gain * (1 - entry.rate)
                    break

        # Progressive brackets on (possibly reduced) gain
        base_tax, steps, flat_amount, flat_tax = evaluate_brackets(
            taxable_gain, self._brackets, self._top_rate,
        )
        simple_tax_before_adj = base_tax

        # Surcharge (on the tax, not the gain)
        base_tax, surcharge_rate = apply_surcharge(
            base_tax, total_months, self._surcharges, self._surcharge_threshold,
        )

        simple_tax = finalize_simple_tax(base_tax)

        # BE: simple tax is then multiplied by cantonal + communal Steuerfuss
        # TODO: load actual BE Steuerfuss data per commune/year
        # Placeholder: use simple tax as total (Steuerfuss = 100%)
        canton_share = simple_tax   # placeholder
        commune_share = Decimal("0")  # placeholder until Steuerfuss data loaded

        total_tax = canton_share + commune_share

        eff_rate = (Decimal("100") * simple_tax / raw_gain) if raw_gain > 0 else Decimal("0")

        return TaxResult(
            taxable_gain=raw_gain,
            simple_tax=simple_tax,
            canton_share=canton_share,
            commune_share=commune_share,
            church_tax_total=Decimal("0"),  # TODO: implement BE church tax
            church_tax_breakdown={},
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
            metadata=ResultMetadata(
                canton="BE",
                canton_name="Bern",
                commune=inputs.commune,
                tax_year=inputs.tax_year,
                engine_version="0.1.0",
                source_links=[
                    "https://www.be.ch/de/start/themen/steuern/grundstueckgewinnsteuer.html",
                    "https://www.estv2.admin.ch/stp/kb/be-de.pdf",
                ],
            ),
            extra={"discount_mode": "gain_reduction", "adjusted_gain": str(taxable_gain)},
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
            metadata=ResultMetadata(canton="BE", canton_name="Bern", commune=inputs.commune, tax_year=inputs.tax_year),
        )
