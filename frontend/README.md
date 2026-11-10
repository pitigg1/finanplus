# FinanPlus – Frontend (React + Vite)

Port completo del frontend vanilla (HTML/CSS/JS) a React.

## Arrancar
```bash
npm install
npm run dev        # http://localhost:3000
```
El backend se espera en `http://localhost:8094/api`. Para cambiarlo, crea un archivo `.env` con
`VITE_API_URL=https://mi-servidor/api`.

## Estructura
- `src/styles/` – los 4 CSS originales (apple, vistas, ios, inicio), sin cambios.
- `src/lib/` – `api.js` (fetch + JWT), `sesion.js` (localStorage), `formato.js` (dinero, fechas), `tema.js` (claro/oscuro).
- `src/context/` – `Aviso` (alertas flotantes: `mensaje`, `intentar`) y `Confirmar` (alerta de confirmación estilo iOS).
- `src/components/` – `Layout` (menú lateral, barra superior y pestañas), `Modal`, `Hoja` (formulario tipo hoja iOS),
  `Campos` (filas, segmentados, selector de categorías, de tipo de inversión, de meses, monto grande), `Chips`, `Piezas`.
- `src/pages/` – una página por cada `.html` original:
  login, recuperar, restablecer, inicio, registros, presupuestos, recurrentes, metas (con aportes),
  inversiones, categorías, etiquetas, métricas, recomendaciones, notificaciones, perfil y usuarios (solo ADMIN).

## Rutas
`/login`, `/recuperar`, `/restablecer?token=…`, `/`, `/registros`, `/presupuestos`, `/recurrentes`, `/metas`,
`/inversiones`, `/categorias`, `/etiquetas`, `/metricas`, `/recomendaciones`, `/notificaciones`, `/perfil`, `/usuarios`.
Los enlaces viejos terminados en `.html` (por ejemplo `restablecer.html?token=…` en los correos) redirigen solos.
