"""Domain models for cross-canton Grundstückgewinnsteuer calculation.

All monetary fields use ``Decimal`` for deterministic numeric behaviour.
"""

from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class TaxpayerType(str, Enum):
    NATURAL = "natural"
    LEGAL = "legal"


# ---------------------------------------------------------------------------
# Input models
# ---------------------------------------------------------------------------

class Investment(BaseModel):
    """A single value-increasing investment."""

    description: str = ""
    amount: Decimal
    investment_date: date | None = None


class TaxInputs(BaseModel):
    """Cross-canton input model for a Grundstückgewinnsteuer computation."""

    # Location
    canton: str = Field(..., min_length=2, max_length=2, description="Two-letter canton code (e.g. SH, ZH)")
    commune: str = Field(..., description="Commune name or BFS number")
    tax_year: int = Field(..., ge=2000, le=2030)

    # Dates
    purchase_date: date
    sale_date: date

    # Prices
    purchase_price: Decimal = Field(..., ge=0)
    sale_price: Decimal = Field(..., ge=0)

    # Costs
    acquisition_costs: Decimal = Field(default=Decimal("0"), ge=0)
    selling_costs: Decimal = Field(default=Decimal("0"), ge=0)

    # Value-increasing investments
    investments: list[Investment] = Field(default_factory=list)

    # Taxpayer
    taxpayer_type: TaxpayerType = TaxpayerType.NATURAL

    # Church tax – maps confession key to number of people
    # e.g. {"evangR": 1, "roemK": 1, "Andere": 0}
    confessions: dict[str, int] = Field(default_factory=dict)

    @property
    def total_investments(self) -> Decimal:
        return sum((inv.amount for inv in self.investments), Decimal("0"))

    @property
    def taxable_gain(self) -> Decimal:
        """Raw taxable gain before any canton-specific adjustments."""
        return (
            self.sale_price
            - self.purchase_price
            - self.acquisition_costs
            - self.selling_costs
            - self.total_investments
        )


# ---------------------------------------------------------------------------
# Output / result models
# ---------------------------------------------------------------------------

class BracketStep(BaseModel):
    """One step of the progressive bracket computation."""

    bracket_limit: Decimal
    rate: Decimal
    taxable_amount: Decimal
    tax_in_bracket: Decimal
    cumulative_tax: Decimal


class ResultMetadata(BaseModel):
    """Metadata attached to every result for traceability."""

    canton: str
    canton_name: str = ""
    commune: str
    tax_year: int
    data_version: str = ""
    source_links: list[str] = Field(default_factory=list)
    engine_version: str = ""


class TaxResult(BaseModel):
    """Full output of a Grundstückgewinnsteuer computation."""

    # Core amounts
    taxable_gain: Decimal
    simple_tax: Decimal
    canton_share: Decimal
    commune_share: Decimal
    church_tax_total: Decimal
    church_tax_breakdown: dict[str, Decimal] = Field(default_factory=dict)
    total_tax: Decimal

    # Holding period info
    holding_months: int
    holding_years: int

    # Detailed computation trace
    brackets_applied: list[BracketStep] = Field(default_factory=list)
    flat_rate_amount: Decimal = Decimal("0")
    flat_rate_tax: Decimal = Decimal("0")
    surcharge_rate: Decimal | None = None
    discount_rate: Decimal | None = None
    simple_tax_before_adjustments: Decimal = Decimal("0")
    effective_tax_rate_percent: Decimal = Decimal("0")

    # Multipliers used
    canton_multiplier_percent: Decimal = Decimal("0")
    commune_multiplier_percent: Decimal = Decimal("0")

    # Metadata
    metadata: ResultMetadata

    # Arbitrary extra info from canton engines
    extra: dict[str, Any] = Field(default_factory=dict)
