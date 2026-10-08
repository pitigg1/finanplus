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

// LISTAR (el backend sabe quién es el usuario por el token)
async function cargar() {
  metas = await api("/metas");
  document.getElementById("tabla").innerHTML =
    metas
      .map((m) => {
        const porcentaje = m.montoObjetivo > 0 ? Math.round((m.montoActual / m.montoObjetivo) * 100) : 0;
        return `<tr>
          <td><strong>${esc(m.nombre)}</strong><br><small class="text-muted">${esc(m.descripcion)}</small></td>
          <td class="text-end">${dinero(m.montoActual)}</td>
          <td class="text-end">${dinero(m.montoObjetivo)}</td>
          <td>
            <div class="progress" role="progressbar" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar ${porcentaje >= 100 ? "bg-success" : ""}" style="width:${Math.min(100, porcentaje)}%">${porcentaje}%</div>
            </div>
          </td>
          <td>${m.fechaObjetivo || "-"}</td>
          <td>${m.estado}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-success" onclick="verAportes('${m.idMeta}')">Aportes</button>
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${m.idMeta}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${m.idMeta}')">Eliminar</button>
          </td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="7" class="text-center text-muted">No hay metas</td></tr>`;
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
function eliminar(id) {
  if (!confirm("¿Eliminar esta meta y sus aportes?")) return;
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
function eliminarAporte(id) {
  if (!confirm("¿Eliminar este aporte? Se descontará de la meta.")) return;
  intentar(async () => {
    await api(`/aportes/${id}`, "DELETE");
    mensaje("Aporte eliminado");
    await cargar();
    await cargarAportes();
  });
}

intentar(iniciar);
