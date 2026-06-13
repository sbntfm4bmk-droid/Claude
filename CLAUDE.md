# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

**ProConnect** (working name) is a mobile marketplace for **local commerce and
services** — an "Uber + Planity + local marketplace" in one app. It connects:

- **Clients** (particuliers) who discover businesses **around them**, **book
  appointments** (RDV), and **buy products**.
- **Providers** (professionnels) who run a **storefront** (vitrine) offering
  **services** booked on time slots and/or **products** sold via orders.

See [`VISION.md`](./VISION.md) for the product strategy and roadmap (this is the
"why" behind the data model and features).

It is a **monorepo** with two independent applications:

- `mobile/` — React Native + Expo app (TypeScript, expo-router file-based routing).
- `server/` — Node.js + Express REST API with Prisma ORM over SQLite, JWT auth.

There is **no shared build tooling**; each has its own `package.json`,
`tsconfig.json`, and `node_modules`. Run commands from inside the relevant subdir.

## Repository layout

```
.
├── CLAUDE.md            ← this file
├── VISION.md            ← product/business strategy
├── README.md            ← human-facing setup guide
├── server/              ← Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma   data model (see below)
│   │   └── seed.ts         demo categories, client + provider storefronts
│   └── src/
│       ├── index.ts        Express app entry, route mounting, error handler
│       ├── lib/            prisma client, JWT helpers, geo distance, slot engine
│       ├── middleware/     requireAuth / requireRole
│       └── routes/         auth, categories, businesses, services, products,
│                           appointments, orders, reviews, favorites
└── mobile/              ← Expo app
    ├── app.json            Expo config (name, apiUrl in expo.extra)
    ├── app/                expo-router routes (see below)
    └── src/
        ├── api/            typed API client (client.ts + index.ts + types.ts)
        ├── components/     ui.tsx design system + BusinessCard
        ├── constants/      config.ts → APP_NAME, API_URL, radius/coords
        ├── context/        AuthContext (session) + CartContext (product cart)
        ├── lib/            format.ts (price/date/duration helpers)
        └── theme/          colors.ts (palette + gradients) + theme.ts (tokens)
```

### Mobile routing (expo-router)

`app/_layout.tsx` holds `AuthProvider` + `CartProvider` and an `AuthGate` that
redirects between the `(auth)` group and `(tabs)` based on session state.

```
app/
├── _layout.tsx              root stack + auth gating + providers
├── index.tsx                redirect → /(tabs)
├── (auth)/
│   ├── login.tsx
│   └── register.tsx         client OR provider sign-up (role + business type + category)
├── (tabs)/
│   ├── _layout.tsx          bottom tab bar (Découvrir, Mes RDV, Achats, Profil)
│   ├── index.tsx            DISCOVER: hero, search, radius selector, categories, "around me"
│   ├── appointments.tsx     RDV list + status actions (role-aware)
│   ├── orders.tsx           orders list + cart banner (role-aware)
│   └── profile.tsx          user, provider storefront card, favorites, logout
├── business/[id].tsx        STOREFRONT: services to book + products to buy + reviews + favorite
├── booking/[serviceId].tsx  pick a day + available slot → book + pay deposit (modal)
├── cart.tsx                 product cart + checkout + payment (modal)
├── review/[appointmentId].tsx  rate a completed appointment (modal)
└── manage/                  provider-only catalog editor
    ├── catalog.tsx          list/add/edit/delete own services & products
    ├── service.tsx          create/edit a service (modal)
    └── product.tsx          create/edit a product (modal)
```

## Data model (Prisma)

- **User** — `role` is `"CLIENT"` or `"PROVIDER"` (string, not a DB enum).
- **Business** — 1:1 with a provider User; the storefront. `type` is
  `"SERVICE" | "PRODUCT" | "BOTH"`. Holds name, tagline, category, lat/lng, city,
  cover image, and cached `ratingAvg` / `ratingCount`.
- **Category** — a vertical (coiffure, fleuriste, plomberie…). Has `kind`
  (`SERVICE`/`PRODUCT`/`BOTH`), an emoji `icon`, and a `color` used in the UI.
- **Service** — a bookable prestation of a Business (`durationMin`, `price`).
- **Product** — a purchasable item of a Business (`price`, `stock`).
- **OpeningHour** — weekly hours (weekday + open/close minutes) that drive slots.
- **Appointment** — a booked RDV for a Service; `status` flows
  `PENDING → CONFIRMED → COMPLETED`, or `CANCELLED` / `NO_SHOW`.
- **Order** + **OrderItem** — a product purchase from one Business; `status`
  `PENDING → PAID → FULFILLED` or `CANCELLED`; `fulfillment` `PICKUP`/`DELIVERY`.
- **Review** — 1:1 with a completed Appointment; recomputes the Business rating.
- **Favorite** — a client's saved Business (`@@unique([userId, businessId])`).

> **SQLite has no native enums.** "Enum-like" fields are stored as `String` with
> allowed values documented in `schema.prisma` and enforced with Zod in routes.
> Switching to PostgreSQL would let you convert these to real Prisma enums.

### Appointment slots

`server/src/lib/slots.ts` generates bookable start times for a service on a given
day from the business `OpeningHour`s, in 15-min steps, excluding past times and
slots overlapping existing `PENDING`/`CONFIRMED` appointments. Exposed at
`GET /api/services/:id/slots?date=YYYY-MM-DD`. Booking re-checks for clashes (409).

## API surface (all under `/api`)

| Group | Endpoints |
| ----- | --------- |
| auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| categories | `GET /categories` |
| businesses | `GET /businesses` (filters: `categoryId,type,lat,lng,radiusKm,q`), `GET /businesses/:id`, `GET /businesses/me/catalog`, `PATCH /businesses/me` |
| services | `POST /services`, `PATCH /services/:id`, `DELETE /services/:id`, `GET /services/:id/slots` |
| products | `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` |
| appointments | `POST /appointments`, `GET /appointments`, `PATCH /appointments/:id/status` |
| orders | `POST /orders`, `GET /orders`, `PATCH /orders/:id/status` |
| reviews | `POST /reviews` |
| favorites | `GET /favorites`, `POST /favorites/toggle` |
| payments | `GET /payments/config`, `POST /payments/order/:id`, `POST /payments/deposit` |

## Development workflows

### Backend (`cd server`)

| Command | What it does |
| ------- | ------------ |
| `npm install` | install deps |
| `npm run db:push` | apply `schema.prisma` to SQLite (no migration files) |
| `npm run db:seed` | load demo data (idempotent) |
| `npm run dev` | hot-reloading dev server on `:4000` |
| `npm run build` | compile TypeScript to `dist/` |
| `npm run lint` | `tsc --noEmit` type check |

After editing `schema.prisma`, run `npm run db:push` then `npm run prisma:generate`
if types look stale.

### Mobile (`cd mobile`)

| Command | What it does |
| ------- | ------------ |
| `npm install` | install deps |
| `npm start` | Expo dev server / QR for Expo Go |
| `npm run ios` / `npm run android` | open a simulator/emulator |
| `npm run lint` | `tsc --noEmit` type check |

API base URL comes from `app.json → expo.extra.apiUrl`, read in
`src/constants/config.ts`. On a physical device, change `localhost` to the host's
LAN IP.

## Conventions

- **Language**: TypeScript everywhere, `strict` mode on. **UI copy in French**;
  **code, comments, identifiers, commit messages in English**.
- **Validation**: every write endpoint validates its body with **Zod**.
- **Auth**: protected routes use `requireAuth`; `req.user` (`{ userId, role }`)
  comes from the JWT. Never trust a client-sent role. Ownership is re-checked
  server-side (e.g. only a business owner can edit its services).
- **Passwords**: bcrypt-hashed; stripped via `sanitize()` before leaving the API.
- **API client**: screens never call `fetch` directly — they go through
  `src/api/index.ts` (`authApi`, `businessesApi`, `servicesApi`, `appointmentsApi`,
  `ordersApi`, `favoritesApi`, …) over the `apiFetch` wrapper.
- **Design system**: use tokens in `src/theme/theme.ts` (spacing/radius/font/shadow)
  and `colors.ts` (palette + gradients). Reuse components in
  `src/components/ui.tsx` (`Button`, `Field`, `Card`, `Stars`, `Avatar`, `Chip`,
  `Badge`, `SectionHeader`, `Skeleton`) instead of ad-hoc styling.
- **Gradients/haptics**: via `expo-linear-gradient` and `expo-haptics`.
- **No icon library**: icons are emoji (categories carry their own `icon`).
- **App name** is centralized in `mobile/src/constants/config.ts` (`APP_NAME`).
- **Cart** holds products from a single Business at a time (`CartContext`).

## Conventions to keep when extending

- New backend route → `src/routes/<name>.ts`, export a `Router`, mount under
  `/api/<name>` in `src/index.ts`, validate with Zod, re-check ownership.
- New mobile API call → add to the right group in `src/api/index.ts` and a type
  in `src/api/types.ts` (kept in sync with Prisma models).
- New screen → add under `app/`, respect `(auth)` vs `(tabs)` grouping and the
  auth-gating in `app/_layout.tsx`.

## Known gaps / not yet implemented

Intentionally out of scope for the current scaffold — flag them, don't assume:

- **Payments are simulated.** `src/lib/payments.ts` is a PSP abstraction: it uses
  the mock provider (instant success) unless `STRIPE_SECRET_KEY` is set. Order
  checkout and the appointment **deposit** (30% to fight no-shows) run through it
  end-to-end. Going live = drop a real Stripe PaymentIntent into `charge()`; the
  rest of the app is unchanged. No refund flow / cancellation-policy enforcement yet.
- **Reminders are local-only.** `src/lib/notifications.ts` schedules an on-device
  notification ~1h before an appointment (best-effort, Expo Go has limits). No
  server-side push / SMS / email yet.
- No in-app chat, no map rendering (distance is computed, not drawn).
- No image upload; `coverImageUrl`/`imageUrl` exist but aren't populated (UI uses
  category-colored gradients instead).
- No automated tests; `npm run lint` (type-check) is the only gate.
- SQLite + dev JWT secret — not production-hardened.
