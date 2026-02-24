/**
 * Flat-rate engine.
 *
 * Handles cantons: TG, AR
 *
 * Pattern: flat rate × gain → surcharge/discount.
 * AR additionally rounds gain down to nearest CHF 500.
 */

import Decimal from "decimal.js";
import type { TaxInputs, TaxResult, CantonTariff } from "../types";
import { computeTaxableGain, monthsBetween } from "../types";
import { applySurcharge, applyDiscount } from "../adjustments";
import { toFixed2 } from "../rounding";
import { CANTON_META } from "../canton-meta";

function zeroResult(inputs: TaxInputs, gain: Decimal, months: number): TaxResult {
    const meta = CANTON_META[inputs.canton];
    return {
        taxableGain: gain.toString(),
        simpleTax: "0",
        cantonShare: "0",
        communeShare: "0",
        churchTaxTotal: "0",
        churchTaxBreakdown: {},
        totalTax: "0",
        holdingMonths: months,
        holdingYears: Math.floor(months / 12),
        bracketsApplied: [],
        flatRateAmount: "0",
        flatRateTax: "0",
        surchargeRate: null,
        discountRate: null,
        simpleTaxBeforeAdjustments: "0",
        effectiveTaxRatePercent: "0",
        cantonMultiplierPercent: "0",
        communeMultiplierPercent: "0",
        metadata: {
            canton: inputs.canton,
            cantonName: meta?.name ?? inputs.canton,
            commune: inputs.commune,
            taxYear: inputs.taxYear,
            dataVersion: "1.0.0",
            sourceLinks: [],
            engineVersion: "1.0.0",
        },
        extra: {},
    };
}

export function computeFlatRate(inputs: TaxInputs, tariff: CantonTariff): TaxResult {
    let taxableGain = computeTaxableGain(inputs);
    const totalMonths = monthsBetween(inputs.purchaseDate, inputs.saleDate);
    const ownershipYears = Math.floor(totalMonths / 12);
    const meta = CANTON_META[inputs.canton];

    const minGain = new Decimal(tariff.minimum_taxable_gain ?? 0);
    if (taxableGain.lte(0) || taxableGain.lt(minGain)) {
        return zeroResult(inputs, taxableGain, totalMonths);
    }

    // AR: round gain down to nearest CHF 500
    const gainRounding = tariff.gain_rounding ?? 0;
    if (gainRounding > 0) {
        const r = new Decimal(gainRounding);
        taxableGain = taxableGain.dividedToIntegerBy(r).times(r);
        if (taxableGain.lt(minGain)) {
            return zeroResult(inputs, taxableGain, totalMonths);
        }
    }

    // Base tax = gain × flat rate
    const baseRate = new Decimal(tariff.base_rate ?? tariff.flat_rate ?? 0);
    let baseTax = taxableGain.times(baseRate);
    const simpleTaxBefore = baseTax;

    // Surcharge
    const surcharges = tariff.surcharges ?? tariff.surcharges_by_months ?? [];
    const surchargeThreshold = tariff.surcharge_threshold_months ?? 60;
    const [afterSurcharge, surchargeRate] = applySurcharge(
        baseTax,
        totalMonths,
        surcharges,
        surchargeThreshold,
    );
    baseTax = afterSurcharge;

    // Discount
    const discounts = tariff.discounts ?? tariff.discounts_by_years ?? [];
    const discountMin = tariff.discount_min_years ?? 6;
    const [afterDiscount, discountRate] = applyDiscount(baseTax, totalMonths, discounts, discountMin);
    baseTax = afterDiscount;

    const simpleTax = toFixed2(baseTax);
    const effRate = taxableGain.gt(0)
        ? new Decimal("100").times(simpleTax).dividedBy(taxableGain)
        : new Decimal("0");

    return {
        taxableGain: taxableGain.toString(),
        simpleTax: simpleTax.toString(),
        cantonShare: simpleTax.toString(),
        communeShare: "0",
        churchTaxTotal: "0",
        churchTaxBreakdown: {},
        totalTax: simpleTax.toString(),
        holdingMonths: totalMonths,
        holdingYears: ownershipYears,
        bracketsApplied: [],
        flatRateAmount: "0",
        flatRateTax: "0",
        surchargeRate: surchargeRate?.toString() ?? null,
        discountRate: discountRate?.toString() ?? null,
        simpleTaxBeforeAdjustments: simpleTaxBefore.toString(),
        effectiveTaxRatePercent: effRate.toString(),
        cantonMultiplierPercent: "0",
        communeMultiplierPercent: "0",
        metadata: {
            canton: inputs.canton,
            cantonName: meta?.name ?? inputs.canton,
            commune: inputs.commune,
            taxYear: inputs.taxYear,
            dataVersion: "1.0.0",
            sourceLinks: tariff.sourceLinks ?? [],
            engineVersion: "1.0.0",
        },
        extra: {
            base_rate: baseRate.toString(),
            ...(gainRounding > 0 ? { gain_rounded_to: taxableGain.toString() } : {}),
        },
    };
}
