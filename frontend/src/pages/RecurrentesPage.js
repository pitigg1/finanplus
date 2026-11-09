import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { usuarioActual } from '../lib/sesion';
import { dinero, humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipTexto, ChipTipo } from '../components/Chips';
import { BotonNuevo, FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, HeroMonto, Interruptor, SelectorCategorias, Segmentado, opciones } from '../components/Campos';

const TIPOS = opciones(['GASTO', 'INGRESO', 'AHORRO', 'INVERSION']);
const FRECUENCIAS = opciones(['MENSUAL', 'SEMANAL', 'DIARIA', 'ANUAL']);
const COLUMNAS = [
  { t: 'Nombre' }, { t: 'Categoría' }, { t: 'Tipo' }, { t: 'Monto', className: 'text-end' },
  { t: 'Frecuencia' }, { t: 'Próxima fecha' }, { t: 'Estado' }, { t: 'Acciones', className: 'text-end' },
];

const formVacio = () => ({ id: '', nombre: '', categoria: '', tipo: 'GASTO', monto: 0, frecuencia: 'MENSUAL', fecha: '', activo: true });

export default function RecurrentesPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const usuarioId = usuarioActual();
  const formRef = useRef(null);

  const [recurrentes, setRecurrentes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  const cargar = async () => setRecurrentes(await api(`/recurrentes/usuario/${usuarioId}`));

  useEffect(() => {
    intentar(async () => {
      setCategorias(await api('/categorias'));
      await cargar();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Arma el JSON que espera el backend
  const armarDatos = (idCategoria, tipo, monto, frecuencia, proximaFecha, activo, nombre) => ({
    nombre: nombre ? nombre.trim() : null,
    usuario: { idUsuario: usuarioId },
    categoria: { idCategoria: idCategoria },
    tipoMovimiento: tipo,
    montoEstimado: monto,
    frecuencia: frecuencia,
    proximaFecha: proximaFecha,
    activo: activo,
  });

  const nuevo = () => { setForm(formVacio()); setAbierta(true); };

  const editar = (id) => {
    const m = recurrentes.find((x) => x.idRecurrencia === id);
    setForm({
      id: m.idRecurrencia,
      nombre: m.nombre || '',
      categoria: String(m.categoria.idCategoria),
      tipo: m.tipoMovimiento,
      monto: Number(m.montoEstimado),
      frecuencia: m.frecuencia,
      fecha: m.proximaFecha,
      activo: m.activo,
    });
    setAbierta(true);
  };

  const guardar = () => {
    intentar(async () => {
      const datos = armarDatos(Number(form.categoria), form.tipo, form.monto, form.frecuencia, form.fecha, form.activo, form.nombre);
      if (form.id) await api(`/recurrentes/${form.id}`, 'PUT', datos);
      else await api('/recurrentes', 'POST', datos);
      mensaje(form.id ? 'Movimiento actualizado' : 'Movimiento creado');
      setAbierta(false);
      await cargar();
    });
  };

  // Cambia entre activo y pausado
  const pausarActivar = (id) => {
    const m = recurrentes.find((x) => x.idRecurrencia === id);
    intentar(async () => {
      await api(`/recurrentes/${id}`, 'PUT',
        armarDatos(m.categoria.idCategoria, m.tipoMovimiento, m.montoEstimado, m.frecuencia, m.proximaFecha, !m.activo, m.nombre));
      mensaje(m.activo ? 'Movimiento pausado' : 'Movimiento activado');
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar este movimiento recurrente?'))) return;
    intentar(async () => {
      await api(`/recurrentes/${id}`, 'DELETE');
      mensaje('Movimiento eliminado');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <PageHead titulo="Recurrentes" sub="Tus pagos e ingresos fijos.">
        <BotonNuevo texto="Nuevo recurrente" onClick={nuevo} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar movimiento recurrente' : 'Nuevo movimiento recurrente'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <HeroMonto etiqueta="Monto estimado" valor={form.monto} onChange={(monto) => poner({ monto })} requerido />
          <div className="grupo-ios">
            <Campo col="col-md-4" etiqueta="Nombre">
              <Entrada maxLength={100} placeholder="Ej. Netflix, Arriendo, Sueldo" requerido value={form.nombre} onChange={(e) => poner({ nombre: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" tipo="bloque" etiqueta="Categoría">
              <SelectorCategorias categorias={categorias} valor={form.categoria} onChange={(categoria) => poner({ categoria })} />
            </Campo>
            <Campo col="col-md-2" tipo="seg" etiqueta="Tipo">
              <Segmentado opciones={TIPOS} valor={form.tipo} onChange={(tipo) => poner({ tipo })} />
            </Campo>
            <Campo col="col-md-2" tipo="seg" etiqueta="Frecuencia">
              <Segmentado opciones={FRECUENCIAS} valor={form.frecuencia} onChange={(frecuencia) => poner({ frecuencia })} />
            </Campo>
            <Campo col="col-md-2" etiqueta="Próxima fecha">
              <Entrada type="date" requerido value={form.fecha} onChange={(e) => poner({ fecha: e.target.value })} />
            </Campo>
            <Interruptor id="activo" etiqueta="Activo" checked={form.activo} onChange={(activo) => poner({ activo })} />
          </div>
        </FormularioHoja>
      </Hoja>

      <TarjetaTabla columnas={COLUMNAS}>
        {recurrentes.map((m) => (
          <tr key={m.idRecurrencia}>
            <td data-label="Nombre"><strong>{m.nombre || m.categoria.nombre}</strong></td>
            <td data-label="Categoría">{m.categoria.nombre}</td>
            <td data-label="Tipo"><ChipTipo tipo={m.tipoMovimiento} /></td>
            <td data-label="Monto" className="text-end">{dinero(m.montoEstimado)}</td>
            <td data-label="Frecuencia"><ChipTexto texto={humano(m.frecuencia)} /></td>
            <td data-label="Próxima fecha" className="text-nowrap">{m.proximaFecha}</td>
            <td data-label="Estado">{m.activo ? <ChipTexto texto="Activo" clase="ingreso" /> : <ChipTexto texto="Pausado" />}</td>
            <td data-label="Acciones" className="text-end text-nowrap">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => pausarActivar(m.idRecurrencia)}>{m.activo ? 'Pausar' : 'Activar'}</button>{' '}
              <button className="btn btn-sm btn-outline-primary" onClick={() => editar(m.idRecurrencia)}>Editar</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(m.idRecurrencia)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!recurrentes.length && <FilaVacia columnas={8} texto="Todavía no hay movimientos recurrentes" />}
      </TarjetaTabla>
    </main>
  );
}
