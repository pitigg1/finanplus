import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { dinero, esc } from '../utils';

const MetasPage = () => {
  const [metas, setMetas] = useState([]);

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

  return (
    <div className="container-fluid">
      <h2>Metas de Ahorro</h2>
      <div className="row">
        {metas.map((m) => (
          <div className="col-md-4" key={m.idMeta}>
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">{esc(m.nombre)}</h5>
                <p className="card-text">Objetivo: {dinero(m.montoObjetivo)}</p>
                <p className="card-text">Actual: {dinero(m.montoActual)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetasPage;
