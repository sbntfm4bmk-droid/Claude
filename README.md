# ProConnect

> Nom de travail provisoire — voir « Renommer l'application » plus bas.

Application mobile type « Uber des métiers » : elle met en relation des
**prestataires** (plombiers, électriciens, ménage, jardinage, etc.) avec des
**particuliers** qui cherchent un service près de chez eux.

Un particulier recherche un pro par métier, le trie par distance et par note,
consulte son profil et ses avis, puis envoie une demande de service. Le
prestataire reçoit la demande, l'accepte ou la refuse, réalise la mission, et le
client laisse un avis.

## Architecture

Monorepo composé de deux applications :

| Dossier    | Stack                                              | Rôle                                   |
| ---------- | -------------------------------------------------- | -------------------------------------- |
| `mobile/`  | React Native + Expo (expo-router, TypeScript)      | Application iOS / Android (et web)     |
| `server/`  | Node.js + Express + Prisma + SQLite (TypeScript)   | API REST + base de données + auth JWT  |

```
┌─────────────┐        HTTP/JSON (Bearer JWT)        ┌──────────────┐
│  mobile/    │  ───────────────────────────────▶   │   server/    │
│  Expo app   │  ◀───────────────────────────────   │  Express API │
└─────────────┘                                       └──────┬───────┘
                                                             │ Prisma
                                                       ┌─────▼──────┐
                                                       │  SQLite db │
                                                       └────────────┘
```

## Démarrage rapide

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run db:push      # crée le schéma SQLite
npm run db:seed      # données de démo (catégories + comptes)
npm run dev          # API sur http://localhost:4000
```

Compte de démo : `client@demo.com` / `password123`
(prestataires : `provider1@demo.com` … `provider5@demo.com`, même mot de passe).

### 2. Application mobile

```bash
cd mobile
npm install
npm start            # ouvre Expo Dev Tools (QR code Expo Go)
```

> **Appareil physique** : `localhost` ne pointe pas vers votre machine. Mettez
> l'IP LAN de votre ordinateur dans `mobile/app.json` →
> `expo.extra.apiUrl` (ex. `http://192.168.1.20:4000`).

## Fonctionnalités principales

- **Authentification** JWT (inscription client ou prestataire, connexion, session persistante).
- **Recherche de prestataires** par métier, par nom, triés par distance (géoloc).
- **Profil prestataire** : bio, tarif horaire, note moyenne, avis.
- **Demande de service** (booking) avec description, adresse et coordonnées GPS.
- **Cycle de vie d'une mission** : `PENDING → ACCEPTED → IN_PROGRESS → COMPLETED` (ou `REJECTED`/`CANCELLED`).
- **Avis & notes** : le client note le prestataire après une mission terminée.

## Renommer l'application

Le nom est centralisé. Pour rebrander :

1. `mobile/src/constants/config.ts` → `APP_NAME` (et `APP_TAGLINE`).
2. `mobile/app.json` → `expo.name` et `expo.slug`.
3. Optionnel : `server/package.json` / `mobile/package.json` → champ `name`.

## Documentation pour assistants IA

Voir [`CLAUDE.md`](./CLAUDE.md) pour la structure détaillée, les conventions et
les workflows de développement.
