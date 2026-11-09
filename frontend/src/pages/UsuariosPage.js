import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { cerrarSesion, usuarioActual } from '../lib/sesion';
import { humano } from '../lib/formato';
import { useAviso } from '../context/Aviso';
import { useConfirmar } from '../context/Confirmar';
import { ChipTexto } from '../components/Chips';
import { FilaVacia, PageHead, TarjetaTabla } from '../components/Piezas';
import Hoja, { FormularioHoja } from '../components/Hoja';
import { Campo, Entrada, Segmentado, opciones } from '../components/Campos';

const MONEDAS = [
  ['COP', 'Peso colombiano (COP)'],
  ['USD', 'Dólar estadounidense (USD)'],
  ['EUR', 'Euro (EUR)'],
  ['MXN', 'Peso mexicano (MXN)'],
  ['ARS', 'Peso argentino (ARS)'],
  ['CLP', 'Peso chileno (CLP)'],
  ['PEN', 'Sol peruano (PEN)'],
  ['BRL', 'Real brasileño (BRL)'],
  ['GBP', 'Libra esterlina (GBP)'],
  ['CAD', 'Dólar canadiense (CAD)'],
];
const ESTADOS = opciones(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']);
const ROLES = [['USUARIO', 'Usuario'], ['ADMIN', 'Administrador']];
const COLUMNAS = [{ t: 'Nombre' }, { t: 'Correo' }, { t: 'País' }, { t: 'Rol' }, { t: 'Estado' }, { t: 'Acciones', className: 'text-end' }];

const formVacio = () => ({ id: '', nombre: '', correo: '', password: '', moneda: 'COP', pais: '', estado: 'ACTIVO', rol: 'USUARIO' });

// Esta página es solo para administradores (el servidor también lo exige)
export default function UsuariosPage() {
  const { mensaje, intentar } = useAviso();
  const confirmar = useConfirmar();
  const formRef = useRef(null);

  const [usuarios, setUsuarios] = useState([]);
  const [abierta, setAbierta] = useState(false);
  const [form, setForm] = useState(formVacio);
  const poner = (campos) => setForm((f) => ({ ...f, ...campos }));

  const cargar = async () => setUsuarios(await api('/usuarios'));

  useEffect(() => {
    intentar(cargar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editar = (id) => {
    const u = usuarios.find((x) => x.idUsuario === id);
    setForm({
      id: u.idUsuario,
      nombre: u.nombre,
      correo: u.correo,
      password: '',
      moneda: u.monedaPreferida || 'COP',
      pais: u.pais || '',
      estado: u.estado,
      rol: u.rol || 'USUARIO',
    });
    setAbierta(true);
  };

  const guardar = () => {
    intentar(async () => {
      // Los usuarios nuevos se crean desde la pantalla de registro (login)
      if (!form.id) {
        mensaje('Para crear un usuario nuevo usa el registro en la pantalla de inicio de sesión. Aquí puedes editar con el botón Editar.', 'warning');
        return;
      }
      // Estructura de ActualizarUsuarioDTO (el correo no se cambia)
      const datos = {
        nombre: form.nombre,
        monedaPreferida: form.moneda,
        pais: form.pais,
        estado: form.estado,
        rol: form.rol,
        password: form.password, // vacía = se conserva la actual
      };
      await api(`/usuarios/${form.id}`, 'PUT', datos);
      mensaje('Usuario actualizado');
      setAbierta(false);
      await cargar();
    });
  };

  const eliminar = async (id) => {
    if (!(await confirmar('¿Eliminar este usuario y todos sus datos?'))) return;
    intentar(async () => {
      await api(`/usuarios/${id}`, 'DELETE');
      if (id === usuarioActual()) { cerrarSesion(); return; } // si borras tu propia cuenta, se cierra la sesión
      mensaje('Usuario eliminado');
      await cargar();
    });
  };

  return (
    <main className="container py-4">
      <PageHead titulo="Usuarios" sub="Cuentas registradas en FinanPlus." />

      <Hoja abierta={abierta} titulo={form.id ? 'Editar usuario' : 'Nuevo usuario'} onCerrar={() => setAbierta(false)} formRef={formRef}>
        <FormularioHoja formRef={formRef} onSubmit={guardar}>
          <div className="grupo-ios">
            <Campo col="col-md-4" etiqueta="Nombre">
              <Entrada requerido value={form.nombre} onChange={(e) => poner({ nombre: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" etiqueta="Correo">
              <Entrada type="email" requerido disabled={Boolean(form.id)} value={form.correo} onChange={(e) => poner({ correo: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" etiqueta={<>Contraseña <small className="text-muted">(vacía = no cambiar)</small></>}>
              <Entrada type="password" autoComplete="new-password" value={form.password} onChange={(e) => poner({ password: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" etiqueta="Moneda">
              <select className="form-select" value={form.moneda} onChange={(e) => poner({ moneda: e.target.value })}>
                {MONEDAS.map(([codigo, texto]) => <option key={codigo} value={codigo}>{texto}</option>)}
              </select>
            </Campo>
            <Campo col="col-md-4" etiqueta="País">
              <Entrada value={form.pais} onChange={(e) => poner({ pais: e.target.value })} />
            </Campo>
            <Campo col="col-md-4" tipo="seg" etiqueta="Estado">
              <Segmentado opciones={ESTADOS} valor={form.estado} onChange={(estado) => poner({ estado })} />
            </Campo>
            <Campo col="col-md-4" tipo="seg" etiqueta="Rol">
              <Segmentado opciones={ROLES} valor={form.rol} onChange={(rol) => poner({ rol })} />
            </Campo>
          </div>
        </FormularioHoja>
      </Hoja>

      <TarjetaTabla columnas={COLUMNAS}>
        {usuarios.map((u) => (
          <tr key={u.idUsuario}>
            <td data-label="Nombre">{u.nombre} {u.idUsuario === usuarioActual() && <span className="chip chip-ahorro ms-1">Tú</span>}</td>
            <td data-label="Correo">{u.correo}</td>
            <td data-label="País">{u.pais}</td>
            <td data-label="Rol">{u.rol === 'ADMIN' ? <ChipTexto texto="Admin" clase="ahorro" /> : <ChipTexto texto="Usuario" />}</td>
            <td data-label="Estado"><ChipTexto texto={humano(u.estado)} clase={{ ACTIVO: 'ingreso', SUSPENDIDO: 'gasto' }[u.estado] || 'otro'} /></td>
            <td data-label="Acciones" className="text-end">
              <button className="btn btn-sm btn-outline-primary" onClick={() => editar(u.idUsuario)}>Editar</button>{' '}
              <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(u.idUsuario)}>Eliminar</button>
            </td>
          </tr>
        ))}
        {!usuarios.length && <FilaVacia columnas={6} texto="No hay usuarios" />}
      </TarjetaTabla>
    </main>
  );
}
