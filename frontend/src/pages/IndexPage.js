import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { usuarioActual, usuarioLocal } from '../lib/sesion';
import { NOMBRES_MESES, claseTipo, dinero, fecha, humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { MontoConSigno } from '../components/Chips';
import { Vacio } from '../components/Piezas';

// Panel de inicio: resumen del mes, gráficos y lo que viene.

const claveMes = (anio, mes) => `${anio}-${String(mes).padStart(2, '0')}`;

// Total de ingresos y gastos de un mes ("2026-10")
function totalesDelMes(registros, clave) {
  const delMes = registros.filter((r) => String(r.fechaMovimiento).startsWith(clave));
  const suma = (tipo) => delMes.filter((r) => r.tipoMovimiento === tipo).reduce((t, r) => t + Number(r.monto), 0);
  return { ingresos: suma('INGRESO'), gastos: suma('GASTO'), cantidad: delMes.length };
}

// ----- Indicador (tarjeta pequeña) -----
function Kpi({ icono, color, titulo, valor, detalle, to }) {
  return (
    <div className="col-6 col-lg-3">
      <Link to={to} className="card kpi h-100">
        <div className="card-body">
          <span className={`kpi-icono bg-app-${color}`}><i className={`bi ${icono}`}></i></span>
          <div className="kpi-titulo">{titulo}</div>
          <div className="kpi-valor">{valor}</div>
          <div className="kpi-detalle">{detalle}</div>
        </div>
      </Link>
    </div>
  );
}

export default function IndexPage() {
  const { intentar } = useAviso();
  const usuarioId = usuarioActual();
  const [datos, setDatos] = useState(null);

  // ----- Fechas: mes actual y mes anterior -----
  const hoy = new Date();
  const claveActual = claveMes(hoy.getFullYear(), hoy.getMonth() + 1);
  const mesPrevio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
  const clavePrevia = claveMes(mesPrevio.getFullYear(), mesPrevio.getMonth() + 1);
  const nombreMesActual = NOMBRES_MESES[hoy.getMonth()];
  const nombreMesPrevio = NOMBRES_MESES[mesPrevio.getMonth()];

  // Carga todo en paralelo; si algo falla, el resto se muestra igual
  useEffect(() => {
    intentar(async () => {
      const pedir = (ruta) => api(ruta).catch(() => []);
      const [registros, metas, categorias, presupuestos, inversiones, notificaciones, recurrentes] = await Promise.all([
        api('/registros'),
        pedir('/metas'),
        pedir('/categorias'),
        pedir(`/presupuestos/usuario/${usuarioId}`),
        pedir(`/inversiones/usuario/${usuarioId}`),
        pedir(`/notificaciones/usuario/${usuarioId}`),
        pedir(`/recurrentes/usuario/${usuarioId}`),
      ]);
      setDatos({ registros, metas, categorias, presupuestos, inversiones, notificaciones, recurrentes });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Hola, Ana" según la hora del día
  const nombre = usuarioLocal().nombre || '';
  const hora = hoy.getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';
  const textoSaludo = nombre ? `${saludo}, ${nombre.split(' ')[0]}` : saludo;

  // ----- Balance del mes -----
  const balanceTarjeta = () => {
    const { ingresos, gastos } = datos ? totalesDelMes(datos.registros, claveActual) : { ingresos: 0, gastos: 0 };
    const balance = ingresos - gastos;
    const uso = ingresos > 0 ? Math.round((gastos / ingresos) * 100) : gastos > 0 ? 100 : 0;
    const sub = !datos ? 'Lo que te queda después de tus gastos'
      : ingresos === 0 && gastos === 0 ? 'Aún no tienes movimientos este mes'
      : balance >= 0 ? 'Lo que te queda después de tus gastos'
      : 'Estás gastando más de lo que ganas';
    return (
      <div className="balance-card h-100">
        <div className="balance-mes">{datos ? `${nombreMesActual} ${hoy.getFullYear()}` : 'Este mes'}</div>
        <div className="balance-valor">{dinero(balance)}</div>
        <div className="balance-sub">{sub}</div>
        <div className="balance-uso">
          <div className="d-flex justify-content-between small mb-1"><span>Has gastado</span><strong>{uso}%</strong></div>
          <div className="balance-barra"><div style={{ width: `${Math.min(100, uso)}%` }}></div></div>
          <div className="small mt-1" style={{ opacity: 0.85 }}>de tus ingresos del mes</div>
        </div>
        <div className="balance-pills">
          <div className="balance-pill"><i className="bi bi-arrow-down-circle-fill"></i><div><small>Ingresos</small><strong>{dinero(ingresos)}</strong></div></div>
          <div className="balance-pill"><i className="bi bi-arrow-up-circle-fill"></i><div><small>Gastos</small><strong>{dinero(gastos)}</strong></div></div>
        </div>
      </div>
    );
  };

  // ----- Últimos movimientos -----
  const recientes = () => {
    if (!datos) return <div className="list-group-item text-muted small">Cargando…</div>;
    const lista = [...datos.registros].sort((a, b) => String(b.fechaMovimiento).localeCompare(String(a.fechaMovimiento))).slice(0, 5);
    if (!lista.length) {
      return (
        <div className="list-group-item">
          <Vacio icono="bi-receipt">Todavía no registras nada.<br /><Link to="/registros">Anota tu primer movimiento</Link></Vacio>
        </div>
      );
    }
    return lista.map((r) => {
      const icono = r.tipoMovimiento === 'INGRESO' ? 'bi-arrow-down-left' : r.tipoMovimiento === 'GASTO' ? 'bi-arrow-up-right' : 'bi-piggy-bank';
      return (
        <div key={r.idRegistro} className="list-group-item mov-item">
          <span className={`mov-icono chip-${claseTipo(r.tipoMovimiento)}`}><i className={`bi ${icono}`}></i></span>
          <span className="mov-texto">
            <strong>{r.descripcion || r.nombreCategoria || 'Movimiento'}</strong>
            <small className="text-muted">{r.nombreCategoria || 'Sin categoría'} · {fecha(r.fechaMovimiento).slice(0, 10)}</small>
          </span>
          <span className="mov-monto"><MontoConSigno tipo={r.tipoMovimiento} monto={r.monto} /></span>
        </div>
      );
    });
  };

  // ----- Indicadores (4 tarjetas) -----
  const indicadores = () => {
    if (!datos) return null;
    const { registros, inversiones, notificaciones, recurrentes } = datos;
    const { ingresos, gastos } = totalesDelMes(registros, claveActual);
    const tasa = ingresos > 0 ? Math.round(((ingresos - gastos) / ingresos) * 100) : null;
    const invertido = inversiones.reduce((t, i) => t + Number(i.montoInvertido || 0), 0);
    const actual = inversiones.reduce((t, i) => t + Number(i.valorActual || 0), 0);
    const rendimiento = invertido > 0 ? ((actual - invertido) / invertido) * 100 : null;
    const sinLeer = notificaciones.filter((n) => !n.leida).length;
    const limite = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7).toISOString().slice(0, 10);
    const pagos = recurrentes.filter((m) => m.activo && m.tipoMovimiento === 'GASTO' && String(m.proximaFecha) <= limite);
    const totalPagos = pagos.reduce((t, m) => t + Number(m.montoEstimado), 0);

    return (
      <>
        <Kpi icono="bi-piggy-bank-fill" color="green" titulo="Ahorro del mes" to="/metricas"
          valor={tasa === null ? '—' : `${tasa}%`}
          detalle={tasa === null ? 'Registra un ingreso para calcularlo' : tasa >= 0 ? 'de tus ingresos te quedó' : 'gastaste más de lo que ganaste'} />
        <Kpi icono="bi-graph-up-arrow" color="blue" titulo="Inversiones" to="/inversiones"
          valor={inversiones.length ? dinero(actual) : '—'}
          detalle={rendimiento === null ? 'Aún no tienes inversiones' : (
            <>
              <span className={rendimiento >= 0 ? 'monto-ingreso' : 'monto-gasto'}>
                {rendimiento >= 0 ? '+' : '−'}{Math.abs(rendimiento).toLocaleString('es-CO', { maximumFractionDigits: 1 })}%
              </span> de rendimiento
            </>
          )} />
        <Kpi icono="bi-bell-fill" color={sinLeer ? 'orange' : 'gray'} titulo="Alertas" to="/notificaciones"
          valor={sinLeer} detalle={sinLeer ? 'sin leer' : 'Todo al día'} />
        <Kpi icono="bi-calendar-check-fill" color="indigo" titulo="Pagos próximos" to="/recurrentes"
          valor={pagos.length} detalle={pagos.length ? `${dinero(totalPagos)} en 7 días` : 'Nada por pagar esta semana'} />
      </>
    );
  };

  // ----- Gráfico: gastos por categoría (anillo) -----
  const gastosPorCategoria = () => {
    if (!datos) return null;
    const { registros, categorias } = datos;
    const gastos = registros.filter((r) => r.tipoMovimiento === 'GASTO' && String(r.fechaMovimiento).startsWith(claveActual));
    const total = gastos.reduce((t, r) => t + Number(r.monto), 0);
    if (!total) return <Vacio icono="bi-pie-chart">Sin gastos este mes.</Vacio>;

    const porCategoria = {};
    gastos.forEach((r) => {
      const n = r.nombreCategoria || 'Sin categoría';
      porCategoria[n] = (porCategoria[n] || 0) + Number(r.monto);
    });
    let items = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);
    if (items.length > 5) {
      const otros = items.slice(4).reduce((t, [, v]) => t + v, 0);
      items = [...items.slice(0, 4), ['Otros', otros]];
    }
    const colorDe = (n) => (categorias.find((c) => c.nombre === n) || {}).color || '#8E8E93';
    const iconoDe = (n) => (categorias.find((c) => c.nombre === n) || {}).icono || '';

    let acumulado = 0;
    const huecos = items.length > 1 ? 0.8 : 0;
    const segmentos = items.map(([n, v]) => {
      const pct = (v / total) * 100;
      const largo = Math.max(pct - huecos, 0.1);
      const seg = (
        <circle key={n} cx="21" cy="21" r="15.915" fill="none" stroke={colorDe(n)} strokeWidth="5"
          strokeDasharray={`${largo} ${100 - largo}`} strokeDashoffset={25 - acumulado}></circle>
      );
      acumulado += pct;
      return seg;
    });

    return (
      <div className="donut-fila">
        <div className="donut" role="img"
          aria-label={`Gastos de ${nombreMesActual}: ${items.map(([n, v]) => `${n} ${Math.round((v / total) * 100)}%`).join(', ')}`}>
          <svg viewBox="0 0 42 42">
            <circle cx="21" cy="21" r="15.915" fill="none" className="donut-fondo" strokeWidth="5"></circle>
            {segmentos}
          </svg>
          <div className="donut-centro"><small>Gastos</small><strong>{dinero(total)}</strong></div>
        </div>
        <ul className="leyenda">
          {items.map(([n, v]) => (
            <li key={n}>
              <span className="punto" style={{ background: colorDe(n) }}></span>
              <span className="leyenda-nombre">{iconoDe(n) ? iconoDe(n) + ' ' : ''}{n}</span>
              <span className="leyenda-monto">{dinero(v)}</span>
              <span className="leyenda-pct">{Math.round((v / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ----- Comparación con el mes anterior -----
  const comparacion = () => {
    if (!datos) return null;
    const act = totalesDelMes(datos.registros, claveActual);
    const prev = totalesDelMes(datos.registros, clavePrevia);
    if (!prev.cantidad) {
      return <Vacio icono="bi-bar-chart">Aún no hay movimientos en {nombreMesPrevio.toLowerCase()} para comparar.</Vacio>;
    }

    const filas = [
      { titulo: 'Ingresos', a: act.ingresos, p: prev.ingresos, bueno: 'sube', color: 'var(--money-in)' },
      { titulo: 'Gastos', a: act.gastos, p: prev.gastos, bueno: 'baja', color: 'var(--money-out)' },
      { titulo: 'Te quedó', a: act.ingresos - act.gastos, p: prev.ingresos - prev.gastos, bueno: 'sube', color: 'var(--system-blue)' },
    ];
    const maximo = Math.max(1, ...filas.flatMap((f) => [Math.abs(f.a), Math.abs(f.p)]));

    return (
      <>
        {filas.map((f) => {
          const cambio = f.p !== 0 ? Math.round(((f.a - f.p) / Math.abs(f.p)) * 100) : null;
          let chip = null;
          if (cambio !== null) {
            const mejora = f.bueno === 'sube' ? cambio >= 0 : cambio <= 0;
            chip = (
              <span className={`chip chip-${cambio === 0 ? 'otro' : mejora ? 'ingreso' : 'gasto'}`}>
                {cambio > 0 ? '↑' : cambio < 0 ? '↓' : '='} {Math.abs(cambio)}%
              </span>
            );
          }
          return (
            <div key={f.titulo} className="comp-fila">
              <div className="comp-cabecera"><strong>{f.titulo}</strong>{chip}</div>
              <div className="comp-barra"><span style={{ width: `${(Math.abs(f.a) / maximo) * 68}%`, background: f.color }}></span><em>{dinero(f.a)}</em></div>
              <div className="comp-barra previa"><span style={{ width: `${(Math.abs(f.p) / maximo) * 68}%` }}></span><em>{dinero(f.p)}</em></div>
            </div>
          );
        })}
        <div className="comp-leyenda">
          <span><i style={{ background: 'var(--system-blue)' }}></i>{nombreMesActual}</span>
          <span><i className="previa"></i>{nombreMesPrevio}</span>
        </div>
      </>
    );
  };

  // ----- Presupuestos del mes -----
  const presupuestosResumen = () => {
    if (!datos) return null;
    const delMes = datos.presupuestos.filter((p) => Number(p.mes) === hoy.getMonth() + 1 && Number(p.anio) === hoy.getFullYear());
    if (!delMes.length) {
      return (
        <div className="list-group-item">
          <Vacio icono="bi-pie-chart">No tienes presupuestos este mes.<br /><Link to="/presupuestos">Crea el primero</Link></Vacio>
        </div>
      );
    }
    return delMes.slice(0, 4).map((p) => {
      const pct = Number(p.limiteGasto) > 0 ? Math.round((Number(p.gastoActual) / Number(p.limiteGasto)) * 100) : 0;
      const estado = pct > 100 ? 'gasto' : pct >= 80 ? 'medio' : 'ingreso';
      const color = pct > 100 ? 'var(--system-red)' : pct >= 80 ? 'var(--system-orange)' : 'var(--system-green)';
      return (
        <Link key={p.idPresupuesto} to="/presupuestos" className="list-group-item list-group-item-action pres-item">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>{p.nombreCategoria}</strong>
            <span className={`chip chip-${estado}`}>{pct}%</span>
          </div>
          <div className="progress mb-1" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-bar" style={{ width: `${Math.min(100, pct)}%`, background: color }}></div>
          </div>
          <small className="text-muted">{dinero(p.gastoActual)} de {dinero(p.limiteGasto)}</small>
        </Link>
      );
    });
  };

  // ----- Próximos pagos e ingresos fijos -----
  const proximosPagos = () => {
    if (!datos) return null;
    const activos = datos.recurrentes.filter((m) => m.activo).sort((a, b) => String(a.proximaFecha).localeCompare(String(b.proximaFecha))).slice(0, 5);
    if (!activos.length) {
      return (
        <div className="list-group-item">
          <Vacio icono="bi-arrow-repeat">No tienes pagos fijos.<br /><Link to="/recurrentes">Agrega uno</Link></Vacio>
        </div>
      );
    }
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return activos.map((m) => {
      const f = new Date(String(m.proximaFecha) + 'T00:00:00');
      const dias = Math.round((f - inicioHoy) / 86400000);
      const cuando = dias < 0 ? `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}` : dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : `En ${dias} días`;
      return (
        <div key={m.idRecurrencia} className="list-group-item mov-item">
          <span className={`mov-icono chip-${claseTipo(m.tipoMovimiento)}`}><i className="bi bi-arrow-repeat"></i></span>
          <span className="mov-texto">
            <strong>{m.nombre || (m.categoria ? m.categoria.nombre : 'Pago fijo')}</strong>
            <small className={dias < 0 ? 'monto-gasto' : 'text-muted'}>{cuando} · {humano(m.frecuencia)}</small>
          </span>
          <span className="mov-monto"><MontoConSigno tipo={m.tipoMovimiento} monto={m.montoEstimado} /></span>
        </div>
      );
    });
  };

  // ----- Metas de ahorro -----
  const metasResumen = () => {
    if (!datos) return null;
    const activas = datos.metas.filter((m) => m.estado === 'ACTIVA').slice(0, 3);
    if (!activas.length) {
      return (
        <div className="col-12">
          <div className="card"><div className="card-body">
            <Vacio icono="bi-bullseye">No tienes metas activas.<br /><Link to="/metas">Crea tu primera meta</Link></Vacio>
          </div></div>
        </div>
      );
    }
    return activas.map((m) => {
      const pct = m.montoObjetivo > 0 ? Math.round((m.montoActual / m.montoObjetivo) * 100) : 0;
      return (
        <div key={m.idMeta} className="col-12 col-md-4">
          <Link to="/metas" className="card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <strong>{m.nombre}</strong>
                <span className="chip chip-ahorro">{pct}%</span>
              </div>
              <div className="progress mb-2" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ width: `${Math.min(100, pct)}%` }}></div>
              </div>
              <small className="text-muted">{dinero(m.montoActual)} de {dinero(m.montoObjetivo)}</small>
            </div>
          </Link>
        </div>
      );
    });
  };

  return (
    <main className="container">
      <div className="hero">
        <p className="saludo">{textoSaludo}</p>
        <h1>Tu resumen</h1>
      </div>

      {/* Balance del mes y últimos movimientos */}
      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-lg-6">{balanceTarjeta()}</div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Últimos movimientos</span>
              <Link to="/registros" className="small fw-semibold">Ver todos</Link>
            </div>
            <div className="list-group list-group-flush">{recientes()}</div>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="row g-3 mt-0">{indicadores()}</div>

      {/* Gráficos */}
      <div className="section-title">Cómo se mueve tu dinero</div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header">Gastos por categoría</div>
            <div className="card-body">{gastosPorCategoria()}</div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header">{nombreMesActual} comparado con {nombreMesPrevio.toLowerCase()}</div>
            <div className="card-body">{comparacion()}</div>
          </div>
        </div>
      </div>

      {/* Presupuestos y próximos pagos */}
      <div className="section-title">Lo que viene</div>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Presupuestos del mes</span>
              <Link to="/presupuestos" className="small fw-semibold">Ver todos</Link>
            </div>
            <div className="list-group list-group-flush">{presupuestosResumen()}</div>
          </div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Próximos pagos</span>
              <Link to="/recurrentes" className="small fw-semibold">Ver todos</Link>
            </div>
            <div className="list-group list-group-flush">{proximosPagos()}</div>
          </div>
        </div>
      </div>

      {/* Metas */}
      <div className="section-title">Tus metas de ahorro</div>
      <div className="row g-3">{metasResumen()}</div>
    </main>
  );
}
