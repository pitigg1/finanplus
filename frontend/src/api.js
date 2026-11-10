const API_BASE = "http://localhost:8094/api";

export const api = async (ruta, metodo = "GET", datos = null) => {
  const token = localStorage.getItem("jwtToken");
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method: metodo,
    headers: headers,
    body: datos ? JSON.stringify(datos) : undefined,
  };

  const respuesta = await fetch(`${API_BASE}${ruta}`, config);

  if (respuesta.status === 401) {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("usuarioId");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    throw new Error(error.message || `Error ${respuesta.status}`);
  }

  if (respuesta.status === 204) return null;
  return await respuesta.json();
};
