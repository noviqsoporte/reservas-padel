# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (warnings only — ignoreDuringBuilds: true)
```

No test suite configured.

## Required Environment Variables

All must be set in `.env.local`:

```
AIRTABLE_API_KEY
AIRTABLE_BASE_ID
AIRTABLE_TABLE_CANCHAS
AIRTABLE_TABLE_RESERVAS
AIRTABLE_TABLE_BLOQUEOS
AIRTABLE_TABLE_CONFIG
ADMIN_PASSWORD
```

## Architecture Overview

**Client for "Lood"** — a padel court booking system with a public-facing reservation flow and a protected admin panel.

### Data Layer (`src/lib/airtable.ts`)

All Airtable access goes through this single file using the `airtable` SDK. Tables are:
- **Canchas** — padel courts with fields: Nombre, Descripcion, Foto_URL, Activa, Precio, Color
- **Reservas** — bookings. `Cancha` field is a linked record (stored/returned as `string[]`). `Estado` values: `Confirmada | Cancelada | Pendiente | Completada | No show`
- **Bloqueos** — time blocks per court. `fecha_inicio`/`fecha_fin` can be full ISO timestamps or date strings
- **Config** — single record with direct fields (not key-value rows): `negocio_nombre`, `horario_apertura`, `horario_cierre`, `dias_operacion` (comma-separated string), `direccion`, `telefono`, `instagram`

### Slot Generation (`src/lib/slots.ts`)

`generarSlots()` takes apertura/cierre strings in any format (e.g. `"07:00 a.m."`, `"7am"`, `"07:00"`) and normalizes them via `normalizeTime()` before computing available 1h/1.5h/2h slots. Overlap check uses string comparison on `HH:mm`.

### API Routes (`src/app/api/`)

All routes use `export const dynamic = 'force-dynamic'` to prevent caching. Key route:
- `GET /api/disponibilidad?cancha_id=&fecha=&duracion=` — validates operating day from Config, fetches reservas + bloqueos, returns slots

### Auth (middleware)

`src/middleware.ts` guards all `/admin/*` routes by checking the `admin_session` cookie against `ADMIN_PASSWORD`. Login sets that cookie via `POST /api/admin/auth`. No JWT — plain password cookie.

### Public Landing Page

`src/app/page.tsx` renders sections: Hero → Canchas → ReservaSection → ComoFunciona → Footer. `ReservaWizard` is the multi-step booking form (step 1: select court + date + duration; step 2: select slot; step 3: fill contact info; step 4: confirmation).

### Admin Panel (`/admin`)

Protected by middleware. Pages:
- `/admin` — dashboard KPIs + today's reservations
- `/admin/reservas` — full reservation management
- `/admin/canchas` — court CRUD
- `/admin/bloqueos` — time block management
- `/admin/configuracion` — business config (maps directly to Config table fields)

### Images

Court photos come from Cloudinary (`res.cloudinary.com` is whitelisted in `next.config.mjs`).
