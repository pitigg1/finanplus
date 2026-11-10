import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { NOMBRES_MESES, humano, montoTexto } from '../lib/formato';

// ===== Campos de los formularios "hoja" (estilo Ajustes de iOS) =====
// Cada campo es una columna con la clase que el CSS espera: fila, bloque, nota o seg.

export function Campo({ col = 'col-12', tipo = 'fila', etiqueta, htmlFor, children }) {
  return (
    <div className={`${col} ${tipo}`}>
      {etiqueta !== undefined && <label className="form-label" htmlFor={htmlFor}>{etiqueta}</label>}
      {children}
    </div>
  );
}

// Campo de texto: si está vacío iOS muestra "Obligatorio" u "Opcional" para que se vea dónde escribir
export function Entrada({ requerido, type = 'text', placeholder, className = '', ...props }) {
  const sinMarca = type === 'date' || type === 'datetime-local' || type === 'color';
  return (
    <input
      className={`form-control ${className}`.trim()}
      type={type}
      required={requerido}
      placeholder={placeholder ?? (sinMarca ? undefined : requerido ? 'Obligatorio' : 'Opcional')}
      {...props}
    />
  );
}

// Interruptor (casilla "Activo")
export function Interruptor({ id, etiqueta, checked, onChange }) {
  return (
    <div className="col-12 fila">
      <div className="form-check form-switch fila-switch">
        <input id={id} type="checkbox" className="form-check-input" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <label htmlFor={id} className="form-check-label">{etiqueta}</label>
      </div>
    </div>
  );
}

// ----- Segmentado: reemplaza a un <select> corto (2 a 4 opciones) -----
const NOMBRES_ESPECIALES = { INVERSION: 'Inversión', ACCION: 'Acción' };

// ['GASTO', 'INGRESO'] -> [['GASTO', 'Gasto'], ['INGRESO', 'Ingreso']]
export function opciones(valores) {
  return valores.map((v) => [v, NOMBRES_ESPECIALES[v] || humano(v)]);
}

export function Segmentado({ opciones: lista, valor, onChange }) {
  return (
    <div className="segmented" role="radiogroup">
      {lista.map(([v, texto]) => (
        <button key={v} type="button" className={v === valor ? 'activo' : ''} onClick={() => onChange(v)}>
          {texto}
        </button>
      ))}
    </div>
  );
}

// ----- Monto con puntos de miles (1500000 -> 1.500.000) -----
// Se ve con puntos, pero el valor que guarda el estado es el número limpio.

// Ajusta el ancho del campo al ancho real de su texto, así el número queda justo y centrado junto al $.
function useAnchoAlTexto(ref, texto, hero) {
  const medidor = useRef(null);

  useEffect(() => () => {
    if (medidor.current) {
      medidor.current.remove();
      medidor.current = null;
    }
  }, []);

  const ajustar = useCallback(() => {
    const campo = ref.current;
    if (!campo) return;
    if (!medidor.current) {
      const m = document.createElement('span');
      m.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;';
      document.body.appendChild(m);
      medidor.current = m;
    }
    // en el monto grande, los números muy largos reducen la letra para no salirse de la pantalla
    if (hero) {
      const n = campo.value.length;
      campo.style.fontSize = n > 16 ? '26px' : n > 13 ? '30px' : n > 10 ? '40px' : '';
    }
    const e = getComputedStyle(campo);
    const m = medidor.current;
    m.style.fontFamily = e.fontFamily;
    m.style.fontSize = e.fontSize;
    m.style.fontWeight = e.fontWeight;
    m.style.letterSpacing = e.letterSpacing;
    m.style.fontVariantNumeric = e.fontVariantNumeric;
    m.style.fontFeatureSettings = e.fontFeatureSettings;
    m.textContent = campo.value || campo.placeholder || '0';
    campo.style.width = Math.max(24, Math.ceil(m.getBoundingClientRect().width) + 4) + 'px';
  }, [hero, ref]);

  useLayoutEffect(() => { ajustar(); }, [texto, ajustar]);
  useEffect(() => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
  }, [ajustar]);
}

export function MontoInput({ id, valor, onChange, hero = false, requerido = false, className = '' }) {
  const ref = useRef(null);
  const digitosADerecha = useRef(null);
  const [, forzar] = useState(0);
  const texto = montoTexto(valor);

  useAnchoAlTexto(ref, texto, hero);

  const alEscribir = (e) => {
    const input = e.target;
    const posicion = input.selectionStart ?? input.value.length;
    digitosADerecha.current = input.value.slice(posicion).replace(/\D/g, '').length;
    const digitos = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    onChange(digitos ? Number(digitos) : 0);
    forzar((n) => n + 1);
  };

  // deja el cursor con la misma cantidad de dígitos a su derecha que antes
  useLayoutEffect(() => {
    const input = ref.current;
    if (!input || digitosADerecha.current === null || document.activeElement !== input) return;
    let i = input.value.length;
    let contados = 0;
    while (i > 0 && contados < digitosADerecha.current) {
      i--;
      if (/\d/.test(input.value[i])) contados++;
    }
    input.setSelectionRange(i, i);
    digitosADerecha.current = null;
  });

  return (
    <input
      ref={ref}
      id={id}
      type="text"
      inputMode="numeric"
      className={`form-control monto ${className}`.trim()}
      placeholder="0"
      required={requerido}
      value={texto}
      onChange={alEscribir}
    />
  );
}

// $ + número
export function GrupoMonto(props) {
  return (
    <div className="input-group">
      <span className="input-group-text">$</span>
      <MontoInput {...props} />
    </div>
  );
}

// El primer monto del formulario sube arriba, en grande
export function HeroMonto({ etiqueta = 'Monto', ...props }) {
  return (
    <div className="hero-monto">
      <span className="hero-monto-et">{etiqueta}</span>
      <GrupoMonto hero {...props} />
    </div>
  );
}

// ----- Selectores de cuadritos -----
function useValidez(ref, mensaje, invalido) {
  useEffect(() => {
    if (ref.current) ref.current.setCustomValidity(invalido ? mensaje : '');
  }, [ref, mensaje, invalido]);
}

// Categoría: cuadritos con su ícono (emoji) y color. Hay un campo oculto que hace que el formulario la exija.
export function SelectorCategorias({ categorias, valor, onChange, requerido = true, etiqueta = 'Categoría' }) {
  const [error, setError] = useState(false);
  const oculto = useRef(null);
  const contenedor = useRef(null);
  useValidez(oculto, 'Elige una categoría', requerido && !valor);
  useEffect(() => { if (valor) setError(false); }, [valor]);

  return (
    <>
      <input
        ref={oculto}
        className="sr-select"
        tabIndex={-1}
        aria-hidden="true"
        required={requerido}
        value={valor ?? ''}
        onChange={() => {}}
        onInvalid={() => {
          setError(true);
          if (contenedor.current) contenedor.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }}
      />
      <div ref={contenedor} className={`cat-picker ${error ? 'cat-error' : ''}`.trim()} role="radiogroup" aria-label={etiqueta}>
        {categorias.length === 0 ? (
          <div className="cat-vacio">
            Todavía no hay categorías para elegir. Crea una en <Link to="/categorias">Categorías</Link>.
          </div>
        ) : (
          categorias.map((c) => {
            const id = String(c.idCategoria);
            const activo = id === String(valor);
            return (
              <button
                key={id}
                type="button"
                className={`cat-tile ${activo ? 'activo' : ''}`.trim()}
                role="radio"
                aria-checked={activo}
                style={{ '--c': c.color || '#8E8E93' }}
                onClick={() => onChange(id)}
              >
                <span className="avatar-cat">{c.icono ? c.icono : <i className="bi bi-tag-fill"></i>}</span>
                <span className="cat-nombre">{c.nombre}</span>
                <i className="bi bi-check-circle-fill cat-check"></i>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

// Tipo de inversión: cuadritos con un ícono y un color para cada tipo
const TIPOS_ACTIVO = {
  ACCION: ['bi-graph-up-arrow', '#34C759', 'Acción'],
  ETF: ['bi-pie-chart-fill', '#5856D6', 'ETF'],
  CRIPTO: ['bi-currency-bitcoin', '#FF9500', 'Cripto'],
  FONDO: ['bi-piggy-bank-fill', '#007AFF', 'Fondo'],
  CDT: ['bi-bank2', '#32ADE6', 'CDT'],
  BONO: ['bi-file-earmark-text-fill', '#AF52DE', 'Bono'],
  OTRO: ['bi-three-dots', '#8E8E93', 'Otro'],
};

export function SelectorTipoActivo({ valor, onChange }) {
  return (
    <div className="cat-picker tipo-picker" role="radiogroup" aria-label="Tipo de inversión">
      {Object.entries(TIPOS_ACTIVO).map(([v, [icono, color, nombre]]) => {
        const activo = v === valor;
        return (
          <button
            key={v}
            type="button"
            className={`cat-tile ${activo ? 'activo' : ''}`.trim()}
            role="radio"
            aria-checked={activo}
            style={{ '--c': color }}
            onClick={() => onChange(v)}
          >
            <span className="avatar-cat"><i className={`bi ${icono}`}></i></span>
            <span className="cat-nombre">{nombre}</span>
            <i className="bi bi-check-circle-fill cat-check"></i>
          </button>
        );
      })}
    </div>
  );
}

// Mes: cuadrícula con los meses del año (en vez de escribir el número 1 a 12)
export function SelectorMeses({ valor, onChange, requerido = true }) {
  const [error, setError] = useState(false);
  const oculto = useRef(null);
  const actual = new Date().getMonth() + 1;
  const elegido = Number(valor);
  const valido = Boolean(NOMBRES_MESES[elegido - 1]);
  useValidez(oculto, 'Elige un mes', requerido && !valido);
  useEffect(() => { if (valido) setError(false); }, [valido]);

  return (
    <>
      <input
        ref={oculto}
        type="number"
        min="1"
        max="12"
        className="sr-select"
        tabIndex={-1}
        aria-hidden="true"
        required={requerido}
        value={valor ?? ''}
        onChange={() => {}}
        onInvalid={() => setError(true)}
      />
      <div className={`mes-picker ${error ? 'cat-error' : ''}`.trim()} role="radiogroup" aria-label="Mes">
        {NOMBRES_MESES.map((n, i) => {
          const activo = i + 1 === elegido;
          return (
            <button
              key={n}
              type="button"
              className={`mes-tile ${i + 1 === actual ? 'actual' : ''} ${activo ? 'activo' : ''}`.replace(/\s+/g, ' ').trim()}
              role="radio"
              aria-checked={activo}
              aria-label={n}
              title={n}
              onClick={() => onChange(i + 1)}
            >
              {n.slice(0, 3)}
            </button>
          );
        })}
        <div className="mes-nombre">{NOMBRES_MESES[elegido - 1] || 'Elige un mes'}</div>
      </div>
    </>
  );
}
