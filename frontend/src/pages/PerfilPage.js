import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API, api, cargarFotoPerfil } from '../lib/api';
import { cerrarSesion, guardarUsuarioLocal, tokenActual } from '../lib/sesion';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { useMenuUsuario } from '../components/Layout';
import { ChipTexto } from '../components/Chips';
import { PageHead } from '../components/Piezas';

// Monedas admitidas (las mismas que valida el servidor)
const MONEDAS = {
  COP: 'Peso colombiano (COP)',
  USD: 'Dólar estadounidense (USD)',
  EUR: 'Euro (EUR)',
  MXN: 'Peso mexicano (MXN)',
  ARS: 'Peso argentino (ARS)',
  CLP: 'Peso chileno (CLP)',
  PEN: 'Sol peruano (PEN)',
  BRL: 'Real brasileño (BRL)',
  GBP: 'Libra esterlina (GBP)',
  CAD: 'Dólar canadiense (CAD)',
};
const TAMANO_MAXIMO = 2 * 1024 * 1024;

// Mi perfil: datos personales, moneda, foto y contraseña.
export default function PerfilPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const { actualizarMenu } = useMenuUsuario();
  const archivoFoto = useRef(null);

  const [perfil, setPerfil] = useState(null);
  const [urlFoto, setUrlFoto] = useState(null); // dirección temporal (blob) de la foto actual

  // datos personales
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState('');
  const [moneda, setMoneda] = useState('COP');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // contraseña
  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passRepetir, setPassRepetir] = useState('');
  const [cambiandoPass, setCambiandoPass] = useState(false);

  // pide la foto y reemplaza la anterior (liberando su memoria)
  const pintarFoto = useCallback(async (tieneFoto) => {
    const url = tieneFoto ? await cargarFotoPerfil() : null;
    setUrlFoto((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return url;
    });
  }, []);

  useEffect(() => () => setUrlFoto((u) => { if (u) URL.revokeObjectURL(u); return null; }), []);

  // Después de cambiar algo: se actualiza lo guardado en el navegador, el formulario y el menú
  const sincronizar = (u) => {
    setPerfil(u);
    guardarUsuarioLocal({ nombre: u.nombre, pais: u.pais, monedaPreferida: u.monedaPreferida, tieneFoto: u.tieneFoto, rol: u.rol });
    setNombre(u.nombre || '');
    setPais(u.pais || '');
    setMoneda(MONEDAS[u.monedaPreferida] ? u.monedaPreferida : 'COP');
    actualizarMenu(u);
  };

  useEffect(() => {
    intentar(async () => {
      const u = await api('/usuarios/perfil');
      sincronizar(u);
      await pintarFoto(u.tieneFoto);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- datos personales ----------
  const guardarPerfil = (e) => {
    e.preventDefault();
    setGuardandoPerfil(true);
    intentar(async () => {
      try {
        const u = await api('/usuarios/perfil', 'PUT', { nombre, pais, monedaPreferida: moneda });
        sincronizar(u);
        mensaje('Perfil actualizado');
      } finally {
        setGuardandoPerfil(false);
      }
    });
  };

  // ---------- foto ----------
  const alElegirFoto = (e) => {
    const archivo = e.target.files[0];
    e.target.value = ''; // para poder elegir el mismo archivo otra vez
    if (!archivo) return;
    if (!['image/png', 'image/jpeg'].includes(archivo.type)) return mensaje('La foto debe ser JPG o PNG', 'warning');
    if (archivo.size > TAMANO_MAXIMO) return mensaje('La foto es muy grande (máximo 2 MB)', 'warning');

    intentar(async () => {
      const datos = new FormData();
      datos.append('foto', archivo);
      // no se usa api(): el navegador debe poner solo el tipo "multipart" del envío
      const respuesta = await fetch(API + '/usuarios/perfil/foto', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + tokenActual() },
        body: datos,
      });
      if (respuesta.status === 401) { cerrarSesion(); return; }
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(cuerpo.message || 'No se pudo subir la foto');
      sincronizar(cuerpo);
      await pintarFoto(cuerpo.tieneFoto);
      mensaje('Foto actualizada');
    });
  };

  const quitarFoto = () => {
    intentar(async () => {
      const u = await api('/usuarios/perfil/foto', 'DELETE');
      sincronizar(u);
      await pintarFoto(u.tieneFoto);
      mensaje('Foto eliminada');
    });
  };

  // ---------- contraseña ----------
  const cambiarPassword = (e) => {
    e.preventDefault();
    if (passNueva.length < 6) return mensaje('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
    if (passNueva !== passRepetir) return mensaje('Las contraseñas nuevas no coinciden', 'warning');

    setCambiandoPass(true);
    intentar(async () => {
      try {
        const respuesta = await api('/usuarios/perfil/password', 'PUT', { actual: passActual, nueva: passNueva });
        localStorage.setItem('jwtToken', respuesta.token); // el servidor entrega una sesión nueva; las de otros dispositivos se cierran
        setPassActual('');
        setPassNueva('');
        setPassRepetir('');
        mensaje('Contraseña actualizada');
      } finally {
        setCambiandoPass(false);
      }
    });
  };

  // ---------- eliminar cuenta ----------
  const eliminarCuenta = async () => {
    if (!(await confirmar('¿Eliminar tu cuenta y todos tus datos?', 'Eliminar cuenta'))) return;
    intentar(async () => {
      await api(`/usuarios/${perfil.idUsuario}`, 'DELETE');
      cerrarSesion();
    });
  };

  const tieneFoto = perfil ? perfil.tieneFoto : false;
  const inicial = String((perfil && perfil.nombre) || '?').trim().charAt(0).toUpperCase();

  return (
    <main className="container">
      <PageHead titulo="Mi perfil" sub="Tus datos y preferencias." />

      <div className="row g-3">
        {/* Foto y cuenta */}
        <div className="col-12 col-lg-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="perfil-avatar mx-auto mb-3" aria-label="Tu foto de perfil" style={urlFoto ? { backgroundImage: `url(${urlFoto})` } : undefined}>
                <span>{urlFoto ? '' : inicial}</span>
              </div>
              <h2 className="h5 mb-1">{(perfil && perfil.nombre) || '\u00A0'}</h2>
              <p className="text-muted small mb-1">{(perfil && perfil.correo) || '\u00A0'}</p>
              <div className="mb-3">{perfil && perfil.rol === 'ADMIN' && <ChipTexto texto="Administrador" clase="ahorro" />}</div>

              <input type="file" ref={archivoFoto} accept="image/png,image/jpeg" className="d-none" onChange={alElegirFoto} />
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-primary" onClick={() => archivoFoto.current.click()}><i className="bi bi-camera"></i> Cambiar foto</button>
                {tieneFoto && <button type="button" className="btn btn-outline-danger" onClick={quitarFoto}><i className="bi bi-trash3"></i> Quitar foto</button>}
              </div>
              <p className="small text-muted mt-3 mb-0">JPG o PNG, hasta 2 MB. Se ajusta sola a un tamaño pequeño.</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          {/* Datos personales */}
          <div className="card mb-3">
            <div className="card-header">Datos personales</div>
            <div className="card-body">
              <form className="row g-3" onSubmit={guardarPerfil}>
                <div className="col-12 col-md-6">
                  <label htmlFor="nombre" className="form-label">Nombre</label>
                  <input id="nombre" className="form-control" maxLength={100} required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="correo" className="form-label">Correo <small>(no se puede cambiar)</small></label>
                  <input id="correo" type="email" className="form-control" disabled value={(perfil && perfil.correo) || ''} readOnly />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="pais" className="form-label">País</label>
                  <input id="pais" className="form-control" maxLength={80} placeholder="Opcional" value={pais} onChange={(e) => setPais(e.target.value)} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="moneda" className="form-label">Moneda</label>
                  <select id="moneda" className="form-select" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
                    {Object.entries(MONEDAS).map(([codigo, texto]) => <option key={codigo} value={codigo}>{texto}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <p className="small text-muted mb-0">La moneda solo cambia cómo se muestran los montos en toda la app; no convierte valores.</p>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary" disabled={guardandoPerfil}>Guardar cambios</button>
                </div>
              </form>
            </div>
          </div>

          {/* Contraseña */}
          <div className="card mb-3">
            <div className="card-header">Contraseña</div>
            <div className="card-body">
              <form className="row g-3" onSubmit={cambiarPassword}>
                <div className="col-12">
                  <label htmlFor="passActual" className="form-label">Contraseña actual</label>
                  <input id="passActual" type="password" className="form-control" autoComplete="current-password" required value={passActual} onChange={(e) => setPassActual(e.target.value)} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="passNueva" className="form-label">Nueva contraseña</label>
                  <input id="passNueva" type="password" className="form-control" minLength={6} autoComplete="new-password" required value={passNueva} onChange={(e) => setPassNueva(e.target.value)} />
                </div>
                <div className="col-12 col-md-6">
                  <label htmlFor="passRepetir" className="form-label">Repite la nueva</label>
                  <input id="passRepetir" type="password" className="form-control" minLength={6} autoComplete="new-password" required value={passRepetir} onChange={(e) => setPassRepetir(e.target.value)} />
                </div>
                <div className="col-12">
                  <p className="small text-muted mb-2">Mínimo 6 caracteres. Al cambiarla, se cierran tus sesiones en otros dispositivos.</p>
                  <button type="submit" className="btn btn-primary" disabled={cambiandoPass}>Cambiar contraseña</button>
                </div>
              </form>
            </div>
          </div>

          {/* Eliminar cuenta */}
          <div className="card">
            <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h2 className="h6 mb-1">Eliminar mi cuenta</h2>
                <p className="small text-muted mb-0">Se borran tu cuenta y todos tus datos. No se puede deshacer.</p>
              </div>
              <button type="button" className="btn btn-outline-danger" onClick={eliminarCuenta}>Eliminar cuenta</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
