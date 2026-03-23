import { computeTax } from "../src/lib/tax/compute";
import { readFileSync } from "fs";

const fixtures = JSON.parse(readFileSync("./tests/fixtures/parity.json", "utf-8"));
const failedLabels = ["BE_7yr", "LU_2yr", "AG_20yr", "UR_5yr"];

for (const f of fixtures) {
    if (failedLabels.includes(f.label)) {
        const result = computeTax(f.inputs);
        console.log(`\n--- Fixture: ${f.label} ---`);
        console.log("Expected:");
        console.log("  taxableGain:", f.expected.taxableGain);
        console.log("  simpleTax:", f.expected.simpleTax);
        console.log("  totalTax:", f.expected.totalTax);
        console.log("Actual:");
        console.log("  taxableGain:", result.taxableGain);
        console.log("  simpleTax:", result.simpleTax);
        console.log("  totalTax:", result.totalTax);
    }
}
