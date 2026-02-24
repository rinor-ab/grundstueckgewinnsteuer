/**
 * Steuerfuss-based engine.
 *
 * Handles cantons: BS, BL, OW
 *
 * BS: dual-schedule holding-period rate + gain reduction
 * BL: similar to BS with different schedule
 * OW: proportional 2% × canton Steuerfuss + surcharges
 */

import Decimal from "decimal.js";
import type { TaxInputs, TaxResult, CantonTariff } from "../types";
import { computeTaxableGain, monthsBetween } from "../types";
import { applySurcharge } from "../adjustments";
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

export function computeSteuerfuss(inputs: TaxInputs, tariff: CantonTariff): TaxResult {
    const rawGain = computeTaxableGain(inputs);
    const totalMonths = monthsBetween(inputs.purchaseDate, inputs.saleDate);
    const ownershipYears = Math.floor(totalMonths / 12);
    const meta = CANTON_META[inputs.canton];

    const minGain = new Decimal(tariff.minimum_taxable_gain ?? 0);
    if (rawGain.lte(0) || rawGain.lt(minGain)) {
        return zeroResult(inputs, rawGain, totalMonths);
    }

    const canton = inputs.canton;

    // OW: proportional rate × Steuerfuss + surcharges
    if (canton === "OW") {
        return computeOW(inputs, tariff, rawGain, totalMonths, ownershipYears);
    }

    // BS, BL: holding-period rate + gain reduction
    return computeBSBL(inputs, tariff, rawGain, totalMonths, ownershipYears);
}

function computeOW(
    inputs: TaxInputs,
    tariff: CantonTariff,
    taxableGain: Decimal,
    totalMonths: number,
    ownershipYears: number,
): TaxResult {
    const meta = CANTON_META[inputs.canton];
    const baseRate = new Decimal(tariff.base_rate ?? 0.02);
    const cantonSF = new Decimal(tariff.steuerfuss_canton ?? (tariff as Record<string, unknown>).default_canton_steuerfuss as number ?? 1);

    let einfacheSteuer = taxableGain.times(baseRate);
    const simpleTaxBefore = einfacheSteuer;

    // Apply surcharge
    const surcharges = tariff.surcharges ?? [];
    const surchargeThreshold = tariff.surcharge_threshold_months ?? 60;
    const [afterSurcharge, surchargeRate] = applySurcharge(
        einfacheSteuer,
        totalMonths,
        surcharges,
        surchargeThreshold,
    );
    einfacheSteuer = afterSurcharge;

    // Multiply by Steuerfuss
    const simpleTax = toFixed2(einfacheSteuer.times(cantonSF));
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
        discountRate: null,
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
        extra: { base_rate: baseRate.toString(), canton_steuerfuss: cantonSF.toString() },
    };
}

function computeBSBL(
    inputs: TaxInputs,
    tariff: CantonTariff,
    rawGain: Decimal,
    totalMonths: number,
    ownershipYears: number,
): TaxResult {
    const meta = CANTON_META[inputs.canton];

    // Rate lookup by holding years
    const ratesMap = (tariff as Record<string, unknown>).rates_not_self_used as
        | Record<string, number>
        | undefined;
    const minRate = new Decimal(tariff.min_rate ?? 0.08);

    let rate: Decimal;
    if (ratesMap && ownershipYears > 0 && ownershipYears < 25) {
        rate = new Decimal(ratesMap[String(ownershipYears)] ?? minRate.toNumber());
    } else if (ownershipYears >= 25) {
        rate = minRate;
    } else {
        // Year 0 or 1
        rate = new Decimal(ratesMap?.["1"] ?? 0.6);
    }

    // Gain reduction: 3%/year from year 6, max 60%
    const gainRedStart = (tariff as Record<string, unknown>).gain_reduction_start_year as
        | number
        | undefined;
    const gainRedPerYear = new Decimal(
        ((tariff as Record<string, unknown>).gain_reduction_per_year as number) ?? 0,
    );
    const gainRedMax = new Decimal(
        ((tariff as Record<string, unknown>).gain_reduction_max as number) ?? 0,
    );

    let gainReductionRate = new Decimal("0");
    if (gainRedStart && ownershipYears >= gainRedStart) {
        const reductionYears = ownershipYears - gainRedStart + 1;
        gainReductionRate = Decimal.min(gainRedPerYear.times(reductionYears), gainRedMax);
    }

    const adjustedGain = rawGain.times(new Decimal("1").minus(gainReductionRate));
    const simpleTax = toFixed2(adjustedGain.times(rate));
    const effRate = rawGain.gt(0)
        ? new Decimal("100").times(simpleTax).dividedBy(rawGain)
        : new Decimal("0");

    return {
        taxableGain: rawGain.toString(),
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
        surchargeRate: null,
        discountRate: gainReductionRate.gt(0) ? gainReductionRate.toString() : null,
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
            holding_period_rate: rate.toString(),
            adjusted_gain: adjustedGain.toString(),
            gain_reduction_rate: gainReductionRate.toString(),
        },
    };
}
