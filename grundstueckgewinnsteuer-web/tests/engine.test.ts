/**
 * Core tax engine unit tests.
 *
 * Tests rounding, brackets, adjustments, and computation for all engine types.
 */

import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import { toFixed2, roundUpTo005 } from "@/lib/tax/rounding";
import { evaluateBrackets } from "@/lib/tax/brackets";
import { applySurcharge, applyDiscount } from "@/lib/tax/adjustments";
import { computeShare, computeChurchTax } from "@/lib/tax/shares";
import type { TariffBracket } from "@/lib/tax/types";

describe("rounding", () => {
    it("toFixed2 should round to 2 decimal places", () => {
        expect(toFixed2(new Decimal("123.456")).toString()).toBe("123.46");
        expect(toFixed2(new Decimal("100.005")).toString()).toBe("100");
        expect(toFixed2(new Decimal("100.015")).toString()).toBe("100.02");
        expect(toFixed2(new Decimal("0")).toString()).toBe("0");
    });

    it("roundUpTo005 should round up to nearest 0.05", () => {
        expect(roundUpTo005(new Decimal("10.01")).toString()).toBe("10.05");
        expect(roundUpTo005(new Decimal("10.05")).toString()).toBe("10.05");
        expect(roundUpTo005(new Decimal("10.00")).toString()).toBe("10");
        expect(roundUpTo005(new Decimal("10.06")).toString()).toBe("10.1");
        expect(roundUpTo005(new Decimal("0")).toString()).toBe("0");
    });
});

describe("evaluateBrackets", () => {
    const brackets: TariffBracket[] = [
        { limit: 3200, rate: 0.02 },
        { limit: 6400, rate: 0.03 },
        { limit: 9600, rate: 0.04 },
        { limit: 12800, rate: 0.05 },
    ];

    it("should compute tax for amount within first bracket", () => {
        const result = evaluateBrackets(new Decimal("2000"), brackets);
        expect(result.totalTax.toNumber()).toBeCloseTo(40, 2); // 2000 * 0.02
        expect(result.steps.length).toBe(1);
    });

    it("should compute tax across multiple brackets", () => {
        const result = evaluateBrackets(new Decimal("10000"), brackets);
        // 3200 * 0.02 + 3200 * 0.03 + 3200 * 0.04 + 400 * 0.05
        expect(result.totalTax.toNumber()).toBeCloseTo(308, 2);
        expect(result.steps.length).toBe(4);
    });

    it("should apply top rate for amount exceeding all brackets", () => {
        const result = evaluateBrackets(new Decimal("20000"), brackets, 0.08);
        // 3200*0.02 + 3200*0.03 + 3200*0.04 + 3200*0.05 + 7200*0.08
        expect(result.flatAmount.toNumber()).toBe(7200);
        expect(result.flatTax.toNumber()).toBeCloseTo(576, 2);
    });
});

describe("applySurcharge", () => {
    const surcharges = [
        { max_months: 12, rate: 0.5 },
        { max_months: 24, rate: 0.3 },
        { max_months: 36, rate: 0.15 },
    ];

    it("should apply surcharge for short holding", () => {
        const [result, rate] = applySurcharge(new Decimal("1000"), 6, surcharges, 60);
        expect(result.toNumber()).toBeCloseTo(1500, 2);
        expect(rate?.toNumber()).toBe(0.5);
    });

    it("should not apply surcharge for long holding", () => {
        const [result, rate] = applySurcharge(new Decimal("1000"), 120, surcharges, 60);
        expect(result.toNumber()).toBe(1000);
        expect(rate).toBeNull();
    });
});

describe("applyDiscount", () => {
    const discounts = [
        { years: 6, rate: 0.04 },
        { years: 10, rate: 0.08 },
        { years: 15, rate: 0.16 },
        { years: 25, rate: 0.4 },
    ];

    it("should apply discount for long holding", () => {
        const [result, rate] = applyDiscount(new Decimal("1000"), 180, discounts, 6);
        expect(rate?.toNumber()).toBe(0.16);
        expect(result.toNumber()).toBeCloseTo(840, 2);
    });

    it("should not apply discount for short holding", () => {
        const [result, rate] = applyDiscount(new Decimal("1000"), 48, discounts, 6);
        expect(result.toNumber()).toBe(1000);
        expect(rate).toBeNull();
    });
});

describe("computeShare", () => {
    it("should compute share with rounding", () => {
        const result = computeShare(new Decimal("22500"), new Decimal("115"));
        // 22500 * 115 / 100 = 25875, roundUpTo005 = 25875.00
        expect(result.toNumber()).toBe(25875);
    });
});

describe("computeChurchTax", () => {
    it("should distribute by people", () => {
        const rates: Record<string, Decimal> = {
            evangR: new Decimal("7"),
            roemK: new Decimal("8"),
        };
        const counts = { evangR: 1, roemK: 1 };
        const [total] = computeChurchTax(new Decimal("1000"), rates, counts);
        // (1000*7/100/2*1) + (1000*8/100/2*1) = 35 + 40 = 75
        expect(total.toNumber()).toBeCloseTo(75, 2);
    });

    it("should return zero for no people", () => {
        const rates: Record<string, Decimal> = { evangR: new Decimal("7") };
        const [total] = computeChurchTax(new Decimal("1000"), rates, {});
        expect(total.toNumber()).toBe(0);
    });
});
