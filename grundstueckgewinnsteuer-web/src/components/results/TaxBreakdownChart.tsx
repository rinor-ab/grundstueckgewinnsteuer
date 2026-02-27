"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TaxResult } from "@/lib/tax/types";

interface TaxBreakdownChartProps {
    result: TaxResult;
}

const COLORS = ["#1C2333", "#8B6F47", "#5B7B6A", "#C07056"];

function formatCHF(v: number): string {
    return new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(v);
}

export function TaxBreakdownChart({ result }: TaxBreakdownChartProps) {
    const data: { name: string; value: number; color: string }[] = [];

    const cantonShare = parseFloat(result.cantonShare);
    const communeShare = parseFloat(result.communeShare);
    const churchTax = parseFloat(result.churchTaxTotal);
    const total = parseFloat(result.totalTax);

    // If all shares are 0, the engine reports only simpleTax = totalTax
    if (cantonShare > 0) {
        data.push({ name: "Kantonssteuer", value: cantonShare, color: COLORS[0] });
    }
    if (communeShare > 0) {
        data.push({ name: "Gemeindesteuer", value: communeShare, color: COLORS[1] });
    }
    if (churchTax > 0) {
        data.push({ name: "Kirchensteuer", value: churchTax, color: COLORS[3] });
    }
    // If no breakdown available, show as single slice
    if (data.length === 0 && total > 0) {
        data.push({ name: "Grundstückgewinnsteuer", value: total, color: COLORS[0] });
    }

    if (total <= 0) return null;

    return (
        <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Steuerverteilung
            </h3>
            <div className="relative mx-auto" style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={800}
                            strokeWidth={0}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value) => formatCHF(Number(value ?? 0))}
                            contentStyle={{
                                backgroundColor: "var(--brand-navy)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                fontSize: "12px",
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-lg font-bold text-foreground tabular-nums">
                        {formatCHF(total)}
                    </span>
                </div>
            </div>
            {/* Legend */}
            <div className="mt-3 flex flex-wrap justify-center gap-3">
                {data.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                        <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
