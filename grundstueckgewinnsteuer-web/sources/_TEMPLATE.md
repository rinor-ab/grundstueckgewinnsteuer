# Canton Audit: `__` – _______________

> **Status**: ⬜ UNVERIFIED – DO NOT DEPLOY  
> **Auditor**: _______________  
> **Audit date**: YYYY-MM-DD  
> **Tax year validated**: ____  
> **Data timestamp**: `dataVersion` in canton JSON

---

## 1. Legal Basis

| Item | Reference | Verified |
|------|-----------|----------|
| Cantonal tax law (StG / LI) | §__ StG __ | ☐ |
| GGSt-specific ordinance | | ☐ |
| Federal ESTV Kantonsblatt | [PDF](https://www.estv2.admin.ch/stp/kb/__-de.pdf) | ☐ |

**Notes**: _________________________________________________

---

## 2. Tariff Source

| Item | Value | Source | Verified |
|------|-------|--------|----------|
| Tax model | progressive / degressive / flat-rate / steuerfuss / yield-rate | | ☐ |
| Bracket table | See `data/cantons/__.json` | | ☐ |
| Top rate | __% | §__ StG | ☐ |
| Minimum taxable gain | CHF __ | §__ StG | ☐ |
| Minimum tax | CHF __ | §__ StG | ☐ |
| Freibetrag | CHF __ | | ☐ |

**Official tariff source (PDF/webpage)**: ______________________  
**Official calculator URL**: ______________________  

---

## 3. Holding Period Adjustments

### 3a. Surcharges (Zuschlag für kurze Besitzdauer)

| Max months | Rate | Source | Verified |
|------------|------|--------|----------|
| | | | ☐ |

**Legal basis**: §__ StG  
**Threshold**: __ months  
**Surcharge applies to**: ☐ simple tax / ☐ taxable gain  

### 3b. Discounts (Ermässigung für lange Besitzdauer)

| Min years | Rate | Source | Verified |
|-----------|------|--------|----------|
| | | | ☐ |

**Legal basis**: §__ StG  
**Discount mode**: ☐ tax reduction / ☐ gain reduction  
**Maximum discount**: ___%  

---

## 4. Commune Multipliers (Steuerfüsse)

| Item | Status |
|------|--------|
| Uses Steuerfuss model? | ☐ Yes / ☐ No / ☐ Communal-uniform |
| Canton Steuerfuss | __% |
| Source for commune multipliers | |
| BFS-keyed data available? | ☐ Yes / ☐ No |
| Data file | `data/communes/__/*.json` |
| Number of communes covered | __ / __ total |
| Year of Steuerfuss data | ____ |

**Official commune multiplier source**: ______________________

---

## 5. Church Tax

| Item | Status |
|------|--------|
| Church tax part of GGSt? | ☐ Yes / ☐ No |
| Confessions applicable | |
| Rate source | |
| Rate per confession per commune available? | ☐ Yes / ☐ No |

---

## 6. Rounding Rules

| Step | Rule | Confirmed |
|------|------|-----------|
| Taxable gain rounding | ☐ none / ☐ CHF 100 / ☐ CHF 1 / ☐ other: ___ | ☐ |
| Simple tax rounding | ☐ `to_fixed_2` / ☐ `round_up_to_005` / ☐ CHF 1 / ☐ other | ☐ |
| Share rounding | ☐ `to_fixed_2` / ☐ `round_up_to_005` / ☐ CHF 1 / ☐ other | ☐ |
| Bracket-level rounding | ☐ per bracket / ☐ after total / ☐ none | ☐ |

**Legal/official source for rounding**: ______________________

---

## 7. Special Rules

| Rule | Applicable? | Details |
|------|-------------|---------|
| Different rates for legal persons | ☐ Yes / ☐ No | |
| Inheritance / gift special treatment | ☐ Yes / ☐ No | |
| Agricultural land exemption | ☐ Yes / ☐ No | |
| Replacement property deferral | ☐ Yes / ☐ No | |
| Tax-free threshold (Freibetrag) | ☐ Yes / ☐ No | |
| Mid-year law changes | ☐ Yes / ☐ No | |

---

## 8. Cross-Validation Results

| Test case | Our result | Official calc | Match? | Notes |
|-----------|-----------|---------------|--------|-------|
| | | | ☐ | |
| | | | ☐ | |
| | | | ☐ | |

**Official calculator used**: ______________________  
**Date of cross-validation**: YYYY-MM-DD  

---

## 9. Data Files Audit

| File | Exists | Content verified |
|------|--------|-----------------|
| `data/cantons/__.json` | ☐ | ☐ |
| `data/communes/__/*.json` | ☐ / N/A | ☐ / N/A |
| Engine in `canton-meta.ts` | ☐ | ☐ |
| Parity fixture in `parity.json` | ☐ | ☐ |

---

## 10. Sign-Off

| Check | Done |
|-------|------|
| All tariff brackets match official source | ☐ |
| Surcharges/discounts match official source | ☐ |
| Rounding rules confirmed | ☐ |
| Cross-validated with ≥3 test cases | ☐ |
| Commune multiplier data is current year | ☐ / N/A |
| Church tax rates confirmed | ☐ / N/A |
| Special rules documented | ☐ |
| `dataVersion` field set correctly | ☐ |

> **Final status**: ⬜ UNVERIFIED / ✅ VERIFIED for tax year ____  
> **Signed by**: _______________  
> **Date**: YYYY-MM-DD
