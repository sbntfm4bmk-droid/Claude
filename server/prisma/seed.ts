import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Categories span both services and products, across many verticals.
const CATEGORIES = [
  { name: "Coiffure", slug: "coiffure", icon: "💇", color: "#7C3AED", kind: "SERVICE" },
  { name: "Maquillage", slug: "maquillage", icon: "💄", color: "#EC4899", kind: "SERVICE" },
  { name: "Onglerie", slug: "onglerie", icon: "💅", color: "#F472B6", kind: "SERVICE" },
  { name: "Massage & Bien-être", slug: "bien-etre", icon: "💆", color: "#10B981", kind: "SERVICE" },
  { name: "Coach sportif", slug: "coach", icon: "🏋️", color: "#F59E0B", kind: "SERVICE" },
  { name: "Plomberie", slug: "plomberie", icon: "🔧", color: "#0EA5E9", kind: "SERVICE" },
  { name: "Électricité", slug: "electricite", icon: "⚡", color: "#EAB308", kind: "SERVICE" },
  { name: "Photographe", slug: "photo", icon: "📷", color: "#6366F1", kind: "SERVICE" },
  { name: "Épicerie & Frais", slug: "epicerie", icon: "🥖", color: "#84CC16", kind: "PRODUCT" },
  { name: "Fleuriste", slug: "fleuriste", icon: "💐", color: "#F43F5E", kind: "PRODUCT" },
  { name: "Créateur & Artisanat", slug: "artisanat", icon: "🎨", color: "#8B5CF6", kind: "PRODUCT" },
  { name: "Mode & Accessoires", slug: "mode", icon: "👗", color: "#D946EF", kind: "PRODUCT" },
];

// Demo businesses around central Paris. Each has services and/or products.
const BUSINESSES: Array<{
  email: string;
  owner: string;
  name: string;
  type: "SERVICE" | "PRODUCT" | "BOTH";
  slug: string;
  tagline: string;
  description: string;
  city: string;
  lat: number;
  lng: number;
  services?: Array<{ name: string; durationMin: number; price: number; description?: string }>;
  products?: Array<{ name: string; price: number; stock: number; description?: string }>;
}> = [
  {
    email: "salon@demo.com",
    owner: "Léa Moreau",
    name: "Studio Léa Coiffure",
    type: "BOTH",
    slug: "coiffure",
    tagline: "Coupe, couleur & soins haut de gamme",
    description: "Salon de coiffure mixte au cœur de Paris. Spécialiste du balayage et des soins naturels.",
    city: "Paris",
    lat: 48.8566,
    lng: 2.3522,
    services: [
      { name: "Coupe femme", durationMin: 45, price: 39, description: "Shampoing, coupe, brushing." },
      { name: "Coupe homme", durationMin: 30, price: 25 },
      { name: "Balayage", durationMin: 120, price: 95, description: "Technique éclaircissante sur-mesure." },
      { name: "Soin profond", durationMin: 30, price: 29 },
    ],
    products: [
      { name: "Shampoing réparateur 250ml", price: 18, stock: 40 },
      { name: "Huile capillaire bio", price: 24, stock: 25 },
    ],
  },
  {
    email: "makeup@demo.com",
    owner: "Inès Khelifi",
    name: "Inès Makeup Artist",
    type: "SERVICE",
    slug: "maquillage",
    tagline: "Maquillage mariée & événementiel",
    description: "Maquilleuse professionnelle, déplacements à domicile. Mise en beauté pour vos grands jours.",
    city: "Paris",
    lat: 48.8606,
    lng: 2.3376,
    services: [
      { name: "Maquillage jour", durationMin: 45, price: 49 },
      { name: "Maquillage mariée", durationMin: 90, price: 150, description: "Essai inclus." },
      { name: "Cours d'automaquillage", durationMin: 60, price: 70 },
    ],
  },
  {
    email: "spa@demo.com",
    owner: "Thomas Réau",
    name: "Zen Studio Massage",
    type: "SERVICE",
    slug: "bien-etre",
    tagline: "Massages & relaxation",
    description: "Praticien certifié. Massage californien, deep tissue et réflexologie.",
    city: "Paris",
    lat: 48.8499,
    lng: 2.37,
    services: [
      { name: "Massage relaxant 1h", durationMin: 60, price: 65 },
      { name: "Deep tissue 1h", durationMin: 60, price: 75 },
      { name: "Réflexologie plantaire", durationMin: 45, price: 50 },
    ],
  },
  {
    email: "fleurs@demo.com",
    owner: "Camille Petit",
    name: "Atelier Floral Camille",
    type: "PRODUCT",
    slug: "fleuriste",
    tagline: "Bouquets frais du jour",
    description: "Fleuriste créateur. Bouquets de saison, compositions et plantes d'intérieur.",
    city: "Paris",
    lat: 48.87,
    lng: 2.31,
    products: [
      { name: "Bouquet du moment", price: 32, stock: 15, description: "Composition de saison." },
      { name: "Bouquet de roses (x12)", price: 45, stock: 10 },
      { name: "Plante Monstera", price: 28, stock: 8 },
      { name: "Orchidée blanche", price: 22, stock: 12 },
    ],
  },
  {
    email: "epicerie@demo.com",
    owner: "Marc Lefèvre",
    name: "L'Épicerie de Marc",
    type: "PRODUCT",
    slug: "epicerie",
    tagline: "Produits locaux & frais",
    description: "Épicerie fine de quartier. Fromages, pains, produits du terroir.",
    city: "Paris",
    lat: 48.845,
    lng: 2.32,
    products: [
      { name: "Pain au levain", price: 4.5, stock: 30 },
      { name: "Panier de légumes bio", price: 18, stock: 20 },
      { name: "Plateau de fromages", price: 25, stock: 12 },
      { name: "Miel artisanal 500g", price: 12, stock: 18 },
    ],
  },
  {
    email: "plombier@demo.com",
    owner: "Karim Bensalah",
    name: "Karim Dépannage",
    type: "SERVICE",
    slug: "plomberie",
    tagline: "Plomberie & urgences 7j/7",
    description: "Plombier expérimenté, interventions rapides. Devis gratuit.",
    city: "Paris",
    lat: 48.858,
    lng: 2.347,
    services: [
      { name: "Diagnostic & devis", durationMin: 30, price: 0 },
      { name: "Réparation fuite", durationMin: 60, price: 80 },
      { name: "Installation sanitaire", durationMin: 120, price: 150 },
    ],
  },
];

async function main() {
  const categoryBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, color: c.color, kind: c.kind },
      create: c,
    });
    categoryBySlug[c.slug] = cat.id;
  }

  // Demo client account.
  const clientPassword = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "client@demo.com" },
    update: {},
    create: {
      email: "client@demo.com",
      password: clientPassword,
      fullName: "Jean Particulier",
      phone: "+33600000000",
      role: "CLIENT",
    },
  });

  // Demo businesses (idempotent: skip if the owner email already exists).
  for (const b of BUSINESSES) {
    const exists = await prisma.user.findUnique({ where: { email: b.email } });
    if (exists) continue;

    const password = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        email: b.email,
        password,
        fullName: b.owner,
        role: "PROVIDER",
        phone: "+33611100000",
        business: {
          create: {
            name: b.name,
            type: b.type,
            tagline: b.tagline,
            description: b.description,
            city: b.city,
            latitude: b.lat,
            longitude: b.lng,
            categoryId: categoryBySlug[b.slug],
            openingHours: {
              // Mon–Sat 9:00–19:00.
              create: [1, 2, 3, 4, 5, 6].map((weekday) => ({
                weekday,
                openMinute: 9 * 60,
                closeMinute: 19 * 60,
              })),
            },
            services: b.services
              ? { create: b.services.map((s) => ({ ...s })) }
              : undefined,
            products: b.products
              ? { create: b.products.map((p) => ({ ...p })) }
              : undefined,
          },
        },
      },
    });
  }

  console.log("Seed complete. Client: client@demo.com / password123");
  console.log("Pros: salon@demo.com, makeup@demo.com, fleurs@demo.com, ... / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
