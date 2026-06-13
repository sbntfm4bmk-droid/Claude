import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { distanceKm } from "../lib/geo";

export const businessesRouter = Router();

// GET /api/businesses?categoryId=&type=&lat=&lng=&radiusKm=&q=
// "Around me" discovery: lists active businesses, annotated + sorted by distance,
// optionally filtered by a maximum radius, category, type, or search query.
businessesRouter.get("/", async (req, res) => {
  const { categoryId, type, lat, lng, radiusKm, q } = req.query;

  const businesses = await prisma.business.findMany({
    where: {
      isActive: true,
      categoryId: typeof categoryId === "string" ? categoryId : undefined,
      type: typeof type === "string" ? type : undefined,
      OR: q
        ? [
            { name: { contains: String(q) } },
            { description: { contains: String(q) } },
          ]
        : undefined,
    },
    include: {
      category: true,
      user: { select: { id: true, fullName: true, avatarUrl: true } },
      _count: { select: { services: true, products: true, reviews: true } },
    },
  });

  let result = businesses.map((b) => ({ ...b, distanceKm: null as number | null }));

  if (typeof lat === "string" && typeof lng === "string") {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const max = typeof radiusKm === "string" ? parseFloat(radiusKm) : undefined;

    result = businesses
      .map((b) => ({
        ...b,
        distanceKm:
          b.latitude != null && b.longitude != null
            ? distanceKm(userLat, userLng, b.latitude, b.longitude)
            : null,
      }))
      .filter((b) => (max != null ? b.distanceKm != null && b.distanceKm <= max : true))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  res.json({ businesses: result });
});

// GET /api/businesses/me/catalog — the provider's own services & products
// (including inactive ones) for the management screen.
businessesRouter.get("/me/catalog", requireAuth, async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { userId: req.user!.userId },
    include: {
      services: { orderBy: { createdAt: "desc" } },
      products: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!business) return res.status(404).json({ error: "No business for this user" });
  res.json({ business });
});

// GET /api/businesses/:id — full storefront with services, products, reviews.
businessesRouter.get("/:id", async (req, res) => {
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
      services: { where: { isActive: true }, orderBy: { price: "asc" } },
      products: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
      openingHours: { orderBy: { weekday: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { fullName: true, avatarUrl: true } } },
      },
    },
  });
  if (!business) return res.status(404).json({ error: "Business not found" });
  res.json({ business });
});

const updateSchema = z.object({
  name: z.string().optional(),
  type: z.enum(["SERVICE", "PRODUCT", "BOTH"]).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  coverImageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Loads the authenticated provider's own business or 404s.
async function ownBusinessId(userId: string): Promise<string | null> {
  const b = await prisma.business.findUnique({ where: { userId } });
  return b?.id ?? null;
}

// PATCH /api/businesses/me — provider updates their own storefront.
businessesRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = await ownBusinessId(req.user!.userId);
  if (!id) return res.status(404).json({ error: "No business for this user" });

  const updated = await prisma.business.update({
    where: { id },
    data: parsed.data,
    include: { category: true },
  });
  res.json({ business: updated });
});
