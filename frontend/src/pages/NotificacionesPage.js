import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { usuarioActual } from '../lib/sesion';
import { fecha, humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipPrioridad, ChipTexto } from '../components/Chips';
import { FilaVacia, TarjetaTabla } from '../components/Piezas';

const COLUMNAS = [
  { t: 'Estado' }, { t: 'Notificación' }, { t: 'Tipo' }, { t: 'Prioridad' }, { t: 'Fecha' }, { t: 'Acciones', className: 'text-end' },
];

export default function NotificacionesPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const usuarioId = usuarioActual();
  const [notificaciones, setNotificaciones] = useState([]);

  // LISTAR (las notificaciones las crea el sistema, aquí solo se leen y se borran)
  const cargar = async () => setNotificaciones(await api(`/notificaciones/usuario/${usuarioId}`));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ACTUALIZAR: marcar como leída
  const marcarLeida = (id) => {
    const n = notificaciones.find((x) => x.idNotificacion === id);
    intentar(async () => {
      await api(`/notificaciones/${id}`, 'PUT', { ...n, leida: true });
      await cargar();
    });
  };

  const marcarTodas = () => {
    intentar(async () => {
      for (const n of notificaciones.filter((x) => !x.leida)) {
        await api(`/notificaciones/${n.idNotificacion}`, 'PUT', { ...n, leida: true });
      }
      mensaje('Todas las notificaciones quedaron leídas');
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar esta notificación?'))) return;
    intentar(async () => {
      await api(`/notificaciones/${id}`, 'DELETE');
      mensaje('Notificación eliminada');
      await cargar();
    });
  };

  const sinLeer = notificaciones.filter((n) => !n.leida).length;

  return (
    <main className="container py-4">
      <h1 className="h3 mb-1">Notificaciones</h1>
      <p className="text-muted">Alertas sobre tus gastos, presupuestos y metas.</p>

      <TarjetaTabla
        columnas={COLUMNAS}
        antes={
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-muted">{sinLeer} sin leer de {notificaciones.length}</span>
            <button className="btn btn-sm btn-primary" onClick={marcarTodas}>Marcar todas como leídas</button>
          </div>
        }
      >
        {notificaciones.map((n) => (
          <tr key={n.idNotificacion} className={n.leida ? '' : 'table-info'}>
            <td data-label="Estado">{n.leida ? <ChipTexto texto="Leída" /> : <ChipTexto texto="Nueva" clase="ahorro" />}</td>
            <td data-label="Notificación"><strong>{n.titulo}</strong><br /><small className="text-muted">{n.mensaje}</small></td>
            <td data-label="Tipo"><ChipTexto texto={humano(n.tipoAlerta)} /></td>
            <td data-label="Prioridad"><ChipPrioridad nivel={n.nivelPrioridad} /></td>
            <td data-label="Fecha">{fecha(n.fechaGeneracion)}</td>
            <td data-label="Acciones" className="text-end text-nowrap">
              {!n.leida && <><button className="btn btn-sm btn-outline-primary" onClick={() => marcarLeida(n.idNotificacion)}>Marcar leída</button>{' '}</>}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(n.idNotificacion)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!notificaciones.length && <FilaVacia columnas={6} texto="No hay notificaciones" />}
      </TarjetaTabla>
    </main>
  );
}
