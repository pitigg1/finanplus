// Panel de inicio: resumen del mes, gráficos y lo que viene.
menu("index.html");
const usuarioId = exigirUsuario();

// ----- Fechas: mes actual y mes anterior -----
const hoy = new Date();
const claveMes = (anio, mes) => `${anio}-${String(mes).padStart(2, "0")}`;
const claveActual = claveMes(hoy.getFullYear(), hoy.getMonth() + 1);
const mesPrevio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
const clavePrevia = claveMes(mesPrevio.getFullYear(), mesPrevio.getMonth() + 1);
const nombreMesActual = NOMBRES_MESES[hoy.getMonth()];
const nombreMesPrevio = NOMBRES_MESES[mesPrevio.getMonth()];

// "Hola, Ana" según la hora del día
function pintarSaludo() {
  let nombre = "";
  try { nombre = (JSON.parse(localStorage.getItem("usuario")) || {}).nombre || ""; } catch (e) {}
  const hora = hoy.getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  document.getElementById("saludo").textContent = nombre ? `${saludo}, ${nombre.split(" ")[0]}` : saludo;
}

// Total de ingresos y gastos de un mes ("2026-10")
function totalesDelMes(registros, clave) {
  const delMes = registros.filter((r) => String(r.fechaMovimiento).startsWith(clave));
  const suma = (tipo) => delMes.filter((r) => r.tipoMovimiento === tipo).reduce((t, r) => t + Number(r.monto), 0);
  return { ingresos: suma("INGRESO"), gastos: suma("GASTO"), cantidad: delMes.length };
}

const vacio = (icono, texto) => `<div class="vacio"><i class="bi ${icono}"></i><p>${texto}</p></div>`;

// ----- Balance del mes -----
function pintarBalance(registros) {
  const { ingresos, gastos } = totalesDelMes(registros, claveActual);
  const balance = ingresos - gastos;
  document.getElementById("balanceMes").textContent = `${nombreMesActual} ${hoy.getFullYear()}`;
  document.getElementById("balanceValor").textContent = dinero(balance);
  document.getElementById("totalIngresos").textContent = dinero(ingresos);
  document.getElementById("totalGastos").textContent = dinero(gastos);
  const uso = ingresos > 0 ? Math.round((gastos / ingresos) * 100) : gastos > 0 ? 100 : 0;
  document.getElementById("usoTexto").textContent = uso + "%";
  document.getElementById("usoBarra").style.width = Math.min(100, uso) + "%";
  document.getElementById("balanceSub").textContent =
    ingresos === 0 && gastos === 0 ? "Aún no tienes movimientos este mes"
    : balance >= 0 ? "Lo que te queda después de tus gastos"
    : "Estás gastando más de lo que ganas";
}

// ----- Últimos movimientos -----
function pintarRecientes(registros) {
  const cont = document.getElementById("recientes");
  const recientes = [...registros].sort((a, b) => String(b.fechaMovimiento).localeCompare(String(a.fechaMovimiento))).slice(0, 5);
  if (!recientes.length) {
    cont.innerHTML = `<div class="list-group-item">${vacio("bi-receipt", "Todavía no registras nada.<br><a href='registros.html'>Anota tu primer movimiento</a>")}</div>`;
    return;
  }
  cont.innerHTML = recientes.map((r) => {
    const clase = { INGRESO: "ingreso", GASTO: "gasto", AHORRO: "ahorro", INVERSION: "inversion" }[r.tipoMovimiento] || "otro";
    const icono = r.tipoMovimiento === "INGRESO" ? "bi-arrow-down-left" : r.tipoMovimiento === "GASTO" ? "bi-arrow-up-right" : "bi-piggy-bank";
    return `<div class="list-group-item mov-item">
      <span class="mov-icono chip-${clase}"><i class="bi ${icono}"></i></span>
      <span class="mov-texto">
        <strong>${esc(r.descripcion || r.nombreCategoria || "Movimiento")}</strong>
        <small class="text-muted">${esc(r.nombreCategoria || "Sin categoría")} · ${fecha(r.fechaMovimiento).slice(0, 10)}</small>
      </span>
      <span class="mov-monto">${montoConSigno(r.tipoMovimiento, r.monto)}</span>
    </div>`;
  }).join("");
}

// ----- Indicadores (4 tarjetas) -----
function kpi(icono, color, titulo, valor, detalle, href) {
  return `<div class="col-6 col-lg-3">
    <a href="${href}" class="card kpi h-100">
      <div class="card-body">
        <span class="kpi-icono bg-app-${color}"><i class="bi ${icono}"></i></span>
        <div class="kpi-titulo">${titulo}</div>
        <div class="kpi-valor">${valor}</div>
        <div class="kpi-detalle">${detalle}</div>
      </div>
    </a>
  </div>`;
}

function pintarIndicadores(registros, inversiones, notificaciones, recurrentes) {
  const { ingresos, gastos } = totalesDelMes(registros, claveActual);
  const tasa = ingresos > 0 ? Math.round(((ingresos - gastos) / ingresos) * 100) : null;
  const invertido = inversiones.reduce((t, i) => t + Number(i.montoInvertido || 0), 0);
  const actual = inversiones.reduce((t, i) => t + Number(i.valorActual || 0), 0);
  const rendimiento = invertido > 0 ? ((actual - invertido) / invertido) * 100 : null;
  const sinLeer = notificaciones.filter((n) => !n.leida).length;
  const limite = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7).toISOString().slice(0, 10);
  const pagos = recurrentes.filter((m) => m.activo && m.tipoMovimiento === "GASTO" && String(m.proximaFecha) <= limite);
  const totalPagos = pagos.reduce((t, m) => t + Number(m.montoEstimado), 0);

  document.getElementById("kpis").innerHTML =
    kpi("bi-piggy-bank-fill", "green", "Ahorro del mes",
      tasa === null ? "—" : `${tasa}%`,
      tasa === null ? "Registra un ingreso para calcularlo" : tasa >= 0 ? "de tus ingresos te quedó" : "gastaste más de lo que ganaste", "metricas.html") +
    kpi("bi-graph-up-arrow", "blue", "Inversiones",
      inversiones.length ? dinero(actual) : "—",
      rendimiento === null ? "Aún no tienes inversiones" : `<span class="${rendimiento >= 0 ? "monto-ingreso" : "monto-gasto"}">${rendimiento >= 0 ? "+" : "−"}${Math.abs(rendimiento).toLocaleString("es-CO", { maximumFractionDigits: 1 })}%</span> de rendimiento`, "inversiones.html") +
    kpi("bi-bell-fill", sinLeer ? "orange" : "gray", "Alertas",
      sinLeer, sinLeer ? (sinLeer === 1 ? "sin leer" : "sin leer") : "Todo al día", "notificaciones.html") +
    kpi("bi-calendar-check-fill", "indigo", "Pagos próximos",
      pagos.length, pagos.length ? `${dinero(totalPagos)} en 7 días` : "Nada por pagar esta semana", "recurrentes.html");
}

// ----- Gráfico: gastos por categoría (anillo) -----
function pintarGastosPorCategoria(registros, categorias) {
  const cont = document.getElementById("graficoGastos");
  const gastos = registros.filter((r) => r.tipoMovimiento === "GASTO" && String(r.fechaMovimiento).startsWith(claveActual));
  const total = gastos.reduce((t, r) => t + Number(r.monto), 0);
  if (!total) { cont.innerHTML = vacio("bi-pie-chart", "Sin gastos este mes."); return; }

  const porCategoria = {};
  gastos.forEach((r) => { const n = r.nombreCategoria || "Sin categoría"; porCategoria[n] = (porCategoria[n] || 0) + Number(r.monto); });
  let items = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
  if (items.length > 5) {
    const otros = items.slice(4).reduce((t, [, v]) => t + v, 0);
    items = [...items.slice(0, 4), ["Otros", otros]];
  }
  const colorDe = (n) => (categorias.find((c) => c.nombre === n) || {}).color || "#8E8E93";
  const iconoDe = (n) => (categorias.find((c) => c.nombre === n) || {}).icono || "";

  let acumulado = 0;
  const huecos = items.length > 1 ? 0.8 : 0;
  const segmentos = items.map(([n, v]) => {
    const pct = (v / total) * 100;
    const largo = Math.max(pct - huecos, 0.1);
    const seg = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${esc(colorDe(n))}" stroke-width="5" stroke-dasharray="${largo} ${100 - largo}" stroke-dashoffset="${25 - acumulado}"></circle>`;
    acumulado += pct;
    return seg;
  }).join("");

  const leyenda = items.map(([n, v]) => `<li>
      <span class="punto" style="background:${esc(colorDe(n))}"></span>
      <span class="leyenda-nombre">${iconoDe(n) ? esc(iconoDe(n)) + " " : ""}${esc(n)}</span>
      <span class="leyenda-monto">${dinero(v)}</span>
      <span class="leyenda-pct">${Math.round((v / total) * 100)}%</span>
    </li>`).join("");

  cont.innerHTML = `<div class="donut-fila">
    <div class="donut" role="img" aria-label="Gastos de ${nombreMesActual}: ${items.map(([n, v]) => `${n} ${Math.round((v / total) * 100)}%`).join(", ")}">
      <svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.915" fill="none" class="donut-fondo" stroke-width="5"></circle>${segmentos}</svg>
      <div class="donut-centro"><small>Gastos</small><strong>${dinero(total)}</strong></div>
    </div>
    <ul class="leyenda">${leyenda}</ul>
  </div>`;
}

// ----- Comparación con el mes anterior -----
function pintarComparacion(registros) {
  const act = totalesDelMes(registros, claveActual);
  const prev = totalesDelMes(registros, clavePrevia);
  document.getElementById("tituloComparacion").textContent = `${nombreMesActual} comparado con ${nombreMesPrevio.toLowerCase()}`;
  const cont = document.getElementById("comparacion");
  if (!prev.cantidad) { cont.innerHTML = vacio("bi-bar-chart", `Aún no hay movimientos en ${nombreMesPrevio.toLowerCase()} para comparar.`); return; }

  const filas = [
    { titulo: "Ingresos", a: act.ingresos, p: prev.ingresos, bueno: "sube", color: "var(--money-in)" },
    { titulo: "Gastos", a: act.gastos, p: prev.gastos, bueno: "baja", color: "var(--money-out)" },
    { titulo: "Te quedó", a: act.ingresos - act.gastos, p: prev.ingresos - prev.gastos, bueno: "sube", color: "var(--system-blue)" },
  ];
  const maximo = Math.max(1, ...filas.flatMap((f) => [Math.abs(f.a), Math.abs(f.p)]));

  cont.innerHTML = filas.map((f) => {
    const cambio = f.p !== 0 ? Math.round(((f.a - f.p) / Math.abs(f.p)) * 100) : null;
    let chip = "";
    if (cambio !== null) {
      const mejora = f.bueno === "sube" ? cambio >= 0 : cambio <= 0;
      chip = `<span class="chip chip-${cambio === 0 ? "otro" : mejora ? "ingreso" : "gasto"}">${cambio > 0 ? "↑" : cambio < 0 ? "↓" : "="} ${Math.abs(cambio)}%</span>`;
    }
    return `<div class="comp-fila">
      <div class="comp-cabecera"><strong>${f.titulo}</strong>${chip}</div>
      <div class="comp-barra"><span style="width:${(Math.abs(f.a) / maximo) * 68}%;background:${f.color}"></span><em>${dinero(f.a)}</em></div>
      <div class="comp-barra previa"><span style="width:${(Math.abs(f.p) / maximo) * 68}%"></span><em>${dinero(f.p)}</em></div>
    </div>`;
  }).join("") + `<div class="comp-leyenda"><span><i style="background:var(--system-blue)"></i>${nombreMesActual}</span><span><i class="previa"></i>${nombreMesPrevio}</span></div>`;
}

// ----- Presupuestos del mes -----
function pintarPresupuestos(presupuestos) {
  const cont = document.getElementById("presupuestosResumen");
  const delMes = presupuestos.filter((p) => Number(p.mes) === hoy.getMonth() + 1 && Number(p.anio) === hoy.getFullYear());
  if (!delMes.length) {
    cont.innerHTML = `<div class="list-group-item">${vacio("bi-pie-chart", "No tienes presupuestos este mes.<br><a href='presupuestos.html'>Crea el primero</a>")}</div>`;
    return;
  }
  cont.innerHTML = delMes.slice(0, 4).map((p) => {
    const pct = Number(p.limiteGasto) > 0 ? Math.round((Number(p.gastoActual) / Number(p.limiteGasto)) * 100) : 0;
    const estado = pct > 100 ? "gasto" : pct >= 80 ? "medio" : "ingreso";
    const color = pct > 100 ? "var(--system-red)" : pct >= 80 ? "var(--system-orange)" : "var(--system-green)";
    return `<a href="presupuestos.html" class="list-group-item list-group-item-action pres-item">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>${esc(p.nombreCategoria)}</strong>
        <span class="chip chip-${estado}">${pct}%</span>
      </div>
      <div class="progress mb-1" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><div class="progress-bar" style="width:${Math.min(100, pct)}%;background:${color}"></div></div>
      <small class="text-muted">${dinero(p.gastoActual)} de ${dinero(p.limiteGasto)}</small>
    </a>`;
  }).join("");
}

// ----- Próximos pagos e ingresos fijos -----
function pintarProximosPagos(recurrentes) {
  const cont = document.getElementById("proximosPagos");
  const activos = recurrentes.filter((m) => m.activo).sort((a, b) => String(a.proximaFecha).localeCompare(String(b.proximaFecha))).slice(0, 5);
  if (!activos.length) {
    cont.innerHTML = `<div class="list-group-item">${vacio("bi-arrow-repeat", "No tienes pagos fijos.<br><a href='recurrentes.html'>Agrega uno</a>")}</div>`;
    return;
  }
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  cont.innerHTML = activos.map((m) => {
    const f = new Date(String(m.proximaFecha) + "T00:00:00");
    const dias = Math.round((f - inicioHoy) / 86400000);
    const cuando = dias < 0 ? `Venció hace ${-dias} ${-dias === 1 ? "día" : "días"}` : dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : `En ${dias} días`;
    const clase = { INGRESO: "ingreso", GASTO: "gasto", AHORRO: "ahorro", INVERSION: "inversion" }[m.tipoMovimiento] || "otro";
    return `<div class="list-group-item mov-item">
      <span class="mov-icono chip-${clase}"><i class="bi bi-arrow-repeat"></i></span>
      <span class="mov-texto">
        <strong>${esc(m.nombre || (m.categoria ? m.categoria.nombre : "Pago fijo"))}</strong>
        <small class="${dias < 0 ? "monto-gasto" : "text-muted"}">${cuando} · ${esc(humano(m.frecuencia))}</small>
      </span>
      <span class="mov-monto">${montoConSigno(m.tipoMovimiento, m.montoEstimado)}</span>
    </div>`;
  }).join("");
}

// ----- Metas de ahorro -----
function pintarMetas(metas) {
  const cont = document.getElementById("metasResumen");
  const activas = metas.filter((m) => m.estado === "ACTIVA").slice(0, 3);
  if (!activas.length) {
    cont.innerHTML = `<div class="col-12"><div class="card"><div class="card-body">${vacio("bi-bullseye", "No tienes metas activas.<br><a href='metas.html'>Crea tu primera meta</a>")}</div></div></div>`;
    return;
  }
  cont.innerHTML = activas.map((m) => {
    const pct = m.montoObjetivo > 0 ? Math.round((m.montoActual / m.montoObjetivo) * 100) : 0;
    return `<div class="col-12 col-md-4">
      <a href="metas.html" class="card h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <strong>${esc(m.nombre)}</strong>
            <span class="chip chip-ahorro">${pct}%</span>
          </div>
          <div class="progress mb-2" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar" style="width:${Math.min(100, pct)}%"></div>
          </div>
          <small class="text-muted">${dinero(m.montoActual)} de ${dinero(m.montoObjetivo)}</small>
        </div>
      </a>
    </div>`;
  }).join("");
}

// ----- Carga todo en paralelo; si algo falla, el resto se muestra igual -----
pintarSaludo();
intentar(async () => {
  const pedir = (ruta) => api(ruta).catch(() => []);
  const [registros, metas, categorias, presupuestos, inversiones, notificaciones, recurrentes] = await Promise.all([
    api("/registros"),
    pedir("/metas"),
    pedir("/categorias"),
    pedir(`/presupuestos/usuario/${usuarioId}`),
    pedir(`/inversiones/usuario/${usuarioId}`),
    pedir(`/notificaciones/usuario/${usuarioId}`),
    pedir(`/recurrentes/usuario/${usuarioId}`),
  ]);
  pintarBalance(registros);
  pintarRecientes(registros);
  pintarIndicadores(registros, inversiones, notificaciones, recurrentes);
  pintarGastosPorCategoria(registros, categorias);
  pintarComparacion(registros);
  pintarPresupuestos(presupuestos);
  pintarProximosPagos(recurrentes);
  pintarMetas(metas);
});
