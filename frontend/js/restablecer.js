// Cambia la contraseña con el enlace que llegó por correo (?token=...)
const token = new URLSearchParams(location.search).get("token");

if (!token) {
  document.getElementById("sinEnlace").classList.remove("d-none");
} else {
  document.getElementById("formRestablecer").classList.remove("d-none");
}

document.getElementById("formRestablecer").addEventListener("submit", (e) => {
  e.preventDefault();
  const nueva = document.getElementById("nueva").value;
  const repetir = document.getElementById("repetir").value;

  if (nueva.length < 6) return mensaje("La contraseña debe tener al menos 6 caracteres", "warning");
  if (nueva !== repetir) return mensaje("Las contraseñas no coinciden", "warning");

  const boton = document.getElementById("btnGuardar");
  boton.disabled = true;
  intentar(async () => {
    try {
      await api("/auth/restablecer-password", "POST", { token: token, nuevaPassword: nueva });
      document.getElementById("formRestablecer").classList.add("d-none");
      document.getElementById("exito").classList.remove("d-none");
      // por seguridad, se cierra cualquier sesión que hubiera quedado abierta en este navegador
      ["jwtToken", "usuarioId", "usuario"].forEach((k) => localStorage.removeItem(k));
    } finally {
      boton.disabled = false;
    }
  });
});
