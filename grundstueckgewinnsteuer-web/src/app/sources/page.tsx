import { CANTON_META } from "@/lib/tax/canton-meta";
import meta from "@/data/meta.json";

export const metadata = {
    title: "Datenquellen | Grundstückgewinnsteuer Rechner",
    description: "Übersicht aller verwendeten kantonalen Steuergesetze und Datenquellen.",
};

export default function SourcesPage() {
    const cantonCodes = Object.keys(CANTON_META).sort();

    return (
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Datenquellen</h1>
            <p className="mt-2 text-muted-foreground">
                Engine v{meta.engineVersion} • Daten v{meta.dataVersion} • Stand {meta.lastUpdated}
            </p>

            <div className="mt-8 overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-3">Kanton</th>
                            <th className="px-4 py-3">Engine-Typ</th>
                            <th className="px-4 py-3">Steuerfuss</th>
                            <th className="px-4 py-3">Quelle</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {cantonCodes.map((code) => {
                            const cm = CANTON_META[code];
                            const src = (meta.cantons as Record<string, { source: string; hasSteuerfuss: boolean }>)[code];
                            return (
                                <tr key={code} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-medium">
                                        {code} – {cm.name}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                                            {cm.engineType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {src?.hasSteuerfuss ? (
                                            <span className="text-emerald-600">✓</span>
                                        ) : (
                                            <span className="text-slate-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {src?.source ? (
                                            <a
                                                href={src.source}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                PDF ↗
                                            </a>
                                        ) : (
                                            "—"
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
