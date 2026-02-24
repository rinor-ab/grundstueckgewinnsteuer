export const metadata = {
    title: "Über | Grundstückgewinnsteuer Rechner",
    description: "Informationen und Haftungsausschluss zum Grundstückgewinnsteuer Rechner.",
};

export default function AboutPage() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Über den Rechner
            </h1>
            <p className="mt-4 text-muted-foreground">
                Dieser Rechner berechnet die Grundstückgewinnsteuer für alle 26 Schweizer Kantone.
                Die Berechnungen basieren auf den aktuellen kantonalen Steuergesetzen und Tarifen.
            </p>

            <div className="mt-10 space-y-8">
                <section>
                    <h2 className="text-xl font-semibold text-foreground">Funktionsweise</h2>
                    <p className="mt-2 text-muted-foreground">
                        Der Rechner verwendet einen datengesteuerten Ansatz: Jeder Kanton hat eine eigene
                        Tarifdatei (JSON) mit Steuersätzen, Stufen, Zuschlägen und Abzügen. Die
                        Berechnungslogik ist in TypeScript geschrieben und läuft vollständig im Browser —
                        keine Daten werden an einen Server gesendet.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground">Unterstützte Steuermodelle</h2>
                    <ul className="mt-2 space-y-1.5 text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            <span>
                                <strong className="text-foreground">Progressiv:</strong> SH, ZH, BE, LU, AG, SG,
                                GR, SO, SZ, GL, AI, VS, JU, NE
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                            <span>
                                <strong className="text-foreground">Degressiv:</strong> NW, TI, VD, GE, FR, UR
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                            <span>
                                <strong className="text-foreground">Pauschalsatz:</strong> TG, AR
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                            <span>
                                <strong className="text-foreground">Steuerfuss:</strong> BS, BL, OW
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-500" />
                            <span>
                                <strong className="text-foreground">Renditesteuer:</strong> ZG
                            </span>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground">Haftungsausschluss</h2>
                    <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm text-amber-800">
                            <strong>⚠️ Keine Rechtsberatung.</strong> Dieser Rechner dient ausschliesslich
                            zu Informationszwecken. Die Berechnungen haben keine rechtliche Bindung.
                            Massgebend sind die jeweiligen kantonalen Steuergesetze. Für eine verbindliche
                            Auskunft wenden Sie sich bitte an die zuständige kantonale Steuerverwaltung
                            oder eine qualifizierte Steuerberatung.
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-foreground">Technologie</h2>
                    <p className="mt-2 text-muted-foreground">
                        Gebaut mit Next.js 14, TypeScript, Tailwind CSS und decimal.js für exakte
                        Arithmetik. Alle Berechnungen laufen client-seitig im Browser.
                    </p>
                </section>
            </div>
        </div>
    );
}
