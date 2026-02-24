/**
 * Canton registry and data loader.
 *
 * Maps canton codes → tariff data and engine functions.
 * Uses dynamic imports for tariff data to keep bundle lean.
 */

import type { CantonTariff } from "./types";
import { CANTON_META } from "./canton-meta";

// Static imports for all canton tariff data
// These are JSON files and tree-shaken by the bundler per-route
import shTariff from "@/data/cantons/sh.json";
import zhTariff from "@/data/cantons/zh.json";
import beTariff from "@/data/cantons/be.json";
import luTariff from "@/data/cantons/lu.json";
import agTariff from "@/data/cantons/ag.json";
import sgTariff from "@/data/cantons/sg.json";
import grTariff from "@/data/cantons/gr.json";
import soTariff from "@/data/cantons/so.json";
import szTariff from "@/data/cantons/sz.json";
import glTariff from "@/data/cantons/gl.json";
import aiTariff from "@/data/cantons/ai.json";
import vsTariff from "@/data/cantons/vs.json";
import juTariff from "@/data/cantons/ju.json";
import neTariff from "@/data/cantons/ne.json";
import nwTariff from "@/data/cantons/nw.json";
import tiTariff from "@/data/cantons/ti.json";
import vdTariff from "@/data/cantons/vd.json";
import geTariff from "@/data/cantons/ge.json";
import frTariff from "@/data/cantons/fr.json";
import urTariff from "@/data/cantons/ur.json";
import tgTariff from "@/data/cantons/tg.json";
import arTariff from "@/data/cantons/ar.json";
import bsTariff from "@/data/cantons/bs.json";
import blTariff from "@/data/cantons/bl.json";
import owTariff from "@/data/cantons/ow.json";
import zgTariff from "@/data/cantons/zg.json";

const TARIFF_MAP: Record<string, CantonTariff> = {
    SH: shTariff as unknown as CantonTariff,
    ZH: zhTariff as unknown as CantonTariff,
    BE: beTariff as unknown as CantonTariff,
    LU: luTariff as unknown as CantonTariff,
    AG: agTariff as unknown as CantonTariff,
    SG: sgTariff as unknown as CantonTariff,
    GR: grTariff as unknown as CantonTariff,
    SO: soTariff as unknown as CantonTariff,
    SZ: szTariff as unknown as CantonTariff,
    GL: glTariff as unknown as CantonTariff,
    AI: aiTariff as unknown as CantonTariff,
    VS: vsTariff as unknown as CantonTariff,
    JU: juTariff as unknown as CantonTariff,
    NE: neTariff as unknown as CantonTariff,
    NW: nwTariff as unknown as CantonTariff,
    TI: tiTariff as unknown as CantonTariff,
    VD: vdTariff as unknown as CantonTariff,
    GE: geTariff as unknown as CantonTariff,
    FR: frTariff as unknown as CantonTariff,
    UR: urTariff as unknown as CantonTariff,
    TG: tgTariff as unknown as CantonTariff,
    AR: arTariff as unknown as CantonTariff,
    BS: bsTariff as unknown as CantonTariff,
    BL: blTariff as unknown as CantonTariff,
    OW: owTariff as unknown as CantonTariff,
    ZG: zgTariff as unknown as CantonTariff,
};

/**
 * Get the tariff data for a canton.
 */
export function getTariff(canton: string): CantonTariff | null {
    return TARIFF_MAP[canton.toUpperCase()] ?? null;
}

/**
 * Get sorted list of available canton codes.
 */
export function availableCantons(): string[] {
    return Object.keys(CANTON_META).sort();
}

/**
 * Get communes for a canton and year.
 * If SH, loads from steuerfuesse.json.
 */
export function getCommunes(canton: string, taxYear: number): string[] {
    const meta = CANTON_META[canton];
    if (!meta) return [];

    if (meta.hasSteuerfussData && canton === "SH") {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sfData = require("@/data/communes/sh/steuerfuesse.json");
        const yearData = sfData[String(taxYear)] ?? [];
        return yearData
            .filter((e: Record<string, string>) => e.Gemeinde !== "Kanton")
            .map((e: Record<string, string>) => e.Gemeinde);
    }

    return meta.communes;
}

/**
 * Get available years for a canton.
 */
export function getAvailableYears(canton: string): number[] {
    return CANTON_META[canton]?.availableYears ?? [];
}

/**
 * Get confession keys for a canton.
 */
export function getConfessions(canton: string): string[] {
    return CANTON_META[canton]?.confessions ?? [];
}
