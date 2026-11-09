import React from 'react';
import { claseTipo, dinero } from '../lib/formato';

export function ChipTexto({ texto, clase = 'otro', children }) {
  return <span className={`chip chip-${clase}`}>{children ?? texto}</span>;
}

export function ChipTipo({ tipo }) {
  return <ChipTexto clase={claseTipo(tipo)} texto={tipo} />;
}

export function ChipEstado({ estado }) {
  const c = { ACTIVA: 'ingreso', COMPLETADA: 'ahorro', CANCELADA: 'otro' }[estado] || 'otro';
  return <ChipTexto clase={c} texto={estado} />;
}

export function ChipRiesgo({ riesgo }) {
  const c = { BAJO: 'ingreso', MEDIO: 'medio', ALTO: 'gasto' }[riesgo] || 'otro';
  return <ChipTexto clase={c} texto={riesgo} />;
}

export function ChipPrioridad({ nivel }) {
  const c = { ALTA: 'gasto', MEDIA: 'medio', BAJA: 'ingreso' }[nivel] || 'otro';
  return <ChipTexto clase={c} texto={nivel} />;
}

// +$ 3.200.000 en verde para ingresos, −$ 65.000 en rojo para gastos
export function MontoConSigno({ tipo, monto }) {
  const clase = tipo === 'INGRESO' ? 'monto-ingreso' : tipo === 'GASTO' ? 'monto-gasto' : '';
  const signo = tipo === 'INGRESO' ? '+' : tipo === 'GASTO' ? '−' : '';
  return <span className={clase}>{signo}{dinero(monto)}</span>;
}
