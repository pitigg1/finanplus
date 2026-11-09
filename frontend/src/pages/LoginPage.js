import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API } from '../lib/api';
import { useAviso } from '../context/Aviso';
import { BotonTema } from '../components/Piezas';

const MONEDAS = [
  ['COP', 'Peso colombiano (COP)'],
  ['USD', 'Dólar estadounidense (USD)'],
  ['EUR', 'Euro (EUR)'],
  ['MXN', 'Peso mexicano (MXN)'],
  ['ARS', 'Peso argentino (ARS)'],
  ['CLP', 'Peso chileno (CLP)'],
  ['PEN', 'Sol peruano (PEN)'],
  ['BRL', 'Real brasileño (BRL)'],
  ['GBP', 'Libra esterlina (GBP)'],
  ['CAD', 'Dólar canadiense (CAD)'],
];

const API_AUTH = `${API}/auth`;

export default function LoginPage() {
  const navigate = useNavigate();
  const { mensaje } = useAviso();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  const [nombre, setNombre] = useState('');
  const [correoReg, setCorreoReg] = useState('');
  const [passwordReg, setPasswordReg] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [pais, setPais] = useState('');

  // --- Guardar sesión correctamente ---
  const guardarSesion = (data) => {
    localStorage.setItem('jwtToken', data.token);
    localStorage.setItem('usuarioId', data.usuario.idUsuario); // CLAVE VITAL
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    navigate('/');
  };

  // --- Manejo de Login ---
  const iniciarSesion = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_AUTH}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correo.trim(), password }),
      });
      if (response.ok) guardarSesion(await response.json());
      else mensaje('Credenciales incorrectas. Verifique correo y contraseña.', 'danger');
    } catch (error) {
      mensaje('No se pudo conectar con el servidor.', 'danger');
    }
  };

  // --- Manejo de Registro ---
  const registrarse = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_AUTH}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correoReg.trim(),
          password: passwordReg,
          monedaPreferida: moneda.trim() || 'COP',
          pais: pais.trim(),
        }),
      });
      if (response.ok) guardarSesion(await response.json());
      else mensaje('Error al registrar usuario. Verifique los datos introducidos.', 'danger');
    } catch (error) {
      mensaje('Error al conectar con el servicio de registro.', 'danger');
    }
  };

  return (
    <>
      <BotonTema className="btn-tema-flotante" />
      <main className="container py-4">
        <div className="login-wrap">
          <div className="text-center mb-4">
            <div className="login-logo"><i className="bi bi-wallet2"></i></div>
            <h1 className="mb-1">FinanPlus</h1>
            <p className="text-muted mb-0">Entiende en qué se va tu dinero.</p>
          </div>

          <div className="card">
            <div className="card-body p-4">
              <div className="segmented" role="tablist" aria-label="Acceso">
                <button type="button" className={modo === 'login' ? 'activo' : ''} role="tab" aria-selected={modo === 'login'} onClick={() => setModo('login')}>
                  Iniciar sesión
                </button>
                <button type="button" className={modo === 'registro' ? 'activo' : ''} role="tab" aria-selected={modo === 'registro'} onClick={() => setModo('registro')}>
                  Crear cuenta
                </button>
              </div>

              {/* Iniciar sesión */}
              {modo === 'login' && (
                <form className="row g-3" onSubmit={iniciarSesion}>
                  <div className="col-12">
                    <label htmlFor="correoLogin" className="form-label">Correo electrónico</label>
                    <input id="correoLogin" type="email" className="form-control" placeholder="correo@ejemplo.com" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label htmlFor="passwordLogin" className="form-label">Contraseña</label>
                    <input id="passwordLogin" type="password" className="form-control" placeholder="Tu contraseña" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="col-12 pt-2">
                    <button type="submit" className="btn btn-primary w-100">Ingresar</button>
                  </div>
                  <div className="col-12 text-center">
                    <Link to="/recuperar" className="small">¿Olvidaste tu contraseña?</Link>
                  </div>
                </form>
              )}

              {/* Crear cuenta */}
              {modo === 'registro' && (
                <form className="row g-3" onSubmit={registrarse}>
                  <div className="col-12">
                    <label htmlFor="nombreRegistro" className="form-label">Nombre completo</label>
                    <input id="nombreRegistro" type="text" className="form-control" autoComplete="name" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label htmlFor="correoRegistro" className="form-label">Correo electrónico</label>
                    <input id="correoRegistro" type="email" className="form-control" placeholder="correo@ejemplo.com" autoComplete="email" required value={correoReg} onChange={(e) => setCorreoReg(e.target.value)} />
                  </div>
                  <div className="col-12">
                    <label htmlFor="passwordRegistro" className="form-label">Contraseña</label>
                    <input id="passwordRegistro" type="password" className="form-control" placeholder="Mínimo 6 caracteres" minLength={6} autoComplete="new-password" required value={passwordReg} onChange={(e) => setPasswordReg(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label htmlFor="monedaRegistro" className="form-label">Moneda</label>
                    <select id="monedaRegistro" className="form-select" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                      {MONEDAS.map(([codigo, texto]) => <option key={codigo} value={codigo}>{texto}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label htmlFor="paisRegistro" className="form-label">País <span className="fw-normal">(opcional)</span></label>
                    <input id="paisRegistro" type="text" className="form-control" value={pais} onChange={(e) => setPais(e.target.value)} />
                  </div>
                  <div className="col-12 pt-2">
                    <button type="submit" className="btn btn-primary w-100">Crear cuenta</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
