"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
    MapPin,
    Calendar,
    TrendingUp,
    TrendingDown,
    Clock,
} from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { CantonCrest } from "@/components/crests/CantonCrest";
import { CANTON_META } from "@/lib/tax/canton-meta";
import type { TaxResult } from "@/lib/tax/types";

interface SummaryPanelProps {
    canton: string;
    commune: string;
    holdingMonths: number;
    rawGain: number;
    result: TaxResult | null;
    step: number;
}

export const SummaryPanel = memo(function SummaryPanel({
    canton,
    commune,
    holdingMonths,
    rawGain,
    result,
    step,
}: SummaryPanelProps) {
    const holdingYears = Math.floor(holdingMonths / 12);
    const holdingRemainder = holdingMonths % 12;
    const meta = CANTON_META[canton];
    const cantonName = meta?.name ?? canton;

    return (
        <div className="lg:sticky lg:top-24 lg:self-start" aria-live="polite" aria-label="Steuer-Übersicht">
            <motion.div
                layout
                className="overflow-hidden rounded-xl border border-border bg-card p-6 text-foreground shadow-sm"
            >
                {/* Header with crest */}
                <div className="mb-5 flex items-center gap-3">
                    <CantonCrest code={canton} size={32} className="drop-shadow-sm" />
                    <div>
                        <p className="font-serif text-lg font-semibold text-foreground">Übersicht</p>
                        <p className="text-xs text-muted-foreground">Live-Berechnung</p>
                    </div>
                </div>

                {/* Data rows */}
                <div className="space-y-3.5">
                    {/* Canton + commune */}
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin size={13} />
                            Standort
                        </span>
                        <span className="text-sm font-medium text-foreground">
                            {cantonName}
                            {commune ? `, ${commune}` : ""}
                        </span>
                    </div>

                    {/* Holding period */}
                    {step >= 1 && holdingMonths > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between"
                        >
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Clock size={13} />
                                Besitzdauer
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {holdingYears}J {holdingRemainder}M
                            </span>
                        </motion.div>
                    )}

                    {/* Gain */}
                    {step >= 2 && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between"
                        >
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar size={13} />
                                Gewinn
                            </span>
                            <AnimatedNumber value={rawGain} format="chf" className="text-sm font-medium text-foreground" />
                        </motion.div>
                    )}

                    {/* Tax result */}
                    {result && (
                        <>
                            <div className="my-1 border-t border-border" />

                            {/* Simple tax */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between"
                            >
                                <span className="text-sm text-muted-foreground">Einfache Steuer</span>
                                <AnimatedNumber
                                    value={parseFloat(result.simpleTax)}
                                    format="chf"
                                    className="text-sm font-medium text-foreground"
                                />
                            </motion.div>

                            {/* Total — hero number */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                                className="flex items-center justify-between"
                            >
                                <span className="font-serif text-lg font-semibold text-foreground">Total</span>
                                <AnimatedNumber
                                    value={parseFloat(result.totalTax)}
                                    format="chf"
                                    duration={900}
                                    className="font-serif text-xl font-bold text-primary"
                                />
                            </motion.div>

                            {/* Effective rate */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center justify-between"
                            >
                                <span className="text-sm text-muted-foreground">Steuersatz</span>
                                <AnimatedNumber
                                    value={parseFloat(result.effectiveTaxRatePercent)}
                                    format="percent"
                                    className="text-sm font-medium text-foreground"
                                />
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Badges */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4 flex flex-wrap gap-1.5"
                    >
                        {result.surchargeRate && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                                <TrendingUp size={11} />+
                                {(parseFloat(result.surchargeRate) * 100).toFixed(0)}% Zuschlag
                            </span>
                        )}
                        {result.discountRate && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                                <TrendingDown size={11} />−
                                {(parseFloat(result.discountRate) * 100).toFixed(0)}% Abzug
                            </span>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
});
