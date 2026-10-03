menu("recomendaciones.html");
const usuarioId = exigirUsuario();
let recomendaciones = [];

// LISTAR (las recomendaciones las genera el sistema, aquí solo se ven, se marcan y se borran)
async function cargar() {
  recomendaciones = await api(`/recomendaciones/usuario/${usuarioId}`);
  document.getElementById("tabla").innerHTML =
    recomendaciones
      .map(
        (r) => `<tr>
          <td><strong>${esc(r.titulo)}</strong><br><small class="text-muted">${esc(r.descripcion)}</small></td>
          <td>${esc(r.tipoRecomendacion)}</td>
          <td>${r.nivelPrioridad}</td>
          <td class="text-end">${r.scoreConfianza == null ? "-" : r.scoreConfianza + "%"}</td>
          <td>${fecha(r.fechaGeneracion)}</td>
          <td>${r.fueAplicada ? '<span class="badge text-bg-success">Sí</span>' : '<span class="badge text-bg-secondary">No</span>'}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-success" onclick="marcar('${r.idRecomendacion}')">${r.fueAplicada ? "Desmarcar" : "Marcar aplicada"}</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${r.idRecomendacion}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="7" class="text-center text-muted">No hay recomendaciones</td></tr>`;
}

// ACTUALIZAR: marcar o desmarcar como aplicada
function marcar(id) {
  const r = recomendaciones.find((x) => x.idRecomendacion === id);
  intentar(async () => {
    await api(`/recomendaciones/${id}`, "PUT", { ...r, fueAplicada: !r.fueAplicada });
    mensaje("Recomendación actualizada");
    await cargar();
  });
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar esta recomendación?")) return;
  intentar(async () => {
    await api(`/recomendaciones/${id}`, "DELETE");
    mensaje("Recomendación eliminada");
    await cargar();
  });
}

intentar(cargar);
