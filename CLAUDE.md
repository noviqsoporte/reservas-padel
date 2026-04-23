# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (warnings only — ignoreDuringBuilds: true)
```

No test suite configured.

## Stack tecnológico

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL) — reemplazó Airtable completamente
- **Auth clientes**: Supabase Auth con Google OAuth + Magic Link (OTP por email)
- **Auth admin**: cookie `admin_session` con `ADMIN_PASSWORD` (sin JWT)
- **Pagos**: Stripe Checkout (modo `payment`, moneda MXN)
- **Email**: Resend — confirmaciones HTML desde `reservas@evntexperiences.com`
- **Imágenes**: Cloudinary (upload desde admin, URLs en `foto_url`)
- **Animaciones**: framer-motion
- **Iconos**: lucide-react

## Variables de entorno

Todas en `.env.local`:

```
# Admin
ADMIN_PASSWORD                     # Contraseña plana para el panel admin

# URLs
NEXT_PUBLIC_URL                    # URL base del sitio (ej: https://lood.mx) — usada en Stripe success/cancel URL

# Cloudinary (subida de fotos de canchas)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
CLOUDINARY_API_KEY

# Supabase
NEXT_PUBLIC_SUPABASE_URL           # URL pública del proyecto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY      # Clave anon (segura para el cliente)
SUPABASE_SERVICE_ROLE_KEY          # Clave service role (solo servidor) — bypasea RLS

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Clave pública de Stripe (no usada directamente en UI aún)
STRIPE_SECRET_KEY                  # Clave secreta de Stripe — solo en API routes
STRIPE_WEBHOOK_SECRET              # Secret del webhook de Stripe (whsec_...)

# Resend
RESEND_API_KEY                     # Clave de la API de Resend para envío de emails
```

## Arquitectura de base de datos (Supabase)

### `canchas`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| nombre | text | |
| descripcion | text | |
| foto_url | text | URL de Cloudinary |
| activa | boolean | Solo activas se muestran en el wizard |
| precio | numeric | Precio normal por hora (MXN) |
| precio_pico | numeric nullable | Precio en hora pico; null = sin diferenciación |
| color | text | Hex color para UI del admin |

### `reservas`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| id_reserva | text | Legible: `RES-{timestamp}` |
| cancha_id | uuid FK → canchas | |
| fecha | date | ISO: `"2025-03-15"` |
| hora_inicio | time | `"09:00"` |
| hora_fin | time | `"10:00"` |
| nombre_cliente | text | |
| telefono | text | |
| email | text | |
| estado | text | `Confirmada \| Cancelada \| Pendiente \| Completada \| No show` |
| notas | text | |
| profile_id | uuid nullable FK → auth.users | Enlaza con cliente logueado |
| metodo_pago | text | `efectivo \| online` |
| pago_estado | text | `pendiente \| pagado \| fallido` |
| stripe_session_id | text nullable | ID de la sesión de Stripe Checkout |
| monto_pagado | numeric nullable | Monto efectivamente cobrado |
| created_at | timestamptz | |

### `bloqueos`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| cancha_id | uuid FK → canchas | |
| motivo | text | |
| fecha_inicio | text | ISO date o timestamp |
| fecha_fin | text | ISO date o timestamp |

### `config`
Tabla con una sola fila. Campos directos (no key-value):
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| negocio_nombre | text | |
| horario_apertura | text | Ej: `"07:00"` |
| horario_cierre | text | Ej: `"22:00"` |
| dias_operacion | text | Días separados por coma: `"Lunes,Martes,..."` |
| direccion | text | |
| telefono | text | |
| instagram | text | |
| horas_pico | text | Rangos separados por coma: `"19:00-21:00,..."` |
| dias_pico | text | Nombres en español minúsculas: `"viernes,sábado,domingo"` |

### `profiles`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → auth.users | |
| nombre | text | |
| email | text | |
| telefono | text | |

### `leads`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE | |
| fuente | text | `"reserva"` cuando viene del wizard |
| created_at | timestamptz | |

## Clientes Supabase

- `src/lib/supabase/client.ts` — cliente browser (`@supabase/ssr`)
- `src/lib/supabase/server.ts` — cliente servidor con cookies (Next.js App Router)
- `src/lib/supabase/service.ts` — `serviceClient` con `SERVICE_ROLE_KEY`; bypasea RLS; usado en todas las operaciones de `src/lib/db.ts`

## Capa de datos (`src/lib/db.ts`)

Toda la lógica de acceso a Supabase está aquí. Usa `serviceClient`. Exports principales:

- `getConfig()` / `actualizarConfig(clave, valor)`
- `getCanchas()` / `getCancha(id)` / `crearCancha()` / `actualizarCancha()` / `eliminarCancha()`
- `getReservas(fecha?)` / `getReservaById(id)` / `crearReserva()` / `actualizarReserva()` / `cancelarReserva()`
- `actualizarPago(id, fields)` — actualiza `pago_estado`, `estado`, `stripe_session_id`, `monto_pagado`
- `checkConflicto(cancha_id, fecha, hora_inicio, hora_fin)` — verifica solapamiento en DB
- `getBloqueos()` / `crearBloqueo()` / `eliminarBloqueo()`

## Lógica de precios (`src/lib/precios.ts`)

- `esHoraPico(hora, fecha, horasPico, diasPico)` — evalúa si un slot cae en hora pico según la config
- `calcularPrecio(horaInicio, fecha, duracionMinutos, precioNormal, precioPico, horasPico, diasPico)` — devuelve precio total proporcional a la duración; usa `precio_pico` si es hora pico y está definido

**Regla**: `precio = tarifa × (duracionMinutos / 60)`. Si la cancha no tiene `precio_pico` definido, nunca se aplica tarifa pico.

## Generación de slots (`src/lib/slots.ts`)

`generarSlots(apertura, cierre, reservas, cancha_id, bloqueos, duracionMinutos)`:
- Normaliza `apertura`/`cierre` vía `normalizeTime()` — acepta `"07:00 a.m."`, `"7am"`, `"07:00"`
- Genera slots cada hora desde apertura hasta `cierre - duracion`
- Marca `disponible: false` si hay reserva o bloqueo solapado

## API Routes (`src/app/api/`)

Todas usan `export const dynamic = 'force-dynamic'`.

| Ruta | Método | Descripción |
|---|---|---|
| `/api/canchas` | GET | Lista canchas activas |
| `/api/canchas` | POST | Crea cancha (admin) |
| `/api/canchas/[id]` | PUT | Actualiza cancha |
| `/api/canchas/[id]` | DELETE | Elimina cancha |
| `/api/disponibilidad` | GET | `?cancha_id=&fecha=&duracion=` — retorna slots con precio y flag `es_pico` |
| `/api/reservas` | GET | `?fecha=` — lista reservas (admin) |
| `/api/reservas` | POST | Crea reserva; si es `efectivo` envía email inmediato; si es `online` deja `estado=Pendiente` |
| `/api/reservas/[id]` | PUT | Actualiza reserva (estado, etc.) |
| `/api/reservas/[id]` | DELETE | Cancela reserva |
| `/api/reservas/mis` | GET | Reservas del usuario autenticado (por `profile_id` o `email`) |
| `/api/bloqueos` | GET/POST | Listar / crear bloqueos |
| `/api/bloqueos/[id]` | DELETE | Eliminar bloqueo |
| `/api/config` | GET/PUT | Leer / actualizar config del negocio |
| `/api/pagos/checkout` | POST | Crea Stripe Checkout Session; requiere `reserva_id` con `pago_estado=pendiente`; expira en 30 min |
| `/api/pagos/webhook` | POST | Webhook de Stripe; maneja `checkout.session.completed` (confirma reserva + envía email) y `checkout.session.expired` (cancela reserva) |
| `/api/admin/auth` | POST | Login admin — valida password y setea cookie `admin_session` |
| `/api/admin/logout` | POST | Limpia cookie admin |
| `/auth/callback` | GET | OAuth callback de Supabase; intercambia `code` por sesión y redirige a `next` |

## Flujo del wizard de reserva

**`src/components/ReservaWizard.tsx`** — wizard de 3 pasos + pantalla de éxito:

1. **Paso 1** — Cancha + Fecha + Duración (60/90/120/150/180 min)
2. **Paso 2** — Selección de slot; slots muestran precio y badge "PICO" si aplica; cambiar duración recarga slots
3. **Paso 3** — Formulario (nombre, teléfono, email, notas) + método de pago (`efectivo` | `online`)
   - Si hay sesión activa: precarga datos del profile
   - Si no hay sesión + pago online: aviso de que se necesita cuenta; botón "Confirmar" redirige a `/auth` guardando el estado de la reserva en `sessionStorage` (`reserva_pendiente`)
   - Checkbox opcional "Guardar mis datos" → envía OTP por email para crear cuenta
4. **Éxito** — pantalla de confirmación (solo para pago en efectivo); pago online redirige a Stripe

**Flujo retomar reserva**: `/reserva/retomar` lee `sessionStorage("reserva_pendiente")` y llama directamente a `handleSubmit` después del login.

## Flujo de pagos (Stripe)

1. `POST /api/reservas` crea la reserva con `estado=Pendiente`, `pago_estado=pendiente`
2. `POST /api/pagos/checkout` crea Stripe Checkout Session con `metadata.reserva_id`, guarda `stripe_session_id` en la reserva, devuelve `url` de Stripe
3. Usuario paga en Stripe → redirige a `/reserva/confirmada?session_id=...&reserva_id=...`
4. Webhook `POST /api/pagos/webhook` recibe `checkout.session.completed` → actualiza `pago_estado=pagado`, `estado=Confirmada`, `monto_pagado` → envía email de confirmación
5. Si la sesión expira → `checkout.session.expired` → `pago_estado=fallido`, `estado=Cancelada`

**Dev**: si `NODE_ENV=development` y la firma del webhook falla, se procesa igualmente (para testing local con `stripe listen`).

## Sistema de autenticación

### Admin (`/admin/*`)
- `src/middleware.ts` protege todas las rutas `/admin/*` (excepto `/admin/login`)
- Valida cookie `admin_session` contra `ADMIN_PASSWORD`
- Login: `POST /api/admin/auth` setea cookie httpOnly

### Clientes (público)
- Supabase Auth: Google OAuth + Magic Link (OTP)
- `src/hooks/useSession.ts` — expone `user`, `profile`, `loading`, `signOut`
- `src/lib/supabase/client.ts` — cliente browser con `@supabase/ssr`
- OAuth callback en `/auth/callback/route.ts`
- Página de login en `/auth`
- Perfil de cliente en tabla `profiles` (relación `user_id → auth.users`)

## Páginas públicas destacadas

- `/` — Landing: Hero → Canchas → ReservaWizard → ComoFunciona → Footer
- `/auth` — Login/registro con Google u OTP
- `/mis-reservas` — Reservas activas del usuario logueado
- `/reserva/confirmada` — Página post-pago de Stripe
- `/reserva/retomar` — Página intermedia para retomar reserva tras login

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `src/lib/db.ts` | Toda la lógica de acceso a Supabase |
| `src/lib/precios.ts` | Cálculo de precio normal vs pico |
| `src/lib/slots.ts` | Generación y filtrado de slots horarios |
| `src/lib/email.ts` | Template HTML y envío de confirmación via Resend |
| `src/lib/stripe.ts` | Instancia de Stripe con `apiVersion` |
| `src/types/index.ts` | Interfaces TypeScript: `Cancha`, `Reserva`, `Bloqueo`, `Config`, `SlotHorario`, `Profile`, `Lead`, `Promocion` |
| `src/middleware.ts` | Protección de rutas `/admin/*` |
| `src/hooks/useSession.ts` | Hook de sesión de cliente (Supabase Auth) |

## Pendiente de implementar

- **Botón flotante de promociones**: la interfaz `Promocion` ya está definida en `src/types/index.ts` (tabla `promociones` en Supabase con campos `titulo`, `descripcion`, `descuento`, `activa`, `fecha_inicio`, `fecha_fin`), pero no existe el componente UI ni la lógica de aplicación de descuentos. Falta:
  1. Tabla `promociones` en Supabase
  2. Componente flotante en la landing que muestre promociones activas
  3. Lógica en el wizard para aplicar descuento al precio final
  4. Gestión de promociones en el panel admin
