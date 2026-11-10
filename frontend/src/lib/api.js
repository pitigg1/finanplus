import { tokenActual } from './sesion';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:8094/api';

// Hace una petición al backend adjuntando el Token JWT
export async function api(ruta, metodo = 'GET', datos = null) {
  let respuesta;
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenActual();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    respuesta = await fetch(API + ruta, {
      method: metodo,
      headers: headers,
      body: datos ? JSON.stringify(datos) : undefined,
    });
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor. ¿Está encendido el backend?');
  }

  // Si el token expiró o es inválido (401), redirige al login.
  // Un 403 significa "tienes sesión pero no permiso": se muestra el mensaje del servidor y la sesión sigue abierta.
  if (respuesta.status === 401) {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('usuarioId');
    window.location.href = '/login';
    throw new Error('Sesión expirada. Inicia sesión nuevamente.');
  }

  if (!respuesta.ok) {
    let mensaje = 'Error ' + respuesta.status;
    try {
      const error = await respuesta.json();
      if (error.message) mensaje = error.message;
    } catch (e) {}
    throw new Error(mensaje);
  }

  if (respuesta.status === 204) return null;
  const texto = await respuesta.text();
  return texto ? JSON.parse(texto) : null;
}

// Foto de perfil: solo la ve su dueño, se pide con el token y se muestra como una dirección temporal (blob).
export async function cargarFotoPerfil() {
  const token = tokenActual();
  if (!token) return null;
  try {
    const respuesta = await fetch(API + '/usuarios/perfil/foto', { headers: { Authorization: 'Bearer ' + token } });
    if (!respuesta.ok) return null;
    return URL.createObjectURL(await respuesta.blob());
  } catch (e) {
    return null;
  }
}
