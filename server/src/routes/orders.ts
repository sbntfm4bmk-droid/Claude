import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const ordersRouter = Router();

const VALID_STATUS = ["PENDING", "PAID", "FULFILLED", "CANCELLED"] as const;

const createSchema = z.object({
  businessId: z.string(),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
  items: z
    .array(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .min(1),
});

// POST /api/orders — a client buys products from a single business (cart checkout).
ordersRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { businessId, fulfillment, items } = parsed.data;

  // Load products and validate they belong to the business and have stock.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, businessId, isActive: true },
  });
  if (products.length !== items.length) {
    return res.status(400).json({ error: "Some products are unavailable" });
  }

  const lineItems: Array<{ productId: string; quantity: number; unitPrice: number }> = [];
  for (const i of items) {
    const p = products.find((pp) => pp.id === i.productId)!;
    if (p.stock < i.quantity) {
      return res.status(400).json({ error: `Stock insuffisant: ${p.name}` });
    }
    lineItems.push({ productId: p.id, quantity: i.quantity, unitPrice: p.price });
  }
  const total = lineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);

  // Create the order and decrement stock atomically.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        businessId,
        clientId: req.user!.userId,
        fulfillment,
        total,
        status: "PENDING",
        items: { create: lineItems },
      },
      include: { items: { include: { product: true } } },
    });
    for (const li of lineItems) {
      await tx.product.update({
        where: { id: li.productId },
        data: { stock: { decrement: li.quantity } },
      });
    }
    return created;
  });

  res.status(201).json({ order });
});

// GET /api/orders — orders for the current user (as client or as provider).
ordersRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const business = await prisma.business.findUnique({ where: { userId } });

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { clientId: userId },
        business ? { businessId: business.id } : { clientId: "__none__" },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      client: { select: { id: true, fullName: true, phone: true } },
      business: { select: { id: true, name: true } },
    },
  });
  res.json({ orders });
});

const statusSchema = z.object({ status: z.enum(VALID_STATUS) });

// PATCH /api/orders/:id/status — provider or client updates order status.
ordersRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { business: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });

  const userId = req.user!.userId;
  if (order.clientId !== userId && order.business.userId !== userId) {
    return res.status(403).json({ error: "Not allowed to update this order" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: parsed.data.status },
  });
  res.json({ order: updated });
});
