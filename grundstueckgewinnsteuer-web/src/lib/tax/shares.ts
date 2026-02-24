/**
 * Steuerfuss share computation and church tax distribution.
 *
 * Port of Python tariff.py `compute_share()` + `compute_church_tax()`.
 */

import Decimal from "decimal.js";
import { roundUpTo005 } from "./rounding";

/**
 * Compute canton or commune share with roundUpTo005 rounding.
 *
 * `share = roundUpTo005(simpleTax * multiplierPercent / 100)`
 */
export function computeShare(simpleTax: Decimal, multiplierPercent: Decimal): Decimal {
    return roundUpTo005(simpleTax.times(multiplierPercent).dividedBy(new Decimal("100")));
}

/**
 * Compute church tax distributed by people, mirroring the JS reference.
 *
 * @param simpleTax - The einfache Steuer
 * @param confessionRates - Mapping of confession key → rate percent from commune data
 * @param confessionCounts - Mapping of confession key → number of people
 * @returns [totalChurchTax, breakdownPerConfession]
 */
export function computeChurchTax(
    simpleTax: Decimal,
    confessionRates: Record<string, Decimal>,
    confessionCounts: Record<string, number>,
): [Decimal, Record<string, string>] {
    const totalPeople = Object.values(confessionCounts).reduce((sum, v) => sum + v, 0);
    if (totalPeople === 0) {
        return [new Decimal("0"), {}];
    }

    const breakdown: Record<string, string> = {};
    let total = new Decimal("0");
    const hundred = new Decimal("100");
    const totalPeopleDec = new Decimal(totalPeople);

    for (const [confKey, count] of Object.entries(confessionCounts)) {
        const rate = confessionRates[confKey] ?? new Decimal("0");
        const part = simpleTax
            .times(rate)
            .dividedBy(hundred)
            .dividedBy(totalPeopleDec)
            .times(new Decimal(count));
        breakdown[confKey] = part.toString();
        total = total.plus(part);
    }

    return [total, breakdown];
}
