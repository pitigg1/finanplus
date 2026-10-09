# FinanPlus
**App web de finanzas personales** para entender en qué se va tu dinero, ponerte límites, ahorrar con metas y tomar mejores decisiones.

Proyecto de la asignatura **Entornos de Programación (Grupo F1)** — Universidad Industrial de Santander (UIS), Facultad de Ingenierías Fisicomecánicas.

**Docente:** Carlos Adolfo Beltrán Castro

**Equipo:**

- Aura Mayerly Vargas Flórez - 2235608 
- Javier Alberto Alean González - 2235610 
- José David Erazo - 2230076 

> **Estado: primera versión.** Incluye el backend (API REST con seguridad JWT y base de datos MySQL) y un frontend sencillo en HTML/JavaScript pensado para **probar los CRUD** del backend. Las funciones avanzadas (IA, alertas automáticas, reportes) están planeadas pero aún no implementadas.


## Tabla de contenido

1. [¿Qué es FinanPlus?](#qué-es-finanplus)
2. [Funcionalidades](#funcionalidades)
3. [Tecnologías](#tecnologías)
4. [Arquitectura y estructura del proyecto](#arquitectura-y-estructura-del-proyecto)
5. [Puesta en marcha](#puesta-en-marcha)
6. [Uso rápido](#uso-rápido)
7. [Autenticación y seguridad](#autenticación-y-seguridad)
8. [Referencia de la API](#referencia-de-la-api)
9. [Modelo de datos](#modelo-de-datos)
10. [Reglas de negocio implementadas](#reglas-de-negocio-implementadas)
11. [Frontend](#frontend)
12. [Estado del proyecto](#estado-del-proyecto)
13. [Documentación adicional](#documentación-adicional)

## ¿Qué es FinanPlus?

### El problema
Mucha gente no sabe en qué se le va el sueldo, no ahorra porque nunca calcula cuánto podría apartar y no invierte por falta de conocimiento financiero. Pasa tanto con estudiantes como con personas que ya trabajan, y casi nunca es por falta de interés, sino porque no tienen una herramienta sencilla que les muestre con claridad en qué gastan y qué podrían cambiar.

### La solución
FinanPlus permite a cualquier persona, sin conocimientos financieros, registrar sus ingresos y gastos, clasificarlos, fijarse presupuestos mensuales, crear metas de ahorro, llevar sus inversiones y ver indicadores de su salud financiera. A futuro incorporará sugerencias con IA y alertas automáticas.

## Funcionalidades

Lo que ya funciona en esta versión:

| Módulo | Qué permite |
|---|---|
| **Cuenta de usuario** | Registro, inicio de sesión (JWT), consulta/edición/eliminación de usuarios, perfil del usuario autenticado |
| **Registros financieros** | CRUD de ingresos, gastos, ahorros e inversiones con monto, fecha, descripción, categoría y etiquetas |
| **Categorías** | CRUD de categorías por tipo (`INGRESO`, `GASTO`, `AHORRO`, `INVERSION`) con icono y color |
| **Etiquetas** | CRUD de etiquetas para agrupar movimientos de distintas categorías (relación muchos a muchos) |
| **Presupuestos** | Límite de gasto por categoría, mes y año; el gasto actual se calcula automáticamente |
| **Metas de ahorro** | CRUD de metas con monto objetivo, fecha límite, prioridad y estado |
| **Aportes a metas** | Aportes que suman al avance de la meta y la marcan como completada al alcanzar el objetivo |
| **Movimientos recurrentes** | CRUD de pagos e ingresos fijos (diario, semanal, mensual, anual) |
| **Inversiones** | CRUD de inversiones (CDT, acciones, ETF, fondos, cripto, bonos) con valor actual, rentabilidad y riesgo |
| **Métricas financieras** | Cálculo del mes actual: ingresos, gastos, flujo neto, tasa de ahorro, score (0–100) y nivel de riesgo |
| **Notificaciones** | CRUD de alertas (gasto elevado, presupuesto excedido, meta próxima a vencer, meta cumplida) con marca de leída |
| **Recomendaciones IA** | CRUD para almacenar recomendaciones (la generación automática con IA aún no está implementada) |

## Tecnologías

**Backend**
- Java 17
- Spring Boot 4.1.1 
- MySQL 8 
- JWT con jjwt 0.11.5 
- Contraseñas con BCrypt
- Lombok
- SpringDoc OpenAPI / Swagger UI (3.1.1)
- Maven (se incluye Maven Wrapper: `mvnw` / `mvnw.cmd`)

**Frontend**
- HTML + JavaScript (vanilla, `fetch`) + Bootstrap
- El token JWT se guarda en `localStorage`

## Arquitectura y estructura del proyecto

El backend sigue una arquitectura en capas clásica:

```
Frontend (HTML/JS)  ──HTTP/JSON + JWT──▶  Controller ──▶ Service ──▶ Repository ──▶ MySQL
                                           (REST)       (negocio)    (Spring Data JPA)
```

```
finanplus/
├── pom.xml                      # Dependencias y configuración de Maven
├── mvnw / mvnw.cmd              # Maven Wrapper (no necesitas instalar Maven)
├── database/
│   ├── finanplus.sql            # Script SQL con las 13 tablas
│   └── diagrama_er.png          # Diagrama entidad-relación
├── docs/
│   └── Entrega1_proyectoEntornos.docx   # Informe inicial (problema, requisitos, historias de usuario)
├── frontend/                    # Frontend de prueba (HTML + JS)
│   ├── login.html, index.html, registros.html, categorias.html, ...
│   └── js/                      # Un script por página + comun.js (API, token, sesión)
└── src/main/
    ├── java/uis/entornos/finanplus/
    │   ├── FinanPlusApplication.java   # Clase principal
    │   ├── config/        # SecurityConfig: rutas públicas, CORS, JWT, BCrypt
    │   ├── security/      # JwtService, JwtAuthenticationFilter, UserDetailsServiceImpl
    │   ├── controller/    # Endpoints REST (/api/...)
    │   ├── service/       # Interfaces (I*Service) y su lógica de negocio
    │   ├── repository/    # Interfaces Spring Data JPA
    │   ├── model/         # Entidades JPA (una por tabla)
    │   ├── dto/           # Objetos de petición/respuesta
    │   ├── enums/         # TipoMovimiento, Frecuencia, EstadoMeta, NivelRiesgo, ...
    │   └── exception/     # ManejadorErrores: respuestas de error en JSON
    └── resources/application.properties   # Configuración
```

## Puesta en marcha

### Requisitos previos

| Herramienta | Versión | Para qué |
|---|---|---|
| JDK | 17 o superior | Compilar y ejecutar el backend |
| MySQL Server | 8.x | Base de datos |
| Git | cualquiera | Clonar el repositorio |
| VS Code + extensión *Live Server* (o cualquier servidor estático) | — | Servir el frontend |

No necesitas instalar Maven: el proyecto incluye `mvnw`.

### 1. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd finanplus
```

### 2. Crear la base de datos

Opción A: ejecutar el script, que crea la base `finanplus` y las 13 tablas.

```bash
mysql -u root -p < database/finanplus.sql
```

Opción B: solo crear una base vacía; el backend crea/actualiza las tablas solo al arrancar (`spring.jpa.hibernate.ddl-auto=update`).

```sql
CREATE DATABASE IF NOT EXISTS finanplus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> Si usas la opción A y luego arrancas el backend, no hay conflicto: Hibernate solo ajusta lo que falte.

### 3. Configurar las credenciales de MySQL

Edita `src/main/resources/application.properties` y pon tu usuario y contraseña de MySQL.

### 4. Arrancar el backend

```bash
# Linux / macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

El backend queda en **http://localhost:8094**. 

Para generar un `.jar`:

```bash
./mvnw clean package
java -jar target/FinanPlus-0.0.1-SNAPSHOT.jar
```

Para correr las pruebas: `./mvnw test`

### 5. Abrir el frontend

El backend no sirve la carpeta `frontend/`; hay que servirla aparte:

1. Abre la carpeta del proyecto en VS Code.
2. Clic derecho sobre `frontend/login.html` → **Open with Live Server**.
3. Se abre en `http://127.0.0.1:5500/frontend/login.html`.

> **Importante:** el backend solo acepta peticiones desde los orígenes `http://127.0.0.1:5500`, `http://localhost:5500` y `http://localhost:8094` (CORS, en `SecurityConfig`). Si sirves el frontend en otro puerto, agrégalo allí. Además, el frontend apunta a `http://localhost:8094/api` (constante `API` en `frontend/js/comun.js`).

## Uso rápido

1. Abre `login.html` y **crea una cuenta** (nombre, correo, contraseña de mínimo 6 caracteres).
2. Serás redirigido al **Inicio**, que muestra accesos a cada módulo.
3. Orden sugerido para probar:
   1. **Categorías** → crea al menos una de ingreso y una de gasto (las categorías son compartidas, no por usuario).
   2. **Registros** → anota un ingreso y un gasto.
   3. **Presupuestos** → fija un límite para una categoría de gasto y mira cómo se calcula lo gastado.
   4. **Metas de ahorro** → crea una meta y registra aportes.
   5. **Métricas** → pide el cálculo del mes actual.
   6. Explora Inversiones, Recurrentes, Etiquetas, Notificaciones y Recomendaciones.

## Autenticación y seguridad

- Registro / login (`/api/auth/**`) son públicos y devuelven `{ "token": "...", "usuario": { ... } }`.
- El resto de la API requiere el encabezado `Authorization: Bearer <token>`.
- El token es un JWT (HS256) con el correo como *subject* y vigencia de 24 horas. La sesión es *stateless* (no hay sesión en el servidor).
- Las contraseñas se guardan con BCrypt (campo `password_hash`).
- Solo pueden iniciar sesión usuarios con estado `ACTIVO`; `INACTIVO` y `SUSPENDIDO` reciben un error.
- En registros, presupuestos y metas, las operaciones de crear/listar/editar/eliminar se hacen sobre el usuario del token, no sobre un id enviado por el cliente.
- Si el frontend recibe `401`/`403`, cierra la sesión y redirige a `login.html`.

## Modelo de datos

Base de datos MySQL `finanplus` con 13 tablas; todo gira alrededor del usuario. El diagrama está en [`database/diagrama_er.png`](database/diagrama_er.png) y el script en [`database/finanplus.sql`](database/finanplus.sql).

| Tabla | Descripción |
|---|---|
| `Usuarios` | Datos de la cuenta, moneda preferida (por defecto `COP`), país, estado (`ACTIVO`/`INACTIVO`/`SUSPENDIDO`) |
| `Categorias` | Clasificación de movimientos por tipo, con icono y color |
| `Registros_Financieros` | Ingresos, gastos, ahorros e inversiones del usuario |
| `Etiquetas` y `Registro_Etiqueta` | Etiquetas y su relación muchos a muchos con los registros |
| `Metas_Ahorro` | Metas con monto objetivo/actual, fecha, prioridad y estado (`ACTIVA`/`COMPLETADA`/`CANCELADA`) |
| `Aportes_Meta` | Une cada meta con el registro del dinero ahorrado |
| `Presupuestos` | Límite de gasto por usuario, categoría, mes y año (único por combinación) |
| `Inversiones` | Activos (`ACCION`, `ETF`, `CRIPTO`, `FONDO`, `CDT`, `BONO`, `OTRO`), valor actual, rentabilidad y riesgo |
| `Movimientos_Recurrentes` | Pagos/ingresos fijos con frecuencia y próxima fecha |
| `Metricas_Financieras` | Foto mensual de ingresos, gastos, flujo, tasa de ahorro, score y riesgo |
| `Notificaciones` | Alertas al usuario con prioridad y estado de lectura |
| `Recomendaciones_IA` | Recomendaciones con modelo usado, nivel de confianza y si fue aplicada |

Relaciones principales: un usuario tiene muchos registros, metas, presupuestos, inversiones, métricas, recomendaciones y notificaciones; las categorías clasifican registros, presupuestos y recurrentes. Al borrar un usuario se borran en cascada sus datos; una categoría no se puede borrar si está en uso.

## Reglas de negocio implementadas

- **Presupuesto:** `gastoActual` no se guarda a mano; se calcula en cada consulta sumando los registros de tipo `GASTO` del usuario en esa categoría, mes y año. Así siempre coincide con los registros aunque se editen o eliminen.
- **Metas y aportes:** crear un aporte suma al `montoActual` de la meta; editarlo ajusta solo la diferencia; borrarlo lo resta (nunca baja de 0). Si `montoActual ≥ montoObjetivo` la meta pasa a `COMPLETADA`, y si deja de cumplirse vuelve a `ACTIVA` (las `CANCELADA` no cambian). Solo se puede aportar a metas `ACTIVA`.
- **Métricas del mes actual**: hay una sola métrica por mes (si existe, se actualiza).
  - `flujoNeto = ingresos − gastos`
  - `tasaAhorro = (ingresos − gastos) / ingresos × 100`
  - `score = tasaAhorro + 50`, limitado a 0–100
  - `nivelRiesgo`: `BAJO` si la tasa ≥ 20 %, `MEDIO` si está entre 0 % y 20 %, `ALTO` si es negativa. Con gastos y sin ingresos: score 0 y riesgo `ALTO`.
- **Registros:** solo el dueño puede editar o eliminar un registro; el monto no puede ser negativo.
- **Notificaciones:** al marcar `leida`, se guarda `fechaLectura` automáticamente.
- **Registro de usuario:** nombre y correo obligatorios, formato de correo válido, contraseña de mínimo 6 caracteres.

## Frontend

Frontend sencillo (Bootstrap + JavaScript) cuyo propósito es probar los CRUD del backend. Todas las páginas (salvo `login.html`) exigen sesión iniciada.

| Página | Módulo |
|---|---|
| `login.html` | Inicio de sesión y registro |
| `index.html` | Inicio con accesos a los módulos |
| `registros.html` | Ingresos y gastos |
| `presupuestos.html` | Presupuestos |
| `metas.html` | Metas de ahorro y aportes |
| `recurrentes.html` | Movimientos recurrentes |
| `categorias.html` / `etiquetas.html` | Organización de movimientos |
| `inversiones.html` | Inversiones |
| `metricas.html` | Métricas financieras |
| `notificaciones.html` | Notificaciones |
| `recomendaciones.html` | Recomendaciones IA |
| `usuarios.html` | Usuarios |

Código compartido en `frontend/js/comun.js`: URL de la API, manejo del token, función `api()` que adjunta el JWT y redirige a login si la sesión expira.

## Estado del proyecto

**Hecho:** modelo de datos, API REST de los 13 módulos, autenticación JWT, manejo centralizado de errores, documentación Swagger y frontend de prueba.

**Pendiente / futuras mejoras** :

- **Recomendaciones con IA:** analizar gastos y sugerir dónde recortar y cuánto ahorrar.
- **Notificaciones automáticas:** avisar al pasar un presupuesto o al acercarse la fecha de una meta.
- **Reportes y comparación de periodos:** gráficas por mes y comparación entre periodos.
- **Pronóstico de inversiones:** proyectar ganancias según plazo, tasa y riesgo.
- **Recurrentes automáticos:** que los pagos fijos se registren solos en su fecha.
- **Cuentas y seguridad:** recuperación de contraseña, roles de administrador y garantizar que cada usuario vea solo sus datos.

## Documentación adicional

- [`docs/Entrega1_proyectoEntornos.docx`](docs/Entrega1_proyectoEntornos.docx): informe inicial con el mundo del problema, justificación, requisitos funcionales y no funcionales, y 17 historias de usuario en 9 épicas (acceso, ingresos/gastos, clasificación, metas, inversiones, visualización, IA, alertas y perfil). *En ese informe el proyecto aparece con el nombre provisional "FinSmart"; el nombre final es **FinanPlus**.*
- [`database/diagrama_er.png`](database/diagrama_er.png): diagrama entidad-relación.


