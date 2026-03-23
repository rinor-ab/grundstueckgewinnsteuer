import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { computeTax } from "@/lib/tax/compute";
import type { TaxInputs } from "@/lib/tax/types";

interface ParityFixture {
    label: string;
    inputs: TaxInputs;
    expected: {
        taxableGain: string;
        simpleTax: string;
        totalTax: string;
    };
}

describe("Parity Fixtures", () => {
    // Read the fixtures
    const fixturesPath = join(__dirname, "./fixtures/parity.json");
    const fixturesData = readFileSync(fixturesPath, "utf-8");
    const fixtures: ParityFixture[] = JSON.parse(fixturesData);

    // Run a test for each fixture
    for (const fixture of fixtures) {
        test(`Fixture: ${fixture.label}`, () => {
            const result = computeTax(fixture.inputs);

            // Using ±1.00 CHF tolerance for unknown rounding rules as per validation framework
            const expectedTaxableGain = parseFloat(fixture.expected.taxableGain);
            const actualTaxableGain = parseFloat(result.taxableGain);
            expect(Math.abs(actualTaxableGain - expectedTaxableGain)).toBeLessThanOrEqual(1.0);

            const expectedSimpleTax = parseFloat(fixture.expected.simpleTax);
            const actualSimpleTax = parseFloat(result.simpleTax);
            expect(Math.abs(actualSimpleTax - expectedSimpleTax)).toBeLessThanOrEqual(1.0);

            const expectedTotalTax = parseFloat(fixture.expected.totalTax);
            const actualTotalTax = parseFloat(result.totalTax);
            expect(Math.abs(actualTotalTax - expectedTotalTax)).toBeLessThanOrEqual(1.0);
        });
    }
});
