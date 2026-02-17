# Luzern (LU) – Official Sources

## Tariff & Calculation
- **Cantonal information page**: https://www.lu.ch/verwaltung/FD/Dienststellen/steuern/grundstueckgewinnsteuer
- **Kantonsblatt ESTV**: https://www.estv2.admin.ch/stp/kb/lu-de.pdf
- **StG LU § 195ff**: Legal basis

## Key Parameters
- Uses income tax tariff for single persons (Alleinstehende) to compute simple tax
- Uniform canton-wide rate: 4.2 Steuereinheiten
- Minimum taxable gain: CHF 13,000 (highest in Switzerland, tax-free below)
- Surcharges: <1yr +50%, 1-2yr +40%, 2-3yr +30%, 3-4yr +20%, 4-5yr +10%
- Discounts: from 9th year, 1%/year, max 25% at 33+ years

## Tax Model
- Uniform canton rate (no per-commune Steuerfuss for GGSt)
- Total tax = simple_tax × 4.2

## TODO
- Verify exact income tariff bracket limits against official Einkommenstarif Alleinstehende
- Load official commune list from BFS dataset
