/**
 * Core domain types for the Grundstückgewinnsteuer calculator.
 *
 * Port of Python models.py — all monetary amounts use string representations
 * that are converted to Decimal at computation time.
 */

import Decimal from "decimal.js";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export type TaxpayerType = "natural" | "legal";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface Investment {
    description: string;
    amount: string; // Decimal string e.g. "50000"
    investmentDate?: string; // ISO date string
}

export interface TaxInputs {
    // Location
    canton: string; // Two-letter canton code (e.g. "SH", "ZH")
    commune: string;
    taxYear: number;

    // Dates (ISO format: "YYYY-MM-DD")
    purchaseDate: string;
    saleDate: string;

    // Prices (Decimal strings)
    purchasePrice: string;
    salePrice: string;

    // Costs
    acquisitionCosts: string;
    sellingCosts: string;

    // Value-increasing investments
    investments: Investment[];

    // Taxpayer
    taxpayerType: TaxpayerType;

    // Church tax: maps confession key to number of people
    confessions: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Computation helpers
// ---------------------------------------------------------------------------

export function computeTaxableGain(inputs: TaxInputs): Decimal {
    const salePrice = new Decimal(inputs.salePrice);
    const purchasePrice = new Decimal(inputs.purchasePrice);
    const acquisitionCosts = new Decimal(inputs.acquisitionCosts || "0");
    const sellingCosts = new Decimal(inputs.sellingCosts || "0");
    const totalInvestments = inputs.investments.reduce(
        (sum, inv) => sum.plus(new Decimal(inv.amount || "0")),
        new Decimal("0"),
    );

    return salePrice
        .minus(purchasePrice)
        .minus(acquisitionCosts)
        .minus(sellingCosts)
        .minus(totalInvestments);
}

export function monthsBetween(d1: string, d2: string): number {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface BracketStep {
    bracketLimit: string;
    rate: string;
    taxableAmount: string;
    taxInBracket: string;
    cumulativeTax: string;
}

export interface ResultMetadata {
    canton: string;
    cantonName: string;
    commune: string;
    taxYear: number;
    dataVersion: string;
    sourceLinks: string[];
    engineVersion: string;
}

export interface TaxResult {
    // Core amounts (Decimal strings)
    taxableGain: string;
    simpleTax: string;
    cantonShare: string;
    communeShare: string;
    churchTaxTotal: string;
    churchTaxBreakdown: Record<string, string>;
    totalTax: string;

    // Holding period
    holdingMonths: number;
    holdingYears: number;

    // Detailed computation trace
    bracketsApplied: BracketStep[];
    flatRateAmount: string;
    flatRateTax: string;
    surchargeRate: string | null;
    discountRate: string | null;
    simpleTaxBeforeAdjustments: string;
    effectiveTaxRatePercent: string;

    // Multipliers
    cantonMultiplierPercent: string;
    communeMultiplierPercent: string;

    // Metadata
    metadata: ResultMetadata;

    // Extra canton-specific info
    extra: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Tariff data types (loaded from JSON)
// ---------------------------------------------------------------------------

export interface TariffBracket {
    limit: number;
    rate: number;
}

export interface SurchargeEntry {
    max_months: number;
    rate: number;
}

export interface DiscountEntry {
    years: number;
    rate: number;
}

export interface RateScheduleEntry {
    max_years: number;
    rate: number;
}

export interface CantonTariff {
    // Progressive bracket model
    brackets?: TariffBracket[];
    top_rate?: number;

    // Degressive rate model
    tax_model?: string;
    rate_schedule?: RateScheduleEntry[];
    floor_rate?: number;

    // Flat rate model
    flat_rate?: number;

    // Yield rate model (ZG)
    min_rate?: number;
    max_rate?: number;
    max_rate_reduction_start_year?: number;
    max_rate_reduction_per_year?: number;
    max_rate_reduction_max?: number;

    // Steuerfuss model
    base_rate?: number;
    steuerfuss_canton?: number;

    // Common fields
    minimum_taxable_gain?: number;
    surcharge_threshold_months?: number;
    surcharges_by_months?: SurchargeEntry[];
    surcharges?: SurchargeEntry[];
    discount_min_years?: number;
    discounts_by_years?: DiscountEntry[];
    discounts?: DiscountEntry[];
    confessions?: string[];
    commune_surcharge_rate?: number;
    minimum_tax?: number;
    gain_rounding?: number;
    freibetrag?: number;

    // Metadata
    dataVersion?: string;
    lastUpdated?: string;
    sourceLinks?: string[];

    // Rounding
    rounding?: {
        simple_tax: string;
        shares: string;
    };
}
