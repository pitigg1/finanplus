import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { fecha, montoConSigno, esc } from '../utils';

const RegistrosPage = () => {
  const [registros, setRegistros] = useState([]);

  useEffect(() => {
    const loadRegistros = async () => {
      const data = await api("/registros");
      setRegistros(data);
    };
    loadRegistros();
  }, []);

  return (
    <div className="container-fluid">
      <h2>Registros</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.idRegistro}>
              <td>{fecha(r.fechaMovimiento)}</td>
              <td>{r.tipoMovimiento}</td>
              <td>{esc(r.nombreCategoria)}</td>
              <td>{esc(r.descripcion)}</td>
              <td className="text-end">{montoConSigno(r.tipoMovimiento, r.monto)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RegistrosPage;
