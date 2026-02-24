/**
 * Holding-period surcharge and discount adjustments.
 *
 * Port of Python tariff.py `apply_surcharge()` + `apply_discount()`.
 */

import Decimal from "decimal.js";
import type { SurchargeEntry, DiscountEntry } from "./types";

/**
 * Apply holding-period surcharge if ownership < threshold_months.
 *
 * Picks the **first** matching entry where `totalMonths <= entry.max_months`.
 * Returns [adjustedTax, appliedRate (or null)].
 */
export function applySurcharge(
    tax: Decimal,
    totalMonths: number,
    surcharges: SurchargeEntry[],
    thresholdMonths: number = 60,
): [Decimal, Decimal | null] {
    if (totalMonths >= thresholdMonths) {
        return [tax, null];
    }
    for (const entry of surcharges) {
        if (totalMonths <= entry.max_months) {
            const rate = new Decimal(entry.rate);
            return [tax.times(new Decimal("1").plus(rate)), rate];
        }
    }
    return [tax, null];
}

/**
 * Apply holding-period discount if ownership >= min_years full years.
 *
 * Ownership years = totalMonths // 12.
 * Iterates **backwards** to find the highest matching discount.
 * Returns [adjustedTax, appliedRate (or null)].
 */
export function applyDiscount(
    tax: Decimal,
    totalMonths: number,
    discounts: DiscountEntry[],
    minYears: number = 6,
): [Decimal, Decimal | null] {
    const ownershipYears = Math.floor(totalMonths / 12);
    if (ownershipYears < minYears) {
        return [tax, null];
    }
    // Iterate backwards to find the highest matching discount
    for (let i = discounts.length - 1; i >= 0; i--) {
        const entry = discounts[i];
        if (ownershipYears >= entry.years) {
            const rate = new Decimal(entry.rate);
            return [tax.times(new Decimal("1").minus(rate)), rate];
        }
    }
    return [tax, null];
}
