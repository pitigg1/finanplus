// ===== Código compartido por todas las páginas =====
const API = "http://localhost:8094/api";

// Hace una petición al backend y devuelve el JSON de la respuesta (o null si viene vacía)
async function api(ruta, metodo = "GET", datos = null) {
  let respuesta;
  try {
    respuesta = await fetch(API + ruta, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor. ¿Está encendido el backend?");
  }
  if (!respuesta.ok) {
    let mensaje = "Error " + respuesta.status;
    try {
      const error = await respuesta.json();
      if (error.message) mensaje = error.message;
    } catch (e) {}
    throw new Error(mensaje);
  }
  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : null;
}

// Muestra un aviso de Bootstrap arriba de la página (tipo: success, danger, warning, info)
function mensaje(texto, tipo = "success") {
  document.getElementById("alerta").innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${esc(texto)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>`;
}

// Ejecuta una función y, si falla, muestra el error en rojo
async function intentar(funcion) {
  try {
    await funcion();
  } catch (e) {
    mensaje(e.message, "danger");
  }
}

// Evita que un texto rompa el HTML
function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// 1500000 -> "$ 1.500.000"
function dinero(valor) {
  return Number(valor ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

// "2026-10-02T13:00:00" -> "2026-10-02 13:00"
function fecha(valor) {
  return valor ? String(valor).replace("T", " ").slice(0, 16) : "";
}

// Fecha y hora actual en el formato que espera el backend (LocalDateTime)
function ahora() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19);
}

// Llena un <select> con una lista
function llenarSelect(select, lista, campoValor, textoDe, primeraOpcion) {
  select.innerHTML =
    `<option value="">${primeraOpcion}</option>` +
    lista.map((x) => `<option value="${esc(x[campoValor])}">${esc(textoDe(x))}</option>`).join("");
}

// ----- Usuario activo: se elige en Inicio y se guarda en el navegador -----
function usuarioActual() {
  return localStorage.getItem("usuarioId");
}

function exigirUsuario() {
  const id = usuarioActual();
  if (!id) {
    alert("Primero elige un usuario en Inicio");
    location.href = "index.html";
  }
  return id;
}

// ----- Menú superior (igual en todas las páginas) -----
function menu(paginaActual) {
  const enlace = (href, texto) =>
    `<li><a class="dropdown-item ${href === paginaActual ? "active" : ""}" href="${href}">${texto}</a></li>`;
  document.getElementById("menu").innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand fw-bold" href="index.html">FinanPlus</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal" aria-label="Abrir menú">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menuPrincipal">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link ${paginaActual === "index.html" ? "active" : ""}" href="index.html">Inicio</a></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Finanzas</a>
              <ul class="dropdown-menu">
                ${enlace("registros.html", "Registros")}
                ${enlace("presupuestos.html", "Presupuestos")}
                ${enlace("recurrentes.html", "Movimientos recurrentes")}
                ${enlace("metas.html", "Metas de ahorro")}
                ${enlace("inversiones.html", "Inversiones")}
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Organización</a>
              <ul class="dropdown-menu">
                ${enlace("categorias.html", "Categorías")}
                ${enlace("etiquetas.html", "Etiquetas")}
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Análisis</a>
              <ul class="dropdown-menu">
                ${enlace("metricas.html", "Métricas")}
                ${enlace("recomendaciones.html", "Recomendaciones IA")}
                ${enlace("notificaciones.html", "Notificaciones")}
              </ul>
            </li>
            <li class="nav-item"><a class="nav-link ${paginaActual === "usuarios.html" ? "active" : ""}" href="usuarios.html">Usuarios</a></li>
          </ul>
          <span class="navbar-text" id="usuarioMenu"></span>
        </div>
      </div>
    </nav>`;

  // Muestra el nombre del usuario activo en el menú
  const id = usuarioActual();
  if (id) {
    api(`/usuarios/${id}`)
      .then((u) => (document.getElementById("usuarioMenu").textContent = "Usuario: " + u.nombre))
      .catch(() => {});
  }
}
