"use client";

import { useState, useMemo, useCallback } from "react";
import { computeTax } from "@/lib/tax/compute";
import { availableCantons, getCommunes, getAvailableYears, getConfessions } from "@/lib/tax/registry";
import { CANTON_META } from "@/lib/tax/canton-meta";
import type { TaxInputs, TaxResult } from "@/lib/tax/types";
import {
    Calculator,
    MapPin,
    Calendar,
    DollarSign,
    Settings,
    ChevronDown,
    ChevronUp,
    Download,
    Printer,
    AlertCircle,
    Info,
    TrendingUp,
    TrendingDown,
    Building2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCHF(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        minimumFractionDigits: 2,
    }).format(num);
}

function formatPercent(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return `${num.toFixed(2)}%`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
    icon: Icon,
    title,
    step,
}: {
    icon: React.ElementType;
    title: string;
    step: number;
}) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={16} />
            </div>
            <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Schritt {step}
                </p>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
        </div>
    );
}

function InputField({
    label,
    tooltip,
    error,
    children,
}: {
    label: string;
    tooltip?: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {label}
                {tooltip && (
                    <span title={tooltip} className="cursor-help text-muted-foreground">
                        <Info size={14} />
                    </span>
                )}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle size={12} />
                    {error}
                </p>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Calculator
// ---------------------------------------------------------------------------

export default function CalculatorPage() {
    // Form state
    const [canton, setCanton] = useState("SH");
    const [commune, setCommune] = useState("");
    const [taxYear, setTaxYear] = useState(2026);
    const [purchaseDate, setPurchaseDate] = useState("2015-01-01");
    const [saleDate, setSaleDate] = useState("2025-06-15");
    const [purchasePrice, setPurchasePrice] = useState("500000");
    const [salePrice, setSalePrice] = useState("700000");
    const [acquisitionCosts, setAcquisitionCosts] = useState("0");
    const [sellingCosts, setSellingCosts] = useState("0");
    const [investmentAmount, setInvestmentAmount] = useState("0");
    const [confessions, setConfessions] = useState<Record<string, number>>({});

    // Result state
    const [result, setResult] = useState<TaxResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Derived data
    const cantons = useMemo(() => availableCantons(), []);
    const years = useMemo(() => getAvailableYears(canton), [canton]);
    const communes = useMemo(() => getCommunes(canton, taxYear), [canton, taxYear]);
    const cantonConfessions = useMemo(() => getConfessions(canton), [canton]);

    // Auto-select first commune when canton changes
    useMemo(() => {
        if (communes.length > 0 && !communes.includes(commune)) {
            setCommune(communes[0]);
        }
    }, [communes, commune]);

    // Compute
    const handleCompute = useCallback(() => {
        setError(null);
        try {
            const inputs: TaxInputs = {
                canton,
                commune: commune || communes[0] || "",
                taxYear,
                purchaseDate,
                saleDate,
                purchasePrice,
                salePrice,
                acquisitionCosts,
                sellingCosts,
                investments:
                    parseFloat(investmentAmount) > 0
                        ? [{ description: "Wertvermehrende Investitionen", amount: investmentAmount }]
                        : [],
                taxpayerType: "natural",
                confessions,
            };
            const res = computeTax(inputs);
            setResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Berechnung fehlgeschlagen");
            setResult(null);
        }
    }, [
        canton,
        commune,
        communes,
        taxYear,
        purchaseDate,
        saleDate,
        purchasePrice,
        salePrice,
        acquisitionCosts,
        sellingCosts,
        investmentAmount,
        confessions,
    ]);

    // Export JSON
    const handleExportJSON = useCallback(() => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ggst_${canton}_${commune}_${taxYear}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [result, canton, commune, taxYear]);

    const confessionLabels: Record<string, string> = {
        evangR: "Evang. Reformiert",
        roemK: "Röm. Katholisch",
        christK: "Christl. Katholisch",
        Andere: "Andere (0%)",
    };

    const inputClass =
        "w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm text-foreground shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
    const selectClass = `${inputClass} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8`;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Grundstückgewinnsteuer Rechner
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Berechnen Sie die Grundstückgewinnsteuer für alle 26 Schweizer Kantone.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
                {/* ====== Left: Form ====== */}
                <div className="space-y-6">
                    {/* Step 1: Location */}
                    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
                        <SectionHeader icon={MapPin} title="Standort" step={1} />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <InputField label="Kanton" tooltip="Wählen Sie den Kanton des Grundstücks">
                                <select
                                    id="canton-select"
                                    className={selectClass}
                                    value={canton}
                                    onChange={(e) => setCanton(e.target.value)}
                                >
                                    {cantons.map((c) => (
                                        <option key={c} value={c}>
                                            {c} – {CANTON_META[c]?.name ?? c}
                                        </option>
                                    ))}
                                </select>
                            </InputField>
                            <InputField label="Gemeinde" tooltip="Gemeinde des Grundstücks">
                                <select
                                    id="commune-select"
                                    className={selectClass}
                                    value={commune}
                                    onChange={(e) => setCommune(e.target.value)}
                                >
                                    {communes.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </InputField>
                            <InputField label="Steuerjahr">
                                <select
                                    id="year-select"
                                    className={selectClass}
                                    value={taxYear}
                                    onChange={(e) => setTaxYear(Number(e.target.value))}
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </InputField>
                        </div>
                    </div>

                    {/* Step 2: Transaction */}
                    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
                        <SectionHeader icon={Calendar} title="Transaktion" step={2} />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <InputField label="Kaufdatum" tooltip="Datum des Erwerbs">
                                <input
                                    id="purchase-date"
                                    type="date"
                                    className={inputClass}
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                />
                            </InputField>
                            <InputField label="Verkaufsdatum" tooltip="Datum der Veräusserung">
                                <input
                                    id="sale-date"
                                    type="date"
                                    className={inputClass}
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                />
                            </InputField>
                            <InputField label="Kaufpreis (CHF)" tooltip="Kaufpreis inkl. allfälliger Grundstückskosten">
                                <input
                                    id="purchase-price"
                                    type="number"
                                    className={inputClass}
                                    value={purchasePrice}
                                    min={0}
                                    step={1000}
                                    onChange={(e) => setPurchasePrice(e.target.value)}
                                />
                            </InputField>
                            <InputField label="Verkaufspreis (CHF)" tooltip="Verkaufspreis des Grundstücks">
                                <input
                                    id="sale-price"
                                    type="number"
                                    className={inputClass}
                                    value={salePrice}
                                    min={0}
                                    step={1000}
                                    onChange={(e) => setSalePrice(e.target.value)}
                                />
                            </InputField>
                        </div>
                    </div>

                    {/* Step 3: Costs */}
                    <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
                        <SectionHeader icon={DollarSign} title="Kosten & Investitionen" step={3} />
                        <div className="grid gap-4 sm:grid-cols-3">
                            <InputField label="Erwerbsnebenkosten (CHF)" tooltip="Notarkosten, Handänderungssteuer, etc.">
                                <input
                                    id="acquisition-costs"
                                    type="number"
                                    className={inputClass}
                                    value={acquisitionCosts}
                                    min={0}
                                    step={100}
                                    onChange={(e) => setAcquisitionCosts(e.target.value)}
                                />
                            </InputField>
                            <InputField label="Veräusserungskosten (CHF)" tooltip="Maklerkosten, Inserate, etc.">
                                <input
                                    id="selling-costs"
                                    type="number"
                                    className={inputClass}
                                    value={sellingCosts}
                                    min={0}
                                    step={100}
                                    onChange={(e) => setSellingCosts(e.target.value)}
                                />
                            </InputField>
                            <InputField
                                label="Investitionen (CHF)"
                                tooltip="Wertvermehrende Investitionen in das Grundstück"
                            >
                                <input
                                    id="investments"
                                    type="number"
                                    className={inputClass}
                                    value={investmentAmount}
                                    min={0}
                                    step={100}
                                    onChange={(e) => setInvestmentAmount(e.target.value)}
                                />
                            </InputField>
                        </div>
                    </div>

                    {/* Step 4: Settings */}
                    {cantonConfessions.length > 0 && (
                        <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
                            <SectionHeader icon={Settings} title="Kirchensteuer" step={4} />
                            <div className="grid gap-4 sm:grid-cols-2">
                                {cantonConfessions.map((key) => (
                                    <InputField key={key} label={`Personen – ${confessionLabels[key] ?? key}`}>
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={confessions[key] ?? 0}
                                            min={0}
                                            step={1}
                                            onChange={(e) =>
                                                setConfessions((prev) => ({
                                                    ...prev,
                                                    [key]: parseInt(e.target.value) || 0,
                                                }))
                                            }
                                        />
                                    </InputField>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Compute button */}
                    <button
                        id="compute-button"
                        onClick={handleCompute}
                        className="w-full rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Calculator size={18} />
                            Berechnen
                        </span>
                    </button>

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                            <p className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle size={16} />
                                {error}
                            </p>
                        </div>
                    )}
                </div>

                {/* ====== Right: Sticky Summary + Results ====== */}
                <div className="lg:sticky lg:top-24 lg:self-start">
                    {/* Live summary card */}
                    <div className="mb-6 rounded-xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-xl">
                        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
                            <Building2 size={16} />
                            Zusammenfassung
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Kanton</span>
                                <span className="font-medium">{CANTON_META[canton]?.name ?? canton}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Gewinn</span>
                                <span className="font-medium">
                                    {formatCHF(
                                        Math.max(
                                            0,
                                            parseFloat(salePrice || "0") -
                                            parseFloat(purchasePrice || "0") -
                                            parseFloat(acquisitionCosts || "0") -
                                            parseFloat(sellingCosts || "0") -
                                            parseFloat(investmentAmount || "0"),
                                        ),
                                    )}
                                </span>
                            </div>
                            {result && (
                                <>
                                    <div className="my-3 border-t border-slate-700" />
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Einfache Steuer</span>
                                        <span className="font-medium">{formatCHF(result.simpleTax)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-lg font-bold">
                                        <span className="text-slate-300">Total Steuer</span>
                                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                            {formatCHF(result.totalTax)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Steuersatz</span>
                                        <span className="text-slate-300">
                                            {formatPercent(result.effectiveTaxRatePercent)}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Results breakdown */}
                    {result && (
                        <div className="space-y-4">
                            {/* Breakdown card */}
                            <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Aufschlüsselung
                                </h3>
                                <div className="space-y-2.5">
                                    {parseFloat(result.cantonShare) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Kantonssteuer ({result.cantonMultiplierPercent || "—"}%)
                                            </span>
                                            <span className="font-medium">{formatCHF(result.cantonShare)}</span>
                                        </div>
                                    )}
                                    {parseFloat(result.communeShare) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Gemeindesteuer ({result.communeMultiplierPercent || "—"}%)
                                            </span>
                                            <span className="font-medium">{formatCHF(result.communeShare)}</span>
                                        </div>
                                    )}
                                    {parseFloat(result.churchTaxTotal) > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Kirchensteuer</span>
                                            <span className="font-medium">{formatCHF(result.churchTaxTotal)}</span>
                                        </div>
                                    )}
                                    <div className="mt-2 border-t pt-2">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total</span>
                                            <span>{formatCHF(result.totalTax)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Holding period badges */}
                            <div className="flex gap-2">
                                {result.surchargeRate && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                                        <TrendingUp size={12} />
                                        Zuschlag +{(parseFloat(result.surchargeRate) * 100).toFixed(0)}%
                                    </span>
                                )}
                                {result.discountRate && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                                        <TrendingDown size={12} />
                                        Abzug -{(parseFloat(result.discountRate) * 100).toFixed(0)}%
                                    </span>
                                )}
                                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                                    {result.holdingYears}J {result.holdingMonths % 12}M
                                </span>
                            </div>

                            {/* Details expander */}
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-white px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-slate-50"
                            >
                                Berechnungsdetails
                                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            {showDetails && (
                                <div className="rounded-xl border border-border/60 bg-white p-6 shadow-sm">
                                    <div className="space-y-4 text-sm">
                                        <div>
                                            <h4 className="font-semibold">Besitzdauer</h4>
                                            <p className="text-muted-foreground">
                                                {result.holdingMonths} Monate ({result.holdingYears} Jahre)
                                            </p>
                                        </div>

                                        {result.bracketsApplied.length > 0 && (
                                            <div>
                                                <h4 className="mb-2 font-semibold">Progressive Stufen</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b text-left text-muted-foreground">
                                                                <th className="pb-2 pr-3">Grenze</th>
                                                                <th className="pb-2 pr-3">Satz</th>
                                                                <th className="pb-2 pr-3">Betrag</th>
                                                                <th className="pb-2 pr-3">Steuer</th>
                                                                <th className="pb-2">Kumuliert</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {result.bracketsApplied.map((step, i) => (
                                                                <tr key={i} className="border-b border-border/30">
                                                                    <td className="py-1.5 pr-3 tabular-nums">
                                                                        {formatCHF(step.bracketLimit)}
                                                                    </td>
                                                                    <td className="py-1.5 pr-3">
                                                                        {(parseFloat(step.rate) * 100).toFixed(1)}%
                                                                    </td>
                                                                    <td className="py-1.5 pr-3 tabular-nums">
                                                                        {formatCHF(step.taxableAmount)}
                                                                    </td>
                                                                    <td className="py-1.5 pr-3 tabular-nums">
                                                                        {formatCHF(step.taxInBracket)}
                                                                    </td>
                                                                    <td className="py-1.5 tabular-nums">
                                                                        {formatCHF(step.cumulativeTax)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {Object.keys(result.extra).length > 0 && (
                                            <div>
                                                <h4 className="mb-1 font-semibold">Zusätzliche Details</h4>
                                                {Object.entries(result.extra).map(([k, v]) => (
                                                    <div key={k} className="flex justify-between text-muted-foreground">
                                                        <span>{k.replace(/_/g, " ")}</span>
                                                        <span className="tabular-nums">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Export controls */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleExportJSON}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    <Download size={14} />
                                    JSON Export
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border/60 bg-white px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-slate-50"
                                >
                                    <Printer size={14} />
                                    Drucken
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
