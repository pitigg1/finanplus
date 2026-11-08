import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { dinero, esc } from '../utils';

const RecurrentesPage = () => {
  const [recurrentes, setRecurrentes] = useState([]);

  useEffect(() => {
    loadRecurrentes();
  }, []);

  const loadRecurrentes = async () => {
    try {
      const data = await api(`/recurrentes/usuario/${localStorage.getItem("usuarioId")}`);
      setRecurrentes(data);
    } catch (error) {
      console.error("Error loading recurrentes", error);
    }
  };

  return (
    <div className="container-fluid">
      <h2>Movimientos Recurrentes</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Monto</th>
            <th>Frecuencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {recurrentes.map((r) => (
            <tr key={r.idRecurrencia}>
              <td>{esc(r.nombre)}</td>
              <td>{dinero(r.montoEstimado)}</td>
              <td>{r.frecuencia}</td>
              <td>{r.activo ? 'Activo' : 'Pausado'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecurrentesPage;
