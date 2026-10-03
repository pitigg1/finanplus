menu("inversiones.html");
const usuarioId = exigirUsuario();
let inversiones = [];

// LISTAR
async function cargar() {
  inversiones = await api(`/inversiones/usuario/${usuarioId}`);
  document.getElementById("tabla").innerHTML =
    inversiones
      .map(
        (i) => `<tr>
          <td>${esc(i.nombreActivo)}</td>
          <td>${i.tipoActivo}</td>
          <td class="text-end">${dinero(i.montoInvertido)}</td>
          <td class="text-end">${dinero(i.valorActual)}</td>
          <td class="text-end">${i.rentabilidad == null ? "-" : i.rentabilidad + "%"}</td>
          <td>${i.riesgo}</td>
          <td>${i.fechaInversion}</td>
          <td class="text-end text-nowrap">
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${i.idInversion}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${i.idInversion}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="8" class="text-center text-muted">No hay inversiones</td></tr>`;

  const invertido = inversiones.reduce((suma, i) => suma + Number(i.montoInvertido), 0);
  const valor = inversiones.reduce((suma, i) => suma + Number(i.valorActual), 0);
  document.getElementById("resumen").textContent = `Total invertido: ${dinero(invertido)} · Valor actual: ${dinero(valor)}`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    const rentabilidad = document.getElementById("rentabilidad").value;
    const datos = {
      usuario: { idUsuario: usuarioId },
      nombreActivo: document.getElementById("nombreActivo").value,
      tipoActivo: document.getElementById("tipoActivo").value,
      montoInvertido: Number(document.getElementById("montoInvertido").value),
      valorActual: Number(document.getElementById("valorActual").value),
      rentabilidad: rentabilidad === "" ? null : Number(rentabilidad),
      riesgo: document.getElementById("riesgo").value,
      fechaInversion: document.getElementById("fechaInversion").value,
    };
    if (id) await api(`/inversiones/${id}`, "PUT", datos);
    else await api("/inversiones", "POST", datos);
    mensaje(id ? "Inversión actualizada" : "Inversión creada");
    limpiar();
    await cargar();
  });
});

function editar(id) {
  const i = inversiones.find((x) => x.idInversion === id);
  document.getElementById("id").value = i.idInversion;
  document.getElementById("nombreActivo").value = i.nombreActivo;
  document.getElementById("tipoActivo").value = i.tipoActivo;
  document.getElementById("montoInvertido").value = i.montoInvertido;
  document.getElementById("valorActual").value = i.valorActual;
  document.getElementById("rentabilidad").value = i.rentabilidad ?? "";
  document.getElementById("riesgo").value = i.riesgo;
  document.getElementById("fechaInversion").value = i.fechaInversion;
  document.getElementById("tituloForm").textContent = "Editar inversión";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("tituloForm").textContent = "Nueva inversión";
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar esta inversión?")) return;
  intentar(async () => {
    await api(`/inversiones/${id}`, "DELETE");
    mensaje("Inversión eliminada");
    await cargar();
  });
}

intentar(cargar);
