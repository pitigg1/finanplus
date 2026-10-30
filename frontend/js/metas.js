menu("metas.html");
const usuarioId = exigirUsuario();
let metas = [];
let metaElegida = null; // meta cuyos aportes se están viendo

async function iniciar() {
  // Los aportes se guardan como un registro de tipo AHORRO, por eso solo sirven categorías de ese tipo
  const categorias = (await api("/categorias")).filter((c) => c.tipo === "AHORRO");
  llenarSelect(document.getElementById("aporteCategoria"), categorias, "idCategoria", (c) => c.nombre,
    categorias.length ? "-- Elige --" : "-- No hay categorías de ahorro --");
  document.getElementById("avisoAhorro").innerHTML = categorias.length
    ? ""
    : 'Para aportar necesitas una categoría de tipo <strong>AHORRO</strong>. <a href="categorias.html">Créala aquí</a>.';
  await cargar();
}

// ================= METAS =================

// Texto de tiempo restante hasta la fecha límite
function tiempoRestante(fechaObjetivo, estado) {
  if (estado === "COMPLETADA") return "¡Meta cumplida!";
  if (!fechaObjetivo) return "Sin fecha límite";
  const dias = Math.ceil((new Date(fechaObjetivo + "T00:00:00") - new Date()) / 86400000);
  if (dias < 0) return `Venció hace ${-dias} ${-dias === 1 ? "día" : "días"}`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Queda 1 día";
  if (dias < 60) return `Quedan ${dias} días`;
  return `Quedan ${Math.round(dias / 30)} meses`;
}

// LISTAR (el backend sabe quién es el usuario por el token): una tarjeta por meta
async function cargar() {
  metas = await api("/metas");
  document.getElementById("tabla").innerHTML =
    metas
      .map((m) => {
        const porcentaje = m.montoObjetivo > 0 ? Math.round((m.montoActual / m.montoObjetivo) * 100) : 0;
        const falta = Math.max(0, Number(m.montoObjetivo) - Number(m.montoActual));
        return `<div class="col-12 col-md-6 col-lg-4">
          <div class="card meta-card h-100">
            <div class="card-body d-flex flex-column">
              <div class="d-flex align-items-start justify-content-between gap-3">
                <div class="anillo ${porcentaje >= 100 ? "completa" : ""}" style="--p:${Math.min(100, porcentaje)}" role="img" aria-label="${porcentaje}% completado"><span>${porcentaje}%</span></div>
                <div class="text-end d-flex flex-column align-items-end gap-1">${chipEstado(m.estado)}${chipPrioridad(m.prioridad)}</div>
              </div>
              <h2 class="h5 mt-3 mb-0">${esc(m.nombre)}</h2>
              <p class="small text-muted mb-3">${esc(m.descripcion) || "&nbsp;"}</p>
              <div class="meta-cifras">
                <div><small>Ahorrado</small><strong>${dinero(m.montoActual)}</strong></div>
                <div><small>Objetivo</small><strong>${dinero(m.montoObjetivo)}</strong></div>
              </div>
              <div class="small text-muted mt-2 mb-3"><i class="bi bi-clock"></i> ${tiempoRestante(m.fechaObjetivo, m.estado)}${falta > 0 ? ` · faltan ${dinero(falta)}` : ""}</div>
              <div class="meta-acciones mt-auto">
                <button class="btn btn-sm btn-outline-success" onclick="verAportes('${m.idMeta}')"><i class="bi bi-plus-circle"></i> Aportes</button>
                <button class="btn btn-sm btn-outline-primary" onclick="editar('${m.idMeta}')">Editar</button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${m.idMeta}')" aria-label="Eliminar meta"><i class="bi bi-trash3"></i></button>
              </div>
            </div>
          </div>
        </div>`;
      })
      .join("") || `<div class="col-12"><div class="card"><div class="card-body vacio"><i class="bi bi-bullseye"></i><p>Todavía no tienes metas.<br>Toca «Nueva meta» para crear la primera.</p></div></div></div>`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    // Estructura de MetaAhorroRequestDTO (el usuario sale del token, no se envía)
    const datos = {
      nombre: document.getElementById("nombre").value,
      descripcion: document.getElementById("descripcion").value || null,
      montoObjetivo: leerMonto("objetivo"),
      fechaObjetivo: document.getElementById("fechaObjetivo").value || null,
      prioridad: document.getElementById("prioridad").value,
      estado: document.getElementById("estado").value,
    };
    if (id) await api(`/metas/${id}`, "PUT", datos);
    else await api("/metas", "POST", datos);
    mensaje(id ? "Meta actualizada" : "Meta creada");
    limpiar();
    await cargar();
  });
});

function editar(id) {
  const m = metas.find((x) => x.idMeta === id);
  document.getElementById("id").value = m.idMeta;
  document.getElementById("nombre").value = m.nombre;
  document.getElementById("descripcion").value = m.descripcion || "";
  ponerMonto("objetivo", m.montoObjetivo);
  document.getElementById("fechaObjetivo").value = m.fechaObjetivo || "";
  document.getElementById("prioridad").value = m.prioridad;
  document.getElementById("estado").value = m.estado;
  document.getElementById("tituloForm").textContent = "Editar meta";
  window.scrollTo(0, 0);
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("tituloForm").textContent = "Nueva meta";
}

// ELIMINAR
async function eliminar(id) {
  if (!(await confirmar("¿Eliminar esta meta y sus aportes?"))) return;
  intentar(async () => {
    await api(`/metas/${id}`, "DELETE");
    mensaje("Meta eliminada");
    if (metaElegida === id) document.getElementById("cajaAportes").hidden = true;
    await cargar();
  });
}

// ================= APORTES (tabla Aportes_Meta) =================

// LISTAR los aportes de una meta
function verAportes(idMeta) {
  metaElegida = idMeta;
  const meta = metas.find((x) => x.idMeta === idMeta);
  document.getElementById("tituloAportes").textContent = "Aportes de: " + meta.nombre;
  document.getElementById("cajaAportes").hidden = false;
  intentar(cargarAportes);
}

async function cargarAportes() {
  const aportes = await api(`/aportes/meta/${metaElegida}`);
  document.getElementById("tablaAportes").innerHTML =
    aportes
      .map(
        (a) => `<tr>
          <td>${fecha(a.fechaAporte)}</td>
          <td class="text-end">${dinero(a.monto)}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" onclick="editarAporte('${a.idAporte}', ${a.monto})">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarAporte('${a.idAporte}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="3" class="text-center text-muted">Esta meta no tiene aportes</td></tr>`;
  document.getElementById("cajaAportes").scrollIntoView({ behavior: "smooth" });
}

// CREAR un aporte: primero se crea un registro de tipo AHORRO y luego el aporte que lo enlaza
document.getElementById("formAporte").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const meta = metas.find((x) => x.idMeta === metaElegida);
    const monto = leerMonto("aporteMonto");
    // 1) Registro de tipo AHORRO (estructura de RegistroFinancieroRequestDTO)
    const registro = await api("/registros", "POST", {
      idCategoria: Number(document.getElementById("aporteCategoria").value),
      tipoMovimiento: "AHORRO",
      monto: monto,
      descripcion: "Aporte a meta: " + meta.nombre,
      fechaMovimiento: ahora(),
    });
    // 2) Aporte que enlaza el registro con la meta (el backend suma el monto a la meta)
    try {
      await api("/aportes", "POST", {
        meta: { idMeta: metaElegida },
        registro: { idRegistro: registro.idRegistro },
        monto: monto,
      });
    } catch (error) {
      // si el aporte falla, se borra el registro para no dejarlo suelto
      await api(`/registros/${registro.idRegistro}`, "DELETE").catch(() => {});
      throw error;
    }
    mensaje("Aporte agregado");
    document.getElementById("formAporte").reset();
    await cargar();
    await cargarAportes();
  });
});

// ACTUALIZAR un aporte
function editarAporte(id, montoActual) {
  const nuevo = prompt("Nuevo monto del aporte:", Math.round(montoActual).toLocaleString("es-CO"));
  if (nuevo === null) return;
  const valor = Number(nuevo.replace(/\D/g, ""));
  if (!valor) return mensaje("Escribe un monto válido", "warning");
  intentar(async () => {
    await api(`/aportes/${id}`, "PUT", { monto: valor });
    mensaje("Aporte actualizado");
    await cargar();
    await cargarAportes();
  });
}

// ELIMINAR un aporte
async function eliminarAporte(id) {
  if (!(await confirmar("¿Eliminar este aporte? Se descontará de la meta."))) return;
  intentar(async () => {
    await api(`/aportes/${id}`, "DELETE");
    mensaje("Aporte eliminado");
    await cargar();
    await cargarAportes();
  });
}

intentar(iniciar);
