import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { dinero, esc, fecha } from '../utils';

const MetasPage = () => {
  const [metas, setMetas] = useState([]);
  const [metaElegida, setMetaElegida] = useState(null);
  const [aportes, setAportes] = useState([]);
  const [formData, setFormData] = useState({ id: '', nombre: '', descripcion: '', montoObjetivo: '', fechaObjetivo: '', prioridad: 'MEDIA', estado: 'ACTIVA' });
  const [aporteMonto, setAporteMonto] = useState('');

  useEffect(() => {
    loadMetas();
  }, []);

  const loadMetas = async () => {
    try {
      const data = await api("/metas");
      setMetas(data);
    } catch (error) {
      console.error("Error loading metas", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        montoObjetivo: Number(formData.montoObjetivo),
        fechaObjetivo: formData.fechaObjetivo || null,
        prioridad: formData.prioridad,
        estado: formData.estado,
      };
      if (formData.id) await api(`/metas/${formData.id}`, "PUT", datos);
      else await api("/metas", "POST", datos);
      setFormData({ id: '', nombre: '', descripcion: '', montoObjetivo: '', fechaObjetivo: '', prioridad: 'MEDIA', estado: 'ACTIVA' });
      loadMetas();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteMeta = async (id) => {
    if (window.confirm("¿Eliminar esta meta y sus aportes?")) {
      await api(`/metas/${id}`, "DELETE");
      if (metaElegida?.idMeta === id) setMetaElegida(null);
      loadMetas();
    }
  };

  const verAportes = async (meta) => {
    setMetaElegida(meta);
    try {
      const data = await api(`/aportes/meta/${meta.idMeta}`);
      setAportes(data);
    } catch (error) {
      console.error("Error loading aportes", error);
    }
  };

  const handleAddAporte = async (e) => {
    e.preventDefault();
    try {
      const monto = Number(aporteMonto);
      const registro = await api("/registros", "POST", {
        idCategoria: 1, // Assuming a default category ID for savings
        tipoMovimiento: "AHORRO",
        monto: monto,
        descripcion: "Aporte a meta: " + metaElegida.nombre,
        fechaMovimiento: new Date().toISOString(),
      });
      await api("/aportes", "POST", {
        meta: { idMeta: metaElegida.idMeta },
        registro: { idRegistro: registro.idRegistro },
        monto: monto,
      });
      setAporteMonto('');
      verAportes(metaElegida);
      loadMetas();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container-fluid">
      <h2>Metas de Ahorro</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input className="form-control mb-2" placeholder="Nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
        <input className="form-control mb-2" type="number" placeholder="Objetivo" value={formData.montoObjetivo} onChange={(e) => setFormData({...formData, montoObjetivo: e.target.value})} required />
        <button type="submit" className="btn btn-primary">Guardar Meta</button>
      </form>

      <div className="row">
        {metas.map((m) => (
          <div className="col-md-4" key={m.idMeta}>
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">{esc(m.nombre)}</h5>
                <p className="card-text">Objetivo: {dinero(m.montoObjetivo)}</p>
                <p className="card-text">Actual: {dinero(m.montoActual)}</p>
                <button className="btn btn-sm btn-outline-success me-2" onClick={() => verAportes(m)}>Aportes</button>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setFormData(m)}>Editar</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteMeta(m.idMeta)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {metaElegida && (
        <div className="mt-4">
          <h3>Aportes de: {metaElegida.nombre}</h3>
          <form onSubmit={handleAddAporte} className="mb-3">
            <input className="form-control d-inline-block w-auto me-2" type="number" placeholder="Monto" value={aporteMonto} onChange={(e) => setAporteMonto(e.target.value)} required />
            <button type="submit" className="btn btn-success">Agregar Aporte</button>
          </form>
          <table className="table">
            <thead><tr><th>Fecha</th><th>Monto</th></tr></thead>
            <tbody>
              {aportes.map((a) => (
                <tr key={a.idAporte}>
                  <td>{fecha(a.fechaAporte)}</td>
                  <td>{dinero(a.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MetasPage;
