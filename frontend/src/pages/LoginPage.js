import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8094/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('usuarioId', data.usuario.idUsuario);
        navigate('/');
      } else {
        alert('Credenciales incorrectas');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleLogin}>
        <input className="form-control mb-2" placeholder="Correo" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <input className="form-control mb-2" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-primary" type="submit">Entrar</button>
      </form>
    </div>
  );
};

export default LoginPage;
