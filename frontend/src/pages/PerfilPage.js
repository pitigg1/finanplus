import React, { useEffect, useState } from 'react';
import { api } from '../api';

const PerfilPage = () => {
  const [perfil, setPerfil] = useState({ nombre: '', correo: '', pais: '', monedaPreferida: 'COP', rol: 'USUARIO', tieneFoto: false });
  const [passwordData, setPasswordData] = useState({ actual: '', nueva: '', repetir: '' });

  useEffect(() => {
    loadPerfil();
  }, []);

  const loadPerfil = async () => {
    try {
      const data = await api("/usuarios/perfil");
      setPerfil(data);
    } catch (error) {
      console.error("Error loading profile", error);
    }
  };

  const handleUpdatePerfil = async (e) => {
    e.preventDefault();
    try {
      const updated = await api("/usuarios/perfil", "PUT", {
        nombre: perfil.nombre,
        pais: perfil.pais,
        monedaPreferida: perfil.monedaPreferida,
      });
      setPerfil(updated);
      alert("Perfil actualizado");
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.nueva !== passwordData.repetir) return alert("Las contraseñas no coinciden");
    try {
      await api("/usuarios/perfil/password", "PUT", { actual: passwordData.actual, nueva: passwordData.nueva });
      alert("Contraseña actualizada");
      setPasswordData({ actual: '', nueva: '', repetir: '' });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("foto", file);
    
    const token = localStorage.getItem("jwtToken");
    const response = await fetch("http://localhost:8094/api/usuarios/perfil/foto", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData,
    });
    if (response.ok) {
      const updated = await response.json();
      setPerfil(updated);
    } else {
      alert("Error al subir foto");
    }
  };

  return (
    <div className="container-fluid">
      <h2>Mi Perfil</h2>
      <form onSubmit={handleUpdatePerfil} className="mb-4">
        <div className="mb-3">
          <label>Nombre</label>
          <input className="form-control" value={perfil.nombre} onChange={(e) => setPerfil({...perfil, nombre: e.target.value})} />
        </div>
        <div className="mb-3">
          <label>País</label>
          <input className="form-control" value={perfil.pais} onChange={(e) => setPerfil({...perfil, pais: e.target.value})} />
        </div>
        <button type="submit" className="btn btn-primary">Guardar Perfil</button>
      </form>

      <div className="mb-4">
        <label>Foto de perfil</label>
        <input type="file" className="form-control" onChange={handleFotoChange} />
      </div>

      <form onSubmit={handlePasswordChange}>
        <h3>Cambiar Contraseña</h3>
        <input className="form-control mb-2" type="password" placeholder="Actual" value={passwordData.actual} onChange={(e) => setPasswordData({...passwordData, actual: e.target.value})} />
        <input className="form-control mb-2" type="password" placeholder="Nueva" value={passwordData.nueva} onChange={(e) => setPasswordData({...passwordData, nueva: e.target.value})} />
        <input className="form-control mb-2" type="password" placeholder="Repetir" value={passwordData.repetir} onChange={(e) => setPasswordData({...passwordData, repetir: e.target.value})} />
        <button type="submit" className="btn btn-warning">Cambiar Contraseña</button>
      </form>
    </div>
  );
};

export default PerfilPage;
