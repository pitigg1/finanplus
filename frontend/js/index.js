menu("index.html");

async function cargarUsuarios() {
  const usuarios = await api("/usuarios");
  llenarSelect(document.getElementById("usuarioSel"), usuarios, "idUsuario", (u) => `${u.nombre} (${u.correo})`, "-- Elige un usuario --");
  document.getElementById("usuarioSel").value = usuarioActual() || "";
}

// Al elegir un usuario se guarda en el navegador
document.getElementById("usuarioSel").addEventListener("change", (e) => {
  localStorage.setItem("usuarioId", e.target.value);
  location.reload();
});

// Crear un usuario nuevo y dejarlo como activo
document.getElementById("formulario").addEventListener("submit", (e) => {
  e.preventDefault();
  intentar(async () => {
    const usuario = await api("/usuarios", "POST", {
      nombre: document.getElementById("nombre").value,
      correo: document.getElementById("correo").value,
      passwordHash: document.getElementById("password").value,
    });
    localStorage.setItem("usuarioId", usuario.idUsuario);
    location.reload();
  });
});

intentar(cargarUsuarios);
