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

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwtToken');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('tema') === 'oscuro' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<IndexPage />} />
                <Route path="/registros" element={<RegistrosPage />} />
                <Route path="/categorias" element={<CategoriasPage />} />
                <Route path="/metas" element={<MetasPage />} />
                <Route path="/perfil" element={<PerfilPage />} />
                <Route path="/recurrentes" element={<RecurrentesPage />} />
                <Route path="/metricas" element={<MetricasPage />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
