/**
 * Compute fixture values for cantons missing from parity.json.
 *
 * These are engine-computed values — they must be cross-validated against
 * official sources before being considered VERIFIED.
 *
 * Run: npx tsx scripts/compute-missing-fixtures.ts
 */

import { computeTax } from "../src/lib/tax/compute";
import type { TaxInputs } from "../src/lib/tax/types";

const cases: Array<{ label: string; inputs: TaxInputs }> = [
    {
        label: "VS_10yr",
        inputs: {
            canton: "VS",
            commune: "Sion",
            taxYear: 2026,
            purchaseDate: "2015-01-01",
            saleDate: "2025-06-15",
            purchasePrice: "400000",
            salePrice: "550000",
            acquisitionCosts: "0",
            sellingCosts: "0",
            investments: [],
            taxpayerType: "natural",
            confessions: {},
        },
    },
    {
        label: "JU_5yr",
        inputs: {
            canton: "JU",
            commune: "Delémont",
            taxYear: 2026,
            purchaseDate: "2020-01-01",
            saleDate: "2025-06-15",
            purchasePrice: "350000",
            salePrice: "500000",
            acquisitionCosts: "0",
            sellingCosts: "0",
            investments: [],
            taxpayerType: "natural",
            confessions: {},
        },
    },
    {
        label: "NE_8yr",
        inputs: {
            canton: "NE",
            commune: "Neuchâtel",
            taxYear: 2026,
            purchaseDate: "2017-06-01",
            saleDate: "2025-06-15",
            purchasePrice: "300000",
            salePrice: "450000",
            acquisitionCosts: "0",
            sellingCosts: "0",
            investments: [],
            taxpayerType: "natural",
            confessions: {},
        },
    },
    {
        label: "BL_10yr",
        inputs: {
            canton: "BL",
            commune: "Liestal",
            taxYear: 2026,
            purchaseDate: "2015-01-01",
            saleDate: "2025-06-15",
            purchasePrice: "500000",
            salePrice: "700000",
            acquisitionCosts: "0",
            sellingCosts: "0",
            investments: [],
            taxpayerType: "natural",
            confessions: {},
        },
    },
];

for (const c of cases) {
    try {
        const result = computeTax(c.inputs);
        console.log(JSON.stringify({
            label: c.label,
            inputs: c.inputs,
            expected: {
                taxableGain: result.taxableGain,
                simpleTax: result.simpleTax,
                totalTax: result.totalTax,
            },
        }, null, 2));
        console.log(",");
    } catch (e) {
        console.error(`ERROR for ${c.label}:`, (e as Error).message);
    }
}
