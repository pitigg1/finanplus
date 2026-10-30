// Pide el enlace para cambiar la contraseña. El servidor responde lo mismo exista o no el correo.
document.getElementById("formRecuperar").addEventListener("submit", (e) => {
  e.preventDefault();
  const boton = document.getElementById("btnEnviar");
  boton.disabled = true;
  intentar(async () => {
    try {
      const respuesta = await api("/auth/olvide-password", "POST", {
        correo: document.getElementById("correo").value.trim(),
      });
      document.getElementById("formRecuperar").classList.add("d-none");
      document.getElementById("textoExito").textContent = respuesta.message;
      document.getElementById("exito").classList.remove("d-none");
    } finally {
      boton.disabled = false;
    }
  });
});
