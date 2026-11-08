import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import IndexPage from './pages/IndexPage';
import LoginPage from './pages/LoginPage';
import RegistrosPage from './pages/RegistrosPage';
import CategoriasPage from './pages/CategoriasPage';
import MetasPage from './pages/MetasPage';
import PerfilPage from './pages/PerfilPage';
import RecurrentesPage from './pages/RecurrentesPage';
import MetricasPage from './pages/MetricasPage';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('tema') === 'oscuro' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout><IndexPage /></Layout>} />
        <Route path="/registros" element={<Layout><RegistrosPage /></Layout>} />
        <Route path="/categorias" element={<Layout><CategoriasPage /></Layout>} />
        <Route path="/metas" element={<Layout><MetasPage /></Layout>} />
        <Route path="/perfil" element={<Layout><PerfilPage /></Layout>} />
        <Route path="/recurrentes" element={<Layout><RecurrentesPage /></Layout>} />
        <Route path="/metricas" element={<Layout><MetricasPage /></Layout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
