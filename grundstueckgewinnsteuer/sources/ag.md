# Aargau (AG) – Official Sources

## Tariff & Calculation
- **Cantonal information page**: https://www.ag.ch/de/verwaltung/dfr/steuern/grundstueckgewinnsteuer
- **Kantonsblatt ESTV**: https://www.estv2.admin.ch/stp/kb/ag-de.pdf
- **StG AG §§ 95–111**: Legal basis for Grundstückgewinnsteuer

## Key Parameters
- Degressive flat rate by holding period (no progressive brackets)
- Year 1: 40%, decreasing 2%/year for first 11 years → year 11: 20%
- Year 12 onward: decreasing 1%/year → year 25: 6%, year 26+: 5%
- **No minimum taxable gain** (no tax-free threshold)
- No surcharge/discount system (baked into the rate table)
- Uniform canton rate (no per-commune Steuerfuss for GGSt)

## Tax Model
- Holding-period-based flat rate: `tax = gain × rate(holding_years)`
- No church tax included in GGSt

## Special
- AG is one of the few cantons with **no progressive bracket tariff at all**
- Rate depends solely on holding period, not on gain amount
