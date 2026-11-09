import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Ventana emergente con las mismas clases de Bootstrap (modal, fade, show), sin necesitar su JavaScript.
let abiertos = 0;

function bloquearScroll() {
  if (abiertos === 0) {
    const ancho = window.innerWidth - document.documentElement.clientWidth;
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    if (ancho > 0) document.body.style.paddingRight = ancho + 'px';
  }
  abiertos++;
}

function liberarScroll() {
  abiertos = Math.max(0, abiertos - 1);
  if (abiertos === 0) {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

export default function Modal({ abierto, onCerrar, className = '', dialogClassName = '', onMostrado, children }) {
  const [montado, setMontado] = useState(abierto);
  const [visible, setVisible] = useState(false);

  // entrada y salida con transición
  useEffect(() => {
    let cerrar, mostrado, raf;
    if (abierto) {
      setMontado(true);
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      mostrado = setTimeout(() => onMostrado && onMostrado(), 350);
    } else {
      setVisible(false);
      cerrar = setTimeout(() => setMontado(false), 300);
    }
    return () => {
      clearTimeout(cerrar);
      clearTimeout(mostrado);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  // mientras está montado, la página de atrás no se desplaza
  useEffect(() => {
    if (!montado) return undefined;
    bloquearScroll();
    return liberarScroll;
  }, [montado]);

  // Escape cierra
  useEffect(() => {
    if (!abierto) return undefined;
    const alTeclear = (e) => { if (e.key === 'Escape') onCerrar && onCerrar(); };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  if (!montado) return null;

  return createPortal(
    <>
      <div
        className={`modal fade ${className} ${visible ? 'show' : ''}`}
        style={{ display: 'block' }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => { if (e.target === e.currentTarget && onCerrar) onCerrar(); }}
      >
        <div className={`modal-dialog ${dialogClassName}`}>{children}</div>
      </div>
      <div className={`modal-backdrop fade ${visible ? 'show' : ''}`}></div>
    </>,
    document.body
  );
}
