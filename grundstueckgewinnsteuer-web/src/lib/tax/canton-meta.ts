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
    },
    ZH: {
        code: "ZH",
        name: "Zürich",
        engineType: "progressive",
        communes: ["Zürich", "Winterthur", "Uster", "Dübendorf", "Dietikon", "Wetzikon", "Bülach"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
    },
    BE: {
        code: "BE",
        name: "Bern",
        engineType: "progressive",
        communes: ["Bern", "Biel/Bienne", "Thun", "Köniz", "Burgdorf", "Langenthal"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
    },
    LU: {
        code: "LU",
        name: "Luzern",
        engineType: "progressive",
        communes: ["Luzern", "Emmen", "Kriens", "Horw", "Ebikon", "Sursee"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
    },
    AG: {
        code: "AG",
        name: "Aargau",
        engineType: "progressive",
        communes: ["Aarau", "Baden", "Wettingen", "Brugg", "Lenzburg", "Rheinfelden"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "christK", "Andere"],
    },
    SG: {
        code: "SG",
        name: "St. Gallen",
        engineType: "progressive",
        communes: ["St. Gallen", "Rapperswil-Jona", "Wil", "Gossau", "Rorschach"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "Andere"],
    },
    GR: {
        code: "GR",
        name: "Graubünden",
        engineType: "progressive",
        communes: ["Chur", "Davos", "Ilanz/Glion", "Landquart", "St. Moritz"],
        availableYears: [2024, 2025, 2026],
        confessions: ["evangR", "roemK", "Andere"],
    },
    SO: {
        code: "SO",
        name: "Solothurn",
        engineType: "progressive",
        communes: ["Solothurn", "Olten", "Grenchen", "Zuchwil", "Derendingen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    SZ: {
        code: "SZ",
        name: "Schwyz",
        engineType: "progressive",
        communes: ["Schwyz", "Küssnacht", "Freienbach", "Einsiedeln", "Wollerau"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    GL: {
        code: "GL",
        name: "Glarus",
        engineType: "progressive",
        communes: ["Glarus", "Glarus Nord", "Glarus Süd"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    AI: {
        code: "AI",
        name: "Appenzell Innerrhoden",
        engineType: "progressive",
        communes: ["Appenzell", "Schwende-Rüte", "Oberegg", "Rüte", "Gonten", "Schlatt-Haslen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    VS: {
        code: "VS",
        name: "Wallis",
        engineType: "progressive",
        communes: ["Sion", "Brig-Glis", "Visp", "Sierre", "Martigny", "Monthey"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    JU: {
        code: "JU",
        name: "Jura",
        engineType: "progressive",
        communes: ["Delémont", "Porrentruy", "Saignelégier", "Haute-Sorne", "Val Terbi"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    NE: {
        code: "NE",
        name: "Neuenburg",
        engineType: "progressive",
        communes: ["Neuchâtel", "La Chaux-de-Fonds", "Le Locle", "Val-de-Travers", "Boudry"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },

    // --- Degressive engines ---
    NW: {
        code: "NW",
        name: "Nidwalden",
        engineType: "degressive",
        communes: ["Stans", "Hergiswil", "Buochs", "Stansstad", "Beckenried", "Ennetmoos"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    TI: {
        code: "TI",
        name: "Tessin",
        engineType: "degressive",
        communes: ["Lugano", "Bellinzona", "Locarno", "Mendrisio", "Chiasso"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    VD: {
        code: "VD",
        name: "Waadt",
        engineType: "degressive",
        communes: ["Lausanne", "Yverdon-les-Bains", "Montreux", "Renens", "Nyon"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    GE: {
        code: "GE",
        name: "Genf",
        engineType: "degressive",
        communes: ["Genève", "Carouge", "Lancy", "Vernier", "Meyrin", "Onex"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    FR: {
        code: "FR",
        name: "Freiburg",
        engineType: "degressive",
        communes: ["Freiburg", "Bulle", "Villars-sur-Glâne", "Düdingen", "Murten"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    UR: {
        code: "UR",
        name: "Uri",
        engineType: "degressive",
        communes: ["Altdorf", "Erstfeld", "Schattdorf", "Bürglen", "Flüelen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },

    // --- Flat-rate engines ---
    TG: {
        code: "TG",
        name: "Thurgau",
        engineType: "flat-rate",
        communes: ["Frauenfeld", "Kreuzlingen", "Arbon", "Amriswil", "Weinfelden"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    AR: {
        code: "AR",
        name: "Appenzell Ausserrhoden",
        engineType: "flat-rate",
        communes: ["Herisau", "Teufen", "Speicher", "Heiden", "Urnäsch"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },

    // --- Steuerfuss engines ---
    BS: {
        code: "BS",
        name: "Basel-Stadt",
        engineType: "steuerfuss",
        communes: ["Basel", "Riehen", "Bettingen"],
        availableYears: [2023, 2024, 2025, 2026],
        confessions: [],
    },
    BL: {
        code: "BL",
        name: "Basel-Landschaft",
        engineType: "steuerfuss",
        communes: ["Liestal", "Allschwil", "Reinach", "Muttenz", "Pratteln", "Binningen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
    OW: {
        code: "OW",
        name: "Obwalden",
        engineType: "steuerfuss",
        communes: ["Sarnen", "Kerns", "Sachseln", "Alpnach", "Giswil", "Lungern", "Engelberg"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },

    // --- Yield-rate engine ---
    ZG: {
        code: "ZG",
        name: "Zug",
        engineType: "yield-rate",
        communes: ["Zug", "Baar", "Cham", "Risch", "Steinhausen"],
        availableYears: [2024, 2025, 2026],
        confessions: [],
    },
};
