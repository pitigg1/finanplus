import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ICONOS = {
  success: 'check-circle-fill',
  danger: 'exclamation-triangle-fill',
  warning: 'exclamation-circle-fill',
  info: 'info-circle-fill',
};

const AvisoContext = createContext(null);

// Avisos flotantes (tipo notificación de iOS) que se cierran solos.
// Reemplaza a mensaje() e intentar() del código original.
export function AvisoProvider({ children }) {
  const [aviso, setAviso] = useState(null); // { texto, tipo, id }
  const temporizador = useRef(null);

  const mensaje = useCallback((texto, tipo = 'success') => {
    setAviso({ texto, tipo, id: Date.now() });
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setAviso(null), tipo === 'danger' ? 7000 : 3500);
  }, []);

  // Ejecuta una función y, si falla, muestra el error
  const intentar = useCallback(
    async (funcion) => {
      try {
        await funcion();
      } catch (e) {
        mensaje(e.message, 'danger');
      }
    },
    [mensaje]
  );

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const valor = useMemo(() => ({ mensaje, intentar }), [mensaje, intentar]);

  return (
    <AvisoContext.Provider value={valor}>
      {children}
      <div id="alerta">
        {aviso && (
          <div key={aviso.id} className={`alert alert-${aviso.tipo} alert-dismissible fade show`} role="alert">
            <i className={`bi bi-${ICONOS[aviso.tipo] || ICONOS.info}`}></i>
            <span>{aviso.texto}</span>
            <button type="button" className="btn-close" aria-label="Cerrar" onClick={() => setAviso(null)}></button>
          </div>
        )}
      </div>
    </AvisoContext.Provider>
  );
}

export function useAviso() {
  return useContext(AvisoContext);
}
