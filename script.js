// =============================================
// DICCIONARIO Y VARIABLES GLOBALES
// =============================================
const mapaIdsRegiones = {
    "PE-AMA": "Amazonas", "PE-ANC": "Áncash", "PE-APU": "Apurímac", "PE-ARE": "Arequipa",
    "PE-AYA": "Ayacucho", "PE-CAJ": "Cajamarca", "PE-CAL": "Callao", "PE-CUS": "Cusco",
    "PE-HUV": "Huancavelica", "PE-HUC": "Huánuco", "PE-ICA": "Ica", "PE-JUN": "Junín",
    "PE-LAL": "La Libertad", "PE-LAM": "Lambayeque", "PE-LIM": "Lima Provincias",
    "PE-LMA": "Lima Metropolitana", "PE-LOR": "Loreto", "PE-MDD": "Madre de Dios",
    "PE-MOQ": "Moquegua", "PE-PAS": "Pasco", "PE-PIU": "Piura", "PE-PUN": "Puno",
    "PE-SAM": "San Martín", "PE-TAC": "Tacna", "PE-TUM": "Tumbes", "PE-UCA": "Ucayali"
};

const ordenSectoresTradicional = ["Ingenierías y Ciencias Aplicadas", "Ciencias de la Salud", "Disciplinas Logísticas", "Ciencias Sociales y Humanidades", "Ciencias Puras", "Artes"];
const ordenSectoresOCDE = ["Ciencias Naturales", "Ingenierías y Tecnología", "Ciencias Médicas y de la Salud", "Ciencias Agrícolas", "Ciencias Sociales", "Humanidades"];

let regionActiva = "Nacional";
let globalData = {};

// =============================================
// INICIO Y EVENTOS
// =============================================

window.onload = function() {
    if (typeof inyectarMapa === 'function') {
        inyectarMapa();
        configurarEventosMapa();
    }
    poblarSelectorRegiones();
    cargarDataRegion("Nacional");
};

function configurarEventosMapa() {
    const mapaSvg = document.getElementById("peru-map");
    const selReg = document.getElementById("select-region");

    if (mapaSvg) {
        mapaSvg.addEventListener("click", (e) => {
            const path = e.target.closest("path");
            if (path && path.id && mapaIdsRegiones[path.id]) {
                const nombre = mapaIdsRegiones[path.id];
                document.querySelectorAll(".region-path").forEach(p => p.classList.remove("region-active"));
                path.classList.add("region-active");
                if (selReg) selReg.value = nombre;
                
                cargarDataRegion(nombre);
            }
        });
    }

    const btnNac = document.getElementById("btn-nacional");
    if (btnNac) {
        btnNac.addEventListener("click", () => {
            document.querySelectorAll(".region-path").forEach(p => p.classList.remove("region-active"));
            if (selReg) selReg.value = "Nacional";
            
            cargarDataRegion("Nacional");
        });
    }

    if (selReg) {
        selReg.addEventListener("change", (e) => {
            const nombre = e.target.value;
            document.querySelectorAll(".region-path").forEach(p => p.classList.remove("region-active"));
            if (nombre !== "Nacional") {
                const idMapa = Object.keys(mapaIdsRegiones).find(key => mapaIdsRegiones[key] === nombre);
                const path = document.getElementById(idMapa);
                if (path) path.classList.add("region-active");
            }
            
            cargarDataRegion(nombre);
        });
    }
}

// =============================================
// LÓGICA DE CARGA DINÁMICA
// =============================================

async function cargarDataRegion(nombreRegion) {
    regionActiva = nombreRegion;
    console.log("Cargando datos de:", nombreRegion);

    const indicador = document.getElementById("titulo_region_actual");
    if (indicador) indicador.textContent = `Seleccionado: ${nombreRegion.replace(/_/g, ' ')}`;

    const archivos = [
        { key: "evolucion_sectores", file: `${nombreRegion}_data_evolucion_sectores.json` },
        { key: "distribucion_sectores_total", file: `${nombreRegion}_data_distribucion_sectores_total.json` },
        { key: "top_carreras", file: `${nombreRegion}_data_top_carreras.json` },
        { key: "evolucion_genero", file: `${nombreRegion}_data_evolucion_genero.json` },
        { key: "evolucion_genero_por_sector", file: `${nombreRegion}_data_evolucion_genero_por_sector.json` },
        { key: "evolucion_edad", file: `${nombreRegion}_data_evolucion_edad.json` },
        { key: "evolucion_edad_por_sector", file: `${nombreRegion}_data_evolucion_edad_por_sector.json` },
        { key: "evolucion_grupo_edad", file: `${nombreRegion}_data_evolucion_grupo_edad.json` },
        { key: "mapa_calor_edad_genero", file: `${nombreRegion}_data_mapa_calor_edad_genero.json` },
        { key: "evolucion_gestion", file: `${nombreRegion}_data_evolucion_gestion.json` },
        { key: "evolucion_gestion_por_sector", file: `${nombreRegion}_data_evolucion_gestion_por_sector.json` },
        { key: "top_universidades_por_sector", file: `${nombreRegion}_data_top_universidades_por_sector.json` },
        { key: "polar_regiones_por_sector", file: `${nombreRegion}_data_polar_regiones_por_sector.json` },
        { key: "evolucion_sectores_postulante", file: `${nombreRegion}_data_evolucion_sectores_postulante.json` },
        { key: "distribucion_sectores_total_postulante", file: `${nombreRegion}_data_distribucion_sectores_total_postulante.json` },
        { key: "migracion_postulante", file: `${nombreRegion}_data_migracion_postulante.json` },
        { key: "migracion_por_sector_postulante", file: `${nombreRegion}_data_migracion_por_sector_postulante.json` },
        { key: "top_destinos_migracion", file: `${nombreRegion}_data_top_destinos_migracion.json` }
    ];

    try {
        const promises = archivos.map(a => fetch(a.file).then(r => r.ok ? r.json() : null));
        const resultados = await Promise.all(promises);
        
        archivos.forEach((a, index) => {
            globalData[a.key] = resultados[index];
        });

        if (nombreRegion === "Nacional") {
            inicializarControles();
        }
        
        actualizarTodasGraf();
    } catch (error) {
        console.error("Error cargando archivos JSON:", error);
    }
}

function inicializarControles() {
    const nivelSelect = document.getElementById("nivel");
    if (nivelSelect.options.length === 0) {
        const niveles = Object.keys(globalData.evolucion_sectores["Tradicional"]);
        niveles.forEach(nivel => {
            const option = document.createElement("option");
            option.value = nivel; option.textContent = nivel;
            nivelSelect.appendChild(option);
        });
        nivelSelect.value = niveles[0];
        nivelSelect.addEventListener("change", actualizarTodasGraf);
        document.querySelectorAll("input[name='clasificacion']").forEach(r => r.addEventListener("change", actualizarTodasGraf));
    }
}

function actualizarTodasGraf() {
    renderizar_evolucion_sectores();
    renderizar_distribucion_sectores_total();
    renderizar_top_carreras();
    renderizar_evolucion_genero();
    renderizar_evolucion_genero_por_sector();
    renderizar_evolucion_edad();
    renderizar_evolucion_edad_por_sector();
    renderizar_evolucion_grupo_edad();
    renderizar_mapa_calor_edad_genero();
    renderizar_evolucion_gestion();
    renderizar_evolucion_gestion_por_sector();
    renderizar_tabla_universidades_por_sector();
    renderizar_polar_regiones_por_sector();
    renderizar_evolucion_sectores_postulante();
    renderizar_distribucion_sectores_total_postulante();
    renderizar_migracion_postulante();
    renderizar_migracion_por_sector_postulante();
    renderizar_top_destinos_migracion();
}

function poblarSelectorRegiones() {
    const select = document.getElementById("select-region");
    if (!select) return;
    const nombresRegiones = Object.values(mapaIdsRegiones).sort();
    nombresRegiones.forEach(nombre => {
        const option = document.createElement("option");
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

// ==============================
// renderizar_evolucion_sectores
// ==============================

function renderizar_evolucion_sectores() {
    const dataSectores = globalData.evolucion_sectores;
    if (!dataSectores) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    let datos = dataSectores[clasificacion]?.[nivel];
    if (!datos) return;

    if (regionActiva === "Nacional") {
        datos = datos["Nacional"];
    } else {
        datos = datos[regionActiva] || datos;
    }

    if (!datos || !Array.isArray(datos) || datos.length === 0) return;

    const ordenSectores = (clasificacion === "Tradicional")
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const sectoresUnicos = [...new Set(datos.map(d => d.Sector))];
    const sectores = ordenSectores.filter(s => sectoresUnicos.includes(s));

    const traces = sectores.map(sector => {
        const datosSector = datos.filter(d => d.Sector === sector);
        return {
            x: datosSector.map(d => d.Fecha_postulacion),
            y: datosSector.map(d => d.Porcentaje),
            mode: "lines+markers",
            name: sector,
            customdata: datosSector.map(d => d.Cantidad),
            hovertemplate:
                `<b>Sector: ${sector}</b><br>` +
                "Año: %{x}<br>" +
                "Porcentaje: %{y:.1f}%<br>" +
                "Cantidad: %{customdata}<extra></extra>"
        };
    });

    const layout = {
        xaxis: {
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            mirror: false
        },
        yaxis: {
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2
        },
        legend: {
            title: { text: "Sector" },
            traceorder: "normal",
            font: { color: "#c9d1d9" }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 60, r: 40, t: 40, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_evolucion_sectores", traces, layout);
}

// ==============================
// renderizar_distribucion_sectores_total
// ==============================

function renderizar_distribucion_sectores_total() {
    const dataDistribucion = globalData.distribucion_sectores_total;
    if (!dataDistribucion) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    const datos = dataDistribucion[clasificacion]?.[nivel];
    if (!datos || datos.length === 0) return;

    const ordenSectores = (clasificacion === "Tradicional")
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const sortedDatos = ordenSectores
        .map(s => datos.find(d => d.Sector === s))
        .filter(d => d !== undefined);

    const labels = sortedDatos.map(d => d.Sector);
    const values = sortedDatos.map(d => d.Porcentaje);
    const customdata = sortedDatos.map(d => d.Cantidad);

    const trace = {
        type: "pie",
        labels: labels,
        values: values,
        customdata: customdata,
        textinfo: "percent",
        textposition: "inside",
        insidetextorientation: "horizontal",
        insidetextfont: {
            color: "#ffffff",
            size: 14
        },
        marker: {
            line: { color: "#161b22", width: 2 }
        },
        hovertemplate:
            "<b>Sector: %{label}</b><br>" +
            "Porcentaje: %{value:.1f}%<br>" +
            "Cantidad: %{customdata}<extra></extra>",
        sort: false
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        uniformtext: {
            mode: "hide",
            minsize: 12
        },
        showlegend: true,
        legend: {
            title: { text: "Sector" },
            font: { size: 12 },
            x: 1,
            y: 0.5
        },
        margin: { l: 20, r: 20, t: 40, b: 20 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_distribucion_sectores_total", [trace], layout);
}

// ==============================
// renderizar_top_carreras
// ==============================

function renderizar_top_carreras() {
    const data = globalData.top_carreras;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    let datos = data[clasificacion]?.[nivel];
    if (!datos) return;

    if (regionActiva === "Nacional") {
        datos = datos["Nacional"];
    } else {
        datos = datos[regionActiva] || datos;
    }

    if (!datos || datos.length === 0) return;

    const tablaDiv = document.getElementById("contenedor_top_carreras");

    const añoCounts = {};
    datos.forEach(d => {
        if (!añoCounts[d.Año]) añoCounts[d.Año] = 0;
        añoCounts[d.Año]++;
    });

    let html = "<table class='tabla-top5'>";
    html += "<thead><tr><th>Año</th><th>Puesto</th><th>Carrera</th><th>Cantidad</th></tr></thead><tbody>";

    const añosMostrados = {};
    datos.forEach(d => {
        html += "<tr>";
        if (!añosMostrados[d.Año]) {
            html += `<td rowspan="${añoCounts[d.Año]}">${d.Año}</td>`;
            añosMostrados[d.Año] = true;
        }
        html += `<td>${d.Puesto}</td>
                 <td>${d.Carrera}</td>
                 <td>${d.Cantidad}</td>`;
        html += "</tr>";
    });

    html += "</tbody></table>";
    tablaDiv.innerHTML = html;
}

// ==============================
// renderizar_evolucion_genero
// ==============================

function renderizar_evolucion_genero() {
    const data = globalData.evolucion_genero;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const datos = data[nivel];

    if (!datos || datos.length === 0) return;

    const anios = datos.map(d => d.año);
    
    const traceF = {
        x: anios,
        y: datos.map(d => d.Femenino),
        customdata: datos.map(d => d.Femenino_cantidad),
        mode: "lines+markers",
        name: "Femenino",
        line: { color: "#2A9D8F", width: 3 },
        marker: { size: 8 },
        hovertemplate:
            "<b>Género: Femenino</b><br>" +
            "Año: %{x}<br>" +
            "Porcentaje: %{y:.1f}%<br>" +
            "Cantidad: %{customdata:,}<extra></extra>"
    };

    const traceM = {
        x: anios,
        y: datos.map(d => d.Masculino),
        customdata: datos.map(d => d.Masculino_cantidad),
        mode: "lines+markers",
        name: "Masculino",
        line: { color: "#E9C46A", width: 3 },
        marker: { size: 8 },
        hovertemplate:
            "<b>Género: Masculino</b><br>" +
            "Año: %{x}<br>" +
            "Porcentaje: %{y:.1f}%<br>" +
            "Cantidad: %{customdata:,}<extra></extra>"
    };

    const layout = {
        xaxis: {
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            mirror: false
        },
        yaxis: {
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
        },
        legend: {
            title: { text: "Género" },
            traceorder: "normal",
            font: { color: "#c9d1d9" }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 70, r: 40, t: 40, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_evolucion_genero", [traceF, traceM], layout);
}

// ==============================
// renderizar_evolucion_genero_por_sector
// ==============================

function renderizar_evolucion_genero_por_sector() {
    const data = globalData.evolucion_genero_por_sector;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    let datos = data[clasificacion]?.[nivel];
    if (!datos) return;

    if (regionActiva === "Nacional") {
        datos = datos["Nacional"];
    } else {
        datos = datos[regionActiva] || datos;
    }

    if (!datos || datos.length === 0) return;

    const ordenSectores = clasificacion === "Tradicional"
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const años = [...new Set(datos.map(d => d["Año"]))].sort();

    let traces = [];

    ordenSectores.forEach((sector, i) => {
        const axisIndex = i + 1;

        const femenino = [];
        const masculino = [];
        const cantidadF = [];
        const cantidadM = [];

        años.forEach(año => {
            const f = datos.find(d => d.Sector === sector && d.Genero === "Femenino" && d["Año"] === año);
            const m = datos.find(d => d.Sector === sector && d.Genero === "Masculino" && d["Año"] === año);

            femenino.push(f ? f.Porcentaje : null);
            masculino.push(m ? m.Porcentaje : null);
            cantidadF.push(f ? f.Cantidad : null);
            cantidadM.push(m ? m.Cantidad : null);
        });

        traces.push({
            x: años,
            y: femenino,
            customdata: cantidadF,
            mode: "lines+markers",
            name: "Femenino",
            legendgroup: "Femenino",
            showlegend: i === 0,
            line: { color: "#2A9D8F", width: 3 },
            marker: { size: 6 },
            xaxis: "x" + axisIndex,
            yaxis: "y" + axisIndex,
            hovertemplate: `<b>${sector}</b><br>Género: Femenino<br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata}<extra></extra>`
        });

        traces.push({
            x: años,
            y: masculino,
            customdata: cantidadM,
            mode: "lines+markers",
            name: "Masculino",
            legendgroup: "Masculino",
            showlegend: i === 0,
            line: { color: "#E9C46A", width: 3 },
            marker: { size: 6 },
            xaxis: "x" + axisIndex,
            yaxis: "y" + axisIndex,
            hovertemplate: `<b>${sector}</b><br>Género: Masculino<br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata}<extra></extra>`
        });
    });

    const layout = {
        grid: {
            rows: 2,
            columns: 3,
            pattern: "independent",
            vertical_spacing: 0.4
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        legend: {
            title: { text: "Género" },
            x: 1.05,
            y: 1
        },
        margin: { l: 60, r: 80, t: 80, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        },
        annotations: []
    };

    ordenSectores.forEach((sector, i) => {
        const axisIndex = i + 1;

        layout["xaxis" + axisIndex] = {
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            titlefont: { size: 12 }
        };

        layout["yaxis" + axisIndex] = {
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            range: [0, 100],
            autorange: false,
            titlefont: { size: 12 }
        };

        layout.annotations.push({
            text: `<b>${sector}</b>`,
            xref: "x" + axisIndex + " domain",
            yref: "y" + axisIndex + " domain",
            x: 0.5,
            y: 1.15,
            showarrow: false,
            font: { size: 14, color: "#58a6ff" }
        });
    });

    Plotly.react("contenedor_evolucion_genero_por_sector", traces, layout);
}

// ==============================
// renderizar_evolucion_edad
// ==============================

function renderizar_evolucion_edad() {
    const data = globalData.evolucion_edad;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const datos = data[nivel];

    if (!datos) return;

    const anios = Object.keys(datos).sort();

    const trace = {
        type: "box",
        x: [],
        q1: [],
        median: [],
        q3: [],
        lowerfence: [],
        upperfence: [],
        name: "Edad",
        marker: { color: "#58a6ff" },
        showlegend: false,
        hoverinfo: "y",
    };

    anios.forEach(anio => {
        const d = datos[anio];
        trace.x.push(anio);
        trace.q1.push(d.q1);
        trace.median.push(d.mediana);
        trace.q3.push(d.q3);
        trace.lowerfence.push(d.min);
        trace.upperfence.push(d.max);
    });

    const layout = {
        xaxis: { 
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2
        },
        yaxis: { 
            title: "Edad",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            autorange: true
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 70, r: 40, t: 10, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_evolucion_edad", [trace], layout);
}

// ==============================
// renderizar_evolucion_edad_por_sector
// ==============================

function renderizar_evolucion_edad_por_sector() {
    const data = globalData.evolucion_edad_por_sector;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    let datos = data[clasificacion]?.[nivel];
    if (!datos) return;

    if (regionActiva === "Nacional") {
        datos = datos["Nacional"];
    } else {
        datos = datos[regionActiva] || datos;
    }

    if (!datos) return;

    const coloresTradicional = {
        'Ingenierías y Ciencias Aplicadas': '#1f77b4',
        'Ciencias de la Salud': '#ff7f0e',
        'Disciplinas Logísticas': '#2ca02c',
        'Ciencias Sociales y Humanidades': '#d62728',
        'Ciencias Puras': '#9467bd',
        'Artes': '#8c564b'
    };

    const coloresOCDE = {
        'Ciencias Naturales': '#4C78A8',
        'Ingeniería y Tecnología': '#F58518',
        'Ciencias Médicas y de la Salud': '#54A24B',
        'Ciencias Agrícolas': '#B279A2',
        'Ciencias Sociales': '#E45756',
        'Humanidades': '#9D755D'
    };

    const mapaColores = (clasificacion === "Tradicional") ? coloresTradicional : coloresOCDE;
    
    const ordenSectores = (clasificacion === "Tradicional")
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    let traces = [];

    ordenSectores.forEach((sector, i) => {
        const datosSector = datos[sector];
        if (!datosSector) return;

        const fechas = Object.keys(datosSector).sort();
        const axisIndex = i + 1;
        
        const colorSector = mapaColores[sector] || '#8b949e';

        const trace = {
            type: "box",
            x: [],
            q1: [],
            median: [],
            q3: [],
            lowerfence: [],
            upperfence: [],
            name: sector,
            showlegend: false,
            marker: { color: colorSector },
            line: { width: 1.5 },
            fillcolor: colorSector + "80",
            xaxis: "x" + axisIndex,
            yaxis: "y" + axisIndex,
            hoverinfo: "y"
        };

        fechas.forEach(fecha_postulacion => {
            const d = datosSector[fecha_postulacion];
            trace.x.push(fecha_postulacion);
            trace.q1.push(d.q1);
            trace.median.push(d.mediana);
            trace.q3.push(d.q3);
            trace.lowerfence.push(d.min);
            trace.upperfence.push(d.max);
        });

        traces.push(trace);
    });

    const layout = {
        grid: {
            rows: 2,
            columns: 3,
            pattern: "independent",
            vertical_spacing: 0.4 
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 60, r: 80, t: 80, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        },
        annotations: []
    };

    ordenSectores.forEach((sector, i) => {
        const axisIndex = i + 1;

        layout["xaxis" + axisIndex] = {
            title: "Año de postulación",
            type: "category",
            showline: true,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            titlefont: { size: 12 }
        };

        layout["yaxis" + axisIndex] = {
            title: "Edad",
            showline: true,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            autorange: true,
            titlefont: { size: 12 }
        };

        layout.annotations.push({
            text: `<b>${sector}</b>`,
            xref: "x" + axisIndex + " domain",
            yref: "y" + axisIndex + " domain",
            x: 0.5,
            y: 1.15, 
            showarrow: false,
            font: { size: 14, color: "#58a6ff" }
        });
    });

    Plotly.react("contenedor_evolucion_edad_por_sector", traces, layout);
}

// ==============================
// renderizar_evolucion_grupo_edad
// ==============================

function renderizar_evolucion_grupo_edad() {
    const data = globalData.evolucion_grupo_edad;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const datos = data[nivel];
    if (!datos || datos.length === 0) return;

    const anios = datos.map(d => d.año);

    const grupos = [
        { key: '[<15]',   color: '#00F5FF' },
        { key: '[16-17]', color: '#FF007F' },
        { key: '[18-20]', color: '#FFFFFF' },
        { key: '[21-25]', color: '#FFD700' },
        { key: '[26<]',   color: '#00FF00' }  
    ];

    const traces = grupos.map(g => {
        return {
            x: anios,
            y: datos.map(d => d[g.key]),
            customdata: datos.map(d => d[`${g.key}_cantidad`]),
            mode: "lines+markers",
            name: g.key,
            line: { color: g.color },
            hovertemplate:
                `<b>Grupo: ${g.key}</b><br>` +
                "Año: %{x}<br>" +
                "Porcentaje: %{y:.1f}%<br>" +
                "Cantidad: %{customdata}<extra></extra>"
        };
    });

    const layout = {
        xaxis: {
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            mirror: false
        },
        yaxis: {
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2
        },
        legend: {
            title: { text: "Rango de Edad" },
            traceorder: "normal",
            font: { color: "#c9d1d9" }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 60, r: 40, t: 40, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_evolucion_grupo_edad", traces, layout);
}

// ==============================
// renderizar_mapa_calor_edad_genero
// ==============================

function renderizar_mapa_calor_edad_genero() {
    const dataMC = globalData.mapa_calor_edad_genero;
    if (!dataMC) return;

    const nivel = document.getElementById("nivel").value;
    const datos = dataMC[nivel];

    if (!datos) return;

    const ordenSectores = [
        'Ingenierías y Ciencias Aplicadas',
        'Ciencias de la Salud',
        'Disciplinas Logísticas',
        'Ciencias Sociales y Humanidades',
        'Ciencias Puras',
        'Artes'
    ];

    const ordenEjeX = [
        '[<15]-Femenino','[<15]-Masculino',
        '[16-17]-Femenino','[16-17]-Masculino',
        '[18-20]-Femenino','[18-20]-Masculino',
        '[21-25]-Femenino','[21-25]-Masculino',
        '[26<]-Femenino','[26<]-Masculino'
    ];

    const sectoresOrdenados = ordenSectores
        .filter(s => datos.hasOwnProperty(s))
        .reverse(); 

    const z = sectoresOrdenados.map(sector => {
        return ordenEjeX.map(cat => datos[sector]?.[cat] ?? 0);
    });

    const dataHeatmap = [{
        type: "heatmap",
        x: ordenEjeX,
        y: sectoresOrdenados,
        z: z,
        text: z.map(row => row.map(v => v.toLocaleString())),
        texttemplate: "%{text}",
        textfont: { size: 11, color: "#ffffff" },
        colorscale: "Viridis",
        showscale: true,
        colorbar: {
            title: { text: "Postulantes", font: { color: "#c9d1d9", size: 12 } },
            tickfont: { color: "#c9d1d9" },
            thickness: 15,
            tickformat: "d" 
        },
        hovertemplate: 
            "<b>Sector: %{y}</b><br>" +
            "Grupo: %{x}<br>" +
            "Cantidad: %{z:,}<extra></extra>" 
    }];

    const layout = {
        xaxis: {
            title: {
                text: "Edad - Género",
                standoff: 30,
                font: { size: 13, color: "#c9d1d9" }
            },
            tickangle: -45,
            showline: false,
            showgrid: false,
            zeroline: false,
            automargin: true
        },
        yaxis: {
            title: {
                text: "Sector",
                standoff: 30,
                font: { size: 13, color: "#c9d1d9" }
            },
            showline: false,
            showgrid: false,
            zeroline: false,
            automargin: true
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 200, r: 50, t: 50, b: 150 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_mapa_calor_edad_genero", dataHeatmap, layout);
}

// ==============================
// renderizar_evolucion_gestion
// ==============================

function renderizar_evolucion_gestion() {
    const data = globalData.evolucion_gestion;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const datosLista = data[nivel];

    if (!datosLista || !Array.isArray(datosLista)) return;

    const anios = datosLista.map(d => d.año);
    const gestiones = ["Público", "Privado"];
    
    const coloresGestion = {
        "Público": "#219ebc", 
        "Privado": "#ffb703"  
    };

    const traces = gestiones.map(g => {
        const valoresY = datosLista.map(d => d[g] ?? 0);
        const cantidades = datosLista.map(d => d[`${g}_cantidad`] ?? 0);

        return {
            x: anios,
            y: valoresY,
            customdata: cantidades, 
            mode: "lines+markers",
            name: g,
            line: { 
                color: coloresGestion[g],
                width: 3 
            },
            marker: { size: 8 },
            hovertemplate: 
                `<b>Gestión: ${g}</b><br>` +
                "Año: %{x}<br>" +
                "Porcentaje: %{y:.2f}%<br>" +
                "Cantidad: %{customdata:,}<extra></extra>"
        };
    });

    const layout = {
        xaxis: {
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2
        },
        yaxis: {
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            autorange: true
        },
        legend: {
            title: { text: "Tipo de Gestión" },
            font: { color: "#c9d1d9" }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 70, r: 40, t: 40, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react("contenedor_evolucion_gestion", traces, layout);
}

// ==============================
// renderizar_evolucion_gestion_por_sector
// ==============================

function renderizar_evolucion_gestion_por_sector() {
    const data = globalData.evolucion_gestion_por_sector;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    let datos = data[clasificacion]?.[nivel];
    if (!datos) return;

    if (regionActiva === "Nacional") {
        datos = datos["Nacional"];
    } else {
        datos = datos[regionActiva] || datos;
    }

    if (!datos || datos.length === 0) return;

    const ordenSectores = clasificacion === "Tradicional"
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const años = [...new Set(datos.map(d => d["Año"]))].sort();

    let traces = [];

    ordenSectores.forEach((sector, i) => {
        const axisIndex = i + 1;
        const listPublico = [];
        const listPrivado = [];
        const cantPublico = [];
        const cantPrivado = [];

        años.forEach(año => {
            const pub = datos.find(d => d.Sector === sector && d.Gestión === "Público" && d["Año"] === año);
            const priv = datos.find(d => d.Sector === sector && d.Gestión === "Privado" && d["Año"] === año);

            listPublico.push(pub ? pub.Porcentaje : null);
            listPrivado.push(priv ? priv.Porcentaje : null);
            cantPublico.push(pub ? pub.Cantidad : null);
            cantPrivado.push(priv ? priv.Cantidad : null);
        });

        traces.push({
            x: años,
            y: listPublico,
            customdata: cantPublico,
            mode: "lines+markers",
            name: "Público",
            legendgroup: "Público",
            showlegend: i === 0,
            line: { color: "#219ebc", width: 3 },
            marker: { size: 6 },
            xaxis: "x" + axisIndex,
            yaxis: "y" + axisIndex,
            hovertemplate: `<b>${sector}</b><br>Gestión: Público<br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata}<extra></extra>`
        });

        traces.push({
            x: años,
            y: listPrivado,
            customdata: cantPrivado,
            mode: "lines+markers",
            name: "Privado",
            legendgroup: "Privado",
            showlegend: i === 0,
            line: { color: "#ffb703", width: 3 },
            marker: { size: 6 },
            xaxis: "x" + axisIndex,
            yaxis: "y" + axisIndex,
            hovertemplate: `<b>${sector}</b><br>Gestión: Privado<br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata}<extra></extra>`
        });
    });

    const layout = {
        grid: {
            rows: 2,
            columns: 3,
            pattern: "independent",
            vertical_spacing: 0.4
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        legend: {
            title: { text: "Gestión" },
            x: 1.05,
            y: 1
        },
        margin: { l: 60, r: 80, t: 80, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        },
        annotations: []
    };

    ordenSectores.forEach((sector, i) => {
        const axisIndex = i + 1;

        layout["xaxis" + axisIndex] = {
            title: "Año de postulación",
            type: "category",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            titlefont: { size: 12 }
        };

        layout["yaxis" + axisIndex] = {
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            gridcolor: "#23282f",
            linecolor: "#8b949e",
            linewidth: 2,
            range: [0, 100],
            autorange: false,
            titlefont: { size: 12 }
        };

        layout.annotations.push({
            text: `<b>${sector}</b>`,
            xref: "x" + axisIndex + " domain",
            yref: "y" + axisIndex + " domain",
            x: 0.5,
            y: 1.15,
            showarrow: false,
            font: { size: 14, color: "#58a6ff" }
        });
    });

    Plotly.react("contenedor_evolucion_gestion_por_sector", traces, layout);
}

// ==============================
// renderizar_tabla_universidades_por_sector
// ==============================

function renderizar_tabla_universidades_por_sector() {
    const data = globalData.top_universidades_por_sector;
    const contenedor = document.getElementById("contenedor_top_universidades_por_sector");
    if (!data || !contenedor) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    const datosNivel = data[clasificacion]?.[nivel];

    if (!datosNivel || Object.keys(datosNivel).length === 0) {
        contenedor.innerHTML = "<div class='no-data'>No hay datos disponibles para la selección actual.</div>";
        return;
    }

    const ordenSectores = (clasificacion === "Tradicional")
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const anios = Object.keys(datosNivel).sort((a, b) => b - a);

    let html = `<div class="table-wrapper">
                <table class="tabla-premium">
                <thead>
                    <tr>
                        <th style="width: 80px;">Año</th>`;
    
    ordenSectores.forEach(sec => {
        html += `<th>${sec}</th>`;
    });
    html += `</tr></thead><tbody>`;

    anios.forEach(anio => {
        html += `<tr>
                    <td class="col-anio"><strong>${anio}</strong></td>`;
        
        ordenSectores.forEach(sec => {
            const listaUniversidades = datosNivel[anio]?.[sec] || [];
            html += `<td>`;
            if (listaUniversidades.length > 0) {
                listaUniversidades.forEach(textoUni => {
                    html += `<div class="uni-item">${textoUni}</div>`;
                });
            } else {
                html += `<span class="muted">-</span>`;
            }
            html += `</td>`;
        });
        html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    contenedor.innerHTML = html;
}

// ==============================
// renderizar_polar_regiones_por_sector
// ==============================

function renderizar_polar_regiones_por_sector() {
    const contenedorPadre = document.getElementById("contenedor_polar_regiones_por_sector");
    const dataPolar = globalData.polar_regiones_por_sector;
    
    if (!contenedorPadre) return;

    const seccionPolar = document.getElementById("seccion_polar");

    if (regionActiva !== "Nacional" || !dataPolar) {
        contenedorPadre.innerHTML = "";
        if (seccionPolar) seccionPolar.style.display = "none";
        return;
    } else {
        if (seccionPolar) seccionPolar.style.display = "block";
    }

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;
    const datosNivel = dataPolar[clasificacion]?.[nivel];

    contenedorPadre.innerHTML = "";

    contenedorPadre.style.display = "grid";
    contenedorPadre.style.gridTemplateColumns = "repeat(3, 1fr)";
    contenedorPadre.style.gap = "20px";

    if (!datosNivel || Object.keys(datosNivel).length === 0) return;

    const ordenSectores = (clasificacion === "Tradicional")
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const coloresRegiones = {
        "Lima Metropolitana": "#636EFA", "Lima Provincias": "#636EFA", "Arequipa": "#EF553B",
        "La Libertad": "#00CC96", "Cusco": "#AB63FA", "Puno": "#FFA15A", "Junín": "#19D3F3",
        "Piura": "#FF6692", "Ancash": "#B6E880", "Áncash": "#B6E880", "Cajamarca": "#FF97FF",
        "Lambayeque": "#FECB52", "Ica": "#316395", "Callao": "#B82E2E", "Loreto": "#66AA00",
        "Huánuco": "#DD4477", "Ayacucho": "#B6E880", "Ucayali": "#22AA99", "San Martín": "#AAAA11",
        "Tacna": "#6633CC", "Huancavelica": "#E67300", "Apurímac": "#8B0707", "Amazonas": "#329262",
        "Moquegua": "#5574A6", "Pasco": "#3B3EAC", "Madre de Dios": "#FF9900", "Tumbes": "#109618"
    };

    ordenSectores.forEach(sector => {
        const sectorData = datosNivel[sector];
        if (!sectorData || sectorData.length === 0) return;

        const card = document.createElement("section");
        card.className = "chart-card"; 
        const divId = `polar_${sector.replace(/\s+/g, '_')}`;
        
        card.innerHTML = `
            <h2>${sector}</h2>
            <div id="${divId}" class="plotly-graph-polar-compact"></div>
        `;
        contenedorPadre.appendChild(card);

        const labels = sectorData.map(d => d.Region_entidad);
        const values = sectorData.map(d => d.Porcentaje);
        const cantidades = sectorData.map(d => d.Cantidad);
        const colores = labels.map(l => coloresRegiones[l] || "#888888");

        const trace = {
            type: 'barpolar',
            r: values,
            theta: labels,
            customdata: cantidades,
            marker: {
                color: colores,
                line: { color: "#1f242c", width: 1.5 }
            },
            hovertemplate: 
                `<b>%{theta}</b><br>` +
                `Interés: %{r}%<br>` +
                `Postulantes: %{customdata:,.0f}<extra></extra>`
        };

        const layout = {
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#c9d1d9", family: "Inter" },
            polar: {
                bgcolor: "rgba(31, 36, 44, 0.5)",
                angularaxis: {
                    gridcolor: "#30363d",
                    rotation: 90,
                    direction: "clockwise",
                    tickfont: { size: 9 }
                },
                radialaxis: {
                    gridcolor: "#30363d",
                    ticksuffix: "%",
                    tickfont: { size: 8 }
                }
            },
            showlegend: false,
            margin: { t: 30, b: 30, l: 30, r: 30 }
        };

        Plotly.newPlot(divId, [trace], layout, { responsive: true, displayModeBar: false });
    });
}

// ==============================
// renderizar_evolucion_sectores_postulante
// ==============================

function renderizar_evolucion_sectores_postulante() {
    const contenedorId = "contenedor_evolucion_sectores_postulante";
    const divGrafica = document.getElementById(contenedorId);
    const divAviso = document.getElementById("aviso_lima_postulante");
    if (!divGrafica) return;

    const cardPadre = divGrafica.closest('.chart-card');

    if (regionActiva === "Nacional") {
        if (cardPadre) cardPadre.style.display = "none";
        return; 
    } else {
        if (cardPadre) cardPadre.style.display = "block";
    }

    if (divAviso) {
        if (["Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
            divAviso.textContent = "Se muestran datos de Lima (incluyendo Lima Metropolitana y Lima Provincias)";
            divAviso.style.display = "block";
        } else {
            divAviso.style.display = "none";
        }
    }

    const dataSectores = globalData.evolucion_sectores_postulante;
    if (!dataSectores) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    const datosPorNivel = dataSectores[clasificacion]?.[nivel];
    if (!datosPorNivel) return;

    let llaveBusqueda = regionActiva;
    if (["Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
        llaveBusqueda = "Lima";
    }

    const datos = datosPorNivel[llaveBusqueda];

    if (!datos || !Array.isArray(datos) || datos.length === 0) {
        Plotly.purge(contenedorId);
        return;
    }

    const ordenSectores = (clasificacion === "Tradicional")
        ? ordenSectoresTradicional
        : ordenSectoresOCDE;

    const sectoresUnicos = [...new Set(datos.map(d => d.Sector))];
    const sectores = ordenSectores.filter(s => sectoresUnicos.includes(s));

    const traces = sectores.map(sector => {
        const datosSector = datos.filter(d => d.Sector === sector);
        return {
            x: datosSector.map(d => d.Fecha_postulacion),
            y: datosSector.map(d => d.Porcentaje),
            mode: "markers+lines",
            name: sector,
            customdata: datosSector.map(d => d.Cantidad),
            hovertemplate: `<b>Sector: ${sector}</b><br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata}<extra></extra>`
        };
    });

    const layout = {
        xaxis: { 
            title: "Año de postulación", 
            type: "category", 
            showline: true,
            zeroline: false,
            gridcolor: "#23282f", 
            linecolor: "#8b949e", 
            linewidth: 2,
            mirror: false 
        },
        yaxis: { 
            title: "Porcentaje (%)", 
            showline: true,
            zeroline: false,
            gridcolor: "#23282f", 
            linecolor: "#8b949e", 
            linewidth: 2
        },
        legend: { 
            title: { text: "Sector" },
            traceorder: "normal",
            font: { color: "#c9d1d9" } 
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 60, r: 40, t: 40, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react(contenedorId, traces, layout, { responsive: true, displayModeBar: false });
}

// ==============================
// renderizar_distribucion_sectores_total_postulante
// ==============================

function renderizar_distribucion_sectores_total_postulante() {
    const contenedorId = "contenedor_distribucion_sectores_total_postulante";
    const divGrafica = document.getElementById(contenedorId);
    const divAviso = document.getElementById("aviso_dist_postulante");
    if (!divGrafica) return;

    const cardPadre = divGrafica.closest('.chart-card');

    if (regionActiva === "Nacional") {
        if (cardPadre) cardPadre.style.display = "none";
        return;
    } else {
        if (cardPadre) cardPadre.style.display = "block";
    }

    if (divAviso) {
        if (["Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
            divAviso.textContent = "Se muestran datos de Lima (incluyendo Lima Metropolitana y Lima Provincias)";
            divAviso.style.display = "block";
        } else {
            divAviso.style.display = "none";
        }
    }

    const dataDistribucion = globalData.distribucion_sectores_total_postulante;
    if (!dataDistribucion) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    const datosPorClasif = dataDistribucion[clasificacion]?.[nivel];
    if (!datosPorClasif) return;

    let llaveBusqueda = regionActiva;
    if (["Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
        llaveBusqueda = "Lima";
    }

    const datos = datosPorClasif[llaveBusqueda];

    if (!datos || datos.length === 0) {
        Plotly.purge(contenedorId);
        return;
    }

    const ordenSectores = (clasificacion === "Tradicional") ? ordenSectoresTradicional : ordenSectoresOCDE;
    
    const sortedDatos = ordenSectores
        .map(s => datos.find(d => d.Sector === s))
        .filter(d => d !== undefined);

    const trace = {
        type: "pie",
        labels: sortedDatos.map(d => d.Sector),
        values: sortedDatos.map(d => d.Porcentaje),
        customdata: sortedDatos.map(d => d.Cantidad),
        textinfo: "percent",
        textposition: "inside",
        insidetextorientation: "horizontal",
        insidetextfont: {
            color: "#ffffff",
            size: 14
        },
        marker: {
            line: { color: "#161b22", width: 2 }
        },
        hovertemplate:
            "<b>Sector: %{label}</b><br>" +
            "Porcentaje: %{value:.1f}%<br>" +
            "Cantidad: %{customdata}<extra></extra>",
        sort: false
    };

    const layout = {
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        uniformtext: {
            mode: "hide",
            minsize: 12
        },
        showlegend: true,
        legend: {
            title: { text: "Sector" },
            font: { size: 12 },
            x: 1,
            y: 0.5
        },
        margin: { l: 20, r: 20, t: 40, b: 20 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react(contenedorId, [trace], layout);
}

// ==============================
// renderizar_migracion_postulante
// ==============================

function renderizar_migracion_postulante() {
    const contenedorId = "contenedor_migracion_postulante";
    const divGrafica = document.getElementById(contenedorId);
    const divAviso = document.getElementById("aviso_3");
    if (!divGrafica) return;

    const cardPadre = divGrafica.closest('.chart-card');

    if (regionActiva === "Nacional") {
        if (cardPadre) cardPadre.style.display = "none";
        return; 
    } else {
        if (cardPadre) cardPadre.style.display = "block";
    }

    if (divAviso) {
        if (["Callao", "Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
            divAviso.textContent = "Se muestran datos de Lima (incluyendo Lima Metropolitana y Lima Provincias) y Callao";
            divAviso.style.display = "block";
        } else {
            divAviso.style.display = "none";
        }
    }

    const dataMigracion = globalData.migracion_postulante;
    if (!dataMigracion) return;

    const nivel = document.getElementById("nivel").value;
    
    let llaveBusqueda = regionActiva;
    if (["Lima Metropolitana", "Lima Provincias", "Callao"].includes(regionActiva)) {
        llaveBusqueda = "Lima";
    }
    
    const datosRegion = dataMigracion[nivel]?.[llaveBusqueda];

    if (!datosRegion || !Array.isArray(datosRegion) || datosRegion.length === 0) {
        Plotly.purge(contenedorId);
        return;
    }

    const coloresMigracion = { 'Migran': '#00BFC4', 'No migran': '#F8766D' };

    const traces = ["Migran", "No migran"].map(cond => {
        const datosCondicion = datosRegion.filter(d => d.Condicion === cond);
        return {
            x: datosCondicion.map(d => d.Fecha_postulacion),
            y: datosCondicion.map(d => d.Porcentaje),
            mode: "lines+markers",
            name: cond,
            line: { shape: 'linear', width: 3, color: coloresMigracion[cond] },
            marker: { size: 8, color: coloresMigracion[cond] },
            customdata: datosCondicion.map(d => d.Cantidad),
            hovertemplate: `<b>Estado: ${cond}</b><br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata:,.0f}<extra></extra>`
        };
    });

    const layout = {
        xaxis: { 
            title: "Año de postulación", 
            type: "category", 
            showline: true,
            zeroline: false,
            gridcolor: "#23282f", 
            linecolor: "#8b949e", 
            linewidth: 2 
        },
        yaxis: { 
            title: "Porcentaje (%)", 
            showline: true,
            zeroline: false,
            gridcolor: "#23282f", 
            linecolor: "#8b949e", 
            linewidth: 2,
            autorange: true
        },
        legend: { 
            title: { text: "Condición" },
            x: 1.05,
            y: 1,
            font: { color: "#c9d1d9" }
        },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#c9d1d9" },
        margin: { l: 60, r: 100, t: 40, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        }
    };

    Plotly.react(contenedorId, traces, layout, { responsive: true, displayModeBar: false });
}

// ==============================
// renderizar_migracion_por_sector_postulante
// ==============================

function renderizar_migracion_por_sector_postulante() {
    const contenedorId = "contenedor_migracion_por_sector_postulante";
    const divGrafica = document.getElementById(contenedorId);
    const divAviso = document.getElementById("aviso_4");
    if (!divGrafica) return;

    const cardPadre = divGrafica.closest('.chart-card');

    if (regionActiva === "Nacional") {
        if (cardPadre) cardPadre.style.display = "none";
        return; 
    } else {
        if (cardPadre) cardPadre.style.display = "block";
    }

    if (divAviso) {
        if (["Callao", "Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
            divAviso.textContent = "Se muestran datos de Lima (incluyendo Lima Metropolitana y Lima Provincias) y Callao";
            divAviso.style.display = "block";
        } else {
            divAviso.style.display = "none";
        }
    }

    const data = globalData.migracion_por_sector_postulante;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    const clasificacion = document.querySelector("input[name='clasificacion']:checked").value;

    const datosPorNivel = data[clasificacion]?.[nivel];
    if (!datosPorNivel) return;

    let llaveBusqueda = regionActiva;
    if (["Lima Metropolitana", "Lima Provincias", "Callao"].includes(regionActiva)) {
        llaveBusqueda = "Lima";
    }

    const datos = datosPorNivel[llaveBusqueda];
    if (!datos || datos.length === 0) {
        Plotly.purge(contenedorId);
        return;
    }

    const ordenSectores = clasificacion === "Tradicional" ? ordenSectoresTradicional : ordenSectoresOCDE;
    const años = [...new Set(datos.map(d => d["Año"]))].sort();
    const coloresMigracion = { 'Migran': '#00BFC4', 'No migran': '#F8766D' };

    let traces = [];
    ordenSectores.forEach((sector, i) => {
        const axisIndex = i + 1;
        const datosSector = datos.filter(d => d.Sector === sector);

        ['Migran', 'No migran'].forEach(condicion => {
            const dataCond = años.map(año => {
                const d = datosSector.find(item => item.Condicion === condicion && item["Año"] === año);
                return d ? { p: d.Porcentaje, c: d.Cantidad } : { p: null, c: null };
            });

            traces.push({
                x: años, 
                y: dataCond.map(d => d.p), 
                customdata: dataCond.map(d => d.c),
                mode: "lines+markers", 
                name: condicion, 
                legendgroup: condicion,
                showlegend: i === 0, 
                line: { color: coloresMigracion[condicion], width: 3 },
                marker: { size: 6 }, 
                xaxis: "x" + axisIndex, 
                yaxis: "y" + axisIndex,
                hovertemplate: `<b>${sector}</b><br>Estado: ${condicion}<br>Año: %{x}<br>Porcentaje: %{y:.1f}%<br>Cantidad: %{customdata:,.0f}<extra></extra>`
            });
        });
    });

    const layout = {
        grid: { 
            rows: 2, 
            columns: 3, 
            pattern: "independent",
            vertical_spacing: 0.4
        },
        paper_bgcolor: "rgba(0,0,0,0)", 
        plot_bgcolor: "rgba(0,0,0,0)", 
        font: { color: "#c9d1d9" },
        // LEYENDA A LA DERECHA (Igual a la de Gestión)
        legend: { 
            title: { text: "Condición" },
            x: 1.05,
            y: 1,
            font: { color: "#c9d1d9" }
        },
        margin: { l: 60, r: 80, t: 80, b: 60 },
        hoverlabel: {
            bgcolor: "#1f242c",
            bordercolor: "#30363d",
            font: { color: "#c9d1d9" }
        },
        annotations: []
    };

    ordenSectores.forEach((sector, i) => {
        const idx = i + 1;
        layout["xaxis" + idx] = { 
            title: "Año de postulación",
            type: "category", 
            showline: true,
            zeroline: false,
            gridcolor: "#23282f", 
            linecolor: "#8b949e",
            linewidth: 2,
            titlefont: { size: 12 }
        };
        layout["yaxis" + idx] = { 
            title: "Porcentaje (%)",
            showline: true,
            zeroline: false,
            range: [0, 100], 
            autorange: false,
            gridcolor: "#23282f", 
            linecolor: "#8b949e",
            linewidth: 2,
            titlefont: { size: 12 }
        };
        layout.annotations.push({ 
            text: `<b>${sector}</b>`, 
            xref: "x" + idx + " domain", 
            yref: "y" + idx + " domain", 
            x: 0.5, 
            y: 1.15, 
            showarrow: false, 
            font: { size: 14, color: "#58a6ff" } 
        });
    });

    Plotly.react(contenedorId, traces, layout, { responsive: true, displayModeBar: false });
}

// ==============================
// renderizar_top_destinos_migracion
// ==============================

function renderizar_top_destinos_migracion() {
    const contenedorId = "contenedor_top_destinos_migracion";
    const contenedor = document.getElementById(contenedorId);
    const divAviso = document.getElementById("aviso_5");
    if (!contenedor) return;

    const cardPadre = contenedor.closest('.chart-card');

    if (regionActiva === "Nacional") {
        if (cardPadre) cardPadre.style.display = "none";
        return;
    } else {
        if (cardPadre) cardPadre.style.display = "block";
    }
    
    if (divAviso) {
        if (["Callao", "Lima Metropolitana", "Lima Provincias"].includes(regionActiva)) {
            divAviso.textContent = "Se muestran datos de Lima (incluyendo Lima Metropolitana y Lima Provincias) y Callao";
            divAviso.style.display = "block";
        } else {
            divAviso.style.display = "none";
        }
    }

    const data = globalData.top_destinos_migracion;
    if (!data) return;

    const nivel = document.getElementById("nivel").value;
    
    let llaveBusqueda = regionActiva;
    if (["Lima Metropolitana", "Lima Provincias", "Callao"].includes(regionActiva)) {
        llaveBusqueda = "Lima";
    }
    
    const datosNivel = data[nivel]?.[llaveBusqueda];

    if (!datosNivel || Object.keys(datosNivel).length === 0) {
        contenedor.innerHTML = "<div class='no-data'>No hay registros de migración para este nivel.</div>";
        return;
    }

    const anios = Object.keys(datosNivel).sort((a, b) => b - a);
    let html = `<div class="table-wrapper"><table class="tabla-premium"><thead><tr><th style="width: 100px;">Año</th><th>Principales Regiones de Destino (Top 5)</th></tr></thead><tbody>`;

    anios.forEach(anio => {
        const listaDestinos = datosNivel[anio] || [];
        html += `<tr><td class="col-anio"><strong>${anio}</strong></td><td class="celda-destinos">`;
        if (listaDestinos.length > 0) {
            html += `<div class="destinos-grid">`;
            listaDestinos.forEach(textoDestino => { html += `<div class="uni-item">${textoDestino}</div>`; });
            html += `</div>`;
        } else {
            html += `<span class="muted">No se registran salidas en este periodo</span>`;
        }
        html += `</td></tr>`;
    });

    html += `</tbody></table></div>`;
    contenedor.innerHTML = html;
}