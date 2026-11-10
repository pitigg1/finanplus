import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AvisoProvider } from './context/Aviso';
import { ConfirmarProvider } from './context/Confirmar';
import Layout from './components/Layout';
import { esAdmin, tokenActual, usuarioActual } from './lib/sesion';

import LoginPage from './pages/LoginPage';
import RecuperarPage from './pages/RecuperarPage';
import RestablecerPage from './pages/RestablecerPage';
import IndexPage from './pages/IndexPage';
import RegistrosPage from './pages/RegistrosPage';
import PresupuestosPage from './pages/PresupuestosPage';
import RecurrentesPage from './pages/RecurrentesPage';
import MetasPage from './pages/MetasPage';
import InversionesPage from './pages/InversionesPage';
import CategoriasPage from './pages/CategoriasPage';
import EtiquetasPage from './pages/EtiquetasPage';
import MetricasPage from './pages/MetricasPage';
import RecomendacionesPage from './pages/RecomendacionesPage';
import NotificacionesPage from './pages/NotificacionesPage';
import PerfilPage from './pages/PerfilPage';
import UsuariosPage from './pages/UsuariosPage';

// Solo entra quien tiene sesión (token + id de usuario)
function RutaProtegida({ children }) {
  if (!usuarioActual() || !tokenActual()) return <Navigate to="/login" replace />;
  return children;
}

// Solo administradores (el servidor también lo exige: aquí solo se evita mostrar la página)
function RutaAdmin({ children }) {
  return esAdmin() ? children : <Navigate to="/" replace />;
}

// Los enlaces viejos (login.html, restablecer.html?token=…) siguen funcionando;
// cualquier otra dirección desconocida vuelve al inicio
function RutaDesconocida() {
  const { pathname, search } = useLocation();
  if (!pathname.endsWith('.html')) return <Navigate to="/" replace />;
  const ruta = pathname.replace(/\.html$/, '');
  return <Navigate to={(ruta === '/index' ? '/' : ruta) + search} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AvisoProvider>
        <ConfirmarProvider>
          <Routes>
            {/* Páginas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar" element={<RecuperarPage />} />
            <Route path="/restablecer" element={<RestablecerPage />} />

            {/* Páginas con sesión (menú lateral, barra superior y pestañas) */}
            <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
              <Route path="/" element={<IndexPage />} />
              <Route path="/registros" element={<RegistrosPage />} />
              <Route path="/presupuestos" element={<PresupuestosPage />} />
              <Route path="/recurrentes" element={<RecurrentesPage />} />
              <Route path="/metas" element={<MetasPage />} />
              <Route path="/inversiones" element={<InversionesPage />} />
              <Route path="/categorias" element={<CategoriasPage />} />
              <Route path="/etiquetas" element={<EtiquetasPage />} />
              <Route path="/metricas" element={<MetricasPage />} />
              <Route path="/recomendaciones" element={<RecomendacionesPage />} />
              <Route path="/notificaciones" element={<NotificacionesPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/usuarios" element={<RutaAdmin><UsuariosPage /></RutaAdmin>} />
            </Route>

            <Route path="*" element={<RutaDesconocida />} />
          </Routes>
        </ConfirmarProvider>
      </AvisoProvider>
    </BrowserRouter>
  );
}
