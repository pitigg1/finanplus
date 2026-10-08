menu("registros.html");
const usuarioId = exigirUsuario();
let registros = [];
let categorias = [];
let etiquetas = [];

async function iniciar() {
  categorias = await api("/categorias");
  etiquetas = await api("/etiquetas");
  llenarSelect(document.getElementById("categoria"), categorias, "idCategoria", (c) => `${c.nombre} (${c.tipo})`, "-- Elige --");
  pintarEtiquetasFormulario();
  limpiar();
  await cargar();
}

// Al elegir la categoría, el tipo se llena solo con el tipo de esa categoría
document.getElementById("categoria").addEventListener("change", (e) => {
  const categoria = categorias.find((c) => String(c.idCategoria) === e.target.value);
  if (categoria) document.getElementById("tipo").value = categoria.tipo;
});

// Botones para marcar etiquetas en el formulario (tabla Registro_Etiqueta)
function pintarEtiquetasFormulario() {
  document.getElementById("etiquetasForm").innerHTML = etiquetas.length
    ? etiquetas
        .map(
          (e) => `<input type="checkbox" class="btn-check" id="etq-${e.idEtiqueta}" value="${e.idEtiqueta}" autocomplete="off">
            <label class="btn btn-outline-info btn-sm" for="etq-${e.idEtiqueta}">${esc(e.nombre)}</label>`
        )
        .join("")
    : `<span class="text-muted small">No hay etiquetas. Créalas en <a href="etiquetas.html">Etiquetas</a>.</span>`;
}

// Ids de las etiquetas marcadas en el formulario
function etiquetasMarcadas() {
  return [...document.querySelectorAll("#etiquetasForm .btn-check:checked")].map((c) => Number(c.value));
}

// LISTAR
async function cargar() {
  registros = await api("/registros");
  document.getElementById("tabla").innerHTML =
    registros
      .map((r) => {
        // el backend devuelve los nombres de las etiquetas del registro
        const puestas = (r.etiquetas || []).map((nombre) => `<span class="badge text-bg-info me-1">${esc(nombre)}</span>`).join("");
        return `<tr>
          <td>${fecha(r.fechaMovimiento)}</td>
          <td>${r.tipoMovimiento}</td>
          <td>${esc(r.nombreCategoria || "Sin categoría")}</td>
          <td>${esc(r.descripcion)}</td>
          <td class="text-end">${dinero(r.monto)}</td>
          <td>${puestas || '<span class="text-muted small">—</span>'}</td>
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

  const idCategoriaVal = document.getElementById("categoria").value;
  if (!idCategoriaVal) {
    mensaje("Debes seleccionar una categoría", "warning");
    return;
  }

  intentar(async () => {
    const id = document.getElementById("id").value;
    const existente = registros.find((x) => x.idRegistro === id);

    // Estructura de RegistroFinancieroRequestDTO
    const datos = {
      idCategoria: Number(idCategoriaVal),
      tipoMovimiento: document.getElementById("tipo").value,
      monto: leerMonto("monto"),
      descripcion: document.getElementById("descripcion").value,
      fechaMovimiento: document.getElementById("fecha").value,
      esRecurrente: existente ? existente.esRecurrente : false,
      idsEtiquetas: etiquetasMarcadas(), // lista vacía = sin etiquetas
    };

    if (id) {
      await api(`/registros/${id}`, "PUT", datos);
    } else {
      await api("/registros", "POST", datos);
    }

    mensaje(id ? "Registro actualizado" : "Registro creado");
    limpiar();
    await cargar();
  });
});

function editar(id) {
  const r = registros.find((x) => x.idRegistro === id);
  if (!r) return;

  document.getElementById("id").value = r.idRegistro;
  document.getElementById("categoria").value = r.idCategoria;
  document.getElementById("tipo").value = r.tipoMovimiento;
  ponerMonto("monto", r.monto);
  document.getElementById("descripcion").value = r.descripcion || "";
  document.getElementById("fecha").value = String(r.fechaMovimiento).slice(0, 16);
  // marca las etiquetas que ya tiene (los nombres de etiqueta son únicos)
  const nombres = r.etiquetas || [];
  etiquetas.forEach((e) => (document.getElementById(`etq-${e.idEtiqueta}`).checked = nombres.includes(e.nombre)));
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

intentar(iniciar);
