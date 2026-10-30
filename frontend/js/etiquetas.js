menu("etiquetas.html");
let etiquetas = [];

// LISTAR
async function cargar() {
  etiquetas = await api("/etiquetas");
  document.getElementById("tabla").innerHTML =
    etiquetas
      .map(
        (e) => `<tr>
          <td><span class="chip chip-inversion"><i class="bi bi-tag-fill"></i> ${esc(e.nombre)}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" onclick="editar(${e.idEtiqueta})">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar(${e.idEtiqueta})">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="2" class="text-center text-muted">Todavía no hay etiquetas</td></tr>`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    const datos = { nombre: document.getElementById("nombre").value };
    if (id) await api(`/etiquetas/${id}`, "PUT", datos);
    else await api("/etiquetas", "POST", datos);
    mensaje(id ? "Etiqueta actualizada" : "Etiqueta creada");
    limpiar();
    await cargar();
  });
});

// Pasa los datos de la fila al formulario
function editar(id) {
  const e = etiquetas.find((x) => x.idEtiqueta === id);
  document.getElementById("id").value = e.idEtiqueta;
  document.getElementById("nombre").value = e.nombre;
  document.getElementById("tituloForm").textContent = "Editar etiqueta";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("tituloForm").textContent = "Nueva etiqueta";
}

// ELIMINAR
async function eliminar(id) {
  if (!(await confirmar("¿Eliminar esta etiqueta?"))) return;
  intentar(async () => {
    await api(`/etiquetas/${id}`, "DELETE");
    mensaje("Etiqueta eliminada");
    await cargar();
  });
}

intentar(cargar);
