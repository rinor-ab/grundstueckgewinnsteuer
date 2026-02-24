/**
 * Yield-rate engine.
 *
 * Handles canton: ZG
 *
 * Tax rate = annual yield of the property, clamped between min_rate
 * and a degressive max_rate (60% for short hold, down to 25% for 26+ years).
 */

import Decimal from "decimal.js";
import type { TaxInputs, TaxResult, CantonTariff } from "../types";
import { computeTaxableGain, monthsBetween } from "../types";
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

function effectiveMaxRate(
    ownershipYears: number,
    maxRate: Decimal,
    reductionStart: number,
    reductionPerYear: Decimal,
    reductionMax: Decimal,
): Decimal {
    if (ownershipYears < reductionStart) return maxRate;
    const reductionYears = ownershipYears - reductionStart + 1;
    const reduction = Decimal.min(reductionPerYear.times(reductionYears), reductionMax);
    return maxRate.minus(reduction);
}

function computeRate(
    gain: Decimal,
    cost: Decimal,
    totalMonths: number,
    ownershipYears: number,
    minRate: Decimal,
    maxRate: Decimal,
    reductionStart: number,
    reductionPerYear: Decimal,
    reductionMax: Decimal,
): Decimal {
    if (cost.lte(0) || totalMonths <= 0) return maxRate;

    const totalYield = gain.times(new Decimal("100")).dividedBy(cost);

    let annualYield: Decimal;
    if (ownershipYears <= 5) {
        annualYield = totalYield.times(new Decimal("12")).dividedBy(new Decimal(totalMonths));
    } else {
        annualYield = totalYield.dividedBy(new Decimal(ownershipYears));
    }

    const effMax = effectiveMaxRate(ownershipYears, maxRate, reductionStart, reductionPerYear, reductionMax);
    return Decimal.max(minRate, Decimal.min(annualYield, effMax));
}

export function computeYieldRate(inputs: TaxInputs, tariff: CantonTariff): TaxResult {
    const taxableGain = computeTaxableGain(inputs);
    const totalMonths = monthsBetween(inputs.purchaseDate, inputs.saleDate);
    const ownershipYears = Math.floor(totalMonths / 12);
    const meta = CANTON_META[inputs.canton];

    const minGain = new Decimal(tariff.minimum_taxable_gain ?? 0);
    if (taxableGain.lte(0) || taxableGain.lt(minGain)) {
        return zeroResult(inputs, taxableGain, totalMonths);
    }

    // Acquisition cost = purchasePrice + acquisitionCosts + investments
    const cost = new Decimal(inputs.purchasePrice)
        .plus(new Decimal(inputs.acquisitionCosts || "0"))
        .plus(
            inputs.investments.reduce(
                (sum, inv) => sum.plus(new Decimal(inv.amount || "0")),
                new Decimal("0"),
            ),
        );

    const minRate = new Decimal(tariff.min_rate ?? 10);
    const maxRate = new Decimal(tariff.max_rate ?? 60);
    const reductionStart = tariff.max_rate_reduction_start_year ?? 12;
    const reductionPerYear = new Decimal(tariff.max_rate_reduction_per_year ?? 2.5);
    const reductionMax = new Decimal(tariff.max_rate_reduction_max ?? 35);

    const ratePercent = computeRate(
        taxableGain,
        cost,
        totalMonths,
        ownershipYears,
        minRate,
        maxRate,
        reductionStart,
        reductionPerYear,
        reductionMax,
    );

    const simpleTax = toFixed2(taxableGain.times(ratePercent).dividedBy(new Decimal("100")));
    const effRate = taxableGain.gt(0)
        ? new Decimal("100").times(simpleTax).dividedBy(taxableGain)
        : new Decimal("0");

    const effMax = effectiveMaxRate(ownershipYears, maxRate, reductionStart, reductionPerYear, reductionMax);

    return {
        taxableGain: taxableGain.toString(),
        simpleTax: simpleTax.toString(),
        cantonShare: "0",
        communeShare: simpleTax.toString(),
        churchTaxTotal: "0",
        churchTaxBreakdown: {},
        totalTax: simpleTax.toString(),
        holdingMonths: totalMonths,
        holdingYears: ownershipYears,
        bracketsApplied: [],
        flatRateAmount: "0",
        flatRateTax: "0",
        surchargeRate: null,
        discountRate: null,
        simpleTaxBeforeAdjustments: simpleTax.toString(),
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
            yield_rate_percent: ratePercent.toString(),
            max_rate_percent: effMax.toString(),
        },
    };
}
