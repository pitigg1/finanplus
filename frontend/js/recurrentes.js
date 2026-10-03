menu("recurrentes.html");
const usuarioId = exigirUsuario();
let recurrentes = [];

async function iniciar() {
  const categorias = await api("/categorias");
  llenarSelect(document.getElementById("categoria"), categorias, "idCategoria", (c) => `${c.nombre} (${c.tipo})`, "-- Elige --");
  await cargar();
}

// LISTAR
async function cargar() {
  recurrentes = await api(`/recurrentes/usuario/${usuarioId}`);
  document.getElementById("tabla").innerHTML =
    recurrentes
      .map(
        (m) => `<tr>
          <td>${esc(m.categoria.nombre)}</td>
          <td>${m.tipoMovimiento}</td>
          <td class="text-end">${dinero(m.montoEstimado)}</td>
          <td>${m.frecuencia}</td>
          <td>${m.proximaFecha}</td>
          <td>${m.activo ? '<span class="badge text-bg-success">Activo</span>' : '<span class="badge text-bg-secondary">Pausado</span>'}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-secondary" onclick="pausarActivar('${m.idRecurrencia}')">${m.activo ? "Pausar" : "Activar"}</button>
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${m.idRecurrencia}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${m.idRecurrencia}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="7" class="text-center text-muted">No hay movimientos recurrentes</td></tr>`;
}

// Arma el JSON que espera el backend
function armarDatos(idCategoria, tipo, monto, frecuencia, proximaFecha, activo) {
  return {
    usuario: { idUsuario: usuarioId },
    categoria: { idCategoria: idCategoria },
    tipoMovimiento: tipo,
    montoEstimado: monto,
    frecuencia: frecuencia,
    proximaFecha: proximaFecha,
    activo: activo,
  };
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    const datos = armarDatos(
      Number(document.getElementById("categoria").value),
      document.getElementById("tipo").value,
      Number(document.getElementById("monto").value),
      document.getElementById("frecuencia").value,
      document.getElementById("fecha").value,
      document.getElementById("activo").checked
    );
    if (id) await api(`/recurrentes/${id}`, "PUT", datos);
    else await api("/recurrentes", "POST", datos);
    mensaje(id ? "Movimiento actualizado" : "Movimiento creado");
    limpiar();
    await cargar();
  });
});

// Cambia entre activo y pausado
function pausarActivar(id) {
  const m = recurrentes.find((x) => x.idRecurrencia === id);
  intentar(async () => {
    await api(`/recurrentes/${id}`, "PUT",
      armarDatos(m.categoria.idCategoria, m.tipoMovimiento, m.montoEstimado, m.frecuencia, m.proximaFecha, !m.activo));
    mensaje(m.activo ? "Movimiento pausado" : "Movimiento activado");
    await cargar();
  });
}

function editar(id) {
  const m = recurrentes.find((x) => x.idRecurrencia === id);
  document.getElementById("id").value = m.idRecurrencia;
  document.getElementById("categoria").value = m.categoria.idCategoria;
  document.getElementById("tipo").value = m.tipoMovimiento;
  document.getElementById("monto").value = m.montoEstimado;
  document.getElementById("frecuencia").value = m.frecuencia;
  document.getElementById("fecha").value = m.proximaFecha;
  document.getElementById("activo").checked = m.activo;
  document.getElementById("tituloForm").textContent = "Editar movimiento recurrente";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("tituloForm").textContent = "Nuevo movimiento recurrente";
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar este movimiento recurrente?")) return;
  intentar(async () => {
    await api(`/recurrentes/${id}`, "DELETE");
    mensaje("Movimiento eliminado");
    await cargar();
  });
}

intentar(iniciar);
