/**
 * Generate skeleton source audit files for all cantons.
 *
 * Run: node scripts/generate-canton-audits.mjs
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcesDir = join(__dirname, "..", "sources");
const cantonsDir = join(__dirname, "..", "src", "data", "cantons");

const cantons = {
    ZH: { name: "Zürich", engine: "progressive", stg: "StG ZH §§ 216–235" },
    BE: { name: "Bern", engine: "progressive", stg: "StG BE Art. 126–142" },
    LU: { name: "Luzern", engine: "progressive", stg: "StG LU §§ 51–57" },
    UR: { name: "Uri", engine: "degressive", stg: "StG UR Art. 90–104" },
    SZ: { name: "Schwyz", engine: "progressive", stg: "StG SZ §§ 105–116" },
    OW: { name: "Obwalden", engine: "steuerfuss", stg: "StG OW Art. 57–68" },
    NW: { name: "Nidwalden", engine: "degressive", stg: "StG NW Art. 50–59" },
    GL: { name: "Glarus", engine: "progressive", stg: "StG GL Art. 63–74" },
    ZG: { name: "Zug", engine: "yield-rate", stg: "StG ZG §§ 42–48" },
    FR: { name: "Freiburg", engine: "degressive", stg: "DStG FR Art. 74–86" },
    SO: { name: "Solothurn", engine: "progressive", stg: "StG SO §§ 58–68" },
    BS: { name: "Basel-Stadt", engine: "steuerfuss", stg: "StG BS §§ 105–118" },
    BL: { name: "Basel-Landschaft", engine: "steuerfuss", stg: "StG BL §§ 62–78" },
    AR: { name: "Appenzell Ausserrhoden", engine: "flat-rate", stg: "StG AR Art. 78–87" },
    AI: { name: "Appenzell Innerrhoden", engine: "progressive", stg: "StG AI Art. 61–72" },
    SG: { name: "St. Gallen", engine: "progressive", stg: "StG SG Art. 127–143" },
    GR: { name: "Graubünden", engine: "progressive", stg: "StG GR Art. 53–66" },
    AG: { name: "Aargau", engine: "progressive", stg: "StG AG §§ 101–112" },
    TG: { name: "Thurgau", engine: "flat-rate", stg: "StG TG §§ 129–138" },
    TI: { name: "Tessin", engine: "degressive", stg: "LT TI Art. 123–135" },
    VD: { name: "Waadt", engine: "degressive", stg: "LI VD Art. 61–73" },
    VS: { name: "Wallis", engine: "progressive", stg: "StG VS Art. 48–55" },
    NE: { name: "Neuenburg", engine: "progressive", stg: "LICo NE Art. 94–108" },
    GE: { name: "Genf", engine: "degressive", stg: "LIPP GE Art. 80–90" },
    JU: { name: "Jura", engine: "progressive", stg: "LICo JU Art. 85–96" },
};

const metaData = JSON.parse(readFileSync(join(__dirname, "..", "src", "data", "meta.json"), "utf-8"));

if (!existsSync(sourcesDir)) {
    mkdirSync(sourcesDir, { recursive: true });
}

for (const [code, info] of Object.entries(cantons)) {
    const filePath = join(sourcesDir, `${code}.md`);

    // Skip if file already exists
    if (existsSync(filePath)) {
        console.log(`⏩ ${code} – file already exists, skipping`);
        continue;
    }

    const source = metaData.cantons?.[code]?.source ?? "TODO";
    const hasSteuerfuss = metaData.cantons?.[code]?.hasSteuerfuss ?? false;

    const content = `# Canton Audit: ${code} – ${info.name}

> **Status**: ⬜ UNVERIFIED – DO NOT DEPLOY  
> **Auditor**: _______________  
> **Audit date**: YYYY-MM-DD  
> **Tax year validated**: ____  
> **Data timestamp**: \`dataVersion\` 2026-02-24

---

## 1. Legal Basis

| Item | Reference | Verified |
|------|-----------|----------|
| Cantonal tax law | ${info.stg} | ☐ |
| GGSt-specific ordinance | | ☐ |
| Federal ESTV Kantonsblatt | [PDF](${source}) | ☐ |

**Notes**: _Exact § numbers are preliminary estimates and must be verified against current law._ 

---

## 2. Tariff Source

| Item | Value | Source | Verified |
|------|-------|--------|----------|
| Tax model | ${info.engine} | canton-meta.ts | ☐ |
| Bracket table / rate schedule | See \`data/cantons/${code.toLowerCase()}.json\` | | ☐ |
| Top rate | ___% | | ☐ |
| Minimum taxable gain | CHF ___ | | ☐ |
| Minimum tax | CHF ___ | | ☐ |
| Freibetrag | CHF ___ | | ☐ |

**Official tariff source (PDF/webpage)**: ______________________  
**Official calculator URL**: ______________________  

---

## 3. Holding Period Adjustments

### 3a. Surcharges
_To be verified against official source._

### 3b. Discounts
_To be verified against official source._

---

## 4. Commune Multipliers (Steuerfüsse)

| Item | Status |
|------|--------|
| Uses Steuerfuss model? | ${hasSteuerfuss ? "☑ Yes" : "☐ To verify"} |
| Data file present? | ${hasSteuerfuss ? "☐ To check" : "N/A"} |

---

## 5. Church Tax

_To be researched._

---

## 6. Rounding Rules

| Step | Rule | Confirmed |
|------|------|-----------|
| Simple tax rounding | \`to_fixed_2\` (from JSON) | ☐ |
| Share rounding | \`to_fixed_2\` (from JSON) | ☐ |

---

## 7. Special Rules

_To be researched._

---

## 8. Cross-Validation Results

_No official cross-validation performed._

---

## 9. Sign-Off

> **Final status**: ⬜ UNVERIFIED – DO NOT DEPLOY  
> **Signed by**: _______________  
> **Date**: YYYY-MM-DD
`;

    writeFileSync(filePath, content, "utf-8");
    console.log(`✅ ${code} – ${info.name}`);
}

console.log("\nDone! Generated skeleton audit files.");
