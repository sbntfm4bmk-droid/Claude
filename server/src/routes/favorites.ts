import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const favoritesRouter = Router();

// GET /api/favorites — current user's saved businesses.
favoritesRouter.get("/", requireAuth, async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    include: { business: { include: { category: true } } },
  });
  res.json({ favorites });
});

const toggleSchema = z.object({ businessId: z.string() });

// POST /api/favorites/toggle — add or remove a business from favorites.
favoritesRouter.post("/toggle", requireAuth, async (req, res) => {
  const parsed = toggleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { businessId } = parsed.data;
  const userId = req.user!.userId;

  const existing = await prisma.favorite.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }
  await prisma.favorite.create({ data: { userId, businessId } });
  res.json({ favorited: true });
});
