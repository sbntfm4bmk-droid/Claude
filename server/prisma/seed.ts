import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Trades/metiers offered on the platform.
const CATEGORIES = [
  { name: "Plomberie", slug: "plomberie", icon: "pipe" },
  { name: "Électricité", slug: "electricite", icon: "flash" },
  { name: "Ménage", slug: "menage", icon: "broom" },
  { name: "Jardinage", slug: "jardinage", icon: "leaf" },
  { name: "Peinture", slug: "peinture", icon: "brush" },
  { name: "Déménagement", slug: "demenagement", icon: "truck" },
  { name: "Bricolage", slug: "bricolage", icon: "hammer" },
  { name: "Coiffure à domicile", slug: "coiffure", icon: "cut" },
];

// A few demo providers around Paris (lat/lng) for realistic distance sorting.
const PROVIDERS = [
  { name: "Karim Bensalah", slug: "plomberie", rate: 45, bio: "Plombier 10 ans d'expérience, urgences 7j/7.", lat: 48.8566, lng: 2.3522 },
  { name: "Sophie Martin", slug: "electricite", rate: 50, bio: "Électricienne certifiée, mise aux normes.", lat: 48.8606, lng: 2.3376 },
  { name: "Awa Diop", slug: "menage", rate: 25, bio: "Ménage et repassage soignés.", lat: 48.8499, lng: 2.3700 },
  { name: "Lucas Bernard", slug: "jardinage", rate: 30, bio: "Entretien d'espaces verts et taille de haies.", lat: 48.8700, lng: 2.3100 },
  { name: "Marie Dubois", slug: "peinture", rate: 40, bio: "Peinture intérieure et décorative.", lat: 48.8450, lng: 2.3200 },
];

async function main() {
  // Categories (idempotent via upsert on slug).
  const categoryBySlug: Record<string, string> = {};
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
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

  // Demo providers.
  for (const [i, p] of PROVIDERS.entries()) {
    const password = await bcrypt.hash("password123", 10);
    const email = `provider${i + 1}@demo.com`;
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        fullName: p.name,
        phone: `+33611100${i}0${i}`,
        role: "PROVIDER",
        providerProfile: {
          create: {
            bio: p.bio,
            hourlyRate: p.rate,
            latitude: p.lat,
            longitude: p.lng,
            isAvailable: true,
            categoryId: categoryBySlug[p.slug],
          },
        },
      },
    });
  }

  console.log("Seed complete. Demo login: client@demo.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
