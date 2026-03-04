import streamlit as st

from config import *
from data_loader import cargar_datos
from graficas.sector import grafica_sector

st.set_page_config(layout="wide")

df = cargar_datos()

# ==============================
# CONTROLES
# ==============================

st.title("ESTADÍSTICAS NACIONALES")

nivel = st.selectbox(
    "Nivel de postulación",
    orden_nivel
)

clasificacion = st.radio(
    "Tipo de clasificación",
    ["Tradicional", "OCDE"],
    horizontal=True
)

region = "Nacional"  # luego podrás convertir esto en multipágina

# ==============================
# GRÁFICA
# ==============================

fig = grafica_sector(
    df,
    clasificacion,
    nivel,
    region,
    orden_sectores,
    orden_sectores_ocde,
    colores_sectores,
    colores_sectores_ocde
)

if fig is None:
    st.warning("No hay datos disponibles.")
else:
    st.plotly_chart(fig, width="stretch")
