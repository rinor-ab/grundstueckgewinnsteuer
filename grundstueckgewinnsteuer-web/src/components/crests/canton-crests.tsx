/**
 * Inline SVG canton crest placeholders.
 *
 * Each renders a heraldic shield shape filled with the canton's accent color
 * and a bold abbreviation. These can be swapped for official vector crests
 * later — the component interface stays identical.
 */

import React from "react";

interface CrestProps {
    size?: number;
    className?: string;
}

/** Accent colours per canton (official / simplified heraldic palette) */
export const CANTON_COLORS: Record<string, { bg: string; fg: string; accent: string }> = {
    ZH: { bg: "#0057B8", fg: "#fff", accent: "#0057B8" },
    BE: { bg: "#D52B1E", fg: "#FFD700", accent: "#D52B1E" },
    LU: { bg: "#1E4D8C", fg: "#fff", accent: "#1E4D8C" },
    UR: { bg: "#FFD700", fg: "#000", accent: "#E8A500" },
    SZ: { bg: "#D52B1E", fg: "#fff", accent: "#D52B1E" },
    OW: { bg: "#D52B1E", fg: "#fff", accent: "#C62828" },
    NW: { bg: "#D52B1E", fg: "#fff", accent: "#B71C1C" },
    GL: { bg: "#000", fg: "#D52B1E", accent: "#333" },
    ZG: { bg: "#0057B8", fg: "#fff", accent: "#0057B8" },
    FR: { bg: "#000", fg: "#fff", accent: "#1a1a1a" },
    SO: { bg: "#D52B1E", fg: "#fff", accent: "#D52B1E" },
    BS: { bg: "#000", fg: "#fff", accent: "#1a1a1a" },
    BL: { bg: "#D52B1E", fg: "#fff", accent: "#C41E1E" },
    SH: { bg: "#FFD700", fg: "#000", accent: "#D4A300" },
    AR: { bg: "#000", fg: "#fff", accent: "#2a2a2a" },
    AI: { bg: "#000", fg: "#fff", accent: "#1a1a1a" },
    SG: { bg: "#1B7340", fg: "#fff", accent: "#1B7340" },
    GR: { bg: "#555", fg: "#fff", accent: "#4a4a4a" },
    AG: { bg: "#0057B8", fg: "#fff", accent: "#0057B8" },
    TG: { bg: "#1B7340", fg: "#fff", accent: "#1B7340" },
    TI: { bg: "#D52B1E", fg: "#0057B8", accent: "#D52B1E" },
    VD: { bg: "#1B7340", fg: "#fff", accent: "#1B7340" },
    VS: { bg: "#D52B1E", fg: "#fff", accent: "#C41E1E" },
    NE: { bg: "#1B7340", fg: "#D52B1E", accent: "#1B7340" },
    GE: { bg: "#D52B1E", fg: "#FFD700", accent: "#D52B1E" },
    JU: { bg: "#D52B1E", fg: "#fff", accent: "#C41E1E" },
};

/** Shield SVG path for a consistent heraldic shape */
const SHIELD_PATH =
    "M4 2 C4 2 2 2 2 4 L2 14 C2 18 8 22 12 24 C16 22 22 18 22 14 L22 4 C22 2 20 2 20 2 Z";

function CrestSVG({
    code,
    size = 32,
    className,
}: CrestProps & { code: string }) {
    const colors = CANTON_COLORS[code] ?? { bg: "#6b7280", fg: "#fff", accent: "#6b7280" };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label={`Wappen ${code}`}
        >
            {/* Shield shape */}
            <path d={SHIELD_PATH} fill={colors.bg} stroke={colors.bg} strokeWidth="0.5" />
            {/* Canton abbreviation */}
            <text
                x="12"
                y="15"
                textAnchor="middle"
                dominantBaseline="central"
                fill={colors.fg}
                fontSize="8"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="0.5"
            >
                {code}
            </text>
        </svg>
    );
}

// ---------------------------------------------------------------------------
// Export one component per canton (tree-shakeable)
// ---------------------------------------------------------------------------

export const CrestZH: React.FC<CrestProps> = (p) => <CrestSVG code="ZH" {...p} />;
export const CrestBE: React.FC<CrestProps> = (p) => <CrestSVG code="BE" {...p} />;
export const CrestLU: React.FC<CrestProps> = (p) => <CrestSVG code="LU" {...p} />;
export const CrestUR: React.FC<CrestProps> = (p) => <CrestSVG code="UR" {...p} />;
export const CrestSZ: React.FC<CrestProps> = (p) => <CrestSVG code="SZ" {...p} />;
export const CrestOW: React.FC<CrestProps> = (p) => <CrestSVG code="OW" {...p} />;
export const CrestNW: React.FC<CrestProps> = (p) => <CrestSVG code="NW" {...p} />;
export const CrestGL: React.FC<CrestProps> = (p) => <CrestSVG code="GL" {...p} />;
export const CrestZG: React.FC<CrestProps> = (p) => <CrestSVG code="ZG" {...p} />;
export const CrestFR: React.FC<CrestProps> = (p) => <CrestSVG code="FR" {...p} />;
export const CrestSO: React.FC<CrestProps> = (p) => <CrestSVG code="SO" {...p} />;
export const CrestBS: React.FC<CrestProps> = (p) => <CrestSVG code="BS" {...p} />;
export const CrestBL: React.FC<CrestProps> = (p) => <CrestSVG code="BL" {...p} />;
export const CrestSH: React.FC<CrestProps> = (p) => <CrestSVG code="SH" {...p} />;
export const CrestAR: React.FC<CrestProps> = (p) => <CrestSVG code="AR" {...p} />;
export const CrestAI: React.FC<CrestProps> = (p) => <CrestSVG code="AI" {...p} />;
export const CrestSG: React.FC<CrestProps> = (p) => <CrestSVG code="SG" {...p} />;
export const CrestGR: React.FC<CrestProps> = (p) => <CrestSVG code="GR" {...p} />;
export const CrestAG: React.FC<CrestProps> = (p) => <CrestSVG code="AG" {...p} />;
export const CrestTG: React.FC<CrestProps> = (p) => <CrestSVG code="TG" {...p} />;
export const CrestTI: React.FC<CrestProps> = (p) => <CrestSVG code="TI" {...p} />;
export const CrestVD: React.FC<CrestProps> = (p) => <CrestSVG code="VD" {...p} />;
export const CrestVS: React.FC<CrestProps> = (p) => <CrestSVG code="VS" {...p} />;
export const CrestNE: React.FC<CrestProps> = (p) => <CrestSVG code="NE" {...p} />;
export const CrestGE: React.FC<CrestProps> = (p) => <CrestSVG code="GE" {...p} />;
export const CrestJU: React.FC<CrestProps> = (p) => <CrestSVG code="JU" {...p} />;

/** Generic crest by canton code */
export { CrestSVG };
