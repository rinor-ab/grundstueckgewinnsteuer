import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Grundstückgewinnsteuer Rechner",
    description:
        "Berechnung der Grundstückgewinnsteuer für alle 26 Schweizer Kantone und Gemeinden. Kostenlos, schnell und präzis.",
    keywords: [
        "Grundstückgewinnsteuer",
        "Rechner",
        "Schweiz",
        "Immobiliensteuer",
        "Kanton",
        "Gemeinde",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de">
            <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white antialiased">
                <div className="flex min-h-screen flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-xl no-print">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-lg text-primary-foreground">
                                    🏠
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold tracking-tight text-foreground">
                                        Grundstückgewinnsteuer
                                    </h1>
                                    <p className="text-xs text-muted-foreground">Schweizer Steuerrechner</p>
                                </div>
                            </div>
                            <nav className="hidden items-center gap-6 sm:flex">
                                <a
                                    href="/"
                                    className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                                >
                                    Rechner
                                </a>
                                <a
                                    href="/sources"
                                    className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                                >
                                    Quellen
                                </a>
                                <a
                                    href="/about"
                                    className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                                >
                                    Über
                                </a>
                            </nav>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex-1">{children}</main>

                    {/* Footer */}
                    <footer className="border-t border-border/40 bg-slate-50 no-print">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    © 2026 Grundstückgewinnsteuer Rechner • Engine v1.0.0
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ⚠️ Keine Rechtsberatung. Massgebend sind die kantonalen Steuergesetze.
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
