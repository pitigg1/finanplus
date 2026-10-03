menu("metricas.html");
const usuarioId = exigirUsuario();

// LISTAR (solo lectura: las métricas las calcula el backend)
async function cargar() {
  const metricas = await api(`/metricas/usuario/${usuarioId}`);
  document.getElementById("tabla").innerHTML =
    metricas
      .map(
        (m) => `<tr>
          <td>${fecha(m.fechaCalculo)}</td>
          <td class="text-end">${dinero(m.ingresosTotales)}</td>
          <td class="text-end">${dinero(m.gastosTotales)}</td>
          <td class="text-end">${dinero(m.flujoNeto)}</td>
          <td class="text-end">${m.tasaAhorro == null ? "-" : m.tasaAhorro + "%"}</td>
          <td class="text-end">${m.scoreFinanciero ?? "-"}</td>
          <td>${m.nivelRiesgo ?? "-"}</td>
        </tr>`
      )
      .join("") || `<tr><td colspan="7" class="text-center text-muted">No hay métricas. Pulsa «Calcular ahora».</td></tr>`;
}

// Le pide al backend que calcule una métrica nueva
function calcular() {
  intentar(async () => {
    await api(`/metricas/usuario/${usuarioId}/calcular`, "POST");
    mensaje("Métrica calculada");
    await cargar();
  });
}

intentar(cargar);
