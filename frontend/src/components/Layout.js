import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api, cargarFotoPerfil } from '../lib/api';
import { cerrarSesion, esAdmin, guardarUsuarioLocal, tokenActual, usuarioLocal } from '../lib/sesion';
import { BotonTema } from './Piezas';

// El bloque de usuario del menú se actualiza desde "Mi perfil" cuando cambias nombre o foto
const MenuUsuarioContext = createContext({ actualizarMenu: () => {} });
export function useMenuUsuario() {
  return useContext(MenuUsuarioContext);
}

export default function Layout() {
  const { pathname } = useLocation();
  const [perfil, setPerfil] = useState(null); // datos del usuario para el menú
  const [fallo, setFallo] = useState(false);
  const [fotoUrl, setFotoUrl] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false); // menú desplegable del celular
  const [desplegable, setDesplegable] = useState(null); // "Finanzas" | "Organización" | "Análisis"

  // espacio para el menú lateral y la barra de pestañas (lo exigen ios.css y apple.css)
  useEffect(() => {
    document.body.classList.add('con-tabs');
    return () => document.body.classList.remove('con-tabs');
  }, []);

  // cada página nueva empieza arriba y cierra los menús
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuAbierto(false);
    setDesplegable(null);
  }, [pathname]);

  // un clic fuera cierra el desplegable
  useEffect(() => {
    if (!desplegable) return undefined;
    const cerrar = (e) => { if (!e.target.closest('.dropdown')) setDesplegable(null); };
    document.addEventListener('click', cerrar);
    return () => document.removeEventListener('click', cerrar);
  }, [desplegable]);

  // datos frescos del usuario
  useEffect(() => {
    if (!tokenActual()) {
      setFallo(true);
      return;
    }
    api('/usuarios/perfil')
      .then((u) => {
        // si el rol o la moneda cambiaron en el servidor (por ejemplo desde otro dispositivo), se actualiza y se recarga una sola vez
        const guardado = usuarioLocal();
        const cambio = (u.rol && guardado.rol !== u.rol) || (u.monedaPreferida && guardado.monedaPreferida !== u.monedaPreferida);
        guardarUsuarioLocal({ nombre: u.nombre, pais: u.pais, monedaPreferida: u.monedaPreferida, rol: u.rol, tieneFoto: u.tieneFoto });
        if (cambio) {
          window.location.reload();
          return;
        }
        setPerfil(u);
      })
      .catch(() => setFallo(true));
  }, []);

  // foto de perfil del menú lateral
  const tieneFoto = perfil ? perfil.tieneFoto : false;
  useEffect(() => {
    if (!tieneFoto) {
      setFotoUrl(null);
      return undefined;
    }
    let activo = true;
    let url = null;
    cargarFotoPerfil().then((u) => {
      url = u;
      if (activo) setFotoUrl(u);
      else if (u) URL.revokeObjectURL(u);
    });
    return () => {
      activo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [tieneFoto, perfil && perfil.nombre]);

  const actualizarMenu = useCallback((u) => setPerfil(u), []);
  const valorContexto = useMemo(() => ({ actualizarMenu }), [actualizarMenu]);

  const admin = esAdmin();
  const activa = (ruta) => pathname === ruta;

  const enlace = (to, texto, icono) => (
    <li>
      <Link className={`dropdown-item ${activa(to) ? 'active' : ''}`.trim()} to={to}>
        <i className={`bi ${icono} me-2`}></i>{texto}
      </Link>
    </li>
  );

  const item = (to, texto, icono) => (
    <Link className={`sb-item ${activa(to) ? 'activo' : ''}`.trim()} to={to}>
      <i className={`bi ${icono}`}></i><span>{texto}</span>
    </Link>
  );

  const pestana = (to, texto, icono) => (
    <Link to={to} className={activa(to) ? 'activo' : ''} aria-label={texto}>
      <i className={`bi ${icono}${activa(to) ? '-fill' : ''}`}></i><span>{texto}</span>
    </Link>
  );

  const desplegableNav = (nombre, hijos) => (
    <li className="nav-item dropdown">
      <a
        className="nav-link dropdown-toggle"
        href="#"
        role="button"
        aria-expanded={desplegable === nombre}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDesplegable(desplegable === nombre ? null : nombre);
        }}
      >
        {nombre}
      </a>
      <ul className={`dropdown-menu ${desplegable === nombre ? 'show' : ''}`.trim()}>{hijos}</ul>
    </li>
  );

  const primerNombre = perfil ? String(perfil.nombre).split(' ')[0] : '';
  const botonLogin = <Link to="/login" className="btn btn-outline-light btn-sm">Iniciar sesión</Link>;

  return (
    <MenuUsuarioContext.Provider value={valorContexto}>
      <div id="menu">
        {/* Barra superior (celular) */}
        <nav className="navbar navbar-expand-lg apple-nav d-lg-none" aria-label="Navegación principal">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <span className="logo"><i className="bi bi-wallet2"></i></span>FinanPlus
            </Link>
            <BotonTema className="d-lg-none ms-auto me-1" />
            <button className="navbar-toggler" type="button" aria-label="Abrir menú" onClick={() => setMenuAbierto(!menuAbierto)}>
              <i className="bi bi-list"></i>
            </button>
            <div className={`collapse navbar-collapse ${menuAbierto ? 'show' : ''}`.trim()} id="menuPrincipal">
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link className={`nav-link ${activa('/') ? 'active' : ''}`.trim()} to="/">Inicio</Link>
                </li>
                {desplegableNav('Finanzas', <>
                  {enlace('/registros', 'Registros', 'bi-receipt')}
                  {enlace('/presupuestos', 'Presupuestos', 'bi-pie-chart')}
                  {enlace('/recurrentes', 'Movimientos recurrentes', 'bi-arrow-repeat')}
                  {enlace('/metas', 'Metas de ahorro', 'bi-bullseye')}
                  {enlace('/inversiones', 'Inversiones', 'bi-graph-up-arrow')}
                </>)}
                {desplegableNav('Organización', <>
                  {enlace('/categorias', 'Categorías', 'bi-folder2')}
                  {enlace('/etiquetas', 'Etiquetas', 'bi-tag')}
                </>)}
                {desplegableNav('Análisis', <>
                  {enlace('/metricas', 'Métricas', 'bi-speedometer2')}
                  {enlace('/recomendaciones', 'Recomendaciones IA', 'bi-stars')}
                  {enlace('/notificaciones', 'Notificaciones', 'bi-bell')}
                </>)}
                <li className="nav-item">
                  <Link className={`nav-link ${activa('/perfil') ? 'active' : ''}`.trim()} to="/perfil">Mi perfil</Link>
                </li>
                {admin && (
                  <li className="nav-item">
                    <Link className={`nav-link ${activa('/usuarios') ? 'active' : ''}`.trim()} to="/usuarios">Usuarios</Link>
                  </li>
                )}
              </ul>
              <BotonTema className="d-none d-lg-grid me-3" />
              <div className="d-flex align-items-center gap-3 py-2 py-lg-0" id="usuarioMenu">
                {perfil ? (
                  <>
                    <span className="small">Hola, <strong>{primerNombre}</strong></span>
                    <button className="btn btn-outline-light btn-sm" onClick={cerrarSesion}>Cerrar sesión</button>
                  </>
                ) : fallo ? botonLogin : null}
              </div>
            </div>
          </div>
        </nav>

        {/* Menú lateral (pantallas anchas) */}
        <aside className="sidebar" aria-label="Menú lateral">
          <Link className="sb-brand" to="/"><span className="logo"><i className="bi bi-wallet2"></i></span>FinanPlus</Link>
          <nav>
            {item('/', 'Inicio', 'bi-house')}
            <div className="sb-seccion">Finanzas</div>
            {item('/registros', 'Registros', 'bi-receipt')}
            {item('/presupuestos', 'Presupuestos', 'bi-pie-chart')}
            {item('/recurrentes', 'Recurrentes', 'bi-arrow-repeat')}
            {item('/metas', 'Metas de ahorro', 'bi-bullseye')}
            {item('/inversiones', 'Inversiones', 'bi-graph-up-arrow')}
            <div className="sb-seccion">Organización</div>
            {item('/categorias', 'Categorías', 'bi-folder2')}
            {item('/etiquetas', 'Etiquetas', 'bi-tag')}
            <div className="sb-seccion">Análisis</div>
            {item('/metricas', 'Métricas', 'bi-speedometer2')}
            {item('/recomendaciones', 'Recomendaciones IA', 'bi-stars')}
            {item('/notificaciones', 'Notificaciones', 'bi-bell')}
            <div className="sb-seccion">Cuenta</div>
            {item('/perfil', 'Mi perfil', 'bi-person-circle')}
            {admin && item('/usuarios', 'Usuarios', 'bi-people')}
          </nav>
          <div className="sb-pie">
            <div className="sb-usuario">
              {perfil && (
                <Link className="sb-usuario-enlace" to="/perfil" title="Mi perfil">
                  <span className="sb-avatar" style={fotoUrl ? { backgroundImage: `url(${fotoUrl})` } : undefined}>
                    {fotoUrl ? '' : String(perfil.nombre).trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="sb-nombre"><strong>{perfil.nombre}</strong><small>{perfil.correo || ''}</small></span>
                </Link>
              )}
            </div>
            <div className="sb-acciones">
              <BotonTema />
              <button className="btn-salir" type="button" onClick={cerrarSesion}>
                <i className="bi bi-box-arrow-right"></i>Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        {/* Barra de pestañas (celular) */}
        <nav className="tab-bar" aria-label="Pestañas">
          {pestana('/', 'Inicio', 'bi-house')}
          {pestana('/registros', 'Registros', 'bi-receipt')}
          {pestana('/metas', 'Metas', 'bi-bullseye')}
          {pestana('/metricas', 'Métricas', 'bi-speedometer2')}
          {pestana('/notificaciones', 'Alertas', 'bi-bell')}
        </nav>
      </div>

      <Outlet />
    </MenuUsuarioContext.Provider>
  );
}
