export const esc = (texto) => {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
};

export const dinero = (valor) => {
  const moneda = "COP"; // Simplified for now
  return Number(valor ?? 0).toLocaleString("es-CO", { style: "currency", currency: moneda, minimumFractionDigits: 0 });
};

export const fecha = (valor) => {
  return valor ? String(valor).replace("T", " ").slice(0, 16) : "";
};

export const montoConSigno = (tipo, monto) => {
  const signo = tipo === "INGRESO" ? "+" : tipo === "GASTO" ? "−" : "";
  return `${signo}${dinero(monto)}`;
};
