import { monedaActual } from './sesion';

export const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Formato de dinero en la moneda del perfil
export function dinero(valor) {
  const moneda = monedaActual();
  const decimales = moneda === 'COP' || moneda === 'CLP' ? 0 : 2; // el peso colombiano y el chileno no usan centavos
  try {
    return Number(valor ?? 0).toLocaleString('es-CO', { style: 'currency', currency: moneda, minimumFractionDigits: 0, maximumFractionDigits: decimales });
  } catch (e) {
    return '$ ' + Number(valor ?? 0).toLocaleString('es-CO');
  }
}

// Formato fecha: "2026-10-08T17:10:00" -> "2026-10-08 17:10"
export function fecha(valor) {
  return valor ? String(valor).replace('T', ' ').slice(0, 16) : '';
}

// Fecha y hora actual (hora local) en formato ISO sin zona
export function ahora() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 19);
}

// "GASTO_ELEVADO" -> "Gasto elevado"
export function humano(texto) {
  const t = String(texto ?? '').toLowerCase().replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Clase de color de cada tipo de movimiento
export function claseTipo(tipo) {
  return { INGRESO: 'ingreso', GASTO: 'gasto', AHORRO: 'ahorro', INVERSION: 'inversion' }[tipo] || 'otro';
}

// 1500000 -> "1.500.000"  (0 o vacío -> "")
export function montoTexto(valor) {
  return valor ? Math.round(Number(valor)).toLocaleString('es-CO') : '';
}
