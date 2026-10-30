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

// Muestra un aviso flotante (tipo notificación de iOS) que se cierra solo
function mensaje(texto, tipo = "success") {
  const alertaDiv = document.getElementById("alerta");
  if (!alertaDiv) return;
  const icono = { success: "check-circle-fill", danger: "exclamation-triangle-fill", warning: "exclamation-circle-fill", info: "info-circle-fill" }[tipo] || "info-circle-fill";
  alertaDiv.innerHTML = `
    <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
      <i class="bi bi-${icono}"></i><span>${esc(texto)}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>`;
  clearTimeout(window._temporizadorAviso);
  window._temporizadorAviso = setTimeout(() => {
    const aviso = alertaDiv.querySelector(".alert");
    if (aviso) bootstrap.Alert.getOrCreateInstance(aviso).close();
  }, tipo === "danger" ? 7000 : 3500);
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

// ----- Campos de monto con puntos de miles (1500000 -> 1.500.000) -----
// En el HTML se marcan con class="monto". Se ven con puntos, pero al backend se envía el número limpio.

// Pone los puntos mientras se escribe, sin mover el cursor de lugar
function formatearMonto(input) {
  const posicion = input.selectionStart ?? input.value.length;
  const digitosALaDerecha = input.value.slice(posicion).replace(/\D/g, "").length;
  const digitos = input.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  input.value = digitos ? Number(digitos).toLocaleString("es-CO") : "";
  // deja el cursor con la misma cantidad de dígitos a su derecha que antes
  let i = input.value.length;
  let contados = 0;
  while (i > 0 && contados < digitosALaDerecha) {
    i--;
    if (/\d/.test(input.value[i])) contados++;
  }
  input.setSelectionRange(i, i);
}

// Lee un campo de monto y devuelve el número sin puntos ("1.500.000" -> 1500000)
function leerMonto(id) {
  const digitos = document.getElementById(id).value.replace(/\D/g, "");
  return digitos ? Number(digitos) : 0;
}

// Escribe un número en un campo de monto ya formateado (1500000 -> "1.500.000")
function ponerMonto(id, valor) {
  document.getElementById(id).value = valor ? Math.round(Number(valor)).toLocaleString("es-CO") : "";
}

// Activa el formato en todos los campos con class="monto" de la página
document.addEventListener("input", (e) => {
  if (e.target.classList && e.target.classList.contains("monto")) formatearMonto(e.target);
});

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

// ----- Ayudantes de presentación (chips de colores y montos con signo) -----
function chipTipo(tipo) {
  const c = { INGRESO: "ingreso", GASTO: "gasto", AHORRO: "ahorro", INVERSION: "inversion" }[tipo] || "otro";
  return `<span class="chip chip-${c}">${esc(tipo)}</span>`;
}

function chipEstado(estado) {
  const c = { ACTIVA: "ingreso", COMPLETADA: "ahorro", CANCELADA: "otro" }[estado] || "otro";
  return `<span class="chip chip-${c}">${esc(estado)}</span>`;
}

function chipRiesgo(riesgo) {
  const c = { BAJO: "ingreso", MEDIO: "medio", ALTO: "gasto" }[riesgo] || "otro";
  return `<span class="chip chip-${c}">${esc(riesgo)}</span>`;
}

// +$ 3.200.000 en verde para ingresos, −$ 65.000 en rojo para gastos
function montoConSigno(tipo, monto) {
  const clase = tipo === "INGRESO" ? "monto-ingreso" : tipo === "GASTO" ? "monto-gasto" : "";
  const signo = tipo === "INGRESO" ? "+" : tipo === "GASTO" ? "−" : "";
  return `<span class="${clase}">${signo}${dinero(monto)}</span>`;
}

// Menú: barra superior (computador) + barra de pestañas abajo (celular)
function menu(paginaActual) {
  const enlace = (href, texto, icono) =>
    `<li><a class="dropdown-item ${href === paginaActual ? "active" : ""}" href="${href}"><i class="bi ${icono} me-2"></i>${texto}</a></li>`;
  const pestana = (href, texto, icono) =>
    `<a href="${href}" class="${href === paginaActual ? "activo" : ""}" aria-label="${texto}"><i class="bi ${icono}${href === paginaActual ? "-fill" : ""}"></i><span>${texto}</span></a>`;

  const item = (href, texto, icono) =>
    `<a class="sb-item ${href === paginaActual ? "activo" : ""}" href="${href}"><i class="bi ${icono}"></i><span>${texto}</span></a>`;

  const menuDiv = document.getElementById("menu");
  if (!menuDiv) return;
  document.body.classList.add("con-tabs");

  menuDiv.innerHTML = `
    <nav class="navbar navbar-expand-lg apple-nav d-lg-none" aria-label="Navegación principal">
      <div class="container">
        <a class="navbar-brand" href="index.html"><span class="logo"><i class="bi bi-wallet2"></i></span>FinanPlus</a>
        <button class="btn-tema d-lg-none ms-auto me-1" type="button" onclick="alternarTema()" aria-label="Cambiar entre modo claro y oscuro" title="Modo claro / oscuro">
          <i class="bi bi-moon-stars i-luna"></i><i class="bi bi-sun i-sol"></i>
        </button>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuPrincipal" aria-label="Abrir menú">
          <i class="bi bi-list"></i>
        </button>
        <div class="collapse navbar-collapse" id="menuPrincipal">
          <ul class="navbar-nav me-auto">
            <li class="nav-item"><a class="nav-link ${paginaActual === "index.html" ? "active" : ""}" href="index.html">Inicio</a></li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Finanzas</a>
              <ul class="dropdown-menu">
                ${enlace("registros.html", "Registros", "bi-receipt")}
                ${enlace("presupuestos.html", "Presupuestos", "bi-pie-chart")}
                ${enlace("recurrentes.html", "Movimientos recurrentes", "bi-arrow-repeat")}
                ${enlace("metas.html", "Metas de ahorro", "bi-bullseye")}
                ${enlace("inversiones.html", "Inversiones", "bi-graph-up-arrow")}
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Organización</a>
              <ul class="dropdown-menu">
                ${enlace("categorias.html", "Categorías", "bi-folder2")}
                ${enlace("etiquetas.html", "Etiquetas", "bi-tag")}
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">Análisis</a>
              <ul class="dropdown-menu">
                ${enlace("metricas.html", "Métricas", "bi-speedometer2")}
                ${enlace("recomendaciones.html", "Recomendaciones IA", "bi-stars")}
                ${enlace("notificaciones.html", "Notificaciones", "bi-bell")}
              </ul>
            </li>
            <li class="nav-item"><a class="nav-link ${paginaActual === "usuarios.html" ? "active" : ""}" href="usuarios.html">Usuarios</a></li>
          </ul>
          <button class="btn-tema d-none d-lg-grid me-3" type="button" onclick="alternarTema()" aria-label="Cambiar entre modo claro y oscuro" title="Modo claro / oscuro">
            <i class="bi bi-moon-stars i-luna"></i><i class="bi bi-sun i-sol"></i>
          </button>
          <div class="d-flex align-items-center gap-3 py-2 py-lg-0" id="usuarioMenu"></div>
        </div>
      </div>
    </nav>
    <aside class="sidebar" aria-label="Menú lateral">
      <a class="sb-brand" href="index.html"><span class="logo"><i class="bi bi-wallet2"></i></span>FinanPlus</a>
      <nav>
        ${item("index.html", "Inicio", "bi-house")}
        <div class="sb-seccion">Finanzas</div>
        ${item("registros.html", "Registros", "bi-receipt")}
        ${item("presupuestos.html", "Presupuestos", "bi-pie-chart")}
        ${item("recurrentes.html", "Recurrentes", "bi-arrow-repeat")}
        ${item("metas.html", "Metas de ahorro", "bi-bullseye")}
        ${item("inversiones.html", "Inversiones", "bi-graph-up-arrow")}
        <div class="sb-seccion">Organización</div>
        ${item("categorias.html", "Categorías", "bi-folder2")}
        ${item("etiquetas.html", "Etiquetas", "bi-tag")}
        <div class="sb-seccion">Análisis</div>
        ${item("metricas.html", "Métricas", "bi-speedometer2")}
        ${item("recomendaciones.html", "Recomendaciones IA", "bi-stars")}
        ${item("notificaciones.html", "Notificaciones", "bi-bell")}
        <div class="sb-seccion">Cuenta</div>
        ${item("usuarios.html", "Usuarios", "bi-people")}
      </nav>
      <div class="sb-pie">
        <div class="sb-usuario" id="sbUsuario"></div>
        <div class="sb-acciones">
          <button class="btn-tema" type="button" onclick="alternarTema()" aria-label="Cambiar entre modo claro y oscuro" title="Modo claro / oscuro">
            <i class="bi bi-moon-stars i-luna"></i><i class="bi bi-sun i-sol"></i>
          </button>
          <button class="btn-salir" type="button" onclick="cerrarSesion()"><i class="bi bi-box-arrow-right"></i>Cerrar sesión</button>
        </div>
      </div>
    </aside>
    <nav class="tab-bar" aria-label="Pestañas">
      ${pestana("index.html", "Inicio", "bi-house")}
      ${pestana("registros.html", "Registros", "bi-receipt")}
      ${pestana("metas.html", "Metas", "bi-bullseye")}
      ${pestana("metricas.html", "Métricas", "bi-speedometer2")}
      ${pestana("notificaciones.html", "Alertas", "bi-bell")}
    </nav>`;

  const token = tokenActual();
  const contenedorUsuario = document.getElementById("usuarioMenu");
  const botonLogin = `<a href="login.html" class="btn btn-outline-light btn-sm">Iniciar sesión</a>`;

  if (token && contenedorUsuario) {
    api("/usuarios/perfil")
      .then((u) => {
        const sb = document.getElementById("sbUsuario");
        if (sb) {
          sb.innerHTML = `<span class="sb-avatar">${esc(String(u.nombre).trim().charAt(0).toUpperCase())}</span>
            <span class="sb-nombre"><strong>${esc(u.nombre)}</strong><small>${esc(u.correo || "")}</small></span>`;
        }
        contenedorUsuario.innerHTML = `
          <span class="small">Hola, <strong>${esc(String(u.nombre).split(" ")[0])}</strong></span>
          <button class="btn btn-outline-light btn-sm" onclick="cerrarSesion()">Cerrar sesión</button>`;
      })
      .catch(() => { contenedorUsuario.innerHTML = botonLogin; });
  } else if (contenedorUsuario) {
    contenedorUsuario.innerHTML = botonLogin;
  }
}


// ----- Más chips -----
function chipPrioridad(nivel) {
  const c = { ALTA: "gasto", MEDIA: "medio", BAJA: "ingreso" }[nivel] || "otro";
  return `<span class="chip chip-${c}">${esc(nivel)}</span>`;
}

// "GASTO_ELEVADO" -> "Gasto elevado"
function humano(texto) {
  const t = String(texto ?? "").toLowerCase().replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function chipTexto(texto, clase = "otro") {
  return `<span class="chip chip-${clase}">${esc(texto)}</span>`;
}

// ----- Alerta de confirmación estilo iOS (reemplaza al confirm() del navegador) -----
function confirmar(texto, accion = "Eliminar") {
  return new Promise((resolve) => {
    const el = document.createElement("div");
    el.className = "modal fade alerta-ios";
    el.tabIndex = -1;
    el.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="alerta-cuerpo"><h2>${esc(texto)}</h2><p>Esta acción no se puede deshacer.</p></div>
          <div class="alerta-botones">
            <button type="button" data-r="0">Cancelar</button>
            <button type="button" data-r="1" class="peligro">${esc(accion)}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(el);
    const modal = new bootstrap.Modal(el);
    let resultado = false;
    el.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => { resultado = b.dataset.r === "1"; modal.hide(); })
    );
    el.addEventListener("hidden.bs.modal", () => { el.remove(); resolve(resultado); });
    modal.show();
  });
}

// ----- Formularios como "hoja" (sheet) -----
// El formulario de cada página se mueve a una ventana emergente. Se abre con el botón "Nuevo"
// y al editar; se cierra al guardar o cancelar. La lógica de cada página no cambia.
let hojaModal = null;
let limpiarOriginal = null;

function abrirHoja() {
  if (hojaModal) hojaModal.show();
}

function nuevoDesdeCabecera() {
  if (limpiarOriginal) limpiarOriginal();
  abrirHoja();
}

// Cada campo del formulario se presenta como en Ajustes de iOS:
// fila (etiqueta + valor), interruptor, bloque (paletas, etiquetas), nota,
// selector de opciones (listas cortas) y el monto en grande arriba.
function clasificarCampos(form) {
  [...form.children].forEach((col) => {
    if (!col.matches('[class*="col"]')) return;
    if (col.querySelector("button[type=submit]")) { col.classList.add("d-none"); return; } // los botones suben a la barra
    if (col.querySelector(".form-check")) {
      col.querySelectorAll(".form-check").forEach((fc) => fc.classList.add("form-switch", "fila-switch"));
      col.classList.add("fila");
      return;
    }
    const control = col.querySelector(":scope > input:not([type=hidden]):not([type=color]), :scope > select, :scope > textarea, :scope > .input-group");
    const complejo = col.querySelector(":scope > div:not(.input-group):not(.form-text)");
    // campos de texto vacíos: iOS muestra "Opcional" u "Obligatorio" para que se vea dónde escribir
    col.querySelectorAll("input.form-control:not([type=date]):not([type=datetime-local]):not([type=color]), textarea.form-control").forEach((c) => {
      if (!c.placeholder) c.placeholder = c.required ? "Obligatorio" : "Opcional";
    });
    if (!control) col.classList.add(col.querySelector(".form-label") ? "bloque" : "nota");
    else col.classList.add(complejo ? "bloque" : "fila");
  });

  // listas cortas (2 a 4 opciones, sin "-- Elige --") -> selector de opciones
  [...form.children].forEach((col) => {
    const sel = col.matches('[class*="col"]') && col.querySelector(":scope > select");
    if (!sel || sel.options.length < 2 || sel.options.length > 4) return;
    if ([...sel.options].some((o) => o.value === "")) return;
    convertirEnSegmentado(sel);
    col.classList.remove("fila");
    col.classList.add("seg");
  });

  // la categoría se elige tocando cuadritos con su ícono y color
  const selCategoria = form.querySelector("select#categoria");
  if (selCategoria) {
    const colCat = selCategoria.closest('[class*="col"]');
    if (colCat) { colCat.classList.remove("fila"); colCat.classList.add("bloque"); }
    convertirEnSelectorCategorias(selCategoria);
  }

  // el tipo de inversión se elige tocando cuadritos con su ícono
  const selTipoActivo = form.querySelector("select#tipoActivo");
  if (selTipoActivo) {
    const colTipo = selTipoActivo.closest('[class*="col"]');
    if (colTipo) { colTipo.classList.remove("fila"); colTipo.classList.add("bloque"); }
    convertirEnSelectorTipoActivo(selTipoActivo);
  }

  // el mes se elige tocando su nombre, sin escribir el número
  const campoMes = form.querySelector("input#mes");
  if (campoMes) {
    const colMes = campoMes.closest('[class*="col"]');
    if (colMes) { colMes.classList.remove("fila"); colMes.classList.add("bloque"); }
    convertirEnSelectorMeses(campoMes);
  }

  // los campos de monto miden lo que mide su texto (así el $ queda pegado al número y nada se corta)
  form.querySelectorAll(".input-group > input.monto").forEach(ajustarAnchoAlTexto);

  // el primer campo de monto sube arriba, en grande
  const colMonto = [...form.children].find((c) => c.matches('[class*="col"]') && c.querySelector(":scope > .input-group input.monto"));
  let hero = null;
  if (colMonto) {
    hero = document.createElement("div");
    hero.className = "hero-monto";
    const et = colMonto.querySelector(".form-label");
    hero.innerHTML = `<span class="hero-monto-et">${et ? esc(et.textContent.trim()) : "Monto"}</span>`;
    hero.appendChild(colMonto.querySelector(":scope > .input-group"));
    colMonto.classList.add("d-none");
  }

  // las filas se agrupan en una tarjeta aparte, como en Ajustes
  const grupo = document.createElement("div");
  grupo.className = "grupo-ios";
  [...form.children].filter((c) => c.matches('[class*="col"]')).forEach((c) => grupo.appendChild(c));
  if (hero) form.appendChild(hero);
  form.appendChild(grupo);
}

// Ajusta el ancho de un campo al ancho real de su texto (medido en píxeles con un <span> invisible),
// así el número queda justo y centrado junto al $. Se actualiza al escribir, al limpiar el formulario,
// cuando el JS de la página le pone un valor (por ejemplo al editar) y cuando termina de cargar la fuente.
function ajustarAnchoAlTexto(campo) {
  const medidor = document.createElement("span");
  medidor.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;";
  document.body.appendChild(medidor);

  const ajustar = () => {
    // en el monto grande, los números muy largos reducen la letra para no salirse de la pantalla
    if (campo.closest(".hero-monto")) campo.style.fontSize = campo.value.length > 16 ? "26px" : campo.value.length > 13 ? "30px" : campo.value.length > 10 ? "40px" : "";
    const e = getComputedStyle(campo);
    medidor.style.fontFamily = e.fontFamily;
    medidor.style.fontSize = e.fontSize;
    medidor.style.fontWeight = e.fontWeight;
    medidor.style.letterSpacing = e.letterSpacing;
    medidor.style.fontVariantNumeric = e.fontVariantNumeric;
    medidor.style.fontFeatureSettings = e.fontFeatureSettings;
    medidor.textContent = campo.value || campo.placeholder || "0";
    campo.style.width = Math.max(24, Math.ceil(medidor.getBoundingClientRect().width) + 4) + "px";
  };

  const base = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  Object.defineProperty(campo, "value", { configurable: true, get() { return base.get.call(this); }, set(v) { base.set.call(this, v); ajustar(); } });
  campo.addEventListener("input", () => setTimeout(ajustar, 0));
  if (campo.form) campo.form.addEventListener("reset", () => setTimeout(ajustar, 0));
  const hoja = campo.closest(".modal");
  if (hoja) hoja.addEventListener("shown.bs.modal", ajustar);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
  ajustar();
}

// Reemplaza el <select> de categorías por una cuadrícula de cuadritos (ícono + color + nombre).
// El <select> sigue existiendo (invisible, pero dentro del formulario para que se valide) y el JS de la página no cambia.
function convertirEnSelectorCategorias(sel) {
  const cont = document.createElement("div");
  cont.className = "cat-picker";
  cont.setAttribute("role", "radiogroup");
  cont.setAttribute("aria-label", "Categoría");
  let datos = [];

  const sincronizar = () => {
    cont.querySelectorAll(".cat-tile").forEach((b) => {
      const activo = b.dataset.v === sel.value;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-checked", activo);
    });
    sel.setCustomValidity(sel.required && !sel.value ? "Elige una categoría" : "");
    if (sel.value) cont.classList.remove("cat-error");
  };

  const pintar = () => {
    const opciones = [...sel.options].filter((o) => o.value !== "");
    if (!opciones.length) {
      cont.innerHTML = `<div class="cat-vacio">Todavía no hay categorías para elegir. Crea una en <a href="categorias.html">Categorías</a>.</div>`;
      return;
    }
    cont.innerHTML = opciones.map((o) => {
      const c = datos.find((x) => String(x.idCategoria) === o.value) || {};
      const nombre = c.nombre || o.text.replace(/\s*\(.*\)$/, "");
      return `<button type="button" class="cat-tile" role="radio" data-v="${esc(o.value)}" style="--c:${esc(c.color || "#8E8E93")}">
        <span class="avatar-cat">${c.icono ? esc(c.icono) : '<i class="bi bi-tag-fill"></i>'}</span>
        <span class="cat-nombre">${esc(nombre)}</span>
        <i class="bi bi-check-circle-fill cat-check"></i>
      </button>`;
    }).join("");
    sincronizar();
  };

  cont.addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile");
    if (!b) return;
    sel.value = b.dataset.v;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // si el JS de la página cambia el valor (editar, limpiar), los cuadritos se actualizan
  const base = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  Object.defineProperty(sel, "value", { configurable: true, get() { return base.get.call(this); }, set(v) { base.set.call(this, v); sincronizar(); } });
  if (sel.form) sel.form.addEventListener("reset", () => setTimeout(sincronizar, 0));
  // las opciones las llena la página después de pedirlas al servidor
  new MutationObserver(pintar).observe(sel, { childList: true });
  // si falta elegir categoría, Guardar resalta el selector en rojo
  sel.addEventListener("invalid", () => { cont.classList.add("cat-error"); cont.scrollIntoView({ block: "nearest", behavior: "smooth" }); });

  // íconos y colores de las categorías (se piden una sola vez para todas las páginas)
  window._categoriasParaSelector = window._categoriasParaSelector || api("/categorias").catch(() => []);
  window._categoriasParaSelector.then((lista) => { datos = lista; pintar(); });

  sel.classList.add("sr-select");
  sel.tabIndex = -1;
  sel.after(cont);
  pintar();
}

// Reemplaza el <select> del tipo de inversión por cuadritos con un ícono y un color para cada tipo.
// El <select> sigue existiendo (invisible, dentro del formulario) y el JS de la página no cambia.
function convertirEnSelectorTipoActivo(sel) {
  const tipos = {
    ACCION: ["bi-graph-up-arrow", "#34C759", "Acción"],
    ETF: ["bi-pie-chart-fill", "#5856D6", "ETF"],
    CRIPTO: ["bi-currency-bitcoin", "#FF9500", "Cripto"],
    FONDO: ["bi-piggy-bank-fill", "#007AFF", "Fondo"],
    CDT: ["bi-bank2", "#32ADE6", "CDT"],
    BONO: ["bi-file-earmark-text-fill", "#AF52DE", "Bono"],
    OTRO: ["bi-three-dots", "#8E8E93", "Otro"],
  };
  const cont = document.createElement("div");
  cont.className = "cat-picker tipo-picker";
  cont.setAttribute("role", "radiogroup");
  cont.setAttribute("aria-label", "Tipo de inversión");
  cont.innerHTML = [...sel.options].map((o) => {
    const [icono, color, nombre] = tipos[o.value] || ["bi-circle-fill", "#8E8E93", humano(o.text)];
    return `<button type="button" class="cat-tile" role="radio" data-v="${esc(o.value)}" style="--c:${color}">
      <span class="avatar-cat"><i class="bi ${icono}"></i></span>
      <span class="cat-nombre">${esc(nombre)}</span>
      <i class="bi bi-check-circle-fill cat-check"></i>
    </button>`;
  }).join("");

  const sincronizar = () => cont.querySelectorAll(".cat-tile").forEach((b) => {
    const activo = b.dataset.v === sel.value;
    b.classList.toggle("activo", activo);
    b.setAttribute("aria-checked", activo);
  });
  cont.addEventListener("click", (e) => {
    const b = e.target.closest(".cat-tile");
    if (!b) return;
    sel.value = b.dataset.v;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
  // si el JS de la página cambia el valor (editar, limpiar), los cuadritos se actualizan
  const base = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  Object.defineProperty(sel, "value", { configurable: true, get() { return base.get.call(this); }, set(v) { base.set.call(this, v); sincronizar(); } });
  if (sel.form) sel.form.addEventListener("reset", () => setTimeout(sincronizar, 0));

  sel.classList.add("sr-select");
  sel.tabIndex = -1;
  sel.after(cont);
  sincronizar();
}

const NOMBRES_MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Reemplaza el campo numérico del mes (1 a 12) por una cuadrícula con los meses del año.
// El campo sigue existiendo (invisible, dentro del formulario para validarse) y el JS de la página no cambia.
function convertirEnSelectorMeses(campo) {
  const cont = document.createElement("div");
  cont.className = "mes-picker";
  cont.setAttribute("role", "radiogroup");
  cont.setAttribute("aria-label", "Mes");
  const actual = new Date().getMonth() + 1;
  cont.innerHTML =
    NOMBRES_MESES.map((n, i) =>
      `<button type="button" class="mes-tile ${i + 1 === actual ? "actual" : ""}" role="radio" data-v="${i + 1}" aria-label="${n}" title="${n}">${n.slice(0, 3)}</button>`
    ).join("") + `<div class="mes-nombre"></div>`;

  const sincronizar = () => {
    const elegido = Number(campo.value);
    cont.querySelectorAll(".mes-tile").forEach((b) => {
      const activo = Number(b.dataset.v) === elegido;
      b.classList.toggle("activo", activo);
      b.setAttribute("aria-checked", activo);
    });
    cont.querySelector(".mes-nombre").textContent = NOMBRES_MESES[elegido - 1] || "Elige un mes";
    campo.setCustomValidity(campo.required && !NOMBRES_MESES[elegido - 1] ? "Elige un mes" : "");
    if (NOMBRES_MESES[elegido - 1]) cont.classList.remove("cat-error");
  };

  cont.addEventListener("click", (e) => {
    const b = e.target.closest(".mes-tile");
    if (!b) return;
    campo.value = b.dataset.v;
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // si el JS de la página cambia el valor (editar, limpiar), la cuadrícula se actualiza
  const base = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  Object.defineProperty(campo, "value", { configurable: true, get() { return base.get.call(this); }, set(v) { base.set.call(this, v); sincronizar(); } });
  if (campo.form) campo.form.addEventListener("reset", () => setTimeout(sincronizar, 0));
  campo.addEventListener("invalid", () => cont.classList.add("cat-error"));

  campo.classList.add("sr-select");
  campo.tabIndex = -1;
  campo.after(cont);
  sincronizar();
}

// Reemplaza un <select> corto por botones; el <select> sigue existiendo (oculto) y el JS de la página no cambia.
function convertirEnSegmentado(sel) {
  const nombres = { INVERSION: "Inversión", ACCION: "Acción" };
  const seg = document.createElement("div");
  seg.className = "segmented";
  seg.setAttribute("role", "radiogroup");
  [...sel.options].forEach((o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.v = o.value;
    b.textContent = nombres[o.value] || humano(o.text);
    seg.appendChild(b);
  });
  const sincronizar = () => seg.querySelectorAll("button").forEach((b) => b.classList.toggle("activo", b.dataset.v === sel.value));
  seg.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    sel.value = b.dataset.v;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });
  // si el JS de la página cambia el valor (editar, limpiar, elegir categoría), los botones se actualizan
  const base = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
  Object.defineProperty(sel, "value", { configurable: true, get() { return base.get.call(this); }, set(v) { base.set.call(this, v); sincronizar(); } });
  if (sel.form) sel.form.addEventListener("reset", () => setTimeout(sincronizar, 0));
  sel.classList.add("d-none");
  sel.after(seg);
  sincronizar();
}

function prepararHoja() {
  const form = document.getElementById("formulario");
  if (!form || typeof window.limpiar !== "function") return;

  const tarjeta = form.closest(".card");
  const cuerpo = tarjeta.querySelector(".card-body");
  const el = document.createElement("div");
  el.className = "modal fade hoja";
  el.tabIndex = -1;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
      <div class="modal-content">
        <div class="hoja-barra">
          <button type="button" class="hoja-cancelar">Cancelar</button>
          <span class="hoja-titulo"></span>
          <button type="button" class="hoja-guardar">Guardar</button>
        </div>
        <div class="modal-body"></div>
      </div>
    </div>`;
  const destino = el.querySelector(".modal-body");
  while (cuerpo.firstChild) destino.appendChild(cuerpo.firstChild);
  tarjeta.remove();

  // el título del formulario sube a la barra; Cancelar y Guardar viven arriba, como en iOS
  const titulo = destino.querySelector("h2");
  if (titulo) { titulo.classList.remove("card-title"); el.querySelector(".hoja-titulo").appendChild(titulo); }
  el.querySelector(".hoja-cancelar").addEventListener("click", () => window.limpiar());
  el.querySelector(".hoja-guardar").addEventListener("click", () => form.requestSubmit());
  clasificarCampos(form);

  document.body.appendChild(el);
  hojaModal = new bootstrap.Modal(el);

  // al abrir, el cursor va al primer campo
  el.addEventListener("shown.bs.modal", () => {
    const primero = el.querySelector("input:not([type=hidden]):not([type=checkbox]), select");
    if (primero) primero.focus();
  });

  // limpiar() (guardar o cancelar) cierra la hoja; editar() la abre
  limpiarOriginal = window.limpiar;
  window.limpiar = function () { limpiarOriginal(); hojaModal.hide(); };
  const editarOriginal = window.editar;
  if (typeof editarOriginal === "function") {
    window.editar = function (...args) { editarOriginal.apply(this, args); abrirHoja(); };
  }
}

// ----- Tablas: en el celular cada fila se vuelve una tarjeta con "campo: valor" -----
function etiquetarTablas() {
  document.querySelectorAll("table").forEach((t) => {
    const cuerpo = t.querySelector("tbody");
    if (!cuerpo) return;
    const cabeceras = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
    const poner = () =>
      cuerpo.querySelectorAll("tr").forEach((tr) =>
        [...tr.children].forEach((td, i) => {
          if (td.colSpan > 1) { td.classList.add("fila-vacia"); return; }
          if (cabeceras[i] !== undefined) td.setAttribute("data-label", cabeceras[i]);
        })
      );
    poner();
    new MutationObserver(poner).observe(cuerpo, { childList: true });
  });
}

window.addEventListener("load", () => {
  prepararHoja();
  etiquetarTablas();
});
