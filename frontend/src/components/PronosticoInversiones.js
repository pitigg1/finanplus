import React, { useState } from 'react';
import { api } from '../lib/api';
import { dinero, humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { Tabla } from './Piezas';

const COLUMNAS = [
  { t: 'Activo' }, { t: 'Tasa anual', className: 'text-end' }, { t: 'De dónde sale la tasa' },
  { t: 'Pesimista', className: 'text-end' }, { t: 'Esperado', className: 'text-end' }, { t: 'Optimista', className: 'text-end' },
];

const ORIGENES = {
  INDICADA_POR_USUARIO: 'Indicada por ti',
  RENTABILIDAD_DE_LA_INVERSION: 'Rentabilidad de la inversión',
  TASA_POR_DEFECTO: 'Tasa por defecto (sin rentabilidad)',
};

const escenario = (escenarios, nombre) => escenarios.find((e) => e.nombre === nombre);

// Celda con el valor proyectado y, debajo, la ganancia
function Celda({ e, etiqueta }) {
  if (!e) return <td data-label={etiqueta} className="text-end">-</td>;
  const gana = Number(e.gananciaProyectada) >= 0;
  return (
    <td data-label={etiqueta} className="text-end text-nowrap">
      {dinero(e.valorProyectado)}
      <div className={`small ${gana ? 'text-success' : 'text-danger'}`}>{gana ? '+' : ''}{dinero(e.gananciaProyectada)}</div>
    </td>
  );
}

/**
 * Pronóstico de inversiones. Cada inversión se proyecta con SU rentabilidad (o con la tasa por defecto si no tiene).
 * - "Todo el portafolio": GET /inversiones/pronostico?meses=N
 * - Una inversión:        GET /inversiones/{id}/pronostico?meses=N&aporteMensual=X
 */
export default function PronosticoInversiones({ inversiones }) {
  const { intentar } = useAviso();
  const [meses, setMeses] = useState(12);
  const [aporte, setAporte] = useState('');
  const [idInversion, setIdInversion] = useState('');
  const [resultado, setResultado] = useState(null);

  const calcular = (e) => {
    e.preventDefault();
    intentar(async () => {
      const m = Number(meses) || 12;
      if (idInversion) {
        const params = new URLSearchParams({ meses: m });
        if (aporte !== '') params.set('aporteMensual', aporte);
        const unica = await api(`/inversiones/${idInversion}/pronostico?${params}`);
        setResultado({ meses: unica.meses, inversiones: [unica], totales: null, advertencia: unica.advertencia });
      } else {
        const p = await api(`/inversiones/pronostico?meses=${m}`);
        setResultado({ meses: p.meses, inversiones: p.inversiones, totales: p.totalPorEscenario, valorActualTotal: p.valorActualTotal, advertencia: p.advertencia });
      }
    });
  };

  return (
    <section className="mt-4">
      <h2 className="h5">Pronóstico</h2>
      <p className="text-muted small mb-2">
        Cada inversión se proyecta con su propia rentabilidad anual. Si no tiene, se asume 8 %.
      </p>

      <form className="card card-body mb-3" onSubmit={calcular}>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label" htmlFor="pron-inversion">Inversión</label>
            <select id="pron-inversion" className="form-select" value={idInversion} onChange={(e) => { setIdInversion(e.target.value); setResultado(null); }}>
              <option value="">Todo el portafolio</option>
              {inversiones.map((i) => <option key={i.idInversion} value={i.idInversion}>{i.nombreActivo}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="pron-meses">Plazo (meses)</label>
            <input id="pron-meses" type="number" min="1" max="600" className="form-control" value={meses} onChange={(e) => setMeses(e.target.value)} required />
          </div>
          <div className="col-md-3">
            <label className="form-label" htmlFor="pron-aporte">Aporte mensual</label>
            <input id="pron-aporte" type="number" min="0" step="any" className="form-control" value={aporte} disabled={!idInversion}
              placeholder={idInversion ? 'Opcional' : 'Solo con una inversión'} onChange={(e) => setAporte(e.target.value)} />
          </div>
          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-primary" disabled={!inversiones.length}>Calcular</button>
          </div>
        </div>
      </form>

      {resultado && (
        <div className="card">
          <div className="card-body table-responsive">
            <p className="text-muted">Proyección a {resultado.meses} {resultado.meses === 1 ? 'mes' : 'meses'}</p>
            <Tabla columnas={COLUMNAS}>
              {resultado.inversiones.map((p) => (
                <tr key={p.idInversion}>
                  <td data-label="Activo">{p.nombreActivo} <span className="text-muted small">({humano(p.tipoActivo)})</span></td>
                  <td data-label="Tasa anual" className="text-end">{p.tasaAnualEsperada}%</td>
                  <td data-label="De dónde sale la tasa">{ORIGENES[p.origenTasa] || p.origenTasa}</td>
                  <Celda etiqueta="Pesimista" e={escenario(p.escenarios, 'PESIMISTA')} />
                  <Celda etiqueta="Esperado" e={escenario(p.escenarios, 'ESPERADO')} />
                  <Celda etiqueta="Optimista" e={escenario(p.escenarios, 'OPTIMISTA')} />
                </tr>
              ))}
              {resultado.totales && (
                <tr className="fw-bold">
                  <td data-label="Activo">Total portafolio</td>
                  <td data-label="Tasa anual" className="text-end">-</td>
                  <td data-label="De dónde sale la tasa">Hoy: {dinero(resultado.valorActualTotal)}</td>
                  <Celda etiqueta="Pesimista" e={escenario(resultado.totales, 'PESIMISTA')} />
                  <Celda etiqueta="Esperado" e={escenario(resultado.totales, 'ESPERADO')} />
                  <Celda etiqueta="Optimista" e={escenario(resultado.totales, 'OPTIMISTA')} />
                </tr>
              )}
            </Tabla>
            <p className="text-muted small mt-2 mb-0">{resultado.advertencia}</p>
          </div>
        </div>
      )}
    </section>
  );
}
