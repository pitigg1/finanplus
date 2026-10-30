menu("usuarios.html");
exigirUsuario();
// Esta página es solo para administradores (el servidor también lo exige: aquí solo se evita mostrarla)
if (!esAdmin()) location.href = "index.html";
let usuarios = [];

// LISTAR
async function cargar() {
  usuarios = await api("/usuarios");
  document.getElementById("tabla").innerHTML =
    usuarios
      .map(
        (u) => `<tr>
          <td>${esc(u.nombre)} ${u.idUsuario === usuarioActual() ? '<span class="chip chip-ahorro ms-1">Tú</span>' : ""}</td>
          <td>${esc(u.correo)}</td>
          <td>${esc(u.pais)}</td>
          <td>${u.rol === "ADMIN" ? chipTexto("Admin", "ahorro") : chipTexto("Usuario")}</td>
          <td>${chipTexto(humano(u.estado), { ACTIVO: "ingreso", SUSPENDIDO: "gasto" }[u.estado] || "otro")}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-primary" onclick="editar('${u.idUsuario}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${u.idUsuario}')">Eliminar</button>
          </td>
        </tr>`
      )
      .join("") || `<tr><td colspan="6" class="text-center text-muted">No hay usuarios</td></tr>`;
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
      rol: document.getElementById("rol").value,
      password: document.getElementById("password").value, // vacía = se conserva la actual
    };
    await api(`/usuarios/${id}`, "PUT", datos);
    mensaje("Usuario actualizado");
    limpiar();
    await cargar();
  });
});

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
  document.getElementById("rol").value = u.rol || "USUARIO";
  document.getElementById("tituloForm").textContent = "Editar usuario";
}

function limpiar() {
  document.getElementById("formulario").reset();
  document.getElementById("id").value = "";
  document.getElementById("correo").disabled = false;
  document.getElementById("tituloForm").textContent = "Nuevo usuario";
}

// ELIMINAR
async function eliminar(id) {
  if (!(await confirmar("¿Eliminar este usuario y todos sus datos?"))) return;
  intentar(async () => {
    await api(`/usuarios/${id}`, "DELETE");
    if (id === usuarioActual()) { cerrarSesion(); return; }   // si borras tu propia cuenta, se cierra la sesión
    mensaje("Usuario eliminado");
    await cargar();
  });
}

intentar(cargar);
