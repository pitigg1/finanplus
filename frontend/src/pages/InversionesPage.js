import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { usuarioActual } from '../lib/sesion';
import { dinero, humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipRiesgo, ChipTexto } from '../components/Chips';
import { BotonNuevo, FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, GrupoMonto, HeroMonto, SelectorTipoActivo, Segmentado, opciones } from '../components/Campos';

const RIESGOS = opciones(['MEDIO', 'BAJO', 'ALTO']);
const COLUMNAS = [
  { t: 'Activo' }, { t: 'Tipo' }, { t: 'Invertido', className: 'text-end' }, { t: 'Valor actual', className: 'text-end' },
  { t: 'Rentab.', className: 'text-end' }, { t: 'Riesgo' }, { t: 'Fecha' }, { t: 'Acciones', className: 'text-end' },
];

const formVacio = () => ({ id: '', nombreActivo: '', tipoActivo: 'ACCION', montoInvertido: 0, valorActual: 0, rentabilidad: '', riesgo: 'MEDIO', fechaInversion: '' });

export default function InversionesPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const usuarioId = usuarioActual();
  const formRef = useRef(null);

  const [inversiones, setInversiones] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  const cargar = async () => setInversiones(await api(`/inversiones/usuario/${usuarioId}`));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nueva = () => { setForm(formVacio()); setAbierta(true); };

  const editar = (id) => {
    const i = inversiones.find((x) => x.idInversion === id);
    setForm({
      id: i.idInversion,
      nombreActivo: i.nombreActivo,
      tipoActivo: i.tipoActivo,
      montoInvertido: Number(i.montoInvertido),
      valorActual: Number(i.valorActual),
      rentabilidad: i.rentabilidad ?? '',
      riesgo: i.riesgo,
      fechaInversion: i.fechaInversion,
    });
    setAbierta(true);
  };

  const guardar = () => {
    intentar(async () => {
      const datos = {
        usuario: { idUsuario: usuarioId },
        nombreActivo: form.nombreActivo,
        tipoActivo: form.tipoActivo,
        montoInvertido: form.montoInvertido,
        valorActual: form.valorActual,
        rentabilidad: form.rentabilidad === '' ? null : Number(form.rentabilidad),
        riesgo: form.riesgo,
        fechaInversion: form.fechaInversion,
      };
      if (form.id) await api(`/inversiones/${form.id}`, 'PUT', datos);
      else await api('/inversiones', 'POST', datos);
      mensaje(form.id ? 'Inversión actualizada' : 'Inversión creada');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar esta inversión?'))) return;
    intentar(async () => {
      await api(`/inversiones/${id}`, 'DELETE');
      mensaje('Inversión eliminada');
      await cargar();
    });
  };

  const invertido = inversiones.reduce((suma, i) => suma + Number(i.montoInvertido), 0);
  const valor = inversiones.reduce((suma, i) => suma + Number(i.valorActual), 0);

  return (
    <main className="container py-4">
      <PageHead titulo="Inversiones" sub="CDT, acciones, fondos y más.">
        <BotonNuevo texto="Nueva inversión" onClick={nueva} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar inversión' : 'Nueva inversión'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <HeroMonto etiqueta="Monto invertido" valor={form.montoInvertido} onChange={(montoInvertido) => poner({ montoInvertido })} requerido />
          <div className="grupo-ios">
            <Campo col="col-md-4" etiqueta="Activo">
              <Entrada placeholder="Ej. CDT Bancolombia" requerido value={form.nombreActivo} onChange={(e) => poner({ nombreActivo: e.target.value })} />
            </Campo>
            <Campo col="col-md-2" tipo="bloque" etiqueta="Tipo">
              <SelectorTipoActivo valor={form.tipoActivo} onChange={(tipoActivo) => poner({ tipoActivo })} />
            </Campo>
            <Campo col="col-md-3" etiqueta="Valor actual">
              <GrupoMonto valor={form.valorActual} onChange={(valorActual) => poner({ valorActual })} requerido />
            </Campo>
            <Campo col="col-md-3" etiqueta="Rentabilidad (%)">
              <Entrada type="number" step="any" value={form.rentabilidad} onChange={(e) => poner({ rentabilidad: e.target.value })} />
            </Campo>
            <Campo col="col-md-3" tipo="seg" etiqueta="Riesgo">
              <Segmentado opciones={RIESGOS} valor={form.riesgo} onChange={(riesgo) => poner({ riesgo })} />
            </Campo>
            <Campo col="col-md-3" etiqueta="Fecha de inversión">
              <Entrada type="date" requerido value={form.fechaInversion} onChange={(e) => poner({ fechaInversion: e.target.value })} />
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      <TarjetaTabla columnas={COLUMNAS} antes={<p className="text-muted">Total invertido: {dinero(invertido)} · Valor actual: {dinero(valor)}</p>}>
        {inversiones.map((i) => (
          <tr key={i.idInversion}>
            <td data-label="Activo">{i.nombreActivo}</td>
            <td data-label="Tipo"><ChipTexto texto={humano(i.tipoActivo)} clase="inversion" /></td>
            <td data-label="Invertido" className="text-end">{dinero(i.montoInvertido)}</td>
            <td data-label="Valor actual" className="text-end">{dinero(i.valorActual)}</td>
            <td data-label="Rentab." className="text-end">{i.rentabilidad == null ? '-' : i.rentabilidad + '%'}</td>
            <td data-label="Riesgo"><ChipRiesgo riesgo={i.riesgo} /></td>
            <td data-label="Fecha">{i.fechaInversion}</td>
            <td data-label="Acciones" className="text-end text-nowrap">
              <button className="btn btn-sm btn-outline-primary" onClick={() => editar(i.idInversion)}>Editar</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(i.idInversion)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!inversiones.length && <FilaVacia columnas={8} texto="No hay inversiones" />}
      </TarjetaTabla>
    </main>
  );
}
