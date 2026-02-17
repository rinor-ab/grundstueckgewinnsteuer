"""Grundstückgewinnsteuer Calculator – Streamlit App.

Run with:
    streamlit run streamlit_app/app.py
"""

from __future__ import annotations

import json
from datetime import date
from decimal import Decimal

import streamlit as st

from grundstueckgewinnsteuer.cantons.registry import available_cantons, get_engine
from grundstueckgewinnsteuer.models import TaxInputs

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="Grundstückgewinnsteuer Rechner",
    page_icon="🏠",
    layout="wide",
)

CANTON_NAMES = {
    "SH": "Schaffhausen",
    "ZH": "Zürich",
    "BE": "Bern",
    "LU": "Luzern",
    "AG": "Aargau",
    "SG": "St. Gallen",
    "ZG": "Zug",
    "BS": "Basel-Stadt",
    "BL": "Basel-Landschaft",
    "GR": "Graubünden",
    "SO": "Solothurn",
    "TG": "Thurgau",
    "SZ": "Schwyz",
    "GL": "Glarus",
    "AI": "Appenzell Innerrhoden",
    "AR": "Appenzell Ausserrhoden",
    "NW": "Nidwalden",
    "OW": "Obwalden",
    "UR": "Uri",
    "VS": "Wallis",
    "FR": "Freiburg",
    "GE": "Genf",
    "JU": "Jura",
    "NE": "Neuenburg",
    "TI": "Tessin",
    "VD": "Waadt",
}


# ---------------------------------------------------------------------------
# Custom JSON encoder for Decimal
# ---------------------------------------------------------------------------
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------
st.sidebar.title("🏠 Grundstückgewinnsteuer")
st.sidebar.markdown("Rechner für alle Schweizer Kantone und Gemeinden")
st.sidebar.markdown("---")

cantons = available_cantons()
canton_labels = [f"{c} – {CANTON_NAMES.get(c, c)}" for c in cantons]
selected_label = st.sidebar.selectbox("Kanton", canton_labels, index=0)
selected_canton = selected_label.split(" –")[0]

engine = get_engine(selected_canton)

years = engine.get_available_years()
tax_year = st.sidebar.selectbox("Steuerjahr", sorted(years, reverse=True))

communes = engine.get_communes(tax_year)
commune = st.sidebar.selectbox("Gemeinde", communes)

st.sidebar.markdown("---")
st.sidebar.caption(f"Engine v0.1.0 • Data: {tax_year}")
st.sidebar.markdown(
    "⚠️ **Haftungsausschluss**: Diese Berechnung dient nur als Orientierungshilfe. "
    "Massgebend sind ausschliesslich die kantonalen Steuergesetze und Veranlagungsverfügungen."
)

# ---------------------------------------------------------------------------
# Main form
# ---------------------------------------------------------------------------
st.title("Grundstückgewinnsteuer Rechner")
st.markdown(f"**Kanton {CANTON_NAMES.get(selected_canton, selected_canton)}** – Gemeinde **{commune}** – Steuerjahr **{tax_year}**")

col1, col2 = st.columns(2)

with col1:
    st.subheader("📅 Daten")
    purchase_date = st.date_input("Kaufdatum", value=date(2015, 1, 1))
    sale_date = st.date_input("Verkaufsdatum", value=date.today())

    st.subheader("💰 Preise")
    purchase_price = st.number_input("Kaufpreis (CHF)", min_value=0, value=500000, step=1000)
    sale_price = st.number_input("Verkaufspreis (CHF)", min_value=0, value=700000, step=1000)

with col2:
    st.subheader("📋 Kosten")
    acquisition_costs = st.number_input("Erwerbsnebenkosten (CHF)", min_value=0, value=0, step=100)
    selling_costs = st.number_input("Veräusserungskosten (CHF)", min_value=0, value=0, step=100)
    investments = st.number_input("Wertvermehrende Investitionen (CHF)", min_value=0, value=0, step=100)

    st.subheader("⛪ Kirchensteuer")
    confessions_available = engine.get_confessions()
    confession_counts: dict[str, int] = {}
    if confessions_available:
        confession_labels = {
            "evangR": "Evang. Reformiert",
            "roemK": "Röm. Katholisch",
            "christK": "Christl. Katholisch",
            "Andere": "Andere (0%)",
        }
        for key in confessions_available:
            label = confession_labels.get(key, key)
            count = st.number_input(f"Anzahl Personen – {label}", min_value=0, value=0, step=1, key=f"conf_{key}")
            if count > 0:
                confession_counts[key] = count
    else:
        st.info("Keine Kirchensteuer bei der Grundstückgewinnsteuer in diesem Kanton.")

# ---------------------------------------------------------------------------
# Compute
# ---------------------------------------------------------------------------
if st.button("🧮 Berechnen", type="primary", use_container_width=True):
    try:
        from grundstueckgewinnsteuer.models import Investment as InvModel

        inv_list = []
        if investments > 0:
            inv_list = [InvModel(description="Wertvermehrende Investitionen", amount=Decimal(str(investments)))]

        inputs = TaxInputs(
            canton=selected_canton,
            commune=commune,
            tax_year=tax_year,
            purchase_date=purchase_date,
            sale_date=sale_date,
            purchase_price=Decimal(str(purchase_price)),
            sale_price=Decimal(str(sale_price)),
            acquisition_costs=Decimal(str(acquisition_costs)),
            selling_costs=Decimal(str(selling_costs)),
            investments=inv_list,
            confessions=confession_counts,
        )

        result = engine.compute(inputs)

        # --- Results ---
        st.markdown("---")
        st.header("Ergebnis")

        # Headline metric
        mcol1, mcol2, mcol3 = st.columns(3)
        mcol1.metric("Steuerbarer Gewinn", f"CHF {result.taxable_gain:,.2f}")
        mcol2.metric("Einfache Steuer", f"CHF {result.simple_tax:,.2f}")
        mcol3.metric("💰 Total Steuer", f"CHF {result.total_tax:,.2f}")

        # Breakdown
        st.subheader("Aufschlüsselung")
        breakdown_data = {
            "Position": [],
            "Betrag (CHF)": [],
        }

        if result.canton_share > 0:
            breakdown_data["Position"].append(f"Anteil Kantonssteuer ({result.canton_multiplier_percent}%)")
            breakdown_data["Betrag (CHF)"].append(f"{result.canton_share:,.2f}")

        if result.commune_share > 0:
            breakdown_data["Position"].append(f"Anteil Gemeindesteuer ({result.commune_multiplier_percent}%)")
            breakdown_data["Betrag (CHF)"].append(f"{result.commune_share:,.2f}")

        if result.church_tax_total > 0:
            breakdown_data["Position"].append("Kirchensteuer")
            breakdown_data["Betrag (CHF)"].append(f"{result.church_tax_total:,.2f}")
            for conf, amount in result.church_tax_breakdown.items():
                if amount > 0:
                    breakdown_data["Position"].append(f"  ↳ {confession_labels.get(conf, conf)}")
                    breakdown_data["Betrag (CHF)"].append(f"{amount:,.2f}")

        breakdown_data["Position"].append("**TOTAL**")
        breakdown_data["Betrag (CHF)"].append(f"**{result.total_tax:,.2f}**")

        st.table(breakdown_data)

        # Computation steps
        with st.expander("📊 Berechnungsschritte anzeigen"):
            st.markdown(f"**Besitzdauer**: {result.holding_months} Monate ({result.holding_years} Jahre)")
            st.markdown(f"**Effektiver Steuersatz**: {result.effective_tax_rate_percent:.4f}%")

            if result.surcharge_rate is not None:
                st.warning(f"Besitzdauerzuschlag: +{result.surcharge_rate * 100:.0f}%")
            if result.discount_rate is not None:
                st.success(f"Besitzdauerabzug: -{result.discount_rate * 100:.0f}%")

            st.markdown("**Progressive Stufen:**")
            bracket_data = {
                "Grenze (CHF)": [],
                "Satz": [],
                "Steuerbarer Betrag": [],
                "Steuer Stufe": [],
                "Kumuliert": [],
            }
            for step in result.brackets_applied:
                bracket_data["Grenze (CHF)"].append(f"{step.bracket_limit:,.0f}")
                bracket_data["Satz"].append(f"{step.rate * 100:.1f}%")
                bracket_data["Steuerbarer Betrag"].append(f"{step.taxable_amount:,.2f}")
                bracket_data["Steuer Stufe"].append(f"{step.tax_in_bracket:,.2f}")
                bracket_data["Kumuliert"].append(f"{step.cumulative_tax:,.2f}")
            st.table(bracket_data)

            if result.flat_rate_amount > 0:
                st.markdown(
                    f"**Restbetrag**: CHF {result.flat_rate_amount:,.2f} "
                    f"× flat rate → CHF {result.flat_rate_tax:,.2f}"
                )

            # Sources
            if result.metadata.source_links:
                st.markdown("**Quellen:**")
                for link in result.metadata.source_links:
                    st.markdown(f"- [{link}]({link})")

        # Download JSON
        result_dict = result.model_dump(mode="json")
        json_str = json.dumps(result_dict, indent=2, cls=DecimalEncoder, ensure_ascii=False)
        st.download_button(
            label="📥 Ergebnis als JSON herunterladen",
            data=json_str,
            file_name=f"ggst_{selected_canton}_{commune}_{tax_year}.json",
            mime="application/json",
        )

    except Exception as e:
        st.error(f"Fehler bei der Berechnung: {e}")
