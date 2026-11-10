import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import Modal from '../components/Modal';

const ConfirmarContext = createContext(null);

// Alerta de confirmación estilo iOS (reemplaza al confirm() del navegador).
// Uso:  if (!(await confirmar('¿Eliminar este registro?'))) return;
export function ConfirmarProvider({ children }) {
  const [estado, setEstado] = useState({ abierto: false, texto: '', accion: 'Eliminar' });
  const resolver = useRef(null);

  const confirmar = useCallback((texto, accion = 'Eliminar') => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setEstado({ abierto: true, texto, accion });
    });
  }, []);

  const responder = (resultado) => {
    setEstado((e) => ({ ...e, abierto: false }));
    if (resolver.current) resolver.current(resultado);
    resolver.current = null;
  };

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}
      <Modal abierto={estado.abierto} onCerrar={() => responder(false)} className="alerta-ios" dialogClassName="modal-dialog-centered">
        <div className="modal-content">
          <div className="alerta-cuerpo">
            <h2>{estado.texto}</h2>
            <p>Esta acción no se puede deshacer.</p>
          </div>
          <div className="alerta-botones">
            <button type="button" onClick={() => responder(false)}>Cancelar</button>
            <button type="button" className="peligro" onClick={() => responder(true)}>{estado.accion}</button>
          </div>
        </div>
      </Modal>
    </ConfirmarContext.Provider>
  );
}

export function useConfirmar() {
  return useContext(ConfirmarContext);
}
