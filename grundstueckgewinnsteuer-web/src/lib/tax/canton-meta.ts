/**
 * Canton metadata: names, communes, years, confessions.
 *
 * Centralizes all canton-specific configuration that was previously
 * spread across individual Python engine __init__ methods.
 */

export interface CantonMeta {
    code: string;
    name: string;
    engineType: "progressive" | "degressive" | "flat-rate" | "steuerfuss" | "yield-rate";
    communes: string[];
    availableYears: number[];
    confessions: string[];
    hasSteuerfussData?: boolean;
    /** Hex accent colour for UI theming (derived from cantonal heraldry) */
    accentColor: string;
    /** Human-readable German label for the calculation model */
    modelLabel: string;
}

export const CANTON_META: Record<string, CantonMeta> = {
    SH: {
        code: "SH",
        name: "Schaffhausen",
        engineType: "progressive",
        communes: [], // loaded from steuerfuesse.json
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
        hasSteuerfussData: true,
        accentColor: "#D4A300",
        modelLabel: "Progressive Steuertabelle",
    },
    ZH: {
        code: "ZH",
        name: "Zürich",
        engineType: "progressive",
        communes: ["Zürich", "Winterthur", "Uster", "Dübendorf", "Dietikon", "Wetzikon", "Bülach"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
        accentColor: "#0057B8",
        modelLabel: "Progressive Steuertabelle",
    },
    BE: {
        code: "BE",
        name: "Bern",
        engineType: "progressive",
        communes: ["Bern", "Biel/Bienne", "Thun", "Köniz", "Burgdorf", "Langenthal"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
        accentColor: "#D52B1E",
        modelLabel: "Progressive Steuertabelle",
    },
    LU: {
        code: "LU",
        name: "Luzern",
        engineType: "progressive",
        communes: ["Luzern", "Emmen", "Kriens", "Horw", "Ebikon", "Sursee"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
        accentColor: "#1E4D8C",
        modelLabel: "Progressive Steuertabelle",
    },
    AG: {
        code: "AG",
        name: "Aargau",
        engineType: "progressive",
        communes: ["Aarau", "Baden", "Wettingen", "Brugg", "Lenzburg", "Rheinfelden"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
        accentColor: "#0057B8",
        modelLabel: "Progressive Steuertabelle",
    },
    SG: {
        code: "SG",
        name: "St. Gallen",
        engineType: "progressive",
        communes: ["St. Gallen", "Rapperswil-Jona", "Wil", "Gossau", "Rorschach"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "Andere"],
        accentColor: "#1B7340",
        modelLabel: "Progressive Steuertabelle",
    },
    GR: {
        code: "GR",
        name: "Graubünden",
        engineType: "progressive",
        communes: ["Chur", "Davos", "Ilanz/Glion", "Landquart", "St. Moritz"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "Andere"],
        accentColor: "#4a4a4a",
        modelLabel: "Progressive Steuertabelle",
    },
    SO: {
        code: "SO",
        name: "Solothurn",
        engineType: "progressive",
        communes: ["Solothurn", "Olten", "Grenchen", "Zuchwil", "Derendingen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#D52B1E",
        modelLabel: "Progressive Steuertabelle",
    },
    SZ: {
        code: "SZ",
        name: "Schwyz",
        engineType: "progressive",
        communes: ["Schwyz", "Küssnacht", "Freienbach", "Einsiedeln", "Wollerau"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#D52B1E",
        modelLabel: "Progressive Steuertabelle",
    },
    GL: {
        code: "GL",
        name: "Glarus",
        engineType: "progressive",
        communes: ["Glarus", "Glarus Nord", "Glarus Süd"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#333333",
        modelLabel: "Progressive Steuertabelle",
    },
    AI: {
        code: "AI",
        name: "Appenzell Innerrhoden",
        engineType: "progressive",
        communes: ["Appenzell", "Schwende-Rüte", "Oberegg", "Rüte", "Gonten", "Schlatt-Haslen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#1a1a1a",
        modelLabel: "Progressive Steuertabelle",
    },
    VS: {
        code: "VS",
        name: "Wallis",
        engineType: "progressive",
        communes: ["Sion", "Brig-Glis", "Visp", "Sierre", "Martigny", "Monthey"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#C41E1E",
        modelLabel: "Progressive Steuertabelle",
    },
    JU: {
        code: "JU",
        name: "Jura",
        engineType: "progressive",
        communes: ["Delémont", "Porrentruy", "Saignelégier", "Haute-Sorne", "Val Terbi"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#C41E1E",
        modelLabel: "Progressive Steuertabelle",
    },
    NE: {
        code: "NE",
        name: "Neuenburg",
        engineType: "progressive",
        communes: ["Neuchâtel", "La Chaux-de-Fonds", "Le Locle", "Val-de-Travers", "Boudry"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#1B7340",
        modelLabel: "Progressive Steuertabelle",
    },

    // --- Degressive engines ---
    NW: {
        code: "NW",
        name: "Nidwalden",
        engineType: "degressive",
        communes: ["Stans", "Hergiswil", "Buochs", "Stansstad", "Beckenried", "Ennetmoos"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#B71C1C",
        modelLabel: "Degressive Haltedauer-Sätze",
    },
    TI: {
        code: "TI",
        name: "Tessin",
        engineType: "degressive",
        communes: ["Lugano", "Bellinzona", "Locarno", "Mendrisio", "Chiasso"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#D52B1E",
        modelLabel: "Degressive Haltedauer-Sätze",
    },
    VD: {
        code: "VD",
        name: "Waadt",
        engineType: "degressive",
        communes: ["Lausanne", "Yverdon-les-Bains", "Montreux", "Renens", "Nyon"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#1B7340",
        modelLabel: "Degressive Haltedauer-Sätze",
    },
    GE: {
        code: "GE",
        name: "Genf",
        engineType: "degressive",
        communes: ["Genève", "Carouge", "Lancy", "Vernier", "Meyrin", "Onex"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#D52B1E",
        modelLabel: "Degressive Haltedauer-Sätze",
    },
    FR: {
        code: "FR",
        name: "Freiburg",
        engineType: "degressive",
        communes: ["Freiburg", "Bulle", "Villars-sur-Glâne", "Düdingen", "Murten"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#1a1a1a",
        modelLabel: "Degressive Haltedauer-Sätze",
    },
    UR: {
        code: "UR",
        name: "Uri",
        engineType: "degressive",
        communes: ["Altdorf", "Erstfeld", "Schattdorf", "Bürglen", "Flüelen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#E8A500",
        modelLabel: "Degressive Haltedauer-Sätze",
    },

    // --- Flat-rate engines ---
    TG: {
        code: "TG",
        name: "Thurgau",
        engineType: "flat-rate",
        communes: ["Frauenfeld", "Kreuzlingen", "Arbon", "Amriswil", "Weinfelden"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#1B7340",
        modelLabel: "Einfache Steuer × Steuerfuss",
    },
    AR: {
        code: "AR",
        name: "Appenzell Ausserrhoden",
        engineType: "flat-rate",
        communes: ["Herisau", "Teufen", "Speicher", "Heiden", "Urnäsch"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#2a2a2a",
        modelLabel: "Pauschalsatz × Steuerfuss",
    },

    // --- Steuerfuss engines ---
    BS: {
        code: "BS",
        name: "Basel-Stadt",
        engineType: "steuerfuss",
        communes: ["Basel", "Riehen", "Bettingen"],
        availableYears: [2023, 2024, 2025, 2026],
        confessions: [],
        accentColor: "#1a1a1a",
        modelLabel: "Einfache Steuer × Steuerfuss",
    },
    BL: {
        code: "BL",
        name: "Basel-Landschaft",
        engineType: "steuerfuss",
        communes: ["Liestal", "Allschwil", "Reinach", "Muttenz", "Pratteln", "Binningen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#C41E1E",
        modelLabel: "Einfache Steuer × Steuerfuss",
    },
    OW: {
        code: "OW",
        name: "Obwalden",
        engineType: "steuerfuss",
        communes: ["Sarnen", "Kerns", "Sachseln", "Alpnach", "Giswil", "Lungern", "Engelberg"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#C62828",
        modelLabel: "Einfache Steuer × Steuerfuss",
    },

    // --- Yield-rate engine ---
    ZG: {
        code: "ZG",
        name: "Zug",
        engineType: "yield-rate",
        communes: ["Zug", "Baar", "Cham", "Risch", "Steinhausen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
        accentColor: "#0057B8",
        modelLabel: "Ertragswertsatz-Modell",
    },
};
