menu("registros.html");
const usuarioId = exigirUsuario();
let registros = [];
let etiquetas = [];

async function iniciar() {
  const categorias = await api("/categorias");
  etiquetas = await api("/etiquetas");
  llenarSelect(document.getElementById("categoria"), categorias, "idCategoria", (c) => `${c.nombre} (${c.tipo})`, "-- Elige --");
  limpiar();
  await cargar();
}

// LISTAR (cada registro con sus etiquetas: tabla Registro_Etiqueta)
async function cargar() {
  registros = await api(`/registros/usuario/${usuarioId}`);
  for (const r of registros) {
    r.etiquetas = await api(`/registros/${r.idRegistro}/etiquetas`);
  }
  document.getElementById("tabla").innerHTML =
    registros
      .map((r) => {
        // etiquetas que ya tiene (con botón para quitar)
        const puestas = r.etiquetas
          .map((t) => `<span class="badge text-bg-info me-1">${esc(t.nombre)}
             <a href="#" class="text-white text-decoration-none" onclick="quitarEtiqueta('${r.idRegistro}', ${t.idEtiqueta}); return false;">×</a></span>`)
          .join("");
        // etiquetas que se le pueden agregar
        const libres = etiquetas.filter((e) => !r.etiquetas.some((t) => t.idEtiqueta === e.idEtiqueta));
        const selector = libres.length
          ? `<select class="form-select form-select-sm d-inline-block w-auto mt-1" onchange="ponerEtiqueta('${r.idRegistro}', this.value)">
               <option value="">+ etiqueta</option>
               ${libres.map((e) => `<option value="${e.idEtiqueta}">${esc(e.nombre)}</option>`).join("")}
             </select>`
          : "";
        return `<tr>
          <td>${fecha(r.fechaMovimiento)}</td>
          <td>${r.tipoMovimiento}</td>
          <td>${esc(r.categoria.nombre)}</td>
          <td>${esc(r.descripcion)}</td>
          <td class="text-end">${dinero(r.monto)}</td>
          <td>${puestas} ${selector}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${r.idRegistro}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${r.idRegistro}')">Eliminar</button>
          </td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="7" class="text-center text-muted">No hay registros</td></tr>`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    const existente = registros.find((x) => x.idRegistro === id);
    const datos = {
      usuario: { idUsuario: usuarioId },
      categoria: { idCategoria: Number(document.getElementById("categoria").value) },
      tipoMovimiento: document.getElementById("tipo").value,
      monto: Number(document.getElementById("monto").value),
      descripcion: document.getElementById("descripcion").value,
      fechaMovimiento: document.getElementById("fecha").value,
      esRecurrente: existente ? existente.esRecurrente : false,
    };
    if (id) await api(`/registros/${id}`, "PUT", datos);
    else await api("/registros", "POST", datos);
    mensaje(id ? "Registro actualizado" : "Registro creado");
    limpiar();
    await cargar();
  });
});

function editar(id) {
  const r = registros.find((x) => x.idRegistro === id);
  document.getElementById("id").value = r.idRegistro;
  document.getElementById("categoria").value = r.categoria.idCategoria;
  document.getElementById("tipo").value = r.tipoMovimiento;
  document.getElementById("monto").value = r.monto;
  document.getElementById("descripcion").value = r.descripcion || "";
  document.getElementById("fecha").value = String(r.fechaMovimiento).slice(0, 16);
  document.getElementById("tituloForm").textContent = "Editar registro";
  window.scrollTo(0, 0);
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("fecha").value = ahora().slice(0, 16);
  document.getElementById("tituloForm").textContent = "Nuevo registro";
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar este registro?")) return;
  intentar(async () => {
    await api(`/registros/${id}`, "DELETE");
    mensaje("Registro eliminado");
    await cargar();
  });
}

// ETIQUETAS DEL REGISTRO (tabla Registro_Etiqueta)
function ponerEtiqueta(idRegistro, idEtiqueta) {
  if (!idEtiqueta) return;
  intentar(async () => {
    await api(`/registros/${idRegistro}/etiquetas/${idEtiqueta}`, "POST");
    await cargar();
  });
}

function quitarEtiqueta(idRegistro, idEtiqueta) {
  intentar(async () => {
    await api(`/registros/${idRegistro}/etiquetas/${idEtiqueta}`, "DELETE");
    await cargar();
  });
}

intentar(iniciar);
