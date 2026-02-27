"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { TaxResult } from "@/lib/tax/types";

interface BracketChartProps {
    result: TaxResult;
}

const BAR_COLORS = [
    "#D4C4A8", "#C5B493", "#A68B5B", "#8B6F47",
    "#6B5A3E", "#4A4035", "#33302C", "#1C2333",
];

function formatCHF(v: number): string {
    return new Intl.NumberFormat("de-CH", {
        style: "currency",
        currency: "CHF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(v);
}

export function BracketChart({ result }: BracketChartProps) {
    if (!result.bracketsApplied || result.bracketsApplied.length === 0) return null;

    const data = result.bracketsApplied.map((b, i) => ({
        bracket: `${(parseFloat(b.rate) * 100).toFixed(1)}%`,
        taxableAmount: parseFloat(b.taxableAmount),
        taxInBracket: parseFloat(b.taxInBracket),
        rate: (parseFloat(b.rate) * 100).toFixed(1),
        index: i,
    }));

    return (
        <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Progressive Steuerstufen
            </h3>
            <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                        <XAxis
                            dataKey="bracket"
                            tick={{ fontSize: 10, fill: "#6B7280" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#6B7280" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) =>
                                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                            }
                        />
                        <Tooltip
                            formatter={(value, name) => [
                                formatCHF(Number(value ?? 0)),
                                name === "taxableAmount" ? "Betrag" : "Steuer",
                            ]}
                            contentStyle={{
                                backgroundColor: "var(--brand-navy)",
                                border: "none",
                                borderRadius: "8px",
                                color: "#fff",
                                fontSize: "12px",
                            }}
                        />
                        <Bar
                            dataKey="taxableAmount"
                            radius={[4, 4, 0, 0]}
                            animationBegin={300}
                            animationDuration={600}
                        >
                            {data.map((entry) => (
                                <Cell
                                    key={`cell-${entry.index}`}
                                    fill={BAR_COLORS[Math.min(entry.index, BAR_COLORS.length - 1)]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
