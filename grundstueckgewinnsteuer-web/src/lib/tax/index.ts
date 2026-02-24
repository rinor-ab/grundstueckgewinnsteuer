/**
 * Tax engine barrel export.
 */

export { computeTax } from "./compute";
export type { TaxInputs, TaxResult, BracketStep, ResultMetadata } from "./types";
export {
    availableCantons,
    getCommunes,
    getAvailableYears,
    getConfessions,
    getTariff,
} from "./registry";
export { CANTON_META } from "./canton-meta";
