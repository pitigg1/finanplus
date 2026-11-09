// ===== Sesión guardada en el navegador (localStorage) =====

export function tokenActual() {
  return localStorage.getItem('jwtToken');
}

export function usuarioActual() {
  const idDirecta = localStorage.getItem('usuarioId');
  if (idDirecta) return idDirecta;

  const usuarioGuardado = localStorage.getItem('usuario');
  if (usuarioGuardado) {
    try {
      const u = JSON.parse(usuarioGuardado);
      if (u && u.idUsuario) {
        localStorage.setItem('usuarioId', u.idUsuario); // Sincroniza la clave
        return u.idUsuario;
      }
    } catch (e) {}
  }
  return null;
}

// Datos del usuario guardados al iniciar sesión
export function usuarioLocal() {
  try {
    return JSON.parse(localStorage.getItem('usuario')) || {};
  } catch (e) {
    return {};
  }
}

// Mezcla datos nuevos con lo que ya hay guardado (nombre, moneda, rol, foto…)
export function guardarUsuarioLocal(datos) {
  try {
    localStorage.setItem('usuario', JSON.stringify({ ...usuarioLocal(), ...datos }));
  } catch (e) {}
}

// ¿El usuario de esta sesión es administrador? (el servidor es quien manda; esto solo decide qué se muestra)
export function esAdmin() {
  return usuarioLocal().rol === 'ADMIN';
}

// Moneda elegida en el perfil (por defecto COP). Solo cambia cómo se ven los montos; no convierte valores.
export function monedaActual() {
  const m = usuarioLocal().monedaPreferida;
  return m && /^[A-Z]{3}$/.test(m) ? m : 'COP';
}

// Cierra la sesión y borra los datos del navegador
export function cerrarSesion() {
  localStorage.removeItem('jwtToken');
  localStorage.removeItem('usuarioId');
  localStorage.removeItem('usuario');
  window.location.href = '/login';
}
