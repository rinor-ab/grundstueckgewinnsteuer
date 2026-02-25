"use client";

import { motion } from "framer-motion";
import type { TaxResult } from "@/lib/tax/types";

interface WaterfallChartProps {
    result: TaxResult;
    purchasePrice: number;
    salePrice: number;
    deductions: number;
}

interface WaterfallBar {
    label: string;
    value: number;
    type: "positive" | "negative" | "total";
}

function formatCHF(v: number): string {
    return new Intl.NumberFormat("de-CH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(v);
}

/**
 * Waterfall (cascade) chart showing the flow from sale to tax.
 * Rendered as pure SVG + Framer Motion for smooth animation.
 */
export function WaterfallChart({ result, purchasePrice, salePrice, deductions }: WaterfallChartProps) {
    const taxableGain = parseFloat(result.taxableGain);
    const totalTax = parseFloat(result.totalTax);
    const rawGain = salePrice - purchasePrice;

    const bars: WaterfallBar[] = [
        { label: "Verkaufspreis", value: salePrice, type: "positive" },
        { label: "Kaufpreis", value: -purchasePrice, type: "negative" },
    ];

    if (deductions > 0) {
        bars.push({ label: "Abzüge", value: -deductions, type: "negative" });
    }

    bars.push(
        { label: "Steuerb. Gewinn", value: taxableGain, type: "total" },
        { label: "→ Steuer", value: totalTax, type: "total" },
    );

    // Find max absolute value for scaling
    const maxVal = Math.max(...bars.map((b) => Math.abs(b.value)));
    if (maxVal === 0) return null;

    const barHeight = 32;
    const gap = 12;
    const labelWidth = 130;
    const valueWidth = 100;
    const chartWidth = 280;
    const totalWidth = labelWidth + chartWidth + valueWidth;
    const totalHeight = bars.length * (barHeight + gap);

    return (
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Gewinnfluss
            </h3>
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                    className="w-full"
                    style={{ minWidth: 360, maxHeight: 260 }}
                >
                    {bars.map((bar, i) => {
                        const y = i * (barHeight + gap);
                        const barW = (Math.abs(bar.value) / maxVal) * chartWidth;
                        const color =
                            bar.type === "negative"
                                ? "#f87171" // red-400
                                : bar.type === "total"
                                    ? bar.label.startsWith("→")
                                        ? "#6366f1" // indigo-500
                                        : "#34d399" // emerald-400
                                    : "#3b82f6"; // blue-500
                        const sign = bar.value < 0 ? "−" : bar.type === "total" ? "" : "";

                        return (
                            <g key={i}>
                                {/* Label */}
                                <text
                                    x={labelWidth - 8}
                                    y={y + barHeight / 2 + 4}
                                    textAnchor="end"
                                    className="fill-muted-foreground text-[11px] font-medium"
                                >
                                    {bar.label}
                                </text>

                                {/* Bar */}
                                <motion.rect
                                    x={labelWidth}
                                    y={y + 4}
                                    rx={4}
                                    ry={4}
                                    height={barHeight - 8}
                                    initial={{ width: 0 }}
                                    animate={{ width: barW }}
                                    transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                                    fill={color}
                                    opacity={0.85}
                                />

                                {/* Value */}
                                <motion.text
                                    x={labelWidth + chartWidth + 8}
                                    y={y + barHeight / 2 + 4}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="fill-foreground text-[11px] font-semibold tabular-nums"
                                >
                                    {sign}CHF {formatCHF(Math.abs(bar.value))}
                                </motion.text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}
