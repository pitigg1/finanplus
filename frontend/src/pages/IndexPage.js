import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { dinero, fecha, montoConSigno, esc } from '../utils';

const IndexPage = () => {
  const [data, setData] = useState({
    registros: [],
    metas: [],
    categorias: [],
    presupuestos: [],
    inversiones: [],
    notificaciones: [],
    recurrentes: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [registros, metas, categorias, presupuestos, inversiones, notificaciones, recurrentes] = await Promise.all([
          api("/registros"),
          api("/metas").catch(() => []),
          api("/categorias").catch(() => []),
          api(`/presupuestos/usuario/${localStorage.getItem("usuarioId")}`).catch(() => []),
          api(`/inversiones/usuario/${localStorage.getItem("usuarioId")}`).catch(() => []),
          api(`/notificaciones/usuario/${localStorage.getItem("usuarioId")}`).catch(() => []),
          api(`/recurrentes/usuario/${localStorage.getItem("usuarioId")}`).catch(() => []),
        ]);
        setData({ registros, metas, categorias, presupuestos, inversiones, notificaciones, recurrentes });
      } catch (error) {
        console.error("Error loading dashboard data", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container-fluid">
      <h1 id="saludo">Bienvenido</h1>
      <div className="row" id="kpis">
        {/* KPI components would go here */}
      </div>
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h5 id="balanceMes">Balance</h5>
              <h2 id="balanceValor">{dinero(0)}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
