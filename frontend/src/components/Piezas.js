import React from 'react';
import { alternarTema } from '../lib/tema';

// Encabezado de página: título, subtítulo y (opcional) el botón "Nuevo"
export function PageHead({ titulo, sub, children }) {
  return (
    <div className="page-head">
      <div><h1>{titulo}</h1><p className="page-sub">{sub}</p></div>
      {children}
    </div>
  );
}

export function BotonNuevo({ texto, onClick }) {
  return (
    <button type="button" className="btn btn-primary btn-nuevo" onClick={onClick}>
      <i className="bi bi-plus-lg"></i><span>{texto}</span>
    </button>
  );
}

// Botón de sol/luna para cambiar entre modo claro y oscuro
export function BotonTema({ className = '' }) {
  return (
    <button
      className={`btn-tema ${className}`.trim()}
      type="button"
      onClick={alternarTema}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
    >
      <i className="bi bi-moon-stars i-luna"></i>
      <i className="bi bi-sun i-sol"></i>
    </button>
  );
}

// Aviso de "sin datos" con ícono
export function Vacio({ icono, children }) {
  return <div className="vacio"><i className={`bi ${icono}`}></i><p>{children}</p></div>;
}

// Tabla. Cada columna: { t: 'Título', className, style }.
// Las celdas de cada fila llevan data-label (el CSS lo usa para convertir cada fila en tarjeta en el celular).
export function Tabla({ columnas, children, small = false }) {
  return (
    <table className={`table ${small ? 'table-sm' : 'table-hover'} align-middle mb-0`}>
      <thead>
        <tr>
          {columnas.map((c) => (
            <th key={c.t} className={c.className} style={c.style}>{c.t}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

// Tarjeta que envuelve una tabla (con scroll horizontal si hace falta)
export function TarjetaTabla({ columnas, antes, responsive = true, children }) {
  return (
    <div className="card">
      <div className={`card-body ${responsive ? 'table-responsive' : ''}`.trim()}>
        {antes}
        <Tabla columnas={columnas}>{children}</Tabla>
      </div>
    </div>
  );
}

// Fila vacía de una tabla ("Todavía no hay…")
export function FilaVacia({ columnas, texto }) {
  return (
    <tr>
      <td colSpan={columnas} className="text-center text-muted fila-vacia">{texto}</td>
    </tr>
  );
}
