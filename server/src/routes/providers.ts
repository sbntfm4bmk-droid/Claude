import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { distanceKm } from "../lib/geo";

export const providersRouter = Router();

// GET /api/providers?categoryId=&lat=&lng=&q=
// Lists available providers, optionally filtered by trade and sorted by distance.
providersRouter.get("/", async (req, res) => {
  const { categoryId, lat, lng, q } = req.query;

  const providers = await prisma.providerProfile.findMany({
    where: {
      isAvailable: true,
      categoryId: typeof categoryId === "string" ? categoryId : undefined,
      user: q
        ? { fullName: { contains: String(q) } }
        : undefined,
    },
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
      category: true,
    },
  });

  // If the caller sent a location, annotate + sort by distance.
  let result = providers.map((p) => ({ ...p, distanceKm: null as number | null }));
  if (typeof lat === "string" && typeof lng === "string") {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    result = providers
      .map((p) => ({
        ...p,
        distanceKm:
          p.latitude != null && p.longitude != null
            ? distanceKm(userLat, userLng, p.latitude, p.longitude)
            : null,
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }

  res.json({ providers: result });
});

// GET /api/providers/:id — full provider detail with recent reviews.
providersRouter.get("/:id", async (req, res) => {
  const provider = await prisma.providerProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
      category: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { fullName: true, avatarUrl: true } } },
      },
    },
  });
  if (!provider) return res.status(404).json({ error: "Provider not found" });
  res.json({ provider });
});

const updateSchema = z.object({
  bio: z.string().optional(),
  hourlyRate: z.number().optional(),
  isAvailable: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  categoryId: z.string().optional(),
});

// PATCH /api/providers/me — provider updates their own profile.
providersRouter.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const profile = await prisma.providerProfile.findUnique({
    where: { userId: req.user!.userId },
  });
  if (!profile) return res.status(404).json({ error: "No provider profile for this user" });

  const updated = await prisma.providerProfile.update({
    where: { id: profile.id },
    data: parsed.data,
    include: { category: true },
  });
  res.json({ provider: updated });
});
