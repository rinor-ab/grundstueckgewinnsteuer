"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import type { TaxResult } from "@/lib/tax/types";

interface ScenarioSliderProps {
    /** Current sale price from the form */
    salePrice: number;
    /** Current total tax from the result */
    currentTax: number;
    /** Callback when the user adjusts the hypothetical sale price */
    onSimulate: (newSalePrice: number) => TaxResult | null;
}

/**
 * "What-if" scenario slider — lets users drag a sale price slider
 * to instantly see how the tax would change at a different price.
 */
export function ScenarioSlider({ salePrice, currentTax, onSimulate }: ScenarioSliderProps) {
    const min = Math.max(0, Math.round(salePrice * 0.7));
    const max = Math.round(salePrice * 1.5);
    const step = Math.max(1000, Math.round((max - min) / 200));

    const [sliderValue, setSliderValue] = useState(salePrice);
    const [isActive, setIsActive] = useState(false);

    const simResult = useMemo(() => {
        if (sliderValue === salePrice) return null;
        return onSimulate(sliderValue);
    }, [sliderValue, salePrice, onSimulate]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSliderValue(parseInt(e.target.value, 10));
        setIsActive(true);
    }, []);

    const simTax = simResult ? parseFloat(simResult.totalTax) : currentTax;
    const diff = simTax - currentTax;
    const diffLabel = diff > 0 ? `+${diff.toLocaleString("de-CH")}` : diff.toLocaleString("de-CH");

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-xl border border-border/60 bg-white p-5 shadow-sm"
        >
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <SlidersHorizontal size={16} className="text-primary" />
                Was-wäre-wenn Szenario
            </div>

            <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground">Hypothetischer Verkaufspreis</span>
                    <span className="text-sm font-semibold tabular-nums">
                        CHF {sliderValue.toLocaleString("de-CH")}
                    </span>
                </div>

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={sliderValue}
                    onChange={handleChange}
                    className="w-full accent-primary cursor-pointer"
                    aria-label="Hypothetischer Verkaufspreis"
                />

                <div className="flex justify-between text-[10px] text-muted-foreground/60 tabular-nums">
                    <span>CHF {min.toLocaleString("de-CH")}</span>
                    <span>CHF {max.toLocaleString("de-CH")}</span>
                </div>

                {isActive && sliderValue !== salePrice && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-2 rounded-xl bg-muted/40 px-4 py-3"
                    >
                        <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Geschätzte Steuer</span>
                            <span className="text-sm font-bold tabular-nums">
                                CHF {simTax.toLocaleString("de-CH", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">Differenz zur aktuellen Berechnung</span>
                            <span
                                className={`text-xs font-semibold tabular-nums ${diff > 0 ? "text-destructive" : diff < 0 ? "text-emerald-600" : "text-muted-foreground"
                                    }`}
                            >
                                CHF {diffLabel}
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
