/**
 * Pre-computation integrity checks.
 *
 * Validates inputs and data freshness before any tax calculation runs.
 * Implements fail-closed behavior: if critical data is missing,
 * computation is blocked.
 */

import { getTariff } from "./registry";
import { CANTON_META } from "./canton-meta";
import { computeTaxableGain } from "./types";
import type { TaxInputs } from "./types";
import meta from "@/data/meta.json";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntegrityResult {
    valid: boolean;
    warnings: string[];
    errors: string[];
    dataVersion: string;
    engineVersion: string;
}

// ---------------------------------------------------------------------------
// Main check
// ---------------------------------------------------------------------------

/**
 * Run all pre-computation integrity checks.
 *
 * @returns IntegrityResult with any errors or warnings
 */
export function checkIntegrity(inputs: TaxInputs): IntegrityResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const canton = inputs.canton.toUpperCase();

    // 1. Canton exists in registry
    const cantonMeta = CANTON_META[canton];
    if (!cantonMeta) {
        errors.push(
            `Kanton "${canton}" wird nicht unterstützt.`,
        );
    }

    // 2. Tariff data exists
    const tariff = getTariff(canton);
    if (!tariff) {
        errors.push(
            `Keine Tarifdaten für Kanton "${canton}" gefunden.`,
        );
    }

    // 3. Data version freshness
    const dataVersion = meta.dataVersion ?? "unknown";
    if (dataVersion !== "unknown") {
        const dataYear = parseInt(dataVersion.substring(0, 4), 10);
        if (!isNaN(dataYear) && dataYear < inputs.taxYear) {
            warnings.push(
                `Datenstand ${dataVersion} ist möglicherweise veraltet für Steuerjahr ${inputs.taxYear}.`,
            );
        }
    }

    // 4. Commune check for Steuerfuss cantons
    if (cantonMeta?.hasSteuerfussData && inputs.commune) {
        // SH has actual Steuerfuss data; other Steuerfuss cantons don't yet
        // For now we just warn if commune is empty
        if (!inputs.commune.trim()) {
            errors.push(
                `Kanton ${canton} benötigt eine Gemeinde mit Steuerfuss-Daten.`,
            );
        }
    }

    // 5. Date sanity
    if (inputs.saleDate && inputs.purchaseDate) {
        if (inputs.saleDate <= inputs.purchaseDate) {
            errors.push("Das Verkaufsdatum muss nach dem Kaufdatum liegen.");
        }
    }

    // 6. Negative gain warning
    try {
        const gain = computeTaxableGain(inputs);
        if (gain.isNegative()) {
            warnings.push(
                "Der steuerbare Gewinn ist negativ — es fällt keine Steuer an.",
            );
        }
    } catch {
        // If gain computation fails, other validations will catch the cause
    }

    // 7. Tax year in available range
    if (cantonMeta) {
        const availYears = cantonMeta.availableYears;
        if (availYears.length > 0 && !availYears.includes(inputs.taxYear)) {
            warnings.push(
                `Steuerjahr ${inputs.taxYear} ist nicht in den verfügbaren Jahren ` +
                `(${availYears.join(", ")}) für Kanton ${canton}.`,
            );
        }
    }

    return {
        valid: errors.length === 0,
        warnings,
        errors,
        dataVersion,
        engineVersion: meta.engineVersion ?? "unknown",
    };
}
