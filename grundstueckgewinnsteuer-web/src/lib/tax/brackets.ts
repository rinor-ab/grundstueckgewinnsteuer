/**
 * Progressive bracket evaluator.
 *
 * Port of Python tariff.py `evaluate_brackets()`.
 * All arithmetic uses decimal.js.
 */

import Decimal from "decimal.js";
import type { BracketStep, TariffBracket } from "./types";

export interface BracketResult {
    totalTax: Decimal;
    steps: BracketStep[];
    flatAmount: Decimal;
    flatTax: Decimal;
}

/**
 * Evaluate a progressive bracket table.
 *
 * @param amount - Taxable gain (positive Decimal)
 * @param brackets - Ordered list of {limit, rate} with ascending limits
 * @param topRate - Flat rate applied above the last bracket (optional)
 */
export function evaluateBrackets(
    amount: Decimal,
    brackets: TariffBracket[],
    topRate?: number | null,
): BracketResult {
    let remaining = new Decimal(amount);
    let tax = new Decimal("0");
    const steps: BracketStep[] = [];
    let prevLimit = new Decimal("0");

    for (const bracket of brackets) {
        if (remaining.lte(0)) break;

        const limit = new Decimal(bracket.limit);
        const rate = new Decimal(bracket.rate);
        const band = limit.minus(prevLimit);
        const taxable = Decimal.min(remaining, band);
        const bracketTax = taxable.times(rate);
        tax = tax.plus(bracketTax);

        steps.push({
            bracketLimit: limit.toString(),
            rate: rate.toString(),
            taxableAmount: taxable.toString(),
            taxInBracket: bracketTax.toString(),
            cumulativeTax: tax.toString(),
        });

        remaining = remaining.minus(taxable);
        prevLimit = limit;
    }

    let flatAmount = new Decimal("0");
    let flatTax = new Decimal("0");

    if (remaining.gt(0) && topRate != null) {
        flatAmount = remaining;
        flatTax = remaining.times(new Decimal(topRate));
        tax = tax.plus(flatTax);
    }

    return { totalTax: tax, steps, flatAmount, flatTax };
}
