import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("usuario");
    if (u) setUsuario(JSON.parse(u));
  }, []);

  const esAdmin = usuario?.rol === 'ADMIN';

  return (
    <div className="app-container">
      <aside className="sidebar">
        <Link className="sb-brand" to="/">
          <span className="logo"><i className="bi bi-wallet2"></i></span>FinanPlus
        </Link>
        <nav>
          <Link className={`sb-item ${location.pathname === '/' ? 'activo' : ''}`} to="/">
            <i className="bi bi-house"></i><span>Inicio</span>
          </Link>
          <div className="sb-seccion">Finanzas</div>
          <Link className={`sb-item ${location.pathname === '/registros' ? 'activo' : ''}`} to="/registros">
            <i className="bi bi-receipt"></i><span>Registros</span>
          </Link>
          {/* Add other links similarly */}
          {esAdmin && (
            <Link className={`sb-item ${location.pathname === '/usuarios' ? 'activo' : ''}`} to="/usuarios">
              <i className="bi bi-people"></i><span>Usuarios</span>
            </Link>
          )}
        </nav>
      </aside>
      <main className="content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
