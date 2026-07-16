# IgnisPLAN

Diagnostic Ops UI — React 19 + Vite 5 + Mantine 8, ported from the HTML prototype with IgnisGTM-matched stack.

## Run

```bash
cd IgnisPLAN
pnpm install
pnpm dev
```

Opens at [http://127.0.0.1:10002](http://127.0.0.1:10002).

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Dev server on port 10002 |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview production build |

## Stack

- React 19, Vite 5, TypeScript
- Mantine 8 (`core`, `hooks`, `form`, `dates`, `notifications`)
- React Router 6, TanStack Query, Tabler icons, zod, date-fns, axios

## Ngauge / Infoveave data layer

Ported from IgnisGTM for Infoveave Ngauge APIs (token from `localStorage.access_token`):

| Export | Path |
|--------|------|
| `ngaugeStore` | `src/store/ngauge-store.ts` |
| Hooks barrel | `src/hooks/index.ts` |

Hooks: `useNgaugeData`, `useNgaugePaginatedData`, `useInfoveaveQuery`, `useAddRow`, `useDeleteRow`, `useNguageRowData`, `useDistinctColumnItems`.

Tenant: `ignis` in DEV, `nooms` otherwise (`https://{tenant}.infoveave.app`).

## Features

- Admin: Services, Setups, Patients
- Awaiting Patients Queue, request intake/cancel, assign slot
- Imaging Scheduler (day + 15-day) with queue, filters, bulk allocation
- Beds Allotment (day + 15-day) with daily/hourly packing
- Booking detail, events, declare event, reschedule plans

Data is in-memory (prototype seed).
