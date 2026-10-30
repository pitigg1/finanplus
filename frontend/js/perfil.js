// Mi perfil: datos personales, moneda, foto y contraseña.
menu("perfil.html");
exigirUsuario();

let perfil = null;
let urlFoto = null; // dirección temporal (blob) de la foto actual

// Monedas admitidas (las mismas que valida el servidor)
const MONEDAS = {
  COP: "Peso colombiano (COP)",
  USD: "Dólar estadounidense (USD)",
  EUR: "Euro (EUR)",
  MXN: "Peso mexicano (MXN)",
  ARS: "Peso argentino (ARS)",
  CLP: "Peso chileno (CLP)",
  PEN: "Sol peruano (PEN)",
  BRL: "Real brasileño (BRL)",
  GBP: "Libra esterlina (GBP)",
  CAD: "Dólar canadiense (CAD)",
};
const TAMANO_MAXIMO = 2 * 1024 * 1024;

document.getElementById("moneda").innerHTML = Object.entries(MONEDAS)
  .map(([codigo, nombre]) => `<option value="${codigo}">${nombre}</option>`)
  .join("");

// Lo que cambia en el perfil se refleja en el resto de la app (nombre, moneda, menú)
function guardarUsuarioLocal(u) {
  try {
    const guardado = JSON.parse(localStorage.getItem("usuario")) || {};
    localStorage.setItem("usuario", JSON.stringify({ ...guardado, ...u }));
  } catch (e) {}
}

async function pintarFoto() {
  const avatar = document.getElementById("avatar");
  const inicial = document.getElementById("avatarInicial");
  if (urlFoto) { URL.revokeObjectURL(urlFoto); urlFoto = null; }
  if (perfil.tieneFoto) urlFoto = await cargarFotoPerfil();

  if (urlFoto) {
    avatar.style.backgroundImage = `url(${urlFoto})`;
    inicial.textContent = "";
  } else {
    avatar.style.backgroundImage = "";
    inicial.textContent = String(perfil.nombre || "?").trim().charAt(0).toUpperCase();
  }
  document.getElementById("btnQuitarFoto").classList.toggle("d-none", !perfil.tieneFoto);
}

function pintarPerfil() {
  document.getElementById("nombre").value = perfil.nombre || "";
  document.getElementById("correo").value = perfil.correo || "";
  document.getElementById("pais").value = perfil.pais || "";
  document.getElementById("moneda").value = MONEDAS[perfil.monedaPreferida] ? perfil.monedaPreferida : "COP";
  document.getElementById("tituloNombre").textContent = perfil.nombre || "";
  document.getElementById("textoCorreo").textContent = perfil.correo || "";
  document.getElementById("chipRol").innerHTML = perfil.rol === "ADMIN" ? chipTexto("Administrador", "ahorro") : "";
}

// Después de cambiar algo: se actualiza lo guardado en el navegador y el menú
function sincronizar(u) {
  perfil = u;
  guardarUsuarioLocal({ nombre: u.nombre, pais: u.pais, monedaPreferida: u.monedaPreferida, tieneFoto: u.tieneFoto, rol: u.rol });
  pintarPerfil();
  pintarUsuarioMenu(u);
}

// ---------- datos personales ----------
document.getElementById("formPerfil").addEventListener("submit", (e) => {
  e.preventDefault();
  const boton = document.getElementById("btnGuardarPerfil");
  boton.disabled = true;
  intentar(async () => {
    try {
      const u = await api("/usuarios/perfil", "PUT", {
        nombre: document.getElementById("nombre").value,
        pais: document.getElementById("pais").value,
        monedaPreferida: document.getElementById("moneda").value,
      });
      sincronizar(u);
      mensaje("Perfil actualizado");
    } finally {
      boton.disabled = false;
    }
  });
});

// ---------- foto ----------
document.getElementById("btnCambiarFoto").addEventListener("click", () => document.getElementById("archivoFoto").click());

document.getElementById("archivoFoto").addEventListener("change", (e) => {
  const archivo = e.target.files[0];
  e.target.value = ""; // para poder elegir el mismo archivo otra vez
  if (!archivo) return;
  if (!["image/png", "image/jpeg"].includes(archivo.type)) return mensaje("La foto debe ser JPG o PNG", "warning");
  if (archivo.size > TAMANO_MAXIMO) return mensaje("La foto es muy grande (máximo 2 MB)", "warning");

  intentar(async () => {
    const datos = new FormData();
    datos.append("foto", archivo);
    // no se usa api(): el navegador debe poner solo el tipo "multipart" del envío
    const respuesta = await fetch(API + "/usuarios/perfil/foto", {
      method: "POST",
      headers: { Authorization: "Bearer " + tokenActual() },
      body: datos,
    });
    if (respuesta.status === 401) { cerrarSesion(); return; }
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) throw new Error(cuerpo.message || "No se pudo subir la foto");
    sincronizar(cuerpo);
    await pintarFoto();
    mensaje("Foto actualizada");
  });
});

document.getElementById("btnQuitarFoto").addEventListener("click", () => {
  intentar(async () => {
    sincronizar(await api("/usuarios/perfil/foto", "DELETE"));
    await pintarFoto();
    mensaje("Foto eliminada");
  });
});

// ---------- contraseña ----------
document.getElementById("formPassword").addEventListener("submit", (e) => {
  e.preventDefault();
  const actual = document.getElementById("passActual").value;
  const nueva = document.getElementById("passNueva").value;
  const repetir = document.getElementById("passRepetir").value;
  if (nueva.length < 6) return mensaje("La nueva contraseña debe tener al menos 6 caracteres", "warning");
  if (nueva !== repetir) return mensaje("Las contraseñas nuevas no coinciden", "warning");

  const boton = document.getElementById("btnCambiarPassword");
  boton.disabled = true;
  intentar(async () => {
    try {
      const respuesta = await api("/usuarios/perfil/password", "PUT", { actual: actual, nueva: nueva });
      localStorage.setItem("jwtToken", respuesta.token); // el servidor entrega una sesión nueva; las de otros dispositivos se cierran
      document.getElementById("formPassword").reset();
      mensaje("Contraseña actualizada");
    } finally {
      boton.disabled = false;
    }
  });
});

// ---------- eliminar cuenta ----------
document.getElementById("btnEliminarCuenta").addEventListener("click", async () => {
  if (!(await confirmar("¿Eliminar tu cuenta y todos tus datos?", "Eliminar cuenta"))) return;
  intentar(async () => {
    await api(`/usuarios/${perfil.idUsuario}`, "DELETE");
    cerrarSesion();
  });
});

intentar(async () => {
  sincronizar(await api("/usuarios/perfil"));
  await pintarFoto();
});
