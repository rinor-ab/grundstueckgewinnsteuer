/**
 * Degressive rate engine.
 *
 * Handles cantons: NW, TI, VD, GE, FR, UR
 *
 * Pattern: rate lookup by holding years → flat rate × gain.
 * FR has a commune surcharge (60% of canton tax).
 * UR has a Freibetrag (tax-free allowance).
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

function getRate(
    ownershipYears: number,
    rateSchedule: Array<{ max_years: number; rate: number }>,
    floorRate: number,
): Decimal {
    for (const entry of rateSchedule) {
        if (ownershipYears < entry.max_years) {
            return new Decimal(entry.rate);
        }
    }
    return new Decimal(floorRate);
}

export function computeDegressive(inputs: TaxInputs, tariff: CantonTariff): TaxResult {
    const rawGain = computeTaxableGain(inputs);
    const totalMonths = monthsBetween(inputs.purchaseDate, inputs.saleDate);
    const ownershipYears = Math.floor(totalMonths / 12);
    const meta = CANTON_META[inputs.canton];

    const minGain = new Decimal(tariff.minimum_taxable_gain ?? 0);

    if (rawGain.lte(0) || rawGain.lt(minGain)) {
        return zeroResult(inputs, rawGain, totalMonths);
    }

    // UR: apply Freibetrag (tax-free allowance)
    let taxableGain = rawGain;
    const freibetrag = tariff.freibetrag ? new Decimal(tariff.freibetrag) : null;
    if (freibetrag) {
        taxableGain = rawGain.minus(freibetrag);
        if (taxableGain.lte(0)) {
            return zeroResult(inputs, rawGain, totalMonths);
        }
    }

    const rateSchedule = tariff.rate_schedule ?? [];
    const floorRate = tariff.floor_rate ?? 0;
    const rate = getRate(ownershipYears, rateSchedule, floorRate);

    const cantonTax = toFixed2(taxableGain.times(rate));

    // FR: commune surcharge
    const communeSurchargeRate = tariff.commune_surcharge_rate
        ? new Decimal(tariff.commune_surcharge_rate)
        : null;
    let communeTax = new Decimal("0");
    if (communeSurchargeRate) {
        communeTax = toFixed2(cantonTax.times(communeSurchargeRate));
    }

    const totalTax = cantonTax.plus(communeTax);
    const effRate = rawGain.gt(0)
        ? new Decimal("100").times(totalTax).dividedBy(rawGain)
        : new Decimal("0");

    return {
        taxableGain: rawGain.toString(),
        simpleTax: cantonTax.toString(),
        cantonShare: cantonTax.toString(),
        communeShare: communeTax.toString(),
        churchTaxTotal: "0",
        churchTaxBreakdown: {},
        totalTax: totalTax.toString(),
        holdingMonths: totalMonths,
        holdingYears: ownershipYears,
        bracketsApplied: [],
        flatRateAmount: "0",
        flatRateTax: "0",
        surchargeRate: null,
        discountRate: null,
        simpleTaxBeforeAdjustments: cantonTax.toString(),
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
            applied_rate: rate.toString(),
            ...(freibetrag ? { freibetrag: freibetrag.toString(), adjusted_gain: taxableGain.toString() } : {}),
            ...(communeSurchargeRate ? { commune_surcharge: communeSurchargeRate.toString() } : {}),
        },
    };
}
