import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipTipo } from '../components/Chips';
import { BotonNuevo, FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, Segmentado, opciones } from '../components/Campos';

// Íconos para elegir con un clic (se guardan como emoji en la columna "icono")
const ICONOS = [
  ['🍔', 'Comida'], ['🛒', 'Mercado'], ['⛽', 'Gasolina'], ['🚌', 'Transporte'], ['🏠', 'Arriendo'],
  ['💡', 'Servicios'], ['📱', 'Celular e internet'], ['🎬', 'Entretenimiento'], ['🎓', 'Educación'], ['💊', 'Salud'],
  ['👕', 'Ropa'], ['🎁', 'Regalos'], ['✈️', 'Viajes'], ['🐶', 'Mascotas'], ['🔧', 'Reparaciones'],
  ['🧾', 'Impuestos'], ['💳', 'Tarjeta de crédito'], ['💼', 'Salario'], ['💻', 'Freelance'], ['💰', 'Ahorro'],
  ['🐷', 'Alcancía'], ['📈', 'Inversión'], ['🏦', 'Banco'], ['❓', 'Otro'],
];

// Colores sugeridos (también se puede elegir cualquiera con el selector)
const COLORES = ['#0d6efd', '#6610f2', '#d63384', '#dc3545', '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0', '#6c757d'];

const TIPOS = opciones(['GASTO', 'INGRESO', 'AHORRO', 'INVERSION']);
const COLUMNAS = [{ t: 'Categoría' }, { t: 'Tipo' }, { t: 'Acciones', className: 'text-end' }];
const formVacio = () => ({ id: '', nombre: '', tipo: 'GASTO', icono: '', color: '#0d6efd' });

export default function CategoriasPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const formRef = useRef(null);

  const [categorias, setCategorias] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  const cargar = async () => setCategorias(await api('/categorias'));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nueva = () => { setForm(formVacio()); setAbierta(true); };

  const editar = (id) => {
    const c = categorias.find((x) => x.idCategoria === id);
    setForm({
      id: c.idCategoria,
      nombre: c.nombre,
      tipo: c.tipo,
      icono: c.icono || '',
      color: /^#[0-9a-fA-F]{6}$/.test(c.color || '') ? c.color : '#0d6efd',
    });
    setAbierta(true);
  };

  // si se vuelve a pulsar el mismo ícono, se quita
  const elegirIcono = (emoji) => poner({ icono: form.icono === emoji ? '' : emoji });

  const guardar = () => {
    intentar(async () => {
      const datos = { nombre: form.nombre, tipo: form.tipo, icono: form.icono, color: form.color };
      if (form.id) await api(`/categorias/${form.id}`, 'PUT', datos);
      else await api('/categorias', 'POST', datos);
      mensaje(form.id ? 'Categoría actualizada' : 'Categoría creada');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar esta categoría?'))) return;
    intentar(async () => {
      await api(`/categorias/${id}`, 'DELETE');
      mensaje('Categoría eliminada');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <PageHead titulo="Categorías" sub="Organiza tus movimientos por tipo.">
        <BotonNuevo texto="Nueva categoría" onClick={nueva} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar categoría' : 'Nueva categoría'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <div className="grupo-ios">
            <Campo col="col-md-4" etiqueta="Nombre">
              <Entrada requerido value={form.nombre} onChange={(e) => poner({ nombre: e.target.value })} />
            </Campo>
            <Campo col="col-md-3" tipo="seg" etiqueta="Tipo">
              <Segmentado opciones={TIPOS} valor={form.tipo} onChange={(tipo) => poner({ tipo })} />
            </Campo>
            <Campo col="col-md-5" tipo="bloque" etiqueta="Color">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input type="color" className="form-control form-control-color" value={form.color} title="Elige cualquier color"
                  onChange={(e) => poner({ color: e.target.value })} />
                <div className="d-flex gap-1 flex-wrap">
                  {COLORES.map((c) => (
                    <button key={c} type="button" className="btn border rounded-circle p-0" title={c}
                      style={{ width: 28, height: 28, background: c }} onClick={() => poner({ color: c })}></button>
                  ))}
                </div>
              </div>
            </Campo>
            <Campo col="col-12" tipo="bloque" etiqueta={<>Icono: <span className="fs-4 align-middle">{form.icono || '—'}</span></>}>
              <div className="d-flex flex-wrap gap-1">
                {ICONOS.map(([emoji, nombre]) => (
                  <button key={emoji} type="button" title={nombre}
                    className={`btn ${form.icono === emoji ? 'btn-primary' : 'btn-outline-secondary'} fs-5 px-2 py-1`}
                    onClick={() => elegirIcono(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      <TarjetaTabla columnas={COLUMNAS}>
        {categorias.map((c) => (
          <tr key={c.idCategoria}>
            <td data-label="Categoría">
              <div className="d-flex align-items-center gap-3">
                <span className="avatar-cat" style={{ '--c': c.color || '#8E8E93' }}>{c.icono || <i className="bi bi-tag-fill"></i>}</span>
                <strong>{c.nombre}</strong>
              </div>
            </td>
            <td data-label="Tipo"><ChipTipo tipo={c.tipo} /></td>
            <td data-label="Acciones" className="text-end text-nowrap">
              <button className="btn btn-sm btn-outline-primary" onClick={() => editar(c.idCategoria)}>Editar</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(c.idCategoria)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!categorias.length && <FilaVacia columnas={3} texto="Todavía no hay categorías" />}
      </TarjetaTabla>
    </main>
  );
}
