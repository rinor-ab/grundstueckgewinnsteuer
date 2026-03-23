const fs = require('fs');
const path = require('path');

const tariff = {
    brackets: [
        { limit: 2800, rate: 0.0144 },
        { limit: 5600, rate: 0.0240 },
        { limit: 13800, rate: 0.0408 },
        { limit: 27200, rate: 0.0492 },
        { limit: 54000, rate: 0.0641 },
        { limit: 134400, rate: 0.0726 },
        { limit: 335500, rate: 0.0781 }
    ],
    top_rate: 0.0810,
    minimum_taxable_gain: 5300,
    surcharge_threshold_months: 60,
    surcharges_by_months: [
        { max_months: 11, rate: 0.70 },
        { max_months: 23, rate: 0.50 },
        { max_months: 35, rate: 0.35 },
        { max_months: 47, rate: 0.20 },
        { max_months: 59, rate: 0.10 }
    ],
    discount_min_years: 5,
    discount_mode: "gain_reduction",
    discounts_by_years: [],
    sourceLinks: [
        "https://www.be.ch/de/steuern/steuern-kanton-bern/grundstueckgewinnsteuer.html",
        "https://www.taxme.be.ch/calc-web/ggst/ggst.form",
        "https://www.be.ch/de/steuern/steuern-kanton-bern/gesetze-und-merkblaetter/gesetze-und-verordnungen.html"
    ],
    dataVersion: "1.0.0",
    lastUpdated: "2024-03-03"
};

for (let y = 5; y <= 35; y++) {
    tariff.discounts_by_years.push({
        years: y,
        rate: Number((y * 0.02).toFixed(2))
    });
}

const outPath = path.join(__dirname, '..', 'src', 'data', 'cantons', 'be.json');
fs.writeFileSync(outPath, JSON.stringify(tariff, null, 2), 'utf-8');
console.log("Wrote be.json");
