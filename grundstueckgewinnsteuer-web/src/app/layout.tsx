import type { Metadata } from "next";
import "./globals.css";
import TransactionPartnerLogo from "@/components/TransactionPartnerLogo";

export const metadata: Metadata = {
    title: "Grundstückgewinnsteuer Rechner | Transaction Partner AG",
    description:
        "Berechnung der Grundstückgewinnsteuer für alle 26 Schweizer Kantone und Gemeinden. Ein Tool von Transaction Partner AG.",
    keywords: [
        "Grundstückgewinnsteuer",
        "Rechner",
        "Schweiz",
        "Immobiliensteuer",
        "Kanton",
        "Gemeinde",
        "Transaction Partner",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de">
            <body className="min-h-screen bg-background antialiased">
                <div className="flex min-h-screen flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-xl no-print">
                        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-4">
                                <a href="https://transactionpartner.ch" target="_blank" rel="noopener noreferrer" className="text-foreground transition-opacity hover:opacity-80">
                                    <TransactionPartnerLogo height={36} />
                                </a>
                                <div className="hidden h-8 w-px bg-border md:block" />
                                <span className="hidden text-sm font-medium text-muted-foreground md:block">
                                    Grundstückgewinnsteuer&shy;rechner
                                </span>
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
                    <footer className="border-t border-border/40 bg-background no-print">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                                <p className="text-xs text-muted-foreground">
                                    © 2026 <a href="https://transactionpartner.ch" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Transaction Partner AG</a> • Grundstückgewinnsteuer Rechner
                                </p>
                                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        🔒 Lokal im Browser — keine Daten gespeichert
                                    </span>
                                    <span>•</span>
                                    ⚠️ Keine Rechtsberatung — massgebend sind die kantonalen Steuergesetze
                                </p>
                            </div>
                        </div>
                    </footer>
                </div>
            </body>
        </html>
    );
}
