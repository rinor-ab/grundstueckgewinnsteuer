"use client";

import Image from "next/image";

interface CantonCrestProps {
    code: string;
    size?: number;
    className?: string;
}

const VALID_CANTONS = new Set([
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR",
    "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG",
    "TI", "UR", "VD", "VS", "ZG", "ZH",
]);

/**
 * Renders the official SVG coat of arms for a Swiss canton.
 * SVG files are served from /crests/{CODE}.svg.
 */
export function CantonCrest({ code, size = 32, className }: CantonCrestProps) {
    if (!VALID_CANTONS.has(code)) return null;

    return (
        <Image
            src={`/crests/${code}.svg`}
            alt={`Wappen ${code}`}
            width={size}
            height={size}
            className={className}
            style={{ objectFit: "contain" }}
            priority={false}
        />
    );
}
