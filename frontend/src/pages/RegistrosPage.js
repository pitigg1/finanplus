import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ahora, fecha } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipTipo, MontoConSigno } from '../components/Chips';
import { BotonNuevo, FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, HeroMonto, SelectorCategorias } from '../components/Campos';

const COLUMNAS = [
  { t: 'Fecha' }, { t: 'Tipo' }, { t: 'Categoría' }, { t: 'Descripción' },
  { t: 'Monto', className: 'text-end' }, { t: 'Etiquetas' }, { t: 'Acciones', className: 'text-end' },
];

const formVacio = () => ({ id: '', categoria: '', tipo: '', monto: 0, descripcion: '', fecha: ahora().slice(0, 16), etiquetas: [] });

export default function RegistrosPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const formRef = useRef(null);

  const [registros, setRegistros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [etiquetas, setEtiquetas] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  const cargar = async () => setRegistros(await api('/registros'));

  useEffect(() => {
    intentar(async () => {
      setCategorias(await api('/categorias'));
      setEtiquetas(await api('/etiquetas'));
      await cargar();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El tipo del registro ES el de su categoría: se llena solo al elegirla y no se puede cambiar a mano
  const elegirCategoria = (id) => {
    const categoria = categorias.find((c) => String(c.idCategoria) === id);
    poner({ categoria: id, tipo: categoria ? categoria.tipo : '' });
  };

  const alternarEtiqueta = (id) =>
    poner({ etiquetas: form.etiquetas.includes(id) ? form.etiquetas.filter((x) => x !== id) : [...form.etiquetas, id] });

  const pasaFiltro = (r) => {
    if (filtroTipo && r.tipoMovimiento !== filtroTipo) return false;
    if (!busqueda) return true;
    const texto = `${r.descripcion || ''} ${r.nombreCategoria || ''} ${(r.etiquetas || []).join(' ')}`.toLowerCase();
    return texto.includes(busqueda);
  };

  const nuevo = () => { setForm(formVacio()); setAbierta(true); };

  const editar = (id) => {
    const r = registros.find((x) => x.idRegistro === id);
    if (!r) return;
    const nombres = r.etiquetas || []; // los nombres de etiqueta son únicos
    setForm({
      id: r.idRegistro,
      categoria: String(r.idCategoria ?? ''),
      tipo: (categorias.find((c) => c.idCategoria === r.idCategoria) || {}).tipo || r.tipoMovimiento,
      monto: Number(r.monto),
      descripcion: r.descripcion || '',
      fecha: String(r.fechaMovimiento).slice(0, 16),
      etiquetas: etiquetas.filter((e) => nombres.includes(e.nombre)).map((e) => e.idEtiqueta),
    });
    setAbierta(true);
  };

  // CREAR o ACTUALIZAR
  const guardar = () => {
    if (!form.categoria) {
      mensaje('Debes seleccionar una categoría', 'warning');
      return;
    }
    intentar(async () => {
      const existente = registros.find((x) => x.idRegistro === form.id);
      // Estructura de RegistroFinancieroRequestDTO
      const datos = {
        idCategoria: Number(form.categoria),
        tipoMovimiento: form.tipo || undefined, // el backend exige que sea el de la categoría
        monto: form.monto,
        descripcion: form.descripcion,
        fechaMovimiento: form.fecha,
        esRecurrente: existente ? existente.esRecurrente : false,
        idsEtiquetas: form.etiquetas.map(Number), // lista vacía = sin etiquetas
      };
      if (form.id) await api(`/registros/${form.id}`, 'PUT', datos);
      else await api('/registros', 'POST', datos);
      mensaje(form.id ? 'Registro actualizado' : 'Registro creado');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar este registro?'))) return;
    intentar(async () => {
      await api(`/registros/${id}`, 'DELETE');
      mensaje('Registro eliminado');
      await cargar();
    });
  };

  const visibles = registros.filter(pasaFiltro);
  const filtros = [['', 'Todos'], ['INGRESO', 'Ingresos'], ['GASTO', 'Gastos'], ['AHORRO', 'Ahorro'], ['INVERSION', 'Inversión']];

  return (
    <main className="container py-4">
      <PageHead titulo="Registros" sub="Todo lo que entra y sale de tu bolsillo.">
        <BotonNuevo texto="Nuevo registro" onClick={nuevo} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar registro' : 'Nuevo registro'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <HeroMonto etiqueta="Monto" valor={form.monto} onChange={(monto) => poner({ monto })} requerido />
          <div className="grupo-ios">
            <Campo col="col-md-4" tipo="bloque" etiqueta="Categoría">
              <SelectorCategorias categorias={categorias} valor={form.categoria} onChange={elegirCategoria} />
            </Campo>
            <Campo col="col-md-2" tipo="bloque" etiqueta="Tipo">
              {form.tipo ? <ChipTipo tipo={form.tipo} /> : <span className="text-muted">—</span>}
              <div className="form-text">Es el de la categoría</div>
            </Campo>
            <Campo col="col-md-4" etiqueta="Fecha">
              <Entrada type="datetime-local" requerido value={form.fecha} onChange={(e) => poner({ fecha: e.target.value })} />
            </Campo>
            <Campo col="col-12" etiqueta="Descripción">
              <Entrada maxLength={255} value={form.descripcion} onChange={(e) => poner({ descripcion: e.target.value })} />
            </Campo>
            <Campo col="col-12" tipo="bloque" etiqueta={<>Etiquetas <small className="text-muted">(opcional, puedes marcar varias)</small></>}>
              <div className="d-flex flex-wrap gap-2">
                {etiquetas.length ? (
                  etiquetas.map((e) => (
                    <React.Fragment key={e.idEtiqueta}>
                      <input type="checkbox" className="btn-check" id={`etq-${e.idEtiqueta}`} autoComplete="off"
                        checked={form.etiquetas.includes(e.idEtiqueta)} onChange={() => alternarEtiqueta(e.idEtiqueta)} />
                      <label className="btn btn-outline-info btn-sm" htmlFor={`etq-${e.idEtiqueta}`}>{e.nombre}</label>
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-muted small">No hay etiquetas. Créalas en <Link to="/etiquetas">Etiquetas</Link>.</span>
                )}
              </div>
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      <div className="toolbar">
        <div className="segmented segmented-filtro" role="tablist" aria-label="Filtrar por tipo">
          {filtros.map(([valor, texto]) => (
            <button key={valor} type="button" className={filtroTipo === valor ? 'activo' : ''} onClick={() => setFiltroTipo(valor)}>{texto}</button>
          ))}
        </div>
        <label className="buscador">
          <i className="bi bi-search"></i>
          <input type="search" placeholder="Buscar" autoComplete="off" value={busqueda} onChange={(e) => setBusqueda(e.target.value.trim().toLowerCase())} />
        </label>
      </div>

      <TarjetaTabla columnas={COLUMNAS}>
        {visibles.map((r) => (
          <tr key={r.idRegistro}>
            <td data-label="Fecha" className="text-nowrap">{fecha(r.fechaMovimiento)}</td>
            <td data-label="Tipo"><ChipTipo tipo={r.tipoMovimiento} /></td>
            <td data-label="Categoría">{r.nombreCategoria || 'Sin categoría'}</td>
            <td data-label="Descripción">{r.descripcion}</td>
            <td data-label="Monto" className="text-end text-nowrap"><MontoConSigno tipo={r.tipoMovimiento} monto={r.monto} /></td>
            <td data-label="Etiquetas">
              {(r.etiquetas || []).length
                ? r.etiquetas.map((nombre) => <span key={nombre} className="badge text-bg-info me-1">{nombre}</span>)
                : <span className="text-muted small">—</span>}
            </td>
            <td data-label="Acciones" className="text-end text-nowrap">
              <button className="btn btn-sm btn-outline-primary" onClick={() => editar(r.idRegistro)}>Editar</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(r.idRegistro)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!visibles.length && (
          <FilaVacia columnas={7} texto={registros.length ? 'Nada coincide con tu búsqueda' : 'Todavía no hay registros. Toca «Nuevo registro» para empezar.'} />
        )}
      </TarjetaTabla>
    </main>
  );
}
