"use client";

import { Receipt, Info } from "lucide-react";
import { CurrencyInput } from "@/components/CurrencyInput";
import { InfoTooltip } from "@/components/InfoTooltip";
import type { FormState } from "@/hooks/use-wizard";

interface DeductionsStepProps {
    form: FormState;
    cantonConfessions: string[];
    setField: (field: keyof FormState, value: unknown) => void;
    setConfessions: (confessions: Record<string, number>) => void;
}

const confessionLabels: Record<string, string> = {
    evangR: "Evang. Reformiert",
    roemK: "Röm. Katholisch",
    christK: "Christl. Katholisch",
    Andere: "Andere (0%)",
};

export function DeductionsStep({
    form,
    cantonConfessions,
    setField,
    setConfessions,
}: DeductionsStepProps) {
    const inputClass =
        "w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40";

    const totalDeductions =
        parseFloat(form.acquisitionCosts || "0") +
        parseFloat(form.sellingCosts || "0") +
        parseFloat(form.investmentAmount || "0");

    return (
        <div className="space-y-6">
            {/* Question */}
            <div>
                <div className="mb-1 flex items-center gap-2 text-primary">
                    <Receipt size={18} />
                    <span className="text-xs font-semibold uppercase tracking-widest">Schritt 4</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Welche Abzüge können Sie geltend machen?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {totalDeductions > 0
                        ? `Total Abzüge: CHF ${totalDeductions.toLocaleString("de-CH")} — diese reduzieren Ihren steuerbaren Gewinn.`
                        : "Diese Kosten reduzieren den steuerbaren Gewinn. Alle Felder sind optional."}
                </p>
            </div>

            {/* Cost inputs */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Erwerbsnebenkosten
                        <InfoTooltip text="Kosten im Zusammenhang mit dem Erwerb: Notariats- und Grundbuchgebühren, Handänderungssteuer, Vermittlungsprovision." />
                    </label>
                    <CurrencyInput
                        id="acquisition-costs"
                        className={inputClass}
                        value={form.acquisitionCosts}
                        placeholder="0"
                        onChange={(v) => setField("acquisitionCosts", v)}
                    />
                    <p className="text-xs text-muted-foreground">Notar, Handänderungssteuer</p>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Veräusserungskosten
                        <InfoTooltip text="Kosten im Zusammenhang mit dem Verkauf: Maklerprovision, Inserate, Notariatsgebühren." />
                    </label>
                    <CurrencyInput
                        id="selling-costs"
                        className={inputClass}
                        value={form.sellingCosts}
                        placeholder="0"
                        onChange={(v) => setField("sellingCosts", v)}
                    />
                    <p className="text-xs text-muted-foreground">Makler, Inserate</p>
                </div>
                <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Investitionen
                        <InfoTooltip text="Wertvermehrende Investitionen wie An-/Umbauten, Renovationen — nicht werterhaltende Ausgaben." />
                    </label>
                    <CurrencyInput
                        id="investments"
                        className={inputClass}
                        value={form.investmentAmount}
                        placeholder="0"
                        onChange={(v) => setField("investmentAmount", v)}
                    />
                    <p className="text-xs text-muted-foreground">Wertvermehrende Aufwendungen</p>
                </div>
            </div>

            {/* Total deductions hint */}
            {totalDeductions > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
                    <Info size={16} className="text-blue-500" />
                    <p className="text-sm text-blue-800">
                        Total Abzüge: CHF{" "}
                        {totalDeductions.toLocaleString("de-CH", { minimumFractionDigits: 0 })}
                    </p>
                </div>
            )}

            {/* Church tax — conditional */}
            {cantonConfessions.length > 0 && (
                <div className="space-y-4 rounded-xl border border-border/60 bg-slate-50/50 p-5">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Kirchensteuer</h3>
                        <p className="text-xs text-muted-foreground">
                            Anzahl steuerpflichtige Personen pro Konfession
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {cantonConfessions.map((key) => (
                            <div key={key} className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground/80">
                                    {confessionLabels[key] ?? key}
                                </label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={form.confessions[key] ?? 0}
                                    min={0}
                                    step={1}
                                    onChange={(e) =>
                                        setConfessions({
                                            ...form.confessions,
                                            [key]: parseInt(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
