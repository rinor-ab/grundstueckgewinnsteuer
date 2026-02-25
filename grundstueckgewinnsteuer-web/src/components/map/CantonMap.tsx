"use client";

import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ZoomOut } from "lucide-react";
import { CANTON_META } from "@/lib/tax/canton-meta";
import { CANTON_PATHS } from "./canton-map-paths";

interface CantonMapProps {
    selectedCanton: string;
    onSelect?: (canton: string) => void;
    className?: string;
}

// Full viewBox of the Switzerland SVG
const FULL_VB = { x: 0, y: 0, w: 1052.361, h: 744.094 };

// Small cantons that need enlarged invisible hit areas
const SMALL_CANTONS = new Set(["BS", "BL", "AI", "AR", "GL", "ZG", "SH", "NW", "OW"]);

// Pre-compute canton entries array (static, never changes)
const CANTON_ENTRIES = Object.entries(CANTON_PATHS);

/**
 * Individual canton path — memoized to prevent unnecessary re-renders.
 * Only re-renders when its own selected/hovered state changes.
 */
const CantonPath = memo(function CantonPath({
    code,
    pathData,
    isSelected,
    isHovered,
    cantonName,
    accentColor,
    isSmall,
    onSelect,
    onHoverStart,
    onHoverEnd,
    onMouseMove,
}: {
    code: string;
    pathData: string;
    isSelected: boolean;
    isHovered: boolean;
    cantonName: string;
    accentColor: string;
    isSmall: boolean;
    onSelect: () => void;
    onHoverStart: () => void;
    onHoverEnd: () => void;
    onMouseMove: (e: React.MouseEvent<SVGElement>) => void;
}) {
    const fill = isSelected ? accentColor : isHovered ? "#94a3b8" : "#e2e8f0";
    const stroke = isSelected ? "rgba(255,255,255,0.7)" : isHovered ? "#94a3b8" : "#cbd5e1";
    const strokeWidth = isSelected ? 2 : 0.5;

    return (
        <g>
            {isSmall && (
                <path
                    d={pathData}
                    fill="transparent"
                    stroke="transparent"
                    strokeWidth={20}
                    className="cursor-pointer"
                    onClick={onSelect}
                    onMouseEnter={onHoverStart}
                    onMouseLeave={onHoverEnd}
                    onMouseMove={onMouseMove}
                    style={{ pointerEvents: "stroke" }}
                />
            )}
            <path
                id={`canton-${code}`}
                d={pathData}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                style={{ transition: "fill 150ms, stroke 150ms, opacity 150ms" }}
                onClick={onSelect}
                onMouseEnter={onHoverStart}
                onMouseLeave={onHoverEnd}
                onMouseMove={onMouseMove}
                role="button"
                tabIndex={0}
                aria-label={`${cantonName} auswählen`}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect();
                    }
                }}
                opacity={isSelected ? 1 : isHovered ? 0.9 : 0.85}
            />
        </g>
    );
});

/**
 * Interactive SVG map of Switzerland with zoom-to-canton on selection.
 * Uses plain <path> elements (not motion.path) for performance —
 * CSS transitions handle the color changes smoothly.
 */
export const CantonMap = memo(function CantonMap({
    selectedCanton,
    onSelect,
    className,
}: CantonMapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredCanton, setHoveredCanton] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [viewBox, setViewBox] = useState(FULL_VB);
    const [isZoomed, setIsZoomed] = useState(false);

    // Throttled tooltip position — use requestAnimationFrame
    const rafRef = useRef(0);
    const handleMouseMove = useCallback((e: React.MouseEvent<SVGElement>) => {
        if (rafRef.current) return; // skip if one is pending
        rafRef.current = requestAnimationFrame(() => {
            const svg = (e.target as SVGElement).closest("svg");
            if (!svg) { rafRef.current = 0; return; }
            const rect = svg.getBoundingClientRect();
            setTooltipPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top - 10,
            });
            rafRef.current = 0;
        });
    }, []);

    // Cleanup rAF on unmount
    useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

    // Compute bounding box for the selected canton and zoom in
    useEffect(() => {
        if (!svgRef.current || !selectedCanton) return;
        const pathEl = svgRef.current.querySelector(
            `#canton-${selectedCanton}`,
        ) as SVGPathElement | null;
        if (!pathEl) return;

        const bbox = pathEl.getBBox();
        const pad = Math.max(bbox.width, bbox.height) * 0.8;
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        const size = Math.max(bbox.width, bbox.height) + pad * 2;

        const vbW = Math.min(size, FULL_VB.w);
        const vbH = Math.min(size * (FULL_VB.h / FULL_VB.w), FULL_VB.h);
        const vbX = Math.max(0, Math.min(cx - vbW / 2, FULL_VB.w - vbW));
        const vbY = Math.max(0, Math.min(cy - vbH / 2, FULL_VB.h - vbH));

        setViewBox({ x: vbX, y: vbY, w: vbW, h: vbH });
        setIsZoomed(true);
    }, [selectedCanton]);

    const handleResetZoom = useCallback(() => {
        setViewBox(FULL_VB);
        setIsZoomed(false);
    }, []);

    // Stable per-canton callbacks via a single onSelect handler
    const handleSelect = useCallback(
        (code: string) => onSelect?.(code),
        [onSelect],
    );

    const handleHoverStart = useCallback(
        (code: string) => setHoveredCanton(code),
        [],
    );

    const handleHoverEnd = useCallback(() => setHoveredCanton(null), []);

    // Sort: selected canton last (on top in SVG z-order)
    const sortedCantons = useMemo(() => {
        return [...CANTON_ENTRIES].sort(([a], [b]) => {
            if (a === selectedCanton) return 1;
            if (b === selectedCanton) return -1;
            return 0;
        });
    }, [selectedCanton]);

    const viewBoxStr = `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`;

    return (
        <div className={`relative ${className ?? ""}`}>
            {/* Reset zoom button */}
            <AnimatePresence>
                {isZoomed && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleResetZoom}
                        className="absolute top-2 right-2 z-10 flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-md border border-border/40 transition-colors hover:bg-white hover:text-slate-900"
                        aria-label="Zoom zurücksetzen"
                    >
                        <ZoomOut size={13} />
                        Übersicht
                    </motion.button>
                )}
            </AnimatePresence>

            <motion.svg
                ref={svgRef}
                viewBox={viewBoxStr}
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto max-h-[300px] sm:max-h-[400px]"
                role="img"
                aria-label="Karte der Schweiz"
                animate={{ viewBox: viewBoxStr }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                {sortedCantons.map(([code, pathData]) => (
                    <CantonPath
                        key={code}
                        code={code}
                        pathData={pathData}
                        isSelected={code === selectedCanton}
                        isHovered={code === hoveredCanton}
                        cantonName={CANTON_META[code]?.name ?? code}
                        accentColor={CANTON_META[code]?.accentColor ?? "#3b82f6"}
                        isSmall={SMALL_CANTONS.has(code)}
                        onSelect={() => handleSelect(code)}
                        onHoverStart={() => handleHoverStart(code)}
                        onHoverEnd={handleHoverEnd}
                        onMouseMove={handleMouseMove}
                    />
                ))}
            </motion.svg>

            {/* Tooltip */}
            {hoveredCanton && (
                <div
                    className="pointer-events-none absolute z-10 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity"
                    style={{
                        left: tooltipPos.x,
                        top: tooltipPos.y,
                        transform: "translate(-50%, -100%)",
                    }}
                >
                    {CANTON_META[hoveredCanton]?.name ?? hoveredCanton}
                </div>
            )}
        </div>
    );
});
