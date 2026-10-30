menu("categorias.html");
let categorias = [];

// Íconos para elegir con un clic (se guardan como emoji en la columna "icono")
const ICONOS = [
  ["🍔", "Comida"], ["🛒", "Mercado"], ["⛽", "Gasolina"], ["🚌", "Transporte"], ["🏠", "Arriendo"],
  ["💡", "Servicios"], ["📱", "Celular e internet"], ["🎬", "Entretenimiento"], ["🎓", "Educación"], ["💊", "Salud"],
  ["👕", "Ropa"], ["🎁", "Regalos"], ["✈️", "Viajes"], ["🐶", "Mascotas"], ["🔧", "Reparaciones"],
  ["🧾", "Impuestos"], ["💳", "Tarjeta de crédito"], ["💼", "Salario"], ["💻", "Freelance"], ["💰", "Ahorro"],
  ["🐷", "Alcancía"], ["📈", "Inversión"], ["🏦", "Banco"], ["❓", "Otro"],
];

// Colores sugeridos (también se puede elegir cualquiera con el selector)
const COLORES = ["#0d6efd", "#6610f2", "#d63384", "#dc3545", "#fd7e14", "#ffc107", "#198754", "#20c997", "#0dcaf0", "#6c757d"];

function pintarIconos() {
  document.getElementById("iconos").innerHTML = ICONOS.map(
    ([emoji, nombre]) =>
      `<button type="button" class="btn btn-outline-secondary fs-5 px-2 py-1" title="${nombre}" data-icono="${emoji}" onclick="elegirIcono('${emoji}')">${emoji}</button>`
  ).join("");
}

function elegirIcono(emoji) {
  // si se vuelve a pulsar el mismo ícono, se quita
  const actual = document.getElementById("icono").value;
  const nuevo = actual === emoji ? "" : emoji;
  document.getElementById("icono").value = nuevo;
  document.getElementById("iconoElegido").textContent = nuevo || "—";
  document.querySelectorAll("#iconos button").forEach((b) => {
    b.classList.toggle("btn-primary", b.dataset.icono === nuevo);
    b.classList.toggle("btn-outline-secondary", b.dataset.icono !== nuevo);
  });
}

function pintarPaleta() {
  document.getElementById("paleta").innerHTML = COLORES.map(
    (c) =>
      `<button type="button" class="btn border rounded-circle p-0" style="width:28px;height:28px;background:${c}" title="${c}"
        onclick="document.getElementById('color').value='${c}'"></button>`
  ).join("");
}

// LISTAR
async function cargar() {
  categorias = await api("/categorias");
  document.getElementById("tabla").innerHTML =
    categorias
      .map(
        (c) => `<tr>
          <td>
            <div class="d-flex align-items-center gap-3">
              <span class="avatar-cat" style="--c:${esc(c.color || "#8E8E93")}">${esc(c.icono) || '<i class="bi bi-tag-fill"></i>'}</span>
              <strong>${esc(c.nombre)}</strong>
            </div>
          </td>
          <td>${chipTipo(c.tipo)}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" onclick="editar(${c.idCategoria})">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar(${c.idCategoria})">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="3" class="text-center text-muted">Todavía no hay categorías</td></tr>`;
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
  document.getElementById("icono").value = "";
  elegirIcono(c.icono || "");
  document.getElementById("color").value = /^#[0-9a-fA-F]{6}$/.test(c.color || "") ? c.color : "#0d6efd";
  document.getElementById("tituloForm").textContent = "Editar categoría";
  window.scrollTo(0, 0);
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("icono").value = "";
  elegirIcono("");
  document.getElementById("color").value = "#0d6efd";
  document.getElementById("tituloForm").textContent = "Nueva categoría";
}

// ELIMINAR
async function eliminar(id) {
  if (!(await confirmar("¿Eliminar esta categoría?"))) return;
  intentar(async () => {
    await api(`/categorias/${id}`, "DELETE");
    mensaje("Categoría eliminada");
    await cargar();
  });
}

pintarIconos();
pintarPaleta();
intentar(cargar);
