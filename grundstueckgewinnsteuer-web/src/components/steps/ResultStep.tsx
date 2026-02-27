"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    ChevronDown,
    ChevronUp,
    Download,
    Printer,
    RotateCcw,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { CantonCrest } from "@/components/crests/CantonCrest";
import { CANTON_META } from "@/lib/tax/canton-meta";
import { TaxBreakdownChart } from "@/components/results/TaxBreakdownChart";
import { BracketChart } from "@/components/results/BracketChart";
import { WaterfallChart } from "@/components/results/WaterfallChart";
import { EffectiveRateGauge } from "@/components/results/EffectiveRateGauge";
import { HoldingPeriodGauge } from "@/components/results/HoldingPeriodGauge";
import { TaxInsights } from "@/components/results/TaxInsights";
import { ScenarioSlider } from "@/components/results/ScenarioSlider";
import type { TaxResult } from "@/lib/tax/types";

interface ResultStepProps {
    result: TaxResult;
    error: string | null;
    canton: string;
    commune: string;
    taxYear: number;
    purchasePrice: number;
    salePrice: number;
    deductions: number;
    onSimulate: (newSalePrice: number) => TaxResult | null;
    onReset: () => void;
}

function formatCHF(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        minimumFractionDigits: 2,
    }).format(num);
}

export function ResultStep({
    result,
    error,
    canton,
    commune,
    taxYear,
    purchasePrice,
    salePrice,
    deductions,
    onSimulate,
    onReset,
}: ResultStepProps) {
    const [showExtras, setShowExtras] = useState(false);

    if (error) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                    <RotateCcw size={14} />
                    Neu berechnen
                </button>
            </div>
        );
    }

    const handleExportJSON = () => {
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ggst_${canton}_${commune}_${taxYear}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Hero tax reveal */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center text-center"
            >
                <div className="mb-3 flex items-center gap-3">
                    <CantonCrest code={canton} size={48} />
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-primary">
                            <Sparkles size={14} />
                            <span className="text-xs font-semibold uppercase tracking-widest">Ergebnis</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {CANTON_META[canton]?.name ?? canton}{commune ? `, ${commune}` : ""} • {taxYear}
                        </p>
                    </div>
                </div>
                <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
                    Ihre Grundstückgewinnsteuer
                </h2>
            </motion.div>

            {/* Big total */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
                className="rounded-xl border border-border bg-card p-8 text-center shadow-sm"
            >
                <p className="mb-2 text-sm text-muted-foreground">Geschuldete Steuer</p>
                <div className="font-serif text-4xl font-bold text-primary">
                    <AnimatedNumber
                        value={parseFloat(result.totalTax)}
                        format="chf"
                        duration={1200}
                    />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                    Effektiver Steuersatz:{" "}
                    <AnimatedNumber
                        value={parseFloat(result.effectiveTaxRatePercent)}
                        format="percent"
                        className="font-medium text-foreground"
                    />
                </p>
            </motion.div>

            {/* Breakdown card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Aufschlüsselung
                </h3>
                <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Steuerbarer Gewinn</span>
                        <span className="font-medium tabular-nums">{formatCHF(result.taxableGain)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Einfache Steuer</span>
                        <span className="font-medium tabular-nums">{formatCHF(result.simpleTax)}</span>
                    </div>
                    {parseFloat(result.cantonShare) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Kantonssteuer ({result.cantonMultiplierPercent ?? "—"}%)
                            </span>
                            <span className="font-medium tabular-nums">{formatCHF(result.cantonShare)}</span>
                        </div>
                    )}
                    {parseFloat(result.communeShare) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Gemeindesteuer ({result.communeMultiplierPercent ?? "—"}%)
                            </span>
                            <span className="font-medium tabular-nums">{formatCHF(result.communeShare)}</span>
                        </div>
                    )}
                    {parseFloat(result.churchTaxTotal) > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Kirchensteuer</span>
                            <span className="font-medium tabular-nums">{formatCHF(result.churchTaxTotal)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span className="tabular-nums">{formatCHF(result.totalTax)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ===== CHARTS — 2-column grid on desktop ===== */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid gap-4 md:grid-cols-2"
            >
                {/* Left column */}
                <div className="space-y-4">
                    <WaterfallChart
                        result={result}
                        purchasePrice={purchasePrice}
                        salePrice={salePrice}
                        deductions={deductions}
                    />
                    <BracketChart result={result} />
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    <TaxBreakdownChart result={result} />
                    <EffectiveRateGauge result={result} />
                </div>
            </motion.div>

            {/* Holding period gauge */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <HoldingPeriodGauge
                    holdingMonths={result.holdingMonths}
                    holdingYears={result.holdingYears}
                    surchargeRate={result.surchargeRate}
                    discountRate={result.discountRate}
                />
            </motion.div>

            {/* Scenario Slider */}
            <div className="space-y-4">
                <ScenarioSlider
                    salePrice={salePrice}
                    currentTax={parseFloat(result.totalTax)}
                    onSimulate={onSimulate}
                />
            </div>

            {/* Insights */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
            >
                <TaxInsights result={result} />
            </motion.div>

            {/* ===== END CHARTS ===== */}

            {/* Holding period badges */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-2"
            >
                {result.surchargeRate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                        <TrendingUp size={12} />
                        Zuschlag +{(parseFloat(result.surchargeRate) * 100).toFixed(0)}%
                    </span>
                )}
                {result.discountRate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                        <TrendingDown size={12} />
                        Abzug −{(parseFloat(result.discountRate) * 100).toFixed(0)}%
                    </span>
                )}
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                    {result.holdingYears}J {result.holdingMonths % 12}M Besitzdauer
                </span>
            </motion.div>

            {/* Expandable: Extras */}
            {Object.keys(result.extra).length > 0 && (
                <div>
                    <button
                        onClick={() => setShowExtras(!showExtras)}
                        className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                    >
                        Zusätzliche Details
                        {showExtras ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence>
                        {showExtras && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-2 space-y-1.5 rounded-md border border-border bg-card p-4 shadow-sm">
                                    {Object.entries(result.extra).map(([k, v]) => (
                                        <div key={k} className="flex justify-between text-sm text-muted-foreground">
                                            <span>{k.replace(/_/g, " ")}</span>
                                            <span className="tabular-nums">{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Action buttons */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-2"
            >
                <button
                    onClick={onReset}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                    <RotateCcw size={14} />
                    Neue Berechnung
                </button>
                <button
                    onClick={handleExportJSON}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                    <Download size={14} />
                    JSON
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                >
                    <Printer size={14} />
                    Drucken
                </button>
            </motion.div>
        </div>
    );
}
