import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { dinero } from '../utils';

const MetricasPage = () => {
  const [metricas, setMetas] = useState([]);

  useEffect(() => {
    loadMetricas();
  }, []);

  const loadMetricas = async () => {
    try {
      const data = await api(`/metricas/usuario/${localStorage.getItem("usuarioId")}`);
      setMetas(data);
    } catch (error) {
      console.error("Error loading metricas", error);
    }
  };

  const calcular = async () => {
    await api(`/metricas/usuario/${localStorage.getItem("usuarioId")}/calcular`, "POST");
    loadMetricas();
  };

  return (
    <div className="container-fluid">
      <h2>Métricas Financieras</h2>
      <button className="btn btn-primary mb-3" onClick={calcular}>Calcular este mes</button>
      <table className="table">
        <thead>
          <tr>
            <th>Mes</th>
            <th>Ingresos</th>
            <th>Gastos</th>
            <th>Flujo</th>
          </tr>
        </thead>
        <tbody>
          {metricas.map((m) => (
            <tr key={m.idMetrica}>
              <td>{m.fechaCalculo}</td>
              <td>{dinero(m.ingresosTotales)}</td>
              <td>{dinero(m.gastosTotales)}</td>
              <td>{dinero(m.flujoNeto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MetricasPage;
