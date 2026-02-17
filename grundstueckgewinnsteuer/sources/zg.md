# Zug (ZG) – Official Sources

## Tariff & Calculation
- **Cantonal information page**: https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung/grundstueckgewinnsteuer
- **Kantonsblatt ESTV**: https://www.estv2.admin.ch/stp/kb/zg-de.pdf
- **StG ZG §§ 187ff**: Legal basis for Grundstückgewinnsteuer

## Key Parameters
- Yield-based tax rate: rate = annual yield of the property transaction
- Total yield = gain × 100 / acquisition costs
- Annual yield: ≤5 years: total_yield × 12 / months; >5 years: total_yield / years
- Minimum rate: 10%
- Maximum rate: 60%, reduced by 2.5pp/year from year 12 onward (floor 25%)
- Minimum taxable gain: CHF 5'000

## Tax Model
- Rate = clamped(annual_yield, 10%, max_rate)
- Tax = gain × rate
- Communal tax — levied by communes, no separate canton/commune split

## Special
- ZG is unique in Switzerland: rate is based on **yield** (profitability), not fixed brackets or holding period alone
- Max rate degresses with holding period (anti-speculation), but min rate stays at 10%
