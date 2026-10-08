menu("usuarios.html");
let usuarios = [];

// LISTAR
async function cargar() {
  usuarios = await api("/usuarios");
  document.getElementById("tabla").innerHTML =
    usuarios
      .map(
        (u) => `<tr>
          <td>${esc(u.nombre)} ${u.idUsuario === usuarioActual() ? '<span class="badge text-bg-success">En uso</span>' : ""}</td>
          <td>${esc(u.correo)}</td>
          <td>${esc(u.pais)}</td>
          <td>${u.estado}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-success" onclick="usar('${u.idUsuario}')">Usar</button>
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${u.idUsuario}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${u.idUsuario}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="5" class="text-center text-muted">No hay usuarios</td></tr>`;
}

// CREAR o ACTUALIZAR
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const id = document.getElementById("id").value;
    // Los usuarios nuevos se crean desde la pantalla de registro (login.html)
    if (!id) {
      mensaje("Para crear un usuario nuevo usa el registro en la pantalla de inicio de sesión. Aquí puedes editar con el botón Editar.", "warning");
      return;
    }
    // Estructura de ActualizarUsuarioDTO (el correo no se cambia)
    const datos = {
      nombre: document.getElementById("nombre").value,
      monedaPreferida: document.getElementById("moneda").value,
      pais: document.getElementById("pais").value,
      estado: document.getElementById("estado").value,
      password: document.getElementById("password").value, // vacía = se conserva la actual
    };
    await api(`/usuarios/${id}`, "PUT", datos);
    mensaje("Usuario actualizado");
    limpiar();
    await cargar();
  });
});

function usar(id) {
  localStorage.setItem("usuarioId", id);
  location.reload();
}

function editar(id) {
  const u = usuarios.find((x) => x.idUsuario === id);
  document.getElementById("id").value = u.idUsuario;
  document.getElementById("nombre").value = u.nombre;
  document.getElementById("correo").value = u.correo;
  document.getElementById("correo").disabled = true; // el correo no se cambia
  document.getElementById("password").value = "";
  document.getElementById("moneda").value = u.monedaPreferida || "COP";
  document.getElementById("pais").value = u.pais || "";
  document.getElementById("estado").value = u.estado;
  document.getElementById("tituloForm").textContent = "Editar usuario";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("correo").disabled = false;
  document.getElementById("tituloForm").textContent = "Nuevo usuario";
}

// ELIMINAR
function eliminar(id) {
  if (!confirm("¿Eliminar este usuario y todos sus datos?")) return;
  intentar(async () => {
    await api(`/usuarios/${id}`, "DELETE");
    if (id === usuarioActual()) localStorage.removeItem("usuarioId");
    mensaje("Usuario eliminado");
    await cargar();
  });
}

intentar(cargar);
