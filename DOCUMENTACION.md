# Documentación del Sistema — Reservas Pádel (Lood)

Sistema de reservas en línea para canchas de pádel. Construido con Next.js 14 App Router + Airtable como base de datos. Desplegado en Vercel.

---

## Índice

1. [Stack tecnológico](#1-stack-tecnológico)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Base de datos — Airtable](#4-base-de-datos--airtable)
5. [Página pública](#5-página-pública)
6. [Flujo de reserva (ReservaWizard)](#6-flujo-de-reserva-reservawizard)
7. [API Routes](#7-api-routes)
8. [Panel de administración](#8-panel-de-administración)
9. [Lógica de slots y disponibilidad](#9-lógica-de-slots-y-disponibilidad)
10. [Autenticación de administrador](#10-autenticación-de-administrador)

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS |
| Animaciones | Framer Motion |
| Iconos | Lucide React |
| Notificaciones | react-hot-toast |
| Fechas | date-fns (con locale español) |
| Base de datos | Airtable (SDK oficial) |
| Imágenes | Cloudinary (solo lectura, URL directa) |
| Hosting | Vercel |

---

## 2. Variables de entorno

Todas se definen en `.env.local`:

```
AIRTABLE_API_KEY          # Token personal de Airtable
AIRTABLE_BASE_ID          # ID de la base (empieza con "app")
AIRTABLE_TABLE_CANCHAS    # Nombre exacto de la tabla de canchas
AIRTABLE_TABLE_RESERVAS   # Nombre exacto de la tabla de reservas
AIRTABLE_TABLE_BLOQUEOS   # Nombre exacto de la tabla de bloqueos
AIRTABLE_TABLE_CONFIG     # Nombre exacto de la tabla de configuración
ADMIN_PASSWORD            # Contraseña del panel admin (cookie directa, sin JWT)
```

---

## 3. Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                     # Landing pública (Server Component)
│   ├── layout.tsx                   # Layout raíz
│   ├── globals.css
│   ├── admin/
│   │   ├── layout.tsx               # Layout del panel admin (sidebar + header)
│   │   ├── page.tsx                 # Dashboard con KPIs
│   │   ├── reservas/page.tsx        # Gestión de reservas
│   │   ├── canchas/page.tsx         # Gestión de canchas
│   │   ├── bloqueos/page.tsx        # Gestión de bloqueos
│   │   ├── configuracion/page.tsx   # Configuración del negocio
│   │   └── login/page.tsx           # Login admin
│   └── api/
│       ├── canchas/route.ts         # GET, POST
│       ├── canchas/[id]/route.ts    # PATCH, DELETE
│       ├── reservas/route.ts        # GET, POST
│       ├── reservas/[id]/route.ts   # PATCH, DELETE
│       ├── bloqueos/route.ts        # GET, POST
│       ├── bloqueos/[id]/route.ts   # DELETE
│       ├── disponibilidad/route.ts  # GET — calcula slots disponibles
│       ├── config/route.ts          # GET, PATCH
│       └── admin/
│           ├── auth/route.ts        # POST — login admin
│           └── logout/route.ts      # POST — logout admin
├── components/
│   ├── admin/                       # Componentes del panel admin
│   └── *.tsx                        # Componentes de la landing
├── lib/
│   ├── airtable.ts                  # Todas las operaciones CRUD de Airtable
│   └── slots.ts                     # Generación de slots horarios
├── types/index.ts                   # Interfaces TypeScript globales
└── middleware.ts                    # Protección de rutas /admin/*
```

---

## 4. Base de datos — Airtable

### Tabla: Canchas

| Campo | Tipo | Descripción |
|---|---|---|
| Nombre | Text | Nombre de la cancha |
| Descripcion | Text | Texto descriptivo |
| Foto_URL | URL | URL de imagen en Cloudinary |
| Activa | Checkbox | Si está disponible para reservar |
| Precio | Number | Precio por sesión (0 = "Consultar") |
| Color | Text | Color hex para destacar la cancha (default: `#1e3a5f`) |

### Tabla: Reservas

| Campo | Tipo | Descripción |
|---|---|---|
| ID_Reserva | Text | Identificador legible: `RES-{timestamp}` |
| Cancha | Linked Record | Referencia a tabla Canchas (array) |
| Fecha | Date | ISO: `YYYY-MM-DD` |
| Hora_Inicio | Text | Formato `HH:mm` |
| Hora_Fin | Text | Formato `HH:mm` |
| Nombre_Cliente | Text | |
| Telefono | Phone | |
| Email | Email | |
| Estado | Select | `Confirmada` / `Cancelada` / `Pendiente` / `Completada` / `No show` |
| Notas | Long text | Opcional |

> `Cancha` se almacena y devuelve como `string[]`; siempre acceder como `cancha[0]`.

### Tabla: Bloqueos

| Campo | Tipo | Descripción |
|---|---|---|
| Motivo | Text | Razón del bloqueo |
| Cancha | Linked Record | Referencia a tabla Canchas (array) |
| Fecha_Inicio | DateTime | Puede ser ISO completo o solo fecha |
| Fecha_Fin | DateTime | Puede ser ISO completo o solo fecha |

### Tabla: Config

Registro único (solo se usa la primera fila). Campos directos (no clave-valor):

| Campo | Tipo | Descripción |
|---|---|---|
| negocio_nombre | Text | Nombre del club |
| horario_apertura | Text | Ej: `"07:00 a.m."` o `"07:00"` |
| horario_cierre | Text | Ej: `"11:00 p.m."` o `"23:00"` |
| dias_operacion | Text | Días separados por coma: `"Lunes, Martes, ..."` |
| direccion | Text | Dirección física |
| telefono | Text | Teléfono de contacto |
| instagram | Text | Handle de Instagram |

---

## 5. Página pública

Ruta: `/` — Server Component con `export const dynamic = 'force-dynamic'`.

Carga en paralelo `getConfig()` y `getCanchas()` desde Airtable. Si falla, usa valores por defecto para no romper el render.

### Secciones en orden

1. **IntroAnimation** — Animación de entrada con el nombre del negocio (Framer Motion).
2. **Navbar** — Barra fija con nombre del club y ancla al wizard de reserva.
3. **HeroSection** — Título principal, horario de apertura/cierre, número de canchas activas, CTA de reserva.
4. **CanchasSection** — Cards de cada cancha (foto, nombre, descripción, precio). El botón "Reservar" guarda el ID en `sessionStorage` como `cancha_preseleccionada` y hace scroll al wizard.
5. **ComoFuncionaSection** — Sección estática de 3 pasos explicativos.
6. **ReservaSection** — Contenedor del `ReservaWizard`.
7. **Footer** — Datos del negocio (config): nombre, dirección, teléfono, Instagram.
8. **FloatingContactButtons** — Botones flotantes de WhatsApp e Instagram.

---

## 6. Flujo de reserva (ReservaWizard)

Componente Client en `src/components/ReservaWizard.tsx`. Flujo de 3 pasos + pantalla de éxito.

### Paso 1 — Cancha, fecha y duración

- Lista todas las canchas activas desde `GET /api/canchas`.
- Si llega `cancha_preseleccionada` en `sessionStorage`, la preselecciona automáticamente.
- El usuario elige: cancha, fecha (hoy hasta +30 días), duración (1h / 1.5h / 2h / 2.5h / 3h).
- Al completar los 3 campos aparece resumen + botón "Ver horarios disponibles".

### Paso 2 — Selección de horario

- Llama a `GET /api/disponibilidad?cancha_id=&fecha=&duracion=`.
- Muestra grilla de slots. Disponibles son clicables; ocupados muestran "Ocupado" (grisados).
- Si no hay slots, muestra mensaje y opción de volver.
- Camiar la duración en este paso relanza la consulta de disponibilidad.
- Skeleton de 12 tarjetas mientras carga.

### Paso 3 — Datos del cliente

- Campos: nombre completo, teléfono, email (requeridos), notas (opcional).
- Validación inline: formato de email con regex, campos vacíos.
- Panel resumen fijo (sticky) a la derecha con: cancha, fecha, horario, duración, precio total.
- Al confirmar: `POST /api/reservas`. Si el servidor devuelve `409`, el slot ya fue tomado.

### Pantalla de éxito

- Muestra CheckCircle animado y resumen de la reserva confirmada.
- Botón "Hacer otra reserva" resetea todo el wizard al estado inicial.

---

## 7. API Routes

Todas las rutas usan `export const dynamic = 'force-dynamic'`.

### Canchas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/canchas` | Devuelve `{ canchas: Cancha[] }` — todas las canchas |
| POST | `/api/canchas` | Crea una cancha nueva |
| PATCH | `/api/canchas/[id]` | Actualiza campos parciales de una cancha |
| DELETE | `/api/canchas/[id]` | Elimina una cancha |

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reservas` | Devuelve todas las reservas (opcionalmente filtradas por `?fecha=`) |
| POST | `/api/reservas` | Crea una reserva. Verifica conflictos → devuelve `409` si hay solapamiento |
| PATCH | `/api/reservas/[id]` | Actualiza fecha, horario, notas o estado |
| DELETE | `/api/reservas/[id]` | Cambia el estado a `"Cancelada"` (soft delete) |

### Bloqueos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/bloqueos` | Devuelve todos los bloqueos |
| POST | `/api/bloqueos` | Crea un bloqueo de horario |
| DELETE | `/api/bloqueos/[id]` | Elimina un bloqueo definitivamente |

### Disponibilidad

| Método | Ruta | Parámetros |
|---|---|---|
| GET | `/api/disponibilidad` | `cancha_id`, `fecha` (YYYY-MM-DD), `duracion` (minutos: 60/90/120/150/180) |

Flujo interno:
1. Valida que el día esté en `dias_operacion` (de Config).
2. Obtiene reservas del día desde Airtable.
3. Obtiene bloqueos y filtra los que intersectan con la fecha.
4. Llama a `generarSlots()` con apertura/cierre de Config.
5. Devuelve `{ slots: SlotHorario[], fecha, cancha_id, duracion }`.

Si el día no es operativo: `{ slots: [], motivo: "dia_no_operativo" }`.

### Configuración

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/config` | Devuelve el objeto `Config` completo |
| PATCH | `/api/config` | Body `{ clave: string, valor: string }` — actualiza un campo |

### Admin Auth

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/admin/auth` | Body `{ password }` → setea cookie `admin_session` y redirige al dashboard |
| POST | `/api/admin/logout` | Borra la cookie y redirige al login |

---

## 8. Panel de administración

Ruta base: `/admin` — protegida por middleware (cookie `admin_session`).

### Login — `/admin/login`

Formulario simple de contraseña. `POST /api/admin/auth`. Si la contraseña coincide con `ADMIN_PASSWORD`, establece la cookie de sesión.

### Dashboard — `/admin`

Server Component. KPIs calculados en el servidor:

| KPI | Cálculo |
|---|---|
| Reservas hoy | Reservas con `fecha === hoy` y estado ≠ Cancelada |
| Reservas esta semana | Reservas dentro del intervalo lunes–domingo actual |
| Reservas este mes | Reservas con `fecha.startsWith(YYYY-MM)` y estado ≠ Cancelada |
| Ingresos del mes | Suma de `cancha.precio` de cada reserva del mes |
| Cancelaciones del mes | Reservas con estado `Cancelada` en el mes actual |
| Ocupación hoy | `(reservasHoy / (canchasActivas × 16)) × 100` — asume 16 slots/día |

Debajo de los KPIs: tabla de reservas de hoy con cancha, horario, cliente, teléfono y estado.

### Gestión de Reservas — `/admin/reservas`

Tabla completa con todas las reservas. Funcionalidades:

- **Filtros**: por fecha, por cancha, por estado, búsqueda de texto libre (nombre, email, teléfono).
- **Limpiar filtros** — botón que aparece cuando hay algún filtro activo.
- **Cambiar estado** inline — dropdown en cada fila: Confirmada / Pendiente / Cancelada / Completada / No show.
- **Editar reserva** — modal con fecha, hora inicio (auto-calcula hora fin +1h), hora fin, notas.
- **Cancelar reserva** — modal de confirmación → `DELETE /api/reservas/[id]` → soft delete.
- Orden: descendente por fecha, luego por hora inicio.

### Gestión de Canchas — `/admin/canchas`

CRUD completo de canchas. Permite:

- Ver todas las canchas con foto, nombre, descripción, precio y estado (activa/inactiva).
- Crear nueva cancha con todos sus campos.
- Editar cancha existente.
- Activar/desactivar cancha (toggle `activa`).

### Gestión de Bloqueos — `/admin/bloqueos`

Permite bloquear horarios de una cancha para mantenimiento u otras razones:

- Crear bloqueo: seleccionar cancha, fecha/hora inicio y fin, motivo.
- Ver bloqueos activos.
- Eliminar bloqueo (hard delete de Airtable).

### Configuración — `/admin/configuracion`

Edición del registro único de Config. Tres secciones:

1. **Información del negocio**: nombre, dirección, teléfono, Instagram.
2. **Horarios de operación**: texto libre para apertura y cierre (normalizado internamente por `slots.ts`).
3. **Días de operación**: toggles para cada día de la semana (lunes a domingo).

Al guardar, hace un `PATCH /api/config` por cada campo en paralelo (`Promise.all`).

---

## 9. Lógica de slots y disponibilidad

`src/lib/slots.ts` — `generarSlots(apertura, cierre, reservasDelDia, canchaId, bloqueosDelDia, duracionMinutos)`

### Normalización de hora (`normalizeTime`)

Convierte cualquier formato de hora a `HH:mm`:
- `"07:00 a.m."` → `"07:00"`
- `"11:00 p.m."` → `"23:00"`
- `"7am"` → `"07:00"`
- `"07:00"` → `"07:00"` (sin cambio)

### Generación de slots

1. Parsea apertura y cierre con `date-fns/parse`.
2. Itera de `apertura` a `cierre` en incrementos de `duracionMinutos`.
3. Para cada slot, verifica solapamiento con reservas (por cancha, excluyendo canceladas) usando comparación de strings `HH:mm`.
4. Verifica solapamiento con bloqueos — si `fecha_inicio` es ISO completo, extrae la parte de hora; si no, bloquea el día completo.
5. Devuelve array de `SlotHorario[]` con `{ hora_inicio, hora_fin, disponible }`.

---

## 10. Autenticación de administrador

Sin JWT ni sesiones complejas. Flujo:

1. Usuario ingresa contraseña en `/admin/login`.
2. `POST /api/admin/auth` compara con `process.env.ADMIN_PASSWORD`.
3. Si coincide: setea cookie `admin_session` con el valor de la contraseña y redirige a `/admin`.
4. `src/middleware.ts` intercepta todas las rutas `/admin/*` (excepto `/admin/login`).
5. Valida que `request.cookies.get('admin_session').value === ADMIN_PASSWORD`.
6. Si no coincide o no existe: redirect a `/admin/login`.
7. Logout: `POST /api/admin/logout` → borra la cookie → redirect a `/admin/login`.
