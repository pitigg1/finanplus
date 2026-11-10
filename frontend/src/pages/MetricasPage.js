import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { usuarioActual } from '../lib/sesion';
import { dinero } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { ChipRiesgo } from '../components/Chips';
import { FilaVacia, TarjetaTabla } from '../components/Piezas';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const COLUMNAS = [
  { t: 'Mes' }, { t: 'Ingresos', className: 'text-end' }, { t: 'Gastos', className: 'text-end' }, { t: 'Flujo neto', className: 'text-end' },
  { t: 'Tasa de ahorro', className: 'text-end' }, { t: 'Score', className: 'text-end' }, { t: 'Riesgo' },
];

// "2026-10-08T17:10:00" -> "octubre 2026"
function nombreMes(fechaTexto) {
  const [anio, mes] = String(fechaTexto).split('-');
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

// 99.88 -> "99,88"  ·  20 -> "20"  (sin redondear a entero, para no mostrar 100% cuando es 99,88%)
function porcentaje(valor) {
  return Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

// Una tarjeta con el número grande y una frase que lo explica
function Tarjeta({ titulo, valor, explicacion, colorTexto = '' }) {
  return (
    <div className="col-12 col-md-6 col-lg-4">
      <div className="card h-100">
        <div className="card-body">
          <div className="text-muted small">{titulo}</div>
          <div className={`fs-3 fw-bold ${colorTexto}`.trim()}>{valor}</div>
          <div className="small mt-1">{explicacion}</div>
        </div>
      </div>
    </div>
  );
}

// Las tarjetas del mes con frases que explican cada número
function Tarjetas({ m }) {
  const ingresos = Number(m.ingresosTotales);
  const gastos = Number(m.gastosTotales);
  const flujo = Number(m.flujoNeto);

  if (ingresos === 0 && gastos === 0) {
    return (
      <div className="col-12"><div className="card"><div className="card-body text-muted">Este mes todavía no tienes ingresos ni gastos registrados.</div></div></div>
    );
  }

  const textoFlujo =
    flujo > 0 ? `Te sobraron ${dinero(flujo)}: ganaste más de lo que gastaste.`
    : flujo < 0 ? `Te faltaron ${dinero(-flujo)}: gastaste más de lo que ganaste.`
    : 'Gastaste exactamente lo que ganaste.';

  const textoTasa =
    m.tasaAhorro == null ? 'No se puede calcular porque no registraste ingresos este mes.'
    : Number(m.tasaAhorro) >= 0 ? `De cada $100 que ganaste, te quedaron $${porcentaje(m.tasaAhorro)}.`
    : `Gastaste ${porcentaje(Math.abs(Number(m.tasaAhorro)))}% más de lo que ganaste.`;

  const textoRiesgo =
    m.nivelRiesgo === 'BAJO' ? 'Vas muy bien: ahorras el 20% o más de lo que ganas.'
    : m.nivelRiesgo === 'MEDIO' ? 'Ahorras algo, pero menos del 20% recomendado.'
    : m.nivelRiesgo === 'ALTO' ? (ingresos === 0 ? 'Tuviste gastos sin ningún ingreso registrado.' : 'Estás gastando más de lo que ganas.')
    : 'Sin datos suficientes.';

  return (
    <>
      <Tarjeta titulo="Ingresos" valor={dinero(ingresos)} explicacion="Todo el dinero que te entró este mes." colorTexto="text-success" />
      <Tarjeta titulo="Gastos" valor={dinero(gastos)} explicacion="Todo el dinero que salió este mes." colorTexto="text-danger" />
      <Tarjeta titulo="Flujo neto" valor={dinero(flujo)} explicacion={textoFlujo} colorTexto={flujo < 0 ? 'text-danger' : 'text-success'} />
      <Tarjeta titulo="Tasa de ahorro" valor={m.tasaAhorro == null ? '—' : porcentaje(m.tasaAhorro) + '%'} explicacion={textoTasa} />
      <Tarjeta titulo="Score financiero" valor={m.scoreFinanciero == null ? '—' : Math.round(Number(m.scoreFinanciero)) + ' / 100'}
        explicacion="Una nota de 0 a 100: entre más ahorras, más alta." />
      <Tarjeta titulo="Riesgo" valor={m.nivelRiesgo ? <ChipRiesgo riesgo={m.nivelRiesgo} /> : '—'} explicacion={textoRiesgo} />
    </>
  );
}

export default function MetricasPage() {
  const { mensaje, intentar } = useAviso();
  const usuarioId = usuarioActual();
  const [metricas, setMetricas] = useState([]);

  // LISTAR (solo lectura: las métricas las calcula el backend, una por mes)
  const cargar = async () => {
    const lista = await api(`/metricas/usuario/${usuarioId}`);
    lista.sort((a, b) => String(b.fechaCalculo).localeCompare(String(a.fechaCalculo))); // más reciente primero
    setMetricas(lista);
  };

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le pide al backend que calcule (o actualice) la métrica de este mes
  const calcular = () => {
    intentar(async () => {
      await api(`/metricas/usuario/${usuarioId}/calcular`, 'POST');
      mensaje('Métrica del mes actualizada');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h1 className="h3 mb-0">Métricas financieras</h1>
        <button className="btn btn-primary" onClick={calcular}>Calcular este mes</button>
      </div>
      <p className="text-muted">Un resumen de cómo te fue cada mes, calculado a partir de tus registros.</p>

      {/* Métrica del mes más reciente */}
      <h2 className="h5 mt-4 mb-3">{metricas.length ? 'Mes de ' + nombreMes(metricas[0].fechaCalculo) : 'Este mes'}</h2>
      <div className="row g-3 mb-4">
        {metricas.length ? (
          <Tarjetas m={metricas[0]} />
        ) : (
          <div className="col-12"><div className="card"><div className="card-body text-muted">Aún no hay métricas. Pulsa «Calcular este mes».</div></div></div>
        )}
      </div>

      {/* Historial mes a mes */}
      <h2 className="h5 mb-3">Historial por mes</h2>
      <TarjetaTabla columnas={COLUMNAS}>
        {metricas.map((m) => (
          <tr key={m.idMetrica ?? m.fechaCalculo}>
            <td data-label="Mes" className="text-capitalize">{nombreMes(m.fechaCalculo)}</td>
            <td data-label="Ingresos" className="text-end">{dinero(m.ingresosTotales)}</td>
            <td data-label="Gastos" className="text-end">{dinero(m.gastosTotales)}</td>
            <td data-label="Flujo neto" className={`text-end ${Number(m.flujoNeto) < 0 ? 'text-danger' : ''}`.trim()}>{dinero(m.flujoNeto)}</td>
            <td data-label="Tasa de ahorro" className="text-end">{m.tasaAhorro == null ? '—' : porcentaje(m.tasaAhorro) + '%'}</td>
            <td data-label="Score" className="text-end">{m.scoreFinanciero == null ? '—' : Math.round(Number(m.scoreFinanciero))}</td>
            <td data-label="Riesgo">{m.nivelRiesgo ? <ChipRiesgo riesgo={m.nivelRiesgo} /> : '—'}</td>
          </tr>
        ))}
        {!metricas.length && <FilaVacia columnas={7} texto="No hay métricas todavía" />}
      </TarjetaTabla>
    </main>
  );
}
