import pandas as pd
import plotly.express as px


def grafica_sector(df, clasificacion, nivel, region,
                   orden_sectores,
                   orden_sectores_ocde,
                   colores_sectores,
                   colores_sectores_ocde):

    # ==============================
    # FILTROS
    # ==============================

    df_filtrado = df.copy()

    if region != "Nacional":
        df_filtrado = df_filtrado[df_filtrado["Region_entidad"] == region]

    df_filtrado = df_filtrado[df_filtrado["Nivel_postulacion"] == nivel]

    if df_filtrado.empty:
        return None

    # ==============================
    # SELECCIÓN DE CLASIFICACIÓN
    # ==============================

    if clasificacion == "Tradicional":
        columna_sector = "Sector_postulacion"
        orden = orden_sectores
        colores = colores_sectores
    else:
        columna_sector = "Sectorocde_postulacion"
        orden = orden_sectores_ocde
        colores = colores_sectores_ocde

    # ==============================
    # AGRUPACIONES
    # ==============================

    df_grafica = (
        df_filtrado
        .groupby("Fecha_postulacion")[columna_sector]
        .value_counts(normalize=True)
        .unstack(fill_value=0)
        .mul(100)
        .round(1)
        .reset_index()
    )

    df_counts = (
        df_filtrado
        .groupby("Fecha_postulacion")[columna_sector]
        .value_counts()
        .unstack(fill_value=0)
        .reset_index()
    )

    df_melted = df_grafica.melt(
        id_vars="Fecha_postulacion",
        var_name=columna_sector,
        value_name="Porcentaje"
    )

    df_counts_melted = df_counts.melt(
        id_vars="Fecha_postulacion",
        var_name=columna_sector,
        value_name="Cantidad"
    )

    df_melted = df_melted.merge(
        df_counts_melted,
        on=["Fecha_postulacion", columna_sector],
        how="left"
    )

    df_melted = df_melted.sort_values("Fecha_postulacion")
    df_melted["Fecha_postulacion"] = df_melted["Fecha_postulacion"].astype(str)

    # ==============================
    # FIGURA (DEFAULT TOTAL)
    # ==============================

    titulo = f"Porcentaje de postulantes por sector - {region}"

    fig = px.line(
        df_melted,
        x="Fecha_postulacion",
        y="Porcentaje",
        color=columna_sector,
        markers=True,
        title=titulo,
        color_discrete_map=colores,
        category_orders={
            columna_sector: orden,
            "Fecha_postulacion": sorted(df_melted["Fecha_postulacion"].unique())
        },
        hover_data={"Porcentaje": ":.1f", "Cantidad": True}
    )

    return fig
