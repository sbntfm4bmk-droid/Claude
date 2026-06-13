# CLAUDE.md

Guidance for AI assistants (and humans) working in this repository.

## What this is

**ProConnect** (working name) is a mobile marketplace that connects service
**providers** (tradespeople: plumbers, electricians, cleaners, gardeners, …)
with **clients** (individuals) who need a service nearby — an "Uber for trades".

It is a **monorepo** with two independent applications:

- `mobile/` — React Native + Expo app (TypeScript, expo-router file-based routing).
- `server/` — Node.js + Express REST API with Prisma ORM over SQLite, JWT auth.

There is **no shared build tooling** between the two; each has its own
`package.json`, `tsconfig.json`, and `node_modules`. Run commands from inside
the relevant subdirectory.

## Repository layout

```
.
├── CLAUDE.md            ← this file
├── README.md            ← human-facing setup guide
├── server/              ← Express + Prisma backend
│   ├── prisma/
│   │   ├── schema.prisma   data model (User, ProviderProfile, Category, Booking, Review)
│   │   └── seed.ts         demo categories, client + provider accounts
│   └── src/
│       ├── index.ts        Express app entry, route mounting, error handler
│       ├── lib/            prisma client, JWT helpers, haversine geo distance
│       ├── middleware/     requireAuth / requireRole
│       └── routes/         auth, categories, providers, bookings, reviews
└── mobile/              ← Expo app
    ├── app.json            Expo config (name, apiUrl in expo.extra)
    ├── app/                expo-router routes (see below)
    └── src/
        ├── api/            typed API client (client.ts + index.ts + types.ts)
        ├── components/     reusable UI (Button, Field, Card, Stars, StatusBadge)
        ├── constants/      config.ts → APP_NAME, API_URL
        ├── context/        AuthContext (session, login/register/logout)
        └── theme/          colors.ts palette
```

### Mobile routing (expo-router)

File-based. `app/_layout.tsx` holds the `AuthProvider` and an `AuthGate` that
redirects between the `(auth)` group and `(tabs)` based on session state.

```
app/
├── _layout.tsx          root stack + auth gating
├── index.tsx            redirect → /(tabs)
├── (auth)/
│   ├── login.tsx
│   └── register.tsx     client OR provider sign-up (role toggle)
├── (tabs)/
│   ├── _layout.tsx      bottom tab bar
│   ├── index.tsx        provider search (filters, distance sort)
│   ├── bookings.tsx     bookings list + status actions (role-aware)
│   └── profile.tsx      current user + logout
├── provider/[id].tsx    provider detail + reviews + "request service"
└── booking/new.tsx      create a booking (modal)
```

## Data model (Prisma)

- **User** — `role` is `"CLIENT"` or `"PROVIDER"` (string, not a DB enum — see note).
- **ProviderProfile** — 1:1 with a provider User; holds bio, hourlyRate, lat/lng,
  availability, and cached `ratingAvg` / `ratingCount`.
- **Category** — a trade/métier (slug-unique).
- **Booking** — a service request; `status` flows
  `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED`, or `REJECTED` / `CANCELLED`.
- **Review** — 1:1 with a completed Booking; writing one recomputes the
  provider's rating aggregates.

> **SQLite has no native enums.** "Enum-like" fields (`User.role`,
> `Booking.status`) are stored as `String` with allowed values documented in
> `schema.prisma` and enforced with Zod in the routes. If you switch the
> datasource to PostgreSQL, you may convert these to real Prisma enums.

## Development workflows

### Backend (`cd server`)

| Command                 | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm install`           | install deps                                         |
| `npm run db:push`       | apply `schema.prisma` to the SQLite db (no migration files) |
| `npm run prisma:migrate`| create a versioned migration instead                 |
| `npm run db:seed`       | load demo data (idempotent, uses upserts)            |
| `npm run dev`           | hot-reloading dev server (ts-node-dev) on `:4000`    |
| `npm run build`         | compile TypeScript to `dist/`                        |
| `npm run lint`          | `tsc --noEmit` type check                            |

After editing `schema.prisma`, run `npm run db:push` (or `prisma:migrate`) **and**
regenerate the client with `npm run prisma:generate` if types look stale.

### Mobile (`cd mobile`)

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `npm install`    | install deps                              |
| `npm start`      | Expo dev server / QR for Expo Go          |
| `npm run ios`    | open iOS simulator                        |
| `npm run android`| open Android emulator                     |
| `npm run lint`   | `tsc --noEmit` type check                 |

The app's API base URL comes from `app.json → expo.extra.apiUrl`, read in
`src/constants/config.ts`. On a physical device, change `localhost` to the
host machine's LAN IP.

## Conventions

- **Language**: TypeScript everywhere, `strict` mode on in both projects.
- **UI copy is in French** (the product's target audience); **code, comments,
  identifiers, and commit messages are in English**. Keep this split.
- **Validation**: every write endpoint validates its body with **Zod** before
  touching the database. Add new endpoints the same way.
- **Auth**: protected routes use the `requireAuth` middleware; `req.user`
  (`{ userId, role }`) is populated from the JWT. Never trust a client-sent role.
- **Passwords** are hashed with bcrypt; the hash is stripped via `sanitize()`
  before any user object leaves the API.
- **API client**: the mobile app never calls `fetch` directly in screens — it
  goes through `src/api/index.ts` (grouped as `authApi`, `providersApi`,
  `bookingsApi`, etc.), which uses the `apiFetch` wrapper for auth + errors.
- **Styling**: React Native `StyleSheet` with the shared palette in
  `src/theme/colors.ts`. Reuse the components in `src/components/ui.tsx` rather
  than re-styling buttons/inputs/cards ad hoc.
- **No icon library**: tab/inline icons use emoji to avoid an extra dependency.
- **App name** is centralized in `mobile/src/constants/config.ts` (`APP_NAME`);
  don't hardcode the product name in screens.

## Conventions to keep when extending

- New backend route → create `src/routes/<name>.ts`, export a `Router`, mount it
  in `src/index.ts` under `/api/<name>`, validate input with Zod.
- New mobile API call → add a method to the relevant group in `src/api/index.ts`
  and a matching type in `src/api/types.ts` (kept in sync with Prisma models).
- New screen → add a file under `app/`; respect the `(auth)` vs `(tabs)`
  grouping and the auth-gating in `app/_layout.tsx`.

## Known gaps / not yet implemented

These are intentionally out of scope for the current scaffold — flag them rather
than assuming they exist:

- No real-time updates (no websockets/push); booking lists refresh on focus/pull.
- No payments, no in-app chat, no map view (distance is computed, not rendered).
- No automated tests yet; `npm run lint` (type-check) is the only gate.
- No image upload; `avatarUrl` exists in the model but isn't populated.
- SQLite + JWT secret in `.env` are dev defaults — not production-hardened.
