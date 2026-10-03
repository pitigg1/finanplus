menu("notificaciones.html");
const usuarioId = exigirUsuario();
let notificaciones = [];

// LISTAR (las notificaciones las crea el sistema, aquí solo se leen y se borran)
async function cargar() {
  notificaciones = await api(`/notificaciones/usuario/${usuarioId}`);
  document.getElementById("tabla").innerHTML =
    notificaciones
      .map(
        (n) => `<tr class="${n.leida ? "" : "table-info"}">
          <td>${n.leida ? '<span class="badge text-bg-secondary">Leída</span>' : '<span class="badge text-bg-primary">Nueva</span>'}</td>
          <td><strong>${esc(n.titulo)}</strong><br><small class="text-muted">${esc(n.mensaje)}</small></td>
          <td>${n.tipoAlerta}</td>
          <td>${n.nivelPrioridad}</td>
          <td>${fecha(n.fechaGeneracion)}</td>
          <td class="text-end text-nowrap">
            ${n.leida ? "" : `<button class="btn btn-sm btn-outline-primary" onclick="marcarLeida('${n.idNotificacion}')">Marcar leída</button>`}
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${n.idNotificacion}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="6" class="text-center text-muted">No hay notificaciones</td></tr>`;

  const sinLeer = notificaciones.filter((n) => !n.leida).length;
  document.getElementById("resumen").textContent = `${sinLeer} sin leer de ${notificaciones.length}`;
}

// ACTUALIZAR: marcar como leída
function marcarLeida(id) {
  const n = notificaciones.find((x) => x.idNotificacion === id);
  intentar(async () => {
    await api(`/notificaciones/${id}`, "PUT", { ...n, leida: true });
    await cargar();
  });
}

function marcarTodas() {
  intentar(async () => {
    for (const n of notificaciones.filter((x) => !x.leida)) {
      await api(`/notificaciones/${n.idNotificacion}`, "PUT", { ...n, leida: true });
    }
    mensaje("Todas las notificaciones quedaron leídas");
    await cargar();
  });
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar esta notificación?")) return;
  intentar(async () => {
    await api(`/notificaciones/${id}`, "DELETE");
    mensaje("Notificación eliminada");
    await cargar();
  });
}

intentar(cargar);
