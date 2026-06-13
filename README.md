# ProConnect

> Nom de travail provisoire — voir « Renommer l'application ».
> Pour la stratégie produit/business, voir [`VISION.md`](./VISION.md).

Marketplace mobile du **commerce et des services de proximité** — un mélange
d'**Uber** (découvrir ce qui est autour de soi), de **Planity** (prise de
rendez-vous) et de **marketplace locale** (achat de produits), dans une seule app.

- Les **professionnels** (coiffeur, maquilleuse, masseur, plombier, fleuriste,
  épicier, créateur…) ouvrent une **vitrine** qui propose des **prestations sur
  RDV** et/ou des **produits à acheter**.
- Les **particuliers** découvrent les pros **autour d'eux** (rayon ajustable),
  consultent une vitrine, **prennent rendez-vous** ou **achètent**, puis laissent
  un **avis**.

## Architecture

Monorepo de deux applications indépendantes :

| Dossier   | Stack                                            | Rôle                                  |
| --------- | ------------------------------------------------ | ------------------------------------- |
| `mobile/` | React Native + Expo (expo-router, TypeScript)    | App iOS / Android (et web)            |
| `server/` | Node.js + Express + Prisma + SQLite (TypeScript) | API REST + base de données + JWT auth |

```
┌─────────────┐      HTTP/JSON (Bearer JWT)       ┌──────────────┐
│  mobile/    │ ───────────────────────────────▶  │   server/    │
│  Expo app   │ ◀───────────────────────────────  │  Express API │──▶ SQLite
└─────────────┘                                    └──────────────┘
```

## Démarrage rapide

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run db:push      # crée le schéma SQLite
npm run db:seed      # données de démo (catégories + vitrines)
npm run dev          # API sur http://localhost:4000
```

### 2. Application mobile

```bash
cd mobile
npm install
npm start            # Expo Dev Tools / QR pour Expo Go
```

> **Appareil physique** : `localhost` ne pointe pas vers votre machine. Mettez
> l'IP LAN de votre ordinateur dans `mobile/app.json → expo.extra.apiUrl`.

### Comptes de démo

- Client : `client@demo.com` / `password123`
- Pros : `salon@demo.com` (coiffure, RDV+boutique), `makeup@demo.com`,
  `spa@demo.com`, `fleurs@demo.com` (boutique), `epicerie@demo.com`,
  `plombier@demo.com` — tous `password123`.

## Fonctionnalités

- **Auth JWT** : inscription client ou pro (type d'activité + catégorie + ville).
- **Découverte « autour de moi »** : géolocalisation, **rayon ajustable**,
  filtres par catégorie et par type (RDV / boutique), recherche.
- **Vitrine pro** : couverture, prestations, produits, avis, mise en favori.
- **Prise de RDV** : sélection du jour + **créneau disponible** (calculé à partir
  des horaires d'ouverture), confirmation, cycle de vie du RDV.
- **Achat de produits** : panier (par commerçant), checkout retrait/livraison,
  décrément de stock, suivi de commande.
- **Paiement** : paiement de la commande et **acompte de RDV** (30%, anti no-show)
  via une couche PSP abstraite — PSP simulé en dev, **Stripe** en production
  (renseigner `STRIPE_SECRET_KEY`, voir `server/src/lib/payments.ts`).
- **Espace pro** : éditeur de vitrine (créer / modifier / supprimer prestations
  et produits) depuis le profil.
- **Rappels de RDV** : notification locale ~1h avant le rendez-vous.
- **Avis & notes** : après un RDV terminé, recalcul de la note de la vitrine.
- **Design** : design system premium (dégradés, ombres douces, skeletons, haptique).

## Renommer l'application

1. `mobile/src/constants/config.ts` → `APP_NAME` / `APP_TAGLINE`.
2. `mobile/app.json` → `expo.name` / `expo.slug`.

## Pour les assistants IA

Voir [`CLAUDE.md`](./CLAUDE.md) (structure, modèle de données, API, conventions)
et [`VISION.md`](./VISION.md) (stratégie, monétisation, roadmap).
