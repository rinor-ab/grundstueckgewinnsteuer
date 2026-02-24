/**
 * Progressive bracket engine.
 *
 * Handles cantons: SH, ZH, BE, LU, AG, SG, GR, SO, SZ, GL, AI, JU, NE, VS
 *
 * Pattern: progressive brackets → surcharge/discount → finalize.
 * Some cantons (SH) have Steuerfuss data for canton/commune shares.
 * Others (JU, NE) have surcharges/discounts in custom keys.
 * VS uses 3-tier progressive brackets.
 */

import Decimal from "decimal.js";
import type { TaxInputs, TaxResult, CantonTariff } from "../types";
import { computeTaxableGain, monthsBetween } from "../types";
import { evaluateBrackets } from "../brackets";
import { applySurcharge, applyDiscount } from "../adjustments";
import { computeShare, computeChurchTax } from "../shares";
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

export function computeProgressive(
    inputs: TaxInputs,
    tariff: CantonTariff,
    steuerfussData?: Record<string, Array<Record<string, string>>>,
): TaxResult {
    const taxableGain = computeTaxableGain(inputs);
    const totalMonths = monthsBetween(inputs.purchaseDate, inputs.saleDate);
    const ownershipYears = Math.floor(totalMonths / 12);
    const meta = CANTON_META[inputs.canton];

    if (taxableGain.lte(0)) {
        return zeroResult(inputs, taxableGain, totalMonths);
    }

    const minGain = new Decimal(tariff.minimum_taxable_gain ?? 0);
    if (taxableGain.lt(minGain)) {
        return zeroResult(inputs, taxableGain, totalMonths);
    }

    // Step 1: Progressive brackets
    const brackets = tariff.brackets ?? [];
    const topRate = tariff.top_rate ?? null;
    const { totalTax: baseTax, steps, flatAmount, flatTax } = evaluateBrackets(
        taxableGain,
        brackets,
        topRate,
    );

    const simpleTaxBefore = baseTax;
    let tax = baseTax;

    // Step 2: Surcharge
    const surcharges = tariff.surcharges_by_months ?? tariff.surcharges ?? [];
    const surchargeThreshold = tariff.surcharge_threshold_months ?? 60;
    const [afterSurcharge, surchargeRate] = applySurcharge(
        tax,
        totalMonths,
        surcharges,
        surchargeThreshold,
    );
    tax = afterSurcharge;

    // Step 3: Discount
    const discounts = tariff.discounts_by_years ?? tariff.discounts ?? [];
    const discountMin = tariff.discount_min_years ?? 6;
    const [afterDiscount, discountRate] = applyDiscount(tax, totalMonths, discounts, discountMin);
    tax = afterDiscount;

    // Step 4: Finalize
    const simpleTax = toFixed2(tax);

    // Step 5: Steuerfuss shares (SH has actual data, others skip)
    let cantonShare = new Decimal("0");
    let communeShare = new Decimal("0");
    let cantonMult = new Decimal("0");
    let communeMult = new Decimal("0");
    let churchTotal = new Decimal("0");
    let churchBreakdown: Record<string, string> = {};

    if (steuerfussData) {
        const yearData = steuerfussData[String(inputs.taxYear)] ?? [];
        const communeEntry = yearData.find((e) => e.Gemeinde === inputs.commune);
        const kantonEntry = yearData.find((e) => e.Gemeinde === "Kanton");

        if (communeEntry && kantonEntry) {
            cantonMult = new Decimal(kantonEntry.natPers);
            communeMult = new Decimal(communeEntry.natPers);
            cantonShare = computeShare(simpleTax, cantonMult);
            communeShare = computeShare(simpleTax, communeMult);

            // Church tax
            const confessionRates: Record<string, Decimal> = {};
            for (const key of ["evangR", "roemK", "christK"]) {
                confessionRates[key] = new Decimal(communeEntry[key] ?? "0");
            }
            confessionRates["Andere"] = new Decimal("0");

            const [ct, cb] = computeChurchTax(simpleTax, confessionRates, inputs.confessions);
            churchTotal = ct;
            churchBreakdown = cb;
        }
    }

    // Total tax
    const totalTax =
        cantonShare.gt(0) || communeShare.gt(0)
            ? cantonShare.plus(communeShare).plus(churchTotal)
            : simpleTax;

    const effRate = taxableGain.gt(0)
        ? new Decimal("100").times(simpleTax).dividedBy(taxableGain)
        : new Decimal("0");

    return {
        taxableGain: taxableGain.toString(),
        simpleTax: simpleTax.toString(),
        cantonShare: cantonShare.toString(),
        communeShare: communeShare.toString(),
        churchTaxTotal: churchTotal.toString(),
        churchTaxBreakdown: churchBreakdown,
        totalTax: totalTax.toString(),
        holdingMonths: totalMonths,
        holdingYears: ownershipYears,
        bracketsApplied: steps,
        flatRateAmount: flatAmount.toString(),
        flatRateTax: flatTax.toString(),
        surchargeRate: surchargeRate?.toString() ?? null,
        discountRate: discountRate?.toString() ?? null,
        simpleTaxBeforeAdjustments: simpleTaxBefore.toString(),
        effectiveTaxRatePercent: effRate.toString(),
        cantonMultiplierPercent: cantonMult.toString(),
        communeMultiplierPercent: communeMult.toString(),
        metadata: {
            canton: inputs.canton,
            cantonName: meta?.name ?? inputs.canton,
            commune: inputs.commune,
            taxYear: inputs.taxYear,
            dataVersion: "1.0.0",
            sourceLinks: tariff.sourceLinks ?? [],
            engineVersion: "1.0.0",
        },
        extra: {},
    };
}
