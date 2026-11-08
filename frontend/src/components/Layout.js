import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) setUsuario(JSON.parse(u));
  }, []);

  const esAdmin = usuario?.rol === 'ADMIN';

  const cerrarSesion = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("usuarioId");
    localStorage.removeItem("usuario");
    navigate('/login');
  };

  const alternarTema = () => {
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('tema', newTheme === 'dark' ? 'oscuro' : 'claro');
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <Link className="sb-brand" to="/">
          <span className="logo"><i className="bi bi-wallet2"></i></span>FinanPlus
        </Link>
        <nav>
          <Link className={`sb-item ${location.pathname === '/' ? 'activo' : ''}`} to="/"><i className="bi bi-house"></i><span>Inicio</span></Link>
          <div className="sb-seccion">Finanzas</div>
          <Link className={`sb-item ${location.pathname === '/registros' ? 'activo' : ''}`} to="/registros"><i className="bi bi-receipt"></i><span>Registros</span></Link>
          <Link className={`sb-item ${location.pathname === '/recurrentes' ? 'activo' : ''}`} to="/recurrentes"><i className="bi bi-arrow-repeat"></i><span>Recurrentes</span></Link>
          <Link className={`sb-item ${location.pathname === '/metas' ? 'activo' : ''}`} to="/metas"><i className="bi bi-bullseye"></i><span>Metas</span></Link>
          <div className="sb-seccion">Organización</div>
          <Link className={`sb-item ${location.pathname === '/categorias' ? 'activo' : ''}`} to="/categorias"><i className="bi bi-folder2"></i><span>Categorías</span></Link>
          <div className="sb-seccion">Análisis</div>
          <Link className={`sb-item ${location.pathname === '/metricas' ? 'activo' : ''}`} to="/metricas"><i className="bi bi-speedometer2"></i><span>Métricas</span></Link>
          <div className="sb-seccion">Cuenta</div>
          <Link className={`sb-item ${location.pathname === '/perfil' ? 'activo' : ''}`} to="/perfil"><i className="bi bi-person-circle"></i><span>Mi perfil</span></Link>
          {esAdmin && <Link className={`sb-item ${location.pathname === '/usuarios' ? 'activo' : ''}`} to="/usuarios"><i className="bi bi-people"></i><span>Usuarios</span></Link>}
        </nav>
        <div className="sb-pie">
          <button className="btn-tema" onClick={alternarTema}><i className="bi bi-moon-stars"></i> Tema</button>
          <button className="btn-salir" onClick={cerrarSesion}><i className="bi bi-box-arrow-right"></i> Cerrar sesión</button>
        </div>
      </aside>
      <main className="content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
