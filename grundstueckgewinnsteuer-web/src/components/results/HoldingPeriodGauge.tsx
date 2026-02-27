"use client";

import { motion } from "framer-motion";

interface HoldingPeriodGaugeProps {
    holdingMonths: number;
    holdingYears: number;
    surchargeRate: string | null;
    discountRate: string | null;
}

/**
 * Visual gauge showing ownership duration along a timeline
 * with color zones for surcharge (<2yr), neutral (2–25yr), discount (>25yr).
 */
export function HoldingPeriodGauge({
    holdingMonths,
    holdingYears,
    surchargeRate,
    discountRate,
}: HoldingPeriodGaugeProps) {
    // Max scale = 40 years
    const maxYears = 40;
    const yearsExact = holdingMonths / 12;
    const pct = Math.min((yearsExact / maxYears) * 100, 100);

    // Zone boundaries (as percentages)
    const surchargeEnd = (2 / maxYears) * 100;   // 5%
    const discountStart = (25 / maxYears) * 100; // 62.5%

    return (
        <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Besitzdauer
            </h3>

            {/* Gauge bar */}
            <div className="relative h-6 w-full overflow-hidden rounded-full bg-muted">
                {/* Surcharge zone */}
                <div
                    className="absolute inset-y-0 left-0 bg-[var(--brand-gold)]/10"
                    style={{ width: `${surchargeEnd}%` }}
                />
                {/* Neutral zone */}
                <div
                    className="absolute inset-y-0 bg-secondary"
                    style={{ left: `${surchargeEnd}%`, width: `${discountStart - surchargeEnd}%` }}
                />
                {/* Discount zone */}
                <div
                    className="absolute inset-y-0 right-0 bg-[var(--brand-sage)]/10"
                    style={{ left: `${discountStart}%` }}
                />

                {/* Progress fill */}
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    style={{
                        background:
                            yearsExact < 2
                                ? "linear-gradient(90deg, var(--brand-gold), var(--brand-gold-light))"
                                : yearsExact > 25
                                    ? "linear-gradient(90deg, var(--brand-navy), var(--brand-sage))"
                                    : "linear-gradient(90deg, var(--brand-navy), var(--brand-gold))",
                    }}
                />

                {/* Marker */}
                <motion.div
                    className="absolute top-0 h-full w-0.5 bg-primary"
                    initial={{ left: "0%" }}
                    animate={{ left: `${pct}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                        <div className="h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
                    </div>
                </motion.div>
            </div>

            {/* Scale labels — positioned at true linear percentages */}
            <div className="relative mt-1.5 h-4 text-[10px] text-muted-foreground">
                <span className="absolute left-0">0J</span>
                <span className="absolute" style={{ left: `${(2 / maxYears) * 100}%`, transform: "translateX(-50%)" }}>2J</span>
                <span className="absolute" style={{ left: `${(10 / maxYears) * 100}%`, transform: "translateX(-50%)" }}>10J</span>
                <span className="absolute" style={{ left: `${(25 / maxYears) * 100}%`, transform: "translateX(-50%)" }}>25J</span>
                <span className="absolute right-0">40J</span>
            </div>

            {/* Info row */}
            <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                    {holdingYears} Jahre {holdingMonths % 12} Monate
                </span>
                <div className="flex gap-1.5">
                    {surchargeRate && (
                        <span className="inline-flex items-center rounded-full bg-accent/5 px-2 py-0.5 text-[10px] font-medium text-accent ring-1 ring-accent/20">
                            +{(parseFloat(surchargeRate) * 100).toFixed(0)}% Zuschlag
                        </span>
                    )}
                    {discountRate && (
                        <span className="inline-flex items-center rounded-full bg-[var(--brand-sage)]/5 px-2 py-0.5 text-[10px] font-medium text-[var(--brand-sage)] ring-1 ring-[var(--brand-sage)]/20">
                            −{(parseFloat(discountRate) * 100).toFixed(0)}% Abzug
                        </span>
                    )}
                    {!surchargeRate && !discountRate && (
                        <span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-primary/20">
                            Kein Zu-/Abschlag
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
