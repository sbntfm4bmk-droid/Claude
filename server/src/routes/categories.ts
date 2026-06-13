import { Router } from "express";
import { prisma } from "../lib/prisma";

export const categoriesRouter = Router();

// GET /api/categories — list all categories (trades + product categories).
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true } } },
  });
  res.json({ categories });
});
