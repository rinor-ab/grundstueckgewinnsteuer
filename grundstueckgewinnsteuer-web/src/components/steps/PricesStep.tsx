"use client";

import { DollarSign, TrendingUp } from "lucide-react";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { CurrencyInput } from "@/components/CurrencyInput";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ContextualWarning } from "@/components/ContextualWarning";
import type { FormState } from "@/hooks/use-wizard";

interface PricesStepProps {
    form: FormState;
    rawGain: number;
    setField: (field: keyof FormState, value: unknown) => void;
}

export function PricesStep({ form, rawGain, setField }: PricesStepProps) {
    const inputClass =
        "w-full rounded-md border border-input bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40";

    return (
        <div className="space-y-6">
            {/* Question */}
            <div>
                <div className="mb-1 flex items-center gap-2 text-primary">
                    <DollarSign size={18} />
                    <span className="text-xs font-semibold uppercase tracking-widest">Schritt 3</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Wie hoch war der Kauf- und Verkaufspreis?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {rawGain > 0
                        ? `Ihr Rohgewinn beträgt CHF ${rawGain.toLocaleString("de-CH")} — davon können noch Abzüge gemacht werden.`
                        : rawGain < 0
                            ? "Aktuell kein steuerbarer Gewinn — der Verkaufspreis liegt unter dem Kaufpreis."
                            : "Die Differenz bestimmt den steuerbaren Grundstückgewinn."}
                </p>
            </div>

            {/* Price inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Kaufpreis
                        <InfoTooltip text="Der im Kaufvertrag vereinbarte Preis inkl. Wert allfälliger Gegenleistungen." />
                    </label>
                    <CurrencyInput
                        id="purchase-price"
                        className={inputClass}
                        value={form.purchasePrice}
                        placeholder="z.B. 500'000"
                        onChange={(v) => setField("purchasePrice", v)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Verkaufspreis
                        <InfoTooltip text="Der tatsächlich erzielte Verkaufserlös gemäss Kaufvertrag." />
                    </label>
                    <CurrencyInput
                        id="sale-price"
                        className={inputClass}
                        value={form.salePrice}
                        placeholder="z.B. 700'000"
                        onChange={(v) => setField("salePrice", v)}
                    />
                </div>
            </div>

            {/* Live gain badge */}
            <div className="flex items-center gap-3 rounded-md bg-secondary px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <TrendingUp size={18} className="text-accent" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        Grundstückgewinn:{" "}
                        <AnimatedNumber value={rawGain} format="chf" className="text-accent" />
                    </p>
                    <p className="text-xs text-muted-foreground">Vor Abzug von Kosten und Investitionen</p>
                </div>
            </div>

            <ContextualWarning
                variant="zero-gain"
                message="Bei einem Gewinn von CHF 0 oder weniger fällt keine Grundstückgewinnsteuer an."
                show={rawGain <= 0 && parseFloat(form.salePrice || "0") > 0}
            />
        </div>
    );
}
