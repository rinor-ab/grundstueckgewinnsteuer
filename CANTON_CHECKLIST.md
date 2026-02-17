# Canton Addition Checklist

Use this template when adding a new canton to the calculator.

## Canton: `__` (full name: _______________)

### 1. Research & Sources
- [ ] Find official cantonal tax law reference (StG §§)
- [ ] Find ESTV Kantonsblatt PDF
- [ ] Find cantonal tax authority information page
- [ ] Find official online calculator (if available)
- [ ] Create `grundstueckgewinnsteuer/sources/<code>.md` with all links

### 2. Tariff Data
- [ ] Identify progressive bracket table (limits + rates)
- [ ] Identify top-rate for amounts above last bracket
- [ ] Identify minimum taxable gain (tax-free threshold, if any)
- [ ] Create `grundstueckgewinnsteuer/data/cantons/<code>/tariff.yaml`

### 3. Holding Period Rules
- [ ] Identify surcharge rules (short ownership)
  - Threshold (months or years)
  - Surcharge rates per period
- [ ] Identify discount rules (long ownership)
  - Minimum years for discount
  - Discount rates per year
  - Mode: does discount reduce tax or taxable gain?
- [ ] Add surcharge/discount data to `tariff.yaml`

### 4. Commune Multipliers (Steuerfuss)
- [ ] Determine tax model: communal-uniform, Steuerfuss, or uniform canton rate
- [ ] If Steuerfuss: collect commune multiplier data
  - Prefer BFS-keyed data
  - Include canton Steuerfuss entry
- [ ] If applicable, create `grundstueckgewinnsteuer/data/communes/<code>/steuerfuesse.json`

### 5. Church Tax
- [ ] Determine if church tax is part of GGSt in this canton
- [ ] If yes: identify confessions and rates per commune
- [ ] Add confession keys to `tariff.yaml`

### 6. Engine Implementation
- [ ] Create `grundstueckgewinnsteuer/cantons/<code>.py`
- [ ] Implement `CantonEngine` interface
- [ ] Use shared `evaluate_brackets`, `apply_surcharge`, `apply_discount` where possible
- [ ] Handle canton-specific logic (gain-reduction discount, special surcharges, etc.)
- [ ] Register in `registry.py`

### 7. Validation & Testing
- [ ] Find 3+ validation examples from:
  - Official calculator outputs
  - Published leaflet examples
  - Known reference calculations
- [ ] Create `tests/test_<code>.py` with validation fixtures
- [ ] Run full test suite: `pytest tests/ -v`
- [ ] Run linter: `ruff check .`

### 8. Integration
- [ ] Update canton name mapping in `streamlit_app/app.py`
- [ ] Test in Streamlit UI
- [ ] Update README canton list

---

## Remaining Cantons (not yet implemented)

| Code | Canton | Status |
|------|--------|--------|
| AG | Aargau | ✅ DONE |
| AI | Appenzell Innerrhoden | ✅ DONE |
| AR | Appenzell Ausserrhoden | ✅ DONE |
| BL | Basel-Landschaft | ✅ DONE |
| BS | Basel-Stadt | ✅ DONE |
| FR | Freiburg | ✅ DONE |
| GE | Genf | ✅ DONE |
| GL | Glarus | ✅ DONE |
| GR | Graubünden | ✅ DONE |
| JU | Jura | ✅ DONE |
| NE | Neuenburg | ✅ DONE |
| NW | Nidwalden | ✅ DONE |
| OW | Obwalden | ✅ DONE |
| SG | St. Gallen | ✅ DONE |
| SO | Solothurn | ✅ DONE |
| SZ | Schwyz | ✅ DONE |
| TG | Thurgau | ✅ DONE |
| TI | Tessin | ✅ DONE |
| UR | Uri | ✅ DONE |
| VD | Waadt | ✅ DONE |
| VS | Wallis | ✅ DONE |
| ZG | Zug | ✅ DONE |
