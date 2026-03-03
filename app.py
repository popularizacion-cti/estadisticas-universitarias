import streamlit as st
import pandas as pd
import plotly.express as px

st.set_page_config(layout="wide")

@st.cache_data
def cargar_datos():
    return pd.read_parquet("df_postulantes.parquet")

df = cargar_datos()

st.title("Dashboard Postulantes")

# ---- FILTROS ----
col1, col2, col3 = st.columns(3)

with col1:
    region = st.selectbox("Región entidad", ["Todas"] + sorted(df["Region_entidad"].dropna().unique()))

with col2:
    sector = st.selectbox("Sector", ["Todos"] + sorted(df["Sector_postulacion"].dropna().unique()))

with col3:
    sexo = st.selectbox("Sexo", ["Todos"] + sorted(df["Sexo_postulante"].dropna().unique()))

# ---- FILTRADO ----
df_filtrado = df.copy()

if region != "Todas":
    df_filtrado = df_filtrado[df_filtrado["Region_entidad"] == region]

if sector != "Todos":
    df_filtrado = df_filtrado[df_filtrado["Sector_postulacion"] == sector]

if sexo != "Todos":
    df_filtrado = df_filtrado[df_filtrado["Sexo_postulante"] == sexo]

# ---- GRÁFICA ----
conteo = df_filtrado["Sector_postulacion"].value_counts().reset_index()
conteo.columns = ["Sector", "Cantidad"]

fig = px.bar(conteo, x="Sector", y="Cantidad")

st.plotly_chart(fig, use_container_width=True)
