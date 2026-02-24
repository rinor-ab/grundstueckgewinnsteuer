/**
 * Deterministic rounding functions matching Python/JavaScript reference behavior.
 *
 * Port of Python rounding.py — uses decimal.js for exact arithmetic.
 */

import Decimal from "decimal.js";

/**
 * Equivalent to JavaScript `Number.toFixed(2)` / Python `ROUND_HALF_EVEN`.
 *
 * Uses banker's rounding (round half to even) and returns a Decimal
 * quantised to two decimal places.
 */
export function toFixed2(x: Decimal): Decimal {
    return x.toDecimalPlaces(2, Decimal.ROUND_HALF_EVEN);
}

/**
 * Equivalent to JS `Math.ceil(x * 20) / 20`.
 *
 * Rounds *x* **up** to the nearest CHF 0.05.
 *
 * Algorithm:
 *   1. Multiply by 20
 *   2. Apply ceiling (round towards +∞)
 *   3. Divide by 20
 *
 * The result is always a multiple of 0.05 and ≥ x.
 */
export function roundUpTo005(x: Decimal): Decimal {
    const twenty = new Decimal("20");
    const scaled = x.times(twenty).ceil();
    return scaled.dividedBy(twenty);
}
