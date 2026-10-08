// ===== Código compartido por todas las páginas =====
const API = "http://localhost:8094/api";

function tokenActual() {
  return localStorage.getItem("jwtToken");
}

function usuarioActual() {
  const idDirecta = localStorage.getItem("usuarioId");
  if (idDirecta) return idDirecta;

  const usuarioGuardado = localStorage.getItem("usuario");
  if (usuarioGuardado) {
    try {
      const u = JSON.parse(usuarioGuardado);
      if (u && u.idUsuario) {
        localStorage.setItem("usuarioId", u.idUsuario); // Sincroniza la clave
        return u.idUsuario;
      }
    } catch (e) {}
  }

  return null;
}

// Redirige a login.html si no hay token o idUsuario en el navegador
function exigirUsuario() {
  const id = usuarioActual();
  const token = tokenActual();
  if (!id || !token) {
    location.href = "login.html";
    return null;
  }
  return id;
}

// Cierra la sesión y borra los datos del navegador
function cerrarSesion() {
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("usuarioId");
  localStorage.removeItem("usuario");
  location.href = "login.html";
}

// Hace una petición al backend adjuntando el Token JWT
async function api(ruta, metodo = "GET", datos = null) {
  let respuesta;
  const headers = { "Content-Type": "application/json" };
  const token = tokenActual();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    respuesta = await fetch(API + ruta, {
      method: metodo,
      headers: headers,
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor. ¿Está encendido el backend?");
  }

  // Si el token expiró o es inválido, redirige a login.html
  if (respuesta.status === 401 || respuesta.status === 403) {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("usuarioId");
    location.href = "login.html";
    throw new Error("Sesión expirada. Inicia sesión nuevamente.");
  }

  if (!respuesta.ok) {
    let mensaje = "Error " + respuesta.status;
    try {
      const error = await respuesta.json();
      if (error.message) mensaje = error.message;
    } catch (e) {}
    throw new Error(mensaje);
  }

  if (respuesta.status === 204) return null;
  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : null;
}

// Muestra un aviso de Bootstrap arriba de la página
function mensaje(texto, tipo = "success") {
  const alertaDiv = document.getElementById("alerta");
  if (!alertaDiv) return;
  alertaDiv.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      ${esc(texto)}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>`;
}

// Ejecuta una función y, si falla, muestra el error
async function intentar(funcion) {
  try {
    await funcion();
  } catch (e) {
    mensaje(e.message, "danger");
  }
}

// Escapa caracteres especiales
function esc(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Formato moneda COP
function dinero(valor) {
  return Number(valor ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

// Formato fecha
function fecha(valor) {
  return valor ? String(valor).replace("T", " ").slice(0, 16) : "";
}

// Fecha y hora actual
function ahora() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19);
}

// Llena un <select> con una lista
function llenarSelect(select, lista, campoValor, textoDe, primeraOpcion) {
  if (!select) return;
  select.innerHTML =
    `<option value="">${primeraOpcion}</option>` +
    lista.map((x) => `<option value="${esc(x[campoValor])}">${esc(textoDe(x))}</option>`).join("");
}

// Menú superior dinámico
function menu(paginaActual) {
  const enlace = (href, texto) =>
    `<li><a class="dropdown-item ${href === paginaActual ? "active" : ""}" href="${href}">${texto}</a></li>`;
  
  const menuDiv = document.getElementById("menu");
  if (!menuDiv) return;

  menuDiv.innerHTML = `
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
          <div class="d-flex align-items-center text-white gap-3" id="usuarioMenu"></div>
        </div>
      </div>
    </nav>`;

  const token = tokenActual();
  const contenedorUsuario = document.getElementById("usuarioMenu");

  if (token && contenedorUsuario) {
    api("/usuarios/perfil")
      .then((u) => {
        contenedorUsuario.innerHTML = `
          <span class="small">Hola, <strong>${esc(u.nombre)}</strong></span>
          <button class="btn btn-outline-light btn-sm" onclick="cerrarSesion()">Cerrar sesión</button>
        `;
      })
      .catch(() => {
        contenedorUsuario.innerHTML = `<a href="login.html" class="btn btn-outline-light btn-sm">Iniciar sesión</a>`;
      });
  } else if (contenedorUsuario) {
    contenedorUsuario.innerHTML = `<a href="login.html" class="btn btn-outline-light btn-sm">Iniciar sesión</a>`;
  }
}