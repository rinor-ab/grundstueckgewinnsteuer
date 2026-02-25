"use client";

import { MapPin, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { availableCantons } from "@/lib/tax/registry";
import { CANTON_META } from "@/lib/tax/canton-meta";
import { CantonCrest } from "@/components/crests/CantonCrest";
import { CantonMap } from "@/components/map/CantonMap";
import type { FormState } from "@/hooks/use-wizard";

interface LocationStepProps {
    form: FormState;
    communes: string[];
    years: number[];
    setField: (field: keyof FormState, value: unknown) => void;
}

const cantons = availableCantons();

export function LocationStep({ form, communes, years, setField }: LocationStepProps) {
    const inputClass =
        "w-full rounded-xl border border-input bg-white px-4 py-3 text-sm text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/40";

    const meta = CANTON_META[form.canton];

    return (
        <div className="space-y-6">
            {/* Question */}
            <div>
                <div className="mb-1 flex items-center gap-2 text-primary">
                    <MapPin size={18} />
                    <span className="text-xs font-semibold uppercase tracking-widest">Schritt 1</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Wo befindet sich Ihre Liegenschaft?
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    Der Steuersatz hängt vom Kanton und der Gemeinde ab.
                </p>
            </div>

            {/* Canton select */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Kanton</label>
                <select
                    id="canton-select"
                    className={inputClass + " cursor-pointer"}
                    value={form.canton}
                    onChange={(e) => setField("canton", e.target.value)}
                >
                    {cantons.map((c) => (
                        <option key={c} value={c}>
                            {c} – {CANTON_META[c]?.name ?? c}
                        </option>
                    ))}
                </select>

                {/* Canton badge with crest */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={form.canton}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{
                            backgroundColor: meta?.accentColor
                                ? `${meta.accentColor}10`
                                : "hsl(var(--primary) / 0.05)",
                            borderLeft: `3px solid ${meta?.accentColor ?? "hsl(var(--primary))"}`,
                        }}
                    >
                        <CantonCrest code={form.canton} size={36} />
                        <div>
                            <p className="text-sm font-semibold text-foreground">{meta?.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {meta?.modelLabel ?? meta?.engineType}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Facts row */}
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        <Info size={11} />
                        Modell: {meta?.modelLabel ?? meta?.engineType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        Datenstand: {meta?.availableYears[meta.availableYears.length - 1] ?? "—"}
                    </span>
                </div>
            </div>

            {/* Interactive map */}
            <div className="rounded-xl border border-border/60 bg-slate-50/50 p-3">
                <CantonMap
                    selectedCanton={form.canton}
                    onSelect={(code) => {
                        if (cantons.includes(code)) setField("canton", code);
                    }}
                />
            </div>

            {/* Commune + Year row */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Gemeinde</label>
                    <select
                        id="commune-select"
                        className={inputClass + " cursor-pointer"}
                        value={form.commune}
                        onChange={(e) => setField("commune", e.target.value)}
                    >
                        {communes.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Steuerjahr</label>
                    <select
                        id="year-select"
                        className={inputClass + " cursor-pointer"}
                        value={form.taxYear}
                        onChange={(e) => setField("taxYear", Number(e.target.value))}
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}
