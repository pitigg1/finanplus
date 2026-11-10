import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAviso } from '../context/Aviso';
import { BotonTema } from '../components/Piezas';

// Pide el enlace para cambiar la contraseña. El servidor responde lo mismo exista o no el correo.
export default function RecuperarPage() {
  const { intentar } = useAviso();
  const [correo, setCorreo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [textoExito, setTextoExito] = useState(null);

  const enviar = (e) => {
    e.preventDefault();
    setEnviando(true);
    intentar(async () => {
      try {
        const respuesta = await api('/auth/olvide-password', 'POST', { correo: correo.trim() });
        setTextoExito(respuesta.message);
      } finally {
        setEnviando(false);
      }
    });
  };

  return (
    <>
      <BotonTema className="btn-tema-flotante" />
      <main className="container py-4">
        <div className="login-wrap">
          <div className="text-center mb-4">
            <div className="login-logo"><i className="bi bi-key"></i></div>
            <h1 className="mb-1">¿Olvidaste tu contraseña?</h1>
            <p className="text-muted mb-0">Escribe tu correo y te enviaremos un enlace para elegir una nueva.</p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              {textoExito === null ? (
                <form className="row g-3" onSubmit={enviar}>
                  <div className="col-12">
                    <label htmlFor="correo" className="form-label">Correo electrónico</label>
                    <input id="correo" type="email" className="form-control" placeholder="correo@ejemplo.com" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </div>
                  <div className="col-12 pt-2">
                    <button type="submit" className="btn btn-primary w-100" disabled={enviando}>Enviar enlace</button>
                  </div>
                </form>
              ) : (
                <div className="text-center">
                  <div className="fs-1 text-success mb-2"><i className="bi bi-envelope-check"></i></div>
                  <h2 className="h5 mb-2">Revisa tu correo</h2>
                  <p className="text-muted mb-0">{textoExito}</p>
                  <p className="small text-muted mt-3 mb-0">Si no te llega, mira la carpeta de spam. Puedes pedir otro enlace en un minuto.</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-center mt-4"><Link to="/login">Volver a iniciar sesión</Link></p>
        </div>
      </main>
    </>
  );
}
