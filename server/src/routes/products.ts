import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const productsRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative().default(0),
  stock: z.number().int().nonnegative().default(0),
  imageUrl: z.string().optional(),
});

// POST /api/products — provider adds a product to their business.
productsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const business = await prisma.business.findUnique({ where: { userId: req.user!.userId } });
  if (!business) return res.status(404).json({ error: "No business for this user" });

  const product = await prisma.product.create({
    data: { ...parsed.data, businessId: business.id },
  });
  res.status(201).json({ product });
});

const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });

// PATCH /api/products/:id — provider edits one of their products.
productsRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { business: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.business.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your product" });
  }

  const updated = await prisma.product.update({ where: { id: product.id }, data: parsed.data });
  res.json({ product: updated });
});

// DELETE /api/products/:id — soft-disable a product.
productsRouter.delete("/:id", requireAuth, async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { business: true },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.business.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your product" });
  }
  await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
  res.json({ ok: true });
});
