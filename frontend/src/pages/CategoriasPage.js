import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { esc } from '../utils';

const CategoriasPage = () => {
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({ id: '', nombre: '', tipo: 'GASTO', icono: '', color: '#0d6efd' });

  useEffect(() => {
    loadCategorias();
  }, []);

  const loadCategorias = async () => {
    try {
      const data = await api("/categorias");
      setCategorias(data);
    } catch (error) {
      console.error("Error loading categories", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await api(`/categorias/${formData.id}`, "PUT", formData);
      } else {
        await api("/categorias", "POST", formData);
      }
      setFormData({ id: '', nombre: '', tipo: 'GASTO', icono: '', color: '#0d6efd' });
      loadCategorias();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteCategoria = async (id) => {
    if (window.confirm("¿Eliminar esta categoría?")) {
      await api(`/categorias/${id}`, "DELETE");
      loadCategorias();
    }
  };

  return (
    <div className="container-fluid">
      <h2>Categorías</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input type="hidden" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value})} />
        <div className="row">
          <div className="col-md-4">
            <input className="form-control" placeholder="Nombre" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}>
              <option value="GASTO">Gasto</option>
              <option value="INGRESO">Ingreso</option>
              <option value="AHORRO">Ahorro</option>
            </select>
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-primary w-100">Guardar</button>
          </div>
        </div>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.idCategoria}>
              <td>{esc(c.nombre)}</td>
              <td>{c.tipo}</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setFormData(c)}>Editar</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCategoria(c.idCategoria)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CategoriasPage;
