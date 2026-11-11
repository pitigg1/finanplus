import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { usuarioActual } from '../lib/sesion';
import { fecha, humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipPrioridad, ChipTexto } from '../components/Chips';
import { FilaVacia, TarjetaTabla } from '../components/Piezas';

const COLUMNAS = [
  { t: 'Recomendación' }, { t: 'Tipo' }, { t: 'Prioridad' }, { t: 'Confianza', className: 'text-end' },
  { t: 'Fecha' }, { t: 'Aplicada' }, { t: 'Acciones', className: 'text-end' },
];

export default function RecomendacionesPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const usuarioId = usuarioActual();
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [generando, setGenerando] = useState(false);

  const cargar = async () => setRecomendaciones(await api(`/recomendaciones/usuario/${usuarioId}`));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Botón Generar Recomendación IA (Gemini)
  const generarRecomendacionGemini = () => {
    intentar(async () => {
      setGenerando(true);
      await api('/recomendaciones/generar', 'POST');
      mensaje('¡Recomendación generada con éxito usando Gemini IA!');
      await cargar();
      setGenerando(false);
    });
  };

  const marcar = (id) => {
    const r = recomendaciones.find((x) => x.idRecomendacion === id);
    intentar(async () => {
      await api(`/recomendaciones/${id}`, 'PUT', { ...r, fueAplicada: !r.fueAplicada });
      mensaje('Recomendación actualizada');
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar esta recomendación?'))) return;
    intentar(async () => {
      await api(`/recomendaciones/${id}`, 'DELETE');
      mensaje('Recomendación eliminada');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h3 mb-1">Recomendaciones IA</h1>
          <p className="text-muted mb-0">Sugerencias financieras generadas por Inteligencia Artificial (Gemini).</p>
        </div>
        <div>
          <button 
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={generarRecomendacionGemini}
            disabled={generando}
          >
            {generando ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Analizando con Gemini...
              </>
            ) : (
              <>
                <i className="bi bi-cpu-fill"></i> Generar con Gemini IA
              </>
            )}
          </button>
        </div>
      </div>

      <TarjetaTabla columnas={COLUMNAS}>
        {recomendaciones.map((r) => (
          <tr key={r.idRecomendacion}>
            <td data-label="Recomendación">
              <strong>{r.titulo}</strong><br />
              <small className="text-muted">{r.descripcion}</small>
              {r.modeloUtilizado && (
                <div><span className="badge bg-light text-dark border mt-1">Modelo: {r.modeloUtilizado}</span></div>
              )}
            </td>
            <td data-label="Tipo"><ChipTexto texto={humano(r.tipoRecomendacion)} /></td>
            <td data-label="Prioridad"><ChipPrioridad nivel={r.nivelPrioridad} /></td>
            <td data-label="Confianza" className="text-end">{r.scoreConfianza == null ? '-' : r.scoreConfianza + '%'}</td>
            <td data-label="Fecha">{fecha(r.fechaGeneracion)}</td>
            <td data-label="Aplicada">{r.fueAplicada ? <ChipTexto texto="Aplicada" clase="ingreso" /> : <ChipTexto texto="Pendiente" />}</td>
            <td data-label="Acciones" className="text-end text-nowrap">
              <button className="btn btn-sm btn-outline-success me-1" onClick={() => marcar(r.idRecomendacion)}>
                {r.fueAplicada ? 'Desmarcar' : 'Marcar aplicada'}
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(r.idRecomendacion)}>
                Eliminar
              </button>
            </td>
          </tr>
        ))}
        {!recomendaciones.length && <FilaVacia columnas={7} texto="No hay recomendaciones generadas aún. ¡Haz clic en generar!" />}
      </TarjetaTabla>
    </main>
  );
}