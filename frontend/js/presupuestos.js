menu("presupuestos.html");
const usuarioId = exigirUsuario();
let presupuestos = [];

async function iniciar() {
  const categorias = (await api("/categorias")).filter((c) => c.tipo === "GASTO");
  llenarSelect(document.getElementById("categoria"), categorias, "idCategoria", (c) => c.nombre, "-- Elige --");
  limpiar();
  await cargar();
}

// LISTAR
async function cargar() {
  presupuestos = await api(`/presupuestos/usuario/${usuarioId}`);
  document.getElementById("tabla").innerHTML =
    presupuestos
      .map((p) => {
        const porcentaje = p.limiteGasto > 0 ? Math.round((p.gastoActual / p.limiteGasto) * 100) : 0;
        // verde si va bien, amarillo desde el 80 %, rojo si se pasó
        const color = porcentaje > 100 ? "bg-danger" : porcentaje >= 80 ? "bg-warning" : "bg-success";
        return `<tr>
          <td>${esc(p.categoria.nombre)}</td>
          <td>${p.mes}/${p.anio}</td>
          <td class="text-end">${dinero(p.limiteGasto)}</td>
          <td class="text-end">${dinero(p.gastoActual)}</td>
          <td>
            <div class="progress" role="progressbar" aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar ${color}" style="width:${Math.min(100, porcentaje)}%">${porcentaje}%</div>
            </div>
          </td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${p.idPresupuesto}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${p.idPresupuesto}')">Eliminar</button>
          </td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="6" class="text-center text-muted">No hay presupuestos</td></tr>`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    const datos = {
      usuario: { idUsuario: usuarioId },
      categoria: { idCategoria: Number(document.getElementById("categoria").value) },
      mes: Number(document.getElementById("mes").value),
      anio: Number(document.getElementById("anio").value),
      limiteGasto: Number(document.getElementById("limite").value),
      gastoActual: Number(document.getElementById("gastoActual").value || 0),
    };
    if (id) await api(`/presupuestos/${id}`, "PUT", datos);
    else await api("/presupuestos", "POST", datos);
    mensaje(id ? "Presupuesto actualizado" : "Presupuesto creado");
    limpiar();
    await cargar();
  });
});

function editar(id) {
  const p = presupuestos.find((x) => x.idPresupuesto === id);
  document.getElementById("id").value = p.idPresupuesto;
  document.getElementById("categoria").value = p.categoria.idCategoria;
  document.getElementById("mes").value = p.mes;
  document.getElementById("anio").value = p.anio;
  document.getElementById("limite").value = p.limiteGasto;
  document.getElementById("gastoActual").value = p.gastoActual;
  document.getElementById("tituloForm").textContent = "Editar presupuesto";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("mes").value = new Date().getMonth() + 1;
  document.getElementById("anio").value = new Date().getFullYear();
  document.getElementById("tituloForm").textContent = "Nuevo presupuesto";
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar este presupuesto?")) return;
  intentar(async () => {
    await api(`/presupuestos/${id}`, "DELETE");
    mensaje("Presupuesto eliminado");
    await cargar();
  });
}

intentar(iniciar);
