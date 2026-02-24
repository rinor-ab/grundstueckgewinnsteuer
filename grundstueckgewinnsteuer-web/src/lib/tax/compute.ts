/**
 * Main computation entry point.
 *
 * Routes TaxInputs to the correct engine based on canton code.
 */

import type { TaxInputs, TaxResult } from "./types";
import { getTariff } from "./registry";
import { CANTON_META } from "./canton-meta";
import { computeProgressive } from "./engines/progressive";
import { computeDegressive } from "./engines/degressive";
import { computeFlatRate } from "./engines/flat-rate";
import { computeSteuerfuss } from "./engines/steuerfuss";
import { computeYieldRate } from "./engines/yield-rate";

/**
 * Compute Grundstückgewinnsteuer for any Swiss canton.
 *
 * @throws Error if canton is not supported or tariff data is missing
 */
export function computeTax(inputs: TaxInputs): TaxResult {
    const canton = inputs.canton.toUpperCase();
    const meta = CANTON_META[canton];
    if (!meta) {
        throw new Error(`Canton "${canton}" is not supported. Available: ${Object.keys(CANTON_META).join(", ")}`);
    }

    const tariff = getTariff(canton);
    if (!tariff) {
        throw new Error(`No tariff data found for canton "${canton}".`);
    }

    // Load SH Steuerfuss data for progressive cantons that need it
    let steuerfussData: Record<string, Array<Record<string, string>>> | undefined;
    if (meta.engineType === "progressive" && meta.hasSteuerfussData && canton === "SH") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        steuerfussData = require("@/data/communes/sh/steuerfuesse.json");
    }

    switch (meta.engineType) {
        case "progressive":
            return computeProgressive({ ...inputs, canton }, tariff, steuerfussData);
        case "degressive":
            return computeDegressive({ ...inputs, canton }, tariff);
        case "flat-rate":
            return computeFlatRate({ ...inputs, canton }, tariff);
        case "steuerfuss":
            return computeSteuerfuss({ ...inputs, canton }, tariff);
        case "yield-rate":
            return computeYieldRate({ ...inputs, canton }, tariff);
        default:
            throw new Error(`Unknown engine type for canton "${canton}".`);
    }
}
