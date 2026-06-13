import { Router } from "express";
import { prisma } from "../lib/prisma";

export const categoriesRouter = Router();

// GET /api/categories — list all trades/metiers.
categoriesRouter.get("/", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { providers: true } } },
  });
  res.json({ categories });
});
