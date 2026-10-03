menu("categorias.html");
let categorias = [];

// LISTAR
async function cargar() {
  categorias = await api("/categorias");
  document.getElementById("tabla").innerHTML =
    categorias
      .map(
        (c) => `<tr>
          <td>${c.idCategoria}</td>
          <td>${esc(c.nombre)}</td>
          <td><span class="badge text-bg-secondary">${c.tipo}</span></td>
          <td>${esc(c.icono)}</td>
          <td>${esc(c.color)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" onclick="editar(${c.idCategoria})">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar(${c.idCategoria})">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="6" class="text-center text-muted">No hay categorías</td></tr>`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    const datos = {
      nombre: document.getElementById("nombre").value,
      tipo: document.getElementById("tipo").value,
      icono: document.getElementById("icono").value,
      color: document.getElementById("color").value,
    };
    if (id) await api(`/categorias/${id}`, "PUT", datos);
    else await api("/categorias", "POST", datos);
    mensaje(id ? "Categoría actualizada" : "Categoría creada");
    limpiar();
    await cargar();
  });
});

function editar(id) {
  const c = categorias.find((x) => x.idCategoria === id);
  document.getElementById("id").value = c.idCategoria;
  document.getElementById("nombre").value = c.nombre;
  document.getElementById("tipo").value = c.tipo;
  document.getElementById("icono").value = c.icono || "";
  document.getElementById("color").value = c.color || "";
  document.getElementById("tituloForm").textContent = "Editar categoría";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("tituloForm").textContent = "Nueva categoría";
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar esta categoría?")) return;
  intentar(async () => {
    await api(`/categorias/${id}`, "DELETE");
    mensaje("Categoría eliminada");
    await cargar();
  });
}

intentar(cargar);
