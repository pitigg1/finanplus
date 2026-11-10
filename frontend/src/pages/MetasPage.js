import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ahora, dinero, fecha } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipEstado, ChipPrioridad } from '../components/Chips';
import { BotonNuevo, FilaVacia, PageHead, Tabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, GrupoMonto, HeroMonto, Segmentado, opciones } from '../components/Campos';

const PRIORIDADES = opciones(['MEDIA', 'ALTA', 'BAJA']);
const ESTADOS = opciones(['ACTIVA', 'COMPLETADA', 'CANCELADA']);
const COLUMNAS_APORTES = [{ t: 'Fecha' }, { t: 'Monto', className: 'text-end' }, { t: 'Acciones', className: 'text-end' }];

const formVacio = () => ({ id: '', nombre: '', descripcion: '', objetivo: 0, fechaObjetivo: '', prioridad: 'MEDIA', estado: 'ACTIVA' });

// Texto de tiempo restante hasta la fecha límite
function tiempoRestante(fechaObjetivo, estado) {
  if (estado === 'COMPLETADA') return '¡Meta cumplida!';
  if (!fechaObjetivo) return 'Sin fecha límite';
  const dias = Math.ceil((new Date(fechaObjetivo + 'T00:00:00') - new Date()) / 86400000);
  if (dias < 0) return `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Queda 1 día';
  if (dias < 60) return `Quedan ${dias} días`;
  return `Quedan ${Math.round(dias / 30)} meses`;
}

export default function MetasPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const formRef = useRef(null);
  const cajaAportes = useRef(null);

  const [metas, setMetas] = useState([]);
  const [categoriasAhorro, setCategoriasAhorro] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  // Aportes de la meta elegida (tabla Aportes_Meta)
  const [metaElegida, setMetaElegida] = useState(null); // id de la meta
  const [aportes, setAportes] = useState([]);
  const [aporteMonto, setAporteMonto] = useState(0);
  const [aporteCategoria, setAporteCategoria] = useState('');

  const cargar = async () => setMetas(await api('/metas'));

  useEffect(() => {
    intentar(async () => {
      // Los aportes se guardan como un registro de tipo AHORRO, por eso solo sirven categorías de ese tipo
      setCategoriasAhorro((await api('/categorias')).filter((c) => c.tipo === 'AHORRO'));
      await cargar();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= METAS =================
  const nueva = () => { setForm(formVacio()); setAbierta(true); };

  const editar = (id) => {
    const m = metas.find((x) => x.idMeta === id);
    setForm({
      id: m.idMeta,
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      objetivo: Number(m.montoObjetivo),
      fechaObjetivo: m.fechaObjetivo || '',
      prioridad: m.prioridad,
      estado: m.estado,
    });
    setAbierta(true);
  };

  const guardar = () => {
    intentar(async () => {
      // Estructura de MetaAhorroRequestDTO (el usuario sale del token, no se envía)
      const datos = {
        nombre: form.nombre,
        descripcion: form.descripcion || null,
        montoObjetivo: form.objetivo,
        fechaObjetivo: form.fechaObjetivo || null,
        prioridad: form.prioridad,
        estado: form.estado,
      };
      if (form.id) await api(`/metas/${form.id}`, 'PUT', datos);
      else await api('/metas', 'POST', datos);
      mensaje(form.id ? 'Meta actualizada' : 'Meta creada');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar esta meta y sus aportes?'))) return;
    intentar(async () => {
      await api(`/metas/${id}`, 'DELETE');
      mensaje('Meta eliminada');
      if (metaElegida === id) setMetaElegida(null);
      await cargar();
    });
  };

  // ================= APORTES =================
  const cargarAportes = async (idMeta = metaElegida) => {
    setAportes(await api(`/aportes/meta/${idMeta}`));
    setTimeout(() => cajaAportes.current && cajaAportes.current.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  const verAportes = (idMeta) => {
    setMetaElegida(idMeta);
    intentar(() => cargarAportes(idMeta));
  };

  // CREAR un aporte: primero se crea un registro de tipo AHORRO y luego el aporte que lo enlaza
  const agregarAporte = (e) => {
    e.preventDefault();
    intentar(async () => {
      const meta = metas.find((x) => x.idMeta === metaElegida);
      // 1) Registro de tipo AHORRO (estructura de RegistroFinancieroRequestDTO)
      const registro = await api('/registros', 'POST', {
        idCategoria: Number(aporteCategoria),
        tipoMovimiento: 'AHORRO',
        monto: aporteMonto,
        descripcion: 'Aporte a meta: ' + meta.nombre,
        fechaMovimiento: ahora(),
      });
      // 2) Aporte que enlaza el registro con la meta (el backend suma el monto a la meta)
      try {
        await api('/aportes', 'POST', {
          meta: { idMeta: metaElegida },
          registro: { idRegistro: registro.idRegistro },
          monto: aporteMonto,
        });
      } catch (error) {
        // si el aporte falla, se borra el registro para no dejarlo suelto
        await api(`/registros/${registro.idRegistro}`, 'DELETE').catch(() => {});
        throw error;
      }
      mensaje('Aporte agregado');
      setAporteMonto(0);
      setAporteCategoria('');
      await cargar();
      await cargarAportes();
    });
  };

  const editarAporte = (id, montoActual) => {
    const nuevo = window.prompt('Nuevo monto del aporte:', Math.round(montoActual).toLocaleString('es-CO'));
    if (nuevo === null) return;
    const valor = Number(nuevo.replace(/\D/g, ''));
    if (!valor) return mensaje('Escribe un monto válido', 'warning');
    intentar(async () => {
      await api(`/aportes/${id}`, 'PUT', { monto: valor });
      mensaje('Aporte actualizado');
      await cargar();
      await cargarAportes();
    });
  };

  const eliminarAporte = async (id) => {
    if (!(await confirmar('¿Eliminar este aporte? Se descontará de la meta.'))) return;
    intentar(async () => {
      await api(`/aportes/${id}`, 'DELETE');
      mensaje('Aporte eliminado');
      await cargar();
      await cargarAportes();
    });
  };

  const metaActual = metas.find((x) => x.idMeta === metaElegida);

  return (
    <main className="container py-4">
      <PageHead titulo="Metas de ahorro" sub="Ahorra para lo que quieres lograr.">
        <BotonNuevo texto="Nueva meta" onClick={nueva} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar meta' : 'Nueva meta'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <HeroMonto etiqueta="Monto objetivo" valor={form.objetivo} onChange={(objetivo) => poner({ objetivo })} requerido />
          <div className="grupo-ios">
            <Campo col="col-md-4" etiqueta="Nombre">
              <Entrada maxLength={120} requerido value={form.nombre} onChange={(e) => poner({ nombre: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" etiqueta="Descripción">
              <Entrada value={form.descripcion} onChange={(e) => poner({ descripcion: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" etiqueta="Fecha objetivo">
              <Entrada type="date" value={form.fechaObjetivo} onChange={(e) => poner({ fechaObjetivo: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" tipo="seg" etiqueta="Prioridad">
              <Segmentado opciones={PRIORIDADES} valor={form.prioridad} onChange={(prioridad) => poner({ prioridad })} />
            </Campo>
            <Campo col="col-md-4" tipo="seg" etiqueta="Estado">
              <Segmentado opciones={ESTADOS} valor={form.estado} onChange={(estado) => poner({ estado })} />
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      {/* Una tarjeta por meta (el backend sabe quién es el usuario por el token) */}
      <div className="row g-3 mb-4">
        {metas.map((m) => {
          const porcentaje = m.montoObjetivo > 0 ? Math.round((m.montoActual / m.montoObjetivo) * 100) : 0;
          const falta = Math.max(0, Number(m.montoObjetivo) - Number(m.montoActual));
          return (
            <div key={m.idMeta} className="col-12 col-md-6 col-lg-4">
              <div className="card meta-card h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className={`anillo ${porcentaje >= 100 ? 'completa' : ''}`.trim()} style={{ '--p': Math.min(100, porcentaje) }} role="img" aria-label={`${porcentaje}% completado`}>
                      <span>{porcentaje}%</span>
                    </div>
                    <div className="text-end d-flex flex-column align-items-end gap-1">
                      <ChipEstado estado={m.estado} /><ChipPrioridad nivel={m.prioridad} />
                    </div>
                  </div>
                  <h2 className="h5 mt-3 mb-0">{m.nombre}</h2>
                  <p className="small text-muted mb-3">{m.descripcion || '\u00A0'}</p>
                  <div className="meta-cifras">
                    <div><small>Ahorrado</small><strong>{dinero(m.montoActual)}</strong></div>
                    <div><small>Objetivo</small><strong>{dinero(m.montoObjetivo)}</strong></div>
                  </div>
                  <div className="small text-muted mt-2 mb-3">
                    <i className="bi bi-clock"></i> {tiempoRestante(m.fechaObjetivo, m.estado)}{falta > 0 ? ` · faltan ${dinero(falta)}` : ''}
                  </div>
                  <div className="meta-acciones mt-auto">
                    <button className="btn btn-sm btn-outline-success" onClick={() => verAportes(m.idMeta)}><i className="bi bi-plus-circle"></i> Aportes</button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => editar(m.idMeta)}>Editar</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(m.idMeta)} aria-label="Eliminar meta"><i className="bi bi-trash3"></i></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {!metas.length && (
          <div className="col-12">
            <div className="card"><div className="card-body vacio">
              <i className="bi bi-bullseye"></i>
              <p>Todavía no tienes metas.<br />Toca «Nueva meta» para crear la primera.</p>
            </div></div>
          </div>
        )}
      </div>

      {/* Aportes de la meta elegida (tabla Aportes_Meta) */}
      {metaActual && (
        <div className="card" ref={cajaAportes}>
          <div className="card-body">
            <h2 className="h5 card-title">Aportes de: {metaActual.nombre}</h2>
            <form className="row g-3 mb-3" onSubmit={agregarAporte}>
              <div className="col-md-4">
                <label className="form-label">Monto</label>
                <GrupoMonto valor={aporteMonto} onChange={setAporteMonto} requerido />
              </div>
              <div className="col-md-4">
                <label className="form-label">Categoría (de ahorro)</label>
                <select className="form-select" required value={aporteCategoria} onChange={(e) => setAporteCategoria(e.target.value)}>
                  <option value="">{categoriasAhorro.length ? '-- Elige --' : '-- No hay categorías de ahorro --'}</option>
                  {categoriasAhorro.map((c) => <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>)}
                </select>
                <div className="form-text">
                  {!categoriasAhorro.length && (
                    <>Para aportar necesitas una categoría de tipo <strong>AHORRO</strong>. <Link to="/categorias">Créala aquí</Link>.</>
                  )}
                </div>
              </div>
              <div className="col-md-4 d-flex align-items-end">
                <button type="submit" className="btn btn-success">Agregar aporte</button>
              </div>
            </form>
            <Tabla columnas={COLUMNAS_APORTES} small>
              {aportes.map((a) => (
                <tr key={a.idAporte}>
                  <td data-label="Fecha">{fecha(a.fechaAporte)}</td>
                  <td data-label="Monto" className="text-end">{dinero(a.monto)}</td>
                  <td data-label="Acciones" className="text-end text-nowrap">
                    <button className="btn btn-sm btn-outline-primary" onClick={() => editarAporte(a.idAporte, a.monto)}>Editar</button>{' '}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarAporte(a.idAporte)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {!aportes.length && <FilaVacia columnas={3} texto="Esta meta no tiene aportes" />}
            </Tabla>
          </div>
        </div>
      )}
    </main>
  );
}
