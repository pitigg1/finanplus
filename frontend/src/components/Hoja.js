import React, { useRef } from 'react';
import Modal from './Modal';

// Formulario como "hoja" (sheet) estilo iOS: barra con Cancelar / título / Guardar.
// Se abre con el botón "Nuevo" y al editar; se cierra al guardar o cancelar.
export default function Hoja({ abierta, titulo, onCerrar, formRef, children }) {
  const cuerpo = useRef(null);

  // al abrir, el cursor va al primer campo
  const alMostrar = () => {
    const primero = cuerpo.current && cuerpo.current.querySelector('input:not([type=hidden]):not([type=checkbox]):not(.sr-select), select');
    if (primero) primero.focus();
  };

  return (
    <Modal
      abierto={abierta}
      onCerrar={onCerrar}
      onMostrado={alMostrar}
      className="hoja"
      dialogClassName="modal-dialog-centered modal-dialog-scrollable modal-lg"
    >
      <div className="modal-content">
        <div className="hoja-barra">
          <button type="button" className="hoja-cancelar" onClick={onCerrar}>Cancelar</button>
          <span className="hoja-titulo"><h2 className="h5">{titulo}</h2></span>
          <button type="button" className="hoja-guardar" onClick={() => formRef.current && formRef.current.requestSubmit()}>
            Guardar
          </button>
        </div>
        <div className="modal-body" ref={cuerpo}>{children}</div>
      </div>
    </Modal>
  );
}

// <form> de la hoja. Dentro va el monto grande (HeroMonto) y luego <div className="grupo-ios"> con los campos.
export function FormularioHoja({ formRef, onSubmit, children }) {
  return (
    <form
      ref={formRef}
      className="row g-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      {children}
      <button type="submit" className="d-none" tabIndex={-1} aria-hidden="true"></button>
    </form>
  );
}
