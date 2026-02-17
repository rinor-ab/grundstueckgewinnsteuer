"""Generic progressive-bracket tax evaluator.

This module provides reusable functions that any canton engine can call to
evaluate progressive bracket tables, holding-period surcharges/discounts,
and share computations via Steuerfuss multipliers.

All arithmetic uses ``Decimal``.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from grundstueckgewinnsteuer.engine.rounding import round_up_to_005, to_fixed_2
from grundstueckgewinnsteuer.models import BracketStep


# ---------------------------------------------------------------------------
# Data containers loaded from YAML
# ---------------------------------------------------------------------------

@dataclass
class Bracket:
    limit: Decimal
    rate: Decimal


@dataclass
class SurchargeEntry:
    max_months: int
    rate: Decimal


@dataclass
class DiscountEntry:
    years: int
    rate: Decimal


# ---------------------------------------------------------------------------
# Progressive bracket evaluator
# ---------------------------------------------------------------------------

def evaluate_brackets(
    amount: Decimal,
    brackets: list[Bracket],
    top_rate: Decimal | None = None,
) -> tuple[Decimal, list[BracketStep], Decimal, Decimal]:
    """Evaluate a progressive bracket table exactly like the SH JS reference.

    Parameters
    ----------
    amount:
        Taxable gain (positive).
    brackets:
        Ordered list of ``Bracket(limit, rate)`` with ascending limits.
    top_rate:
        Flat rate applied to any amount above the last bracket limit.
        If ``None``, the last bracket's rate is used.

    Returns
    -------
    tuple of (total_tax, steps, flat_amount, flat_tax)
        *total_tax* is the cumulative tax from brackets + flat portion.
        *steps* is the list of ``BracketStep`` objects.
        *flat_amount* is the remaining amount taxed at the top rate.
        *flat_tax* is the tax on that flat portion.
    """
    remaining = Decimal(amount)
    tax = Decimal("0")
    steps: list[BracketStep] = []
    prev_limit = Decimal("0")

    for bracket in brackets:
        if remaining <= 0:
            break
        band = bracket.limit - prev_limit
        taxable = min(remaining, band)
        bracket_tax = taxable * bracket.rate
        tax += bracket_tax
        steps.append(BracketStep(
            bracket_limit=bracket.limit,
            rate=bracket.rate,
            taxable_amount=taxable,
            tax_in_bracket=bracket_tax,
            cumulative_tax=tax,
        ))
        remaining -= taxable
        prev_limit = bracket.limit

    flat_amount = Decimal("0")
    flat_tax = Decimal("0")
    if remaining > 0 and top_rate is not None:
        flat_amount = remaining
        flat_tax = remaining * top_rate
        tax += flat_tax

    return tax, steps, flat_amount, flat_tax


# ---------------------------------------------------------------------------
# Holding-period adjustments
# ---------------------------------------------------------------------------

def apply_surcharge(
    tax: Decimal,
    total_months: int,
    surcharges: list[SurchargeEntry],
    threshold_months: int = 60,
) -> tuple[Decimal, Decimal | None]:
    """Apply holding-period surcharge if ownership < *threshold_months*.

    Picks the **first** matching entry where ``total_months <= entry.max_months``.
    Returns (adjusted_tax, applied_rate_or_None).
    """
    if total_months >= threshold_months:
        return tax, None
    for entry in surcharges:
        if total_months <= entry.max_months:
            return tax * (1 + entry.rate), entry.rate
    return tax, None


def apply_discount(
    tax: Decimal,
    total_months: int,
    discounts: list[DiscountEntry],
    min_years: int = 6,
) -> tuple[Decimal, Decimal | None]:
    """Apply holding-period discount if ownership >= *min_years* full years.

    Ownership years = ``total_months // 12``.
    Iterates **backwards** to find the highest matching discount.
    Returns (adjusted_tax, applied_rate_or_None).
    """
    ownership_years = total_months // 12
    if ownership_years < min_years:
        return tax, None
    for entry in reversed(discounts):
        if ownership_years >= entry.years:
            return tax * (1 - entry.rate), entry.rate
    return tax, None


# ---------------------------------------------------------------------------
# Share computation
# ---------------------------------------------------------------------------

def compute_share(simple_tax: Decimal, multiplier_percent: Decimal) -> Decimal:
    """Compute canton or commune share with roundUpTo005 rounding.

    ``share = roundUpTo005(simple_tax * multiplier_percent / 100)``
    """
    return round_up_to_005(simple_tax * multiplier_percent / Decimal("100"))


# ---------------------------------------------------------------------------
# Church tax
# ---------------------------------------------------------------------------

def compute_church_tax(
    simple_tax: Decimal,
    confession_rates: dict[str, Decimal],
    confession_counts: dict[str, int],
) -> tuple[Decimal, dict[str, Decimal]]:
    """Compute church tax distributed by people, mirroring the JS reference.

    Parameters
    ----------
    simple_tax:
        The einfache Steuer.
    confession_rates:
        Mapping of confession key → rate percent from commune data.
        Keys like ``evangR``, ``roemK``, ``christK``, ``Andere``.
    confession_counts:
        Mapping of confession key → number of people selecting that confession.

    Returns
    -------
    (total_church_tax, breakdown_per_confession)
    """
    total_people = sum(confession_counts.values())
    if total_people == 0:
        return Decimal("0"), {}

    breakdown: dict[str, Decimal] = {}
    total = Decimal("0")

    for conf_key, count in confession_counts.items():
        rate = confession_rates.get(conf_key, Decimal("0"))
        part = (simple_tax * rate / Decimal("100") / Decimal(total_people)) * Decimal(count)
        breakdown[conf_key] = part
        total += part

    return total, breakdown


def finalize_simple_tax(tax: Decimal) -> Decimal:
    """Apply the same rounding as JS ``tax.toFixed(2)`` to the simple tax."""
    return to_fixed_2(tax)
