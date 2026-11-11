# Errores detectados en FinanPlus

Revisión del código del proyecto. Se separan los que **ya se corrigieron** en esta entrega de los que **siguen pendientes**.
Los pendientes están ordenados por importancia.

## Corregidos en esta entrega

1. **El tipo del registro no dependía de la categoría.** `RegistroFinancieroService` aceptaba cualquier `tipoMovimiento`
   (se podía guardar una INVERSION en la categoría «Comida», que es GASTO). Además, un tipo inválido se convertía en
   GASTO sin avisar. Ahora el tipo es el de la categoría, y si el cliente envía otro se rechaza con un 400 claro.
2. **Movimientos recurrentes con el mismo problema.** La pantalla ni siquiera llenaba el tipo al elegir la categoría y
   permitía cambiarlo a mano; como la tarea automática copia ese tipo a los registros que crea, el error se propagaba.
3. **Se podía cambiar el tipo de una categoría con datos ya guardados**, dejando registros incoherentes
   (y presupuestos/métricas/alertas mal calculados). Ahora se bloquea si la categoría tiene registros o recurrentes.
   Además, un tipo de categoría inválido devolvía el mensaje técnico `No enum constant ...`.
4. **El pronóstico ignoraba la rentabilidad de cada inversión** y usaba una tabla fija por tipo de activo
   (CDT 9 %, acción 12 %...). Ahora cada inversión usa la suya y, si no tiene, una tasa por defecto (8 %).
5. **La rentabilidad de una inversión no tenía rango válido** (se podía guardar 5000 %). Ahora se valida (-99 % a 1000 %).
6. **Presupuestos sobre categorías que no son de gasto**: ahora solo se aceptan categorías de tipo GASTO, al crear y al editar.
7. **Aportes a metas sin controles**: ahora el registro debe ser de tipo AHORRO, no puede reutilizarse en otro aporte y su monto
   debe ser igual al del aporte (al editar el aporte, el registro conserva el mismo valor); y no se pueden editar aportes de una meta cancelada.
8. **Finales de línea mezclados**: `.gitattributes` normaliza todo a LF (excepto `*.cmd`), se agregó `.editorconfig` y se convirtieron a LF
   los 4 archivos que estaban en CRLF (`pom.xml`, `.gitignore`, `.project`, `HELP.md`).
9. **Sin pantalla de pronóstico**: «Inversiones» ahora tiene un panel de pronóstico (portafolio o una inversión, plazo y aporte mensual).
10. **Sin prueba de integración de las reglas**: se agregó `ReglasNegocioTest` (tipo = categoría, presupuestos, aportes, pronóstico).

## Pendientes

### Datos y validaciones
1. **Inversiones usa la entidad JPA como cuerpo de la petición** y le faltan validaciones: `nombreActivo` sin `@NotBlank`,
   `tipoActivo`, `fechaInversion`, `montoInvertido` y `valorActual` sin `@NotNull`. Si faltan, el error lo da la base de
   datos (409/500) en vez de un 400 con mensaje.
2. **Correo duplicado al registrarse**: `AuthService.registrar` no usa `existsByCorreo` (existe en el repositorio y
   nunca se llama). El error cae en el manejador de integridad y el usuario ve «hay otros datos que dependen de este»,
   que no tiene nada que ver. Pasa igual con presupuestos duplicados y etiquetas duplicadas.
3. **Presupuestos**: `anio` no tiene rango; la columna `gastoActual` se guarda en 0 y nunca se usa
   (se calcula al vuelo).
4. **Categorías**: no hay unicidad de nombre por usuario (se pueden crear dos «Comida»). El DTO trae `descripcion`, que se ignora.
5. **Recurrentes mensuales**: un día 31 pasa a 30/28 en los meses cortos y ya no vuelve al 31 (el propio código lo admite
   en un comentario). Conviene guardar el día original.
6. **Métricas**: `MetricaFinancieraService.calcular` usa `LocalDateTime.now()` (zona del servidor) mientras el resto de la
   app usa America/Bogotá; además carga todos los registros del usuario y filtra el mes en memoria.
7. **Rentabilidad vs. valores**: `rentabilidad`, `montoInvertido` y `valorActual` son independientes; se puede guardar una
   rentabilidad que no corresponde con el valor actual. El pronóstico interpreta la rentabilidad como **% efectivo anual**:
   si alguien la guardó como rentabilidad acumulada, el pronóstico la tomará como anual.

### Seguridad y manejo de errores
8. **Registros y presupuestos ajenos responden 400 «No tiene permisos»** (`RegistroFinancieroService.eliminar/actualizar`,
   `PresupuestoService.actualizar/eliminar`) en vez de 404. Revela que ese ID existe y contradice la regla del resto de la
   app (`SeguridadService`: «no encontrado»). Conviene usar `seguridad.exigirDueno(...)`.
9. **`ManejadorErrores` decide el 404 buscando el texto «no encontrad»** dentro del mensaje: es frágil (cambiar una
    frase cambia el código HTTP). Mejor excepciones propias (`NoEncontradoException`, `ReglaDeNegocioException`).
10. **JWT en `localStorage`** (expuesto a XSS), duración fija de 24 h sin renovación, y uso de la API antigua de jjwt 0.11.5.
11. **CORS con orígenes fijos en el código** (localhost) y **Swagger/OpenAPI públicos**: hay que parametrizarlos por perfil
    antes de desplegar.
12. `SecurityConfig.escribirError` arma el JSON concatenando texto sin escapar.

### Proyecto y mantenimiento
13. **El zip trae `application-local.properties` con la contraseña de MySQL.** Está en `.gitignore`, pero viaja si se
    comparte la carpeta. No lo subas ni lo compartas.
14. **Código muerto en el frontend**: `frontend/js/` y `frontend/css/` (versión vanilla anterior a React),
    `frontend/src/api.js` y `frontend/src/utils.js` (nadie los importa; `api.js` tiene la URL fija `localhost:8094`)
    y `frontend/finanplus-frontend-react.zip` (copia comprimida versionada en git).
15. Carpetas generadas dentro del proyecto (`bin/` de Eclipse, `target/`, `frontend/node_modules`) que no deben ir al repositorio
    ni al zip de entrega.
