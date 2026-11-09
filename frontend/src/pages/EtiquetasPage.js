import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipTexto } from '../components/Chips';
import { BotonNuevo, FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada } from '../components/Campos';

const COLUMNAS = [{ t: 'Etiqueta' }, { t: 'Acciones', className: 'text-end' }];

export default function EtiquetasPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const formRef = useRef(null);

  const [etiquetas, setEtiquetas] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState({ id: '', nombre: '' });

  const cargar = async () => setEtiquetas(await api('/etiquetas'));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nueva = () => { setForm({ id: '', nombre: '' }); setAbierta(true); };

  // Pasa los datos de la fila al formulario
  const editar = (id) => {
    const e = etiquetas.find((x) => x.idEtiqueta === id);
    setForm({ id: e.idEtiqueta, nombre: e.nombre });
    setAbierta(true);
  };

  const guardar = () => {
    intentar(async () => {
      const datos = { nombre: form.nombre };
      if (form.id) await api(`/etiquetas/${form.id}`, 'PUT', datos);
      else await api('/etiquetas', 'POST', datos);
      mensaje(form.id ? 'Etiqueta actualizada' : 'Etiqueta creada');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar esta etiqueta?'))) return;
    intentar(async () => {
      await api(`/etiquetas/${id}`, 'DELETE');
      mensaje('Etiqueta eliminada');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <PageHead titulo="Etiquetas" sub="Agrupa movimientos de distintas categorías.">
        <BotonNuevo texto="Nueva etiqueta" onClick={nueva} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar etiqueta' : 'Nueva etiqueta'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <div className="grupo-ios">
            <Campo col="col-md-6" etiqueta="Nombre">
              <Entrada maxLength={100} requerido value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      <TarjetaTabla columnas={COLUMNAS} responsive={false}>
        {etiquetas.map((e) => (
          <tr key={e.idEtiqueta}>
            <td data-label="Etiqueta"><ChipTexto clase="inversion"><i className="bi bi-tag-fill"></i> {e.nombre}</ChipTexto></td>
            <td data-label="Acciones" className="text-end">
              <button className="btn btn-sm btn-outline-primary" onClick={() => editar(e.idEtiqueta)}>Editar</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(e.idEtiqueta)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!etiquetas.length && <FilaVacia columnas={2} texto="Todavía no hay etiquetas" />}
      </TarjetaTabla>
    </main>
  );
}
