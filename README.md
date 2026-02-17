# Grundstückgewinnsteuer Calculator (CH)

A production-grade **Grundstückgewinnsteuer** (real-estate capital gains tax) calculator for all Swiss cantons and communes, built in Python with a Streamlit UI.

## Features

- ✅ **Schaffhausen (SH)** – exact port of the [JS reference calculator](https://github.com/rinor-ab/steuerrechnerSHCH) with parity tests
- ✅ **Zürich (ZH)** – communal-uniform tariff model
- ✅ **Bern (BE)** – Steuerfuss model with gain-reduction discount
- ✅ **Luzern (LU)** – income-tariff based with 4.2 Steuereinheiten
- ✅ **Aargau (AG)** – degressive flat rate by holding period
- ✅ **St. Gallen (SG)** – progressive brackets with Steuerfuss
- ✅ **Zug (ZG)** – yield-based rate model
- ✅ **Basel-Stadt (BS)** – dual-schedule holding-period rate
- ✅ **Basel-Landschaft (BL)** – formula-based progressive rate
- ✅ **Graubünden (GR)** – progressive brackets with 21 bands
- ✅ **Solothurn (SO)** – income-tariff based, no surcharges
- ✅ **Thurgau (TG)** – proportional 40% rate with adjustments
- ✅ **Schwyz (SZ)** – progressive brackets 8–30%
- ✅ **Glarus (GL)** – progressive brackets with generous discounts
- ✅ **Appenzell Innerrhoden (AI)** – progressive brackets 10–40%
- ✅ **Appenzell Ausserrhoden (AR)** – flat 30% with gain rounding
- ✅ **Nidwalden (NW)** – degressive rate by holding period
- ✅ **Obwalden (OW)** – proportional 2% × Steuerfuss
- ✅ **Uri (UR)** – degressive rate with Freibetrag
- ✅ **Wallis (VS)** – 3-tier progressive 12/18/24%
- ✅ **Freiburg (FR)** – degressive rate with commune surcharge
- ✅ **Genf (GE)** – degressive rate 50%→2%
- ✅ **Jura (JU)** – progressive brackets 3.5–6%
- ✅ **Neuenburg (NE)** – progressive with inverted top rate
- ✅ **Tessin (TI)** – degressive rate 31%→4%
- ✅ **Waadt (VD)** – degressive rate 30%→7%
- 🔧 Data-driven plugin framework for adding more cantons
- 📊 Interactive Streamlit UI with detailed computation breakdown
- 📥 JSON export of full computation results

## Quick Start

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-user>/grundstueckgewinnsteuer-ch.git
cd grundstueckgewinnsteuer-ch

# Install with dev dependencies
pip install -e ".[dev]"
```

### Run Tests

```bash
pytest tests/ -v
```

### Lint

```bash
ruff check .
```

### Run Streamlit App

```bash
streamlit run streamlit_app/app.py
```

The app will open at `http://localhost:8501`.

## Deploy to Streamlit Cloud

1. Push the repo to GitHub
2. Go to [share.streamlit.io](https://share.streamlit.io)
3. Connect your GitHub repo
4. Set the main file path to `streamlit_app/app.py`
5. Deploy

## Project Structure

```
grundstueckgewinnsteuer/
├── models.py              # Pydantic domain models (TaxInputs, TaxResult)
├── engine/
│   ├── base.py            # Abstract CantonEngine interface
│   ├── tariff.py          # Generic bracket evaluator + helpers
│   └── rounding.py        # to_fixed_2, round_up_to_005
├── cantons/
│   ├── registry.py        # Canton engine registry
│   ├── sh.py              # Schaffhausen (JS-parity port)
│   ├── zh.py              # Zürich
│   ├── be.py              # Bern
│   ├── lu.py              # Luzern
│   ├── ag.py              # Aargau
│   ├── sg.py              # St. Gallen
│   ├── zg.py              # Zug
│   ├── bs.py              # Basel-Stadt
│   ├── bl.py              # Basel-Landschaft
│   ├── gr.py              # Graubünden
│   ├── so.py              # Solothurn
│   ├── tg.py              # Thurgau
│   ├── sz.py              # Schwyz
│   ├── gl.py              # Glarus
│   ├── ai.py              # Appenzell Innerrhoden
│   ├── ar.py              # Appenzell Ausserrhoden
│   ├── nw.py              # Nidwalden
│   ├── ow.py              # Obwalden
│   ├── ur.py              # Uri
│   ├── vs.py              # Wallis
│   ├── fr.py              # Freiburg
│   ├── ge.py              # Genf
│   ├── ju.py              # Jura
│   ├── ne.py              # Neuenburg
│   ├── ti.py              # Tessin
│   └── vd.py              # Waadt
├── data/
│   ├── cantons/<code>/    # Tariff YAML per canton
│   └── communes/<code>/   # Steuerfuss JSON per canton
├── sources/               # Official source docs per canton
streamlit_app/
│   └── app.py             # Streamlit UI
tests/                     # pytest suite
```

## Adding a New Canton

See [CANTON_CHECKLIST.md](CANTON_CHECKLIST.md) for the step-by-step template.

## Official Sources

Each canton has official sources documented in `grundstueckgewinnsteuer/sources/<canton>.md` with links to tax authority pages, laws, and leaflets.

## Architecture

- **Data-driven**: Tax rules are stored in YAML/JSON, not hardcoded
- **Decimal arithmetic**: All monetary calculations use `Decimal` for deterministic results
- **Plugin pattern**: Each canton implements `CantonEngine` and is auto-registered
- **Parity-tested**: Schaffhausen engine has 16+ golden-master tests against the JS reference

## License

MIT
