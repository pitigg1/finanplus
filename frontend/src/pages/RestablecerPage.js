import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAviso } from '../context/Aviso';
import { BotonTema } from '../components/Piezas';

// Cambia la contraseña con el enlace que llegó por correo (?token=...)
export default function RestablecerPage() {
  const { mensaje, intentar } = useAviso();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);

  const guardar = (e) => {
    e.preventDefault();
    if (nueva.length < 6) return mensaje('La contraseña debe tener al menos 6 caracteres', 'warning');
    if (nueva !== repetir) return mensaje('Las contraseñas no coinciden', 'warning');

    setGuardando(true);
    intentar(async () => {
      try {
        await api('/auth/restablecer-password', 'POST', { token: token, nuevaPassword: nueva });
        setListo(true);
        // por seguridad, se cierra cualquier sesión que hubiera quedado abierta en este navegador
        ['jwtToken', 'usuarioId', 'usuario'].forEach((k) => localStorage.removeItem(k));
      } finally {
        setGuardando(false);
      }
    });
  };

  return (
    <>
      <BotonTema className="btn-tema-flotante" />
      <main className="container py-4">
        <div className="login-wrap">
          <div className="text-center mb-4">
            <div className="login-logo"><i className="bi bi-shield-lock"></i></div>
            <h1 className="mb-1">Elige tu nueva contraseña</h1>
            <p className="text-muted mb-0">Mínimo 6 caracteres. Al cambiarla, se cerrarán las sesiones abiertas.</p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              {/* el enlace no trae el código */}
              {!token && (
                <div className="text-center">
                  <div className="fs-1 text-warning mb-2"><i className="bi bi-exclamation-triangle"></i></div>
                  <h2 className="h5 mb-2">El enlace está incompleto</h2>
                  <p className="text-muted">Abre el enlace completo que te llegó al correo o pide uno nuevo.</p>
                  <Link to="/recuperar" className="btn btn-primary w-100">Pedir un enlace nuevo</Link>
                </div>
              )}

              {token && !listo && (
                <form className="row g-3" onSubmit={guardar}>
                  <div className="col-12">
                    <label htmlFor="nueva" className="form-label">Nueva contraseña</label>
                    <input id="nueva" type="password" className="form-control" minLength={6} autoComplete="new-password" required value={nueva} onChange={(e) => setNueva(e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label htmlFor="repetir" className="form-label">Repite la contraseña</label>
                    <input id="repetir" type="password" className="form-control" minLength={6} autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} />
                  </div>
                  <div className="col-12 pt-2">
                    <button type="submit" className="btn btn-primary w-100" disabled={guardando}>Cambiar contraseña</button>
                  </div>
                </form>
              )}

              {token && listo && (
                <div className="text-center">
                  <div className="fs-1 text-success mb-2"><i className="bi bi-check-circle"></i></div>
                  <h2 className="h5 mb-2">¡Contraseña cambiada!</h2>
                  <p className="text-muted">Ya puedes iniciar sesión con tu nueva contraseña.</p>
                  <Link to="/login" className="btn btn-primary w-100">Iniciar sesión</Link>
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
