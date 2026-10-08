menu("metricas.html");
const usuarioId = exigirUsuario();

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// "2026-10-08T17:10:00" -> "octubre 2026"
function nombreMes(fechaTexto) {
  const [anio, mes] = String(fechaTexto).split("-");
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

// 99.88 -> "99,88"  ·  20 -> "20"  (sin redondear a entero, para no mostrar 100% cuando es 99,88%)
function porcentaje(valor) {
  return Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

function colorRiesgo(riesgo) {
  return { BAJO: "success", MEDIO: "warning", ALTO: "danger" }[riesgo] || "secondary";
}

// Una tarjeta con el número grande y una frase que lo explica
function tarjeta(titulo, valor, explicacion, colorTexto = "") {
  return `<div class="col-12 col-md-6 col-lg-4">
    <div class="card h-100">
      <div class="card-body">
        <div class="text-muted small">${titulo}</div>
        <div class="fs-3 fw-bold ${colorTexto}">${valor}</div>
        <div class="small mt-1">${explicacion}</div>
      </div>
    </div>
  </div>`;
}

// Las tarjetas del mes con frases que explican cada número
function pintarTarjetas(m) {
  document.getElementById("tituloMes").textContent = "Mes de " + nombreMes(m.fechaCalculo);
  const ingresos = Number(m.ingresosTotales);
  const gastos = Number(m.gastosTotales);
  const flujo = Number(m.flujoNeto);

  if (ingresos === 0 && gastos === 0) {
    document.getElementById("tarjetas").innerHTML =
      `<div class="col-12"><div class="card"><div class="card-body text-muted">Este mes todavía no tienes ingresos ni gastos registrados.</div></div></div>`;
    return;
  }

  const textoFlujo =
    flujo > 0 ? `Te sobraron ${dinero(flujo)}: ganaste más de lo que gastaste.`
    : flujo < 0 ? `Te faltaron ${dinero(-flujo)}: gastaste más de lo que ganaste.`
    : "Gastaste exactamente lo que ganaste.";

  const textoTasa =
    m.tasaAhorro == null ? "No se puede calcular porque no registraste ingresos este mes."
    : Number(m.tasaAhorro) >= 0 ? `De cada $100 que ganaste, te quedaron $${porcentaje(m.tasaAhorro)}.`
    : `Gastaste ${porcentaje(Math.abs(Number(m.tasaAhorro)))}% más de lo que ganaste.`;

  const textoRiesgo =
    m.nivelRiesgo === "BAJO" ? "Vas muy bien: ahorras el 20% o más de lo que ganas."
    : m.nivelRiesgo === "MEDIO" ? "Ahorras algo, pero menos del 20% recomendado."
    : m.nivelRiesgo === "ALTO" ? (ingresos === 0 ? "Tuviste gastos sin ningún ingreso registrado." : "Estás gastando más de lo que ganas.")
    : "Sin datos suficientes.";

  document.getElementById("tarjetas").innerHTML =
    tarjeta("Ingresos", dinero(ingresos), "Todo el dinero que te entró este mes.", "text-success") +
    tarjeta("Gastos", dinero(gastos), "Todo el dinero que salió este mes.", "text-danger") +
    tarjeta("Flujo neto", dinero(flujo), textoFlujo, flujo < 0 ? "text-danger" : "text-success") +
    tarjeta("Tasa de ahorro", m.tasaAhorro == null ? "—" : porcentaje(m.tasaAhorro) + "%", textoTasa) +
    tarjeta("Score financiero", m.scoreFinanciero == null ? "—" : Math.round(Number(m.scoreFinanciero)) + " / 100",
      "Una nota de 0 a 100: entre más ahorras, más alta.") +
    tarjeta("Riesgo", m.nivelRiesgo
      ? `<span class="badge text-bg-${colorRiesgo(m.nivelRiesgo)}">${m.nivelRiesgo}</span>` : "—", textoRiesgo);
}

// LISTAR (solo lectura: las métricas las calcula el backend, una por mes)
async function cargar() {
  const metricas = await api(`/metricas/usuario/${usuarioId}`);
  metricas.sort((a, b) => String(b.fechaCalculo).localeCompare(String(a.fechaCalculo))); // más reciente primero

  if (metricas.length) pintarTarjetas(metricas[0]);
  else document.getElementById("tarjetas").innerHTML =
    `<div class="col-12"><div class="card"><div class="card-body text-muted">Aún no hay métricas. Pulsa «Calcular este mes».</div></div></div>`;

  document.getElementById("tabla").innerHTML =
    metricas
      .map(
        (m) => `<tr>
          <td class="text-capitalize">${nombreMes(m.fechaCalculo)}</td>
          <td class="text-end">${dinero(m.ingresosTotales)}</td>
          <td class="text-end">${dinero(m.gastosTotales)}</td>
          <td class="text-end ${Number(m.flujoNeto) < 0 ? "text-danger" : ""}">${dinero(m.flujoNeto)}</td>
          <td class="text-end">${m.tasaAhorro == null ? "—" : porcentaje(m.tasaAhorro) + "%"}</td>
          <td class="text-end">${m.scoreFinanciero == null ? "—" : Math.round(Number(m.scoreFinanciero))}</td>
          <td>${m.nivelRiesgo ? `<span class="badge text-bg-${colorRiesgo(m.nivelRiesgo)}">${m.nivelRiesgo}</span>` : "—"}</td>
        </tr>`
      )
      .join("") || `<tr><td colspan="7" class="text-center text-muted">No hay métricas todavía</td></tr>`;
}

// Le pide al backend que calcule (o actualice) la métrica de este mes
function calcular() {
  intentar(async () => {
    await api(`/metricas/usuario/${usuarioId}/calcular`, "POST");
    mensaje("Métrica del mes actualizada");
    await cargar();
  });
}

intentar(cargar);
