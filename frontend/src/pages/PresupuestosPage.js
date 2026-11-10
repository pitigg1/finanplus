import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { usuarioActual } from '../lib/sesion';
import { NOMBRES_MESES, dinero } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { BotonNuevo, FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, HeroMonto, SelectorCategorias, SelectorMeses } from '../components/Campos';

const COLUMNAS = [
  { t: 'Categoría' }, { t: 'Mes/Año' }, { t: 'Límite', className: 'text-end' }, { t: 'Gastado', className: 'text-end' },
  { t: 'Progreso', style: { width: 200 } }, { t: 'Acciones', className: 'text-end' },
];

const formVacio = () => ({ id: '', categoria: '', mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), limite: 0 });

export default function PresupuestosPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const usuarioId = usuarioActual();
  const formRef = useRef(null);

  const [presupuestos, setPresupuestos] = useState([]);
  const [categorias, setCategorias] = useState([]); // solo de gasto
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  const cargar = async () => setPresupuestos(await api(`/presupuestos/usuario/${usuarioId}`));

  useEffect(() => {
    intentar(async () => {
      setCategorias((await api('/categorias')).filter((c) => c.tipo === 'GASTO'));
      await cargar();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nuevo = () => { setForm(formVacio()); setAbierta(true); };

  const editar = (id) => {
    const p = presupuestos.find((x) => x.idPresupuesto === id);
    setForm({ id: p.idPresupuesto, categoria: String(p.idCategoria), mes: p.mes, anio: p.anio, limite: Number(p.limiteGasto) });
    setAbierta(true);
  };

  const guardar = () => {
    intentar(async () => {
      if (!form.categoria) {
        mensaje('Por favor selecciona una categoría', 'warning');
        return;
      }
      // Estructura exacta que espera PresupuestoRequestDTO en Spring Boot
      const datos = { idCategoria: Number(form.categoria), mes: Number(form.mes), anio: Number(form.anio), limiteGasto: form.limite };
      if (form.id) await api(`/presupuestos/${form.id}`, 'PUT', datos);
      else await api('/presupuestos', 'POST', datos);
      mensaje(form.id ? 'Presupuesto actualizado' : 'Presupuesto creado');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar este presupuesto?'))) return;
    intentar(async () => {
      await api(`/presupuestos/${id}`, 'DELETE');
      mensaje('Presupuesto eliminado');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <PageHead titulo="Presupuestos" sub="Ponle un límite a lo que gastas cada mes.">
        <BotonNuevo texto="Nuevo presupuesto" onClick={nuevo} />
      </PageHead>

      <Hoja abierta={abierta} titulo={form.id ? 'Editar presupuesto' : 'Nuevo presupuesto'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <HeroMonto etiqueta="Límite" valor={form.limite} onChange={(limite) => poner({ limite })} requerido />
          <div className="grupo-ios">
            <Campo col="col-md-4" tipo="bloque" etiqueta="Categoría (de gasto)">
              <SelectorCategorias categorias={categorias} valor={form.categoria} onChange={(categoria) => poner({ categoria })} />
            </Campo>
            <Campo col="col-md-2" tipo="bloque" etiqueta="Mes">
              <SelectorMeses valor={form.mes} onChange={(mes) => poner({ mes })} />
            </Campo>
            <Campo col="col-md-2" etiqueta="Año">
              <Entrada type="number" min="2000" requerido value={form.anio} onChange={(e) => poner({ anio: e.target.value })} />
            </Campo>
            <Campo col="col-12" tipo="nota">
              <small className="text-muted">Lo gastado se calcula solo: es la suma de tus registros de tipo GASTO en esa categoría durante ese mes.</small>
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      <TarjetaTabla columnas={COLUMNAS}>
        {presupuestos.map((p) => {
          const porcentaje = p.limiteGasto > 0 ? Math.round((p.gastoActual / p.limiteGasto) * 100) : 0;
          // verde si va bien, amarillo desde el 80 %, rojo si se pasó
          const color = porcentaje > 100 ? 'bg-danger' : porcentaje >= 80 ? 'bg-warning' : 'bg-success';
          return (
            <tr key={p.idPresupuesto}>
              <td data-label="Categoría">{p.nombreCategoria}</td>
              <td data-label="Mes/Año" className="text-nowrap">{NOMBRES_MESES[p.mes - 1] || p.mes} {p.anio}</td>
              <td data-label="Límite" className="text-end">{dinero(p.limiteGasto)}</td>
              <td data-label="Gastado" className="text-end">{dinero(p.gastoActual)}</td>
              <td data-label="Progreso">
                <div className="progress" role="progressbar" aria-valuenow={porcentaje} aria-valuemin="0" aria-valuemax="100">
                  <div className={`progress-bar ${color}`} style={{ width: `${Math.min(100, porcentaje)}%`, minWidth: porcentaje > 0 ? 40 : 0 }}>{porcentaje}%</div>
                </div>
              </td>
              <td data-label="Acciones" className="text-end text-nowrap">
                <button className="btn btn-sm btn-outline-primary" onClick={() => editar(p.idPresupuesto)}>Editar</button>{' '}
                <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(p.idPresupuesto)}>Eliminar</button>
              </td>
            </tr>
          );
        })}
        {!presupuestos.length && <FilaVacia columnas={6} texto="No hay presupuestos" />}
      </TarjetaTabla>
    </main>
  );
}
