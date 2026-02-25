"use client";

import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { ContextualWarning } from "@/components/ContextualWarning";
import type { FormState } from "@/hooks/use-wizard";

interface DatesStepProps {
    form: FormState;
    holdingMonths: number;
    setField: (field: keyof FormState, value: unknown) => void;
}

export function DatesStep({ form, holdingMonths, setField }: DatesStepProps) {
    const holdingYears = Math.floor(holdingMonths / 12);
    const holdingRemainder = holdingMonths % 12;
    const datesInvalid =
        form.purchaseDate && form.saleDate && form.purchaseDate > form.saleDate;

    const inputClass =
        "w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40";

    return (
        <div className="space-y-6">
            {/* Question */}
            <div>
                <div className="mb-1 flex items-center gap-2 text-primary">
                    <Calendar size={18} />
                    <span className="text-xs font-semibold uppercase tracking-widest">Schritt 2</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Seit wann besitzen Sie die Liegenschaft?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Die Besitzdauer beeinflusst den Steuersatz erheblich.
                </p>
            </div>

            {/* Date inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Erwerbsdatum</label>
                    <input
                        id="purchase-date"
                        type="date"
                        className={`${inputClass}${datesInvalid ? " border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                        value={form.purchaseDate}
                        onChange={(e) => setField("purchaseDate", e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Veräusserungsdatum</label>
                    <input
                        id="sale-date"
                        type="date"
                        className={`${inputClass}${datesInvalid ? " border-destructive focus:border-destructive focus:ring-destructive/20" : ""}`}
                        value={form.saleDate}
                        onChange={(e) => setField("saleDate", e.target.value)}
                    />
                </div>
            </div>

            {/* Date order error */}
            {datesInvalid && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3">
                    <AlertTriangle size={16} className="text-destructive shrink-0" />
                    <p className="text-sm text-destructive">
                        Erwerbsdatum muss vor Veräusserungsdatum liegen.
                    </p>
                </div>
            )}

            {/* Live holding period badge */}
            {holdingMonths > 0 && !datesInvalid && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Clock size={18} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {holdingYears} Jahre und {holdingRemainder} Monate
                        </p>
                        <p className="text-xs text-muted-foreground">Berechnete Besitzdauer</p>
                    </div>
                </div>
            )}

            {/* Contextual warnings */}
            <ContextualWarning
                variant="surcharge"
                message={`Bei einer Besitzdauer unter 2 Jahren wird ein erhöhter Steuerzuschlag fällig. Aktuell: ${holdingMonths} Monate.`}
                show={holdingMonths > 0 && holdingMonths < 24}
            />
            <ContextualWarning
                variant="discount"
                message={`Bei einer Besitzdauer über 25 Jahren profitieren Sie von einem erheblichen Steuerabzug.`}
                show={holdingMonths > 25 * 12}
            />
        </div>
    );
}
