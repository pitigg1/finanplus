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

  // LISTAR (las recomendaciones las genera el sistema, aquí solo se ven, se marcan y se borran)
  const cargar = async () => setRecomendaciones(await api(`/recomendaciones/usuario/${usuarioId}`));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ACTUALIZAR: marcar o desmarcar como aplicada
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
      <h1 className="h3 mb-1">Recomendaciones IA</h1>
      <p className="text-muted">Sugerencias generadas por el sistema para mejorar tus finanzas.</p>

      <TarjetaTabla columnas={COLUMNAS}>
        {recomendaciones.map((r) => (
          <tr key={r.idRecomendacion}>
            <td data-label="Recomendación"><strong>{r.titulo}</strong><br /><small className="text-muted">{r.descripcion}</small></td>
            <td data-label="Tipo"><ChipTexto texto={humano(r.tipoRecomendacion)} /></td>
            <td data-label="Prioridad"><ChipPrioridad nivel={r.nivelPrioridad} /></td>
            <td data-label="Confianza" className="text-end">{r.scoreConfianza == null ? '-' : r.scoreConfianza + '%'}</td>
            <td data-label="Fecha">{fecha(r.fechaGeneracion)}</td>
            <td data-label="Aplicada">{r.fueAplicada ? <ChipTexto texto="Aplicada" clase="ingreso" /> : <ChipTexto texto="Pendiente" />}</td>
            <td data-label="Acciones" className="text-end text-nowrap">
              <button className="btn btn-sm btn-outline-success" onClick={() => marcar(r.idRecomendacion)}>{r.fueAplicada ? 'Desmarcar' : 'Marcar aplicada'}</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(r.idRecomendacion)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!recomendaciones.length && <FilaVacia columnas={7} texto="No hay recomendaciones" />}
      </TarjetaTabla>
    </main>
  );
}
