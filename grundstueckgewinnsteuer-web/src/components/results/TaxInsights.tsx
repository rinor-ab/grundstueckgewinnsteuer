"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, Clock, Building2 } from "lucide-react";
import type { TaxResult } from "@/lib/tax/types";

interface TaxInsightsProps {
    result: TaxResult;
}

interface Insight {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}

export function TaxInsights({ result }: TaxInsightsProps) {
    const totalTax = parseFloat(result.totalTax);
    const taxableGain = parseFloat(result.taxableGain);
    const effectiveRate = parseFloat(result.effectiveTaxRatePercent);

    const insights: Insight[] = [];

    // 1. Gain size insight
    if (taxableGain > 500000) {
        insights.push({
            icon: <TrendingUp size={14} />,
            title: "Hoher steuerbarer Gewinn",
            description: `CHF ${new Intl.NumberFormat("de-CH").format(taxableGain)} fallen in höhere Progressionsstufen, was den effektiven Steuersatz auf ${effectiveRate.toFixed(1)}% treibt.`,
            color: "text-primary",
        });
    } else if (taxableGain > 100000) {
        insights.push({
            icon: <TrendingUp size={14} />,
            title: "Mittlerer Gewinn",
            description: `Bei CHF ${new Intl.NumberFormat("de-CH").format(taxableGain)} liegt der effektive Steuersatz bei ${effectiveRate.toFixed(1)}%.`,
            color: "text-primary",
        });
    } else {
        insights.push({
            icon: <TrendingUp size={14} />,
            title: "Moderater Gewinn",
            description: `Ein steuerbarer Gewinn von CHF ${new Intl.NumberFormat("de-CH").format(taxableGain)} führt zu einem günstigen Steuersatz von ${effectiveRate.toFixed(1)}%.`,
            color: "text-[var(--brand-sage)]",
        });
    }

    // 2. Holding period effect
    if (result.surchargeRate) {
        const surcharge = (parseFloat(result.surchargeRate) * 100).toFixed(0);
        insights.push({
            icon: <Clock size={14} />,
            title: "Spekulationszuschlag",
            description: `Die kurze Besitzdauer von ${result.holdingYears}J ${result.holdingMonths % 12}M führt zu einem Zuschlag von ${surcharge}%. Längeres Halten hätte die Steuer reduziert.`,
            color: "text-accent",
        });
    } else if (result.discountRate) {
        const discount = (parseFloat(result.discountRate) * 100).toFixed(0);
        insights.push({
            icon: <Clock size={14} />,
            title: "Besitzdauer-Abzug",
            description: `Die lange Besitzdauer von ${result.holdingYears} Jahren bringt einen Abzug von ${discount}%. Das spart Ihnen einen erheblichen Steuerbetrag.`,
            color: "text-[var(--brand-sage)]",
        });
    } else {
        insights.push({
            icon: <Clock size={14} />,
            title: "Neutrale Besitzdauer",
            description: `${result.holdingYears} Jahre Besitzdauer — kein Zuschlag und noch kein Langzeit-Abzug anwendbar.`,
            color: "text-muted-foreground",
        });
    }

    // 3. Commune multiplier effect
    const communeMult = parseFloat(result.communeMultiplierPercent);
    const cantonMult = parseFloat(result.cantonMultiplierPercent);
    if (communeMult > 0 || cantonMult > 0) {
        const totalMult = communeMult + cantonMult;
        insights.push({
            icon: <Building2 size={14} />,
            title: "Steuerfuss-Effekt",
            description: `Der kombinierte Steuerfuss von ${totalMult.toFixed(0)}% (Kanton ${cantonMult.toFixed(0)}% + Gemeinde ${communeMult.toFixed(0)}%) beeinflusst Ihre Endsteuer massgeblich.`,
            color: "text-primary",
        });
    } else {
        insights.push({
            icon: <Building2 size={14} />,
            title: "Direkte Berechnung",
            description: `In diesem Kanton wird die Steuer direkt berechnet — ohne separaten kantonalen/kommunalen Steuerfuss.`,
            color: "text-muted-foreground",
        });
    }

    if (totalTax <= 0) return null;

    return (
        <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Was treibt Ihre Steuer?
                </h3>
            </div>
            <div className="space-y-3">
                {insights.map((insight, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex gap-3"
                    >
                        <div className={`mt-0.5 ${insight.color}`}>
                            {insight.icon}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{insight.title}</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">{insight.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
