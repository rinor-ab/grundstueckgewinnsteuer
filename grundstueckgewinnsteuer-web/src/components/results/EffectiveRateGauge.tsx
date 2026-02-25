"use client";

import { motion } from "framer-motion";
import type { TaxResult } from "@/lib/tax/types";

interface EffectiveRateGaugeProps {
    result: TaxResult;
}

/**
 * Half-circle gauge showing the effective tax rate (0%–40%).
 * Uses a pure SVG arc with animated dashoffset.
 */
export function EffectiveRateGauge({ result }: EffectiveRateGaugeProps) {
    const effectiveRate = parseFloat(result.effectiveTaxRatePercent);
    const maxRate = 40; // scale max
    const pct = Math.min(effectiveRate / maxRate, 1);

    // SVG arc geometry
    const cx = 140;
    const cy = 130;
    const r = 100;
    const startAngle = Math.PI; // 180° (left)
    const endAngle = 0; // 0° (right)
    const arcLength = Math.PI * r; // half-circle perimeter

    // Arc path (counter-clockwise semicircle)
    const arcD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

    // Tick marks
    const ticks = [0, 10, 20, 30, 40];

    return (
        <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Effektiver Steuersatz
            </h3>
            <div className="flex justify-center">
                <svg viewBox="0 0 280 160" className="w-full" style={{ maxWidth: 320 }}>
                    {/* Background arc */}
                    <path
                        d={arcD}
                        fill="none"
                        stroke="hsl(210 40% 96%)"
                        strokeWidth={16}
                        strokeLinecap="round"
                    />

                    {/* Coloured arc */}
                    <motion.path
                        d={arcD}
                        fill="none"
                        stroke="url(#rateGradient)"
                        strokeWidth={16}
                        strokeLinecap="round"
                        strokeDasharray={arcLength}
                        initial={{ strokeDashoffset: arcLength }}
                        animate={{ strokeDashoffset: arcLength * (1 - pct) }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="rateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="50%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    {/* Tick labels */}
                    {ticks.map((t) => {
                        const angle = startAngle - (t / maxRate) * (startAngle - endAngle);
                        const tx = cx + (r + 22) * Math.cos(angle);
                        const ty = cy - (r + 22) * Math.sin(angle);
                        return (
                            <text
                                key={t}
                                x={tx}
                                y={ty}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-muted-foreground text-[10px]"
                            >
                                {t}%
                            </text>
                        );
                    })}

                    {/* Center value */}
                    <motion.text
                        x={cx}
                        y={cy - 16}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-2xl font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        {effectiveRate.toFixed(1)}%
                    </motion.text>
                    <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-[10px]"
                    >
                        Eff. Steuersatz
                    </text>
                </svg>
            </div>
        </div>
    );
}
