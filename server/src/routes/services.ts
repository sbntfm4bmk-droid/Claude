import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { computeSlots } from "../lib/slots";

export const servicesRouter = Router();

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMin: z.number().int().positive().default(60),
  price: z.number().nonnegative().default(0),
});

// POST /api/services — provider adds a prestation to their business.
servicesRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const business = await prisma.business.findUnique({ where: { userId: req.user!.userId } });
  if (!business) return res.status(404).json({ error: "No business for this user" });

  const service = await prisma.service.create({
    data: { ...parsed.data, businessId: business.id },
  });
  res.status(201).json({ service });
});

const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });

// PATCH /api/services/:id — provider edits one of their prestations.
servicesRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { business: true },
  });
  if (!service) return res.status(404).json({ error: "Service not found" });
  if (service.business.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your service" });
  }

  const updated = await prisma.service.update({ where: { id: service.id }, data: parsed.data });
  res.json({ service: updated });
});

// GET /api/services/:id/slots?date=YYYY-MM-DD
// Available appointment start times for the given day.
servicesRouter.get("/:id/slots", async (req, res) => {
  const dateStr = typeof req.query.date === "string" ? req.query.date : undefined;
  const day = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
  if (Number.isNaN(day.getTime())) return res.status(400).json({ error: "Invalid date" });

  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { business: { include: { openingHours: true } } },
  });
  if (!service) return res.status(404).json({ error: "Service not found" });

  // Existing appointments that day, to mark busy intervals.
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const appts = await prisma.appointment.findMany({
    where: {
      businessId: service.businessId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { gte: dayStart, lt: dayEnd },
    },
    select: { startAt: true, endAt: true },
  });

  const slots = computeSlots(
    day,
    service.durationMin,
    service.business.openingHours,
    appts.map((a) => ({ start: a.startAt, end: a.endAt }))
  );
  res.json({ slots, durationMin: service.durationMin });
});

// DELETE /api/services/:id — soft-disable a prestation.
servicesRouter.delete("/:id", requireAuth, async (req, res) => {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id },
    include: { business: true },
  });
  if (!service) return res.status(404).json({ error: "Service not found" });
  if (service.business.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your service" });
  }
  await prisma.service.update({ where: { id: service.id }, data: { isActive: false } });
  res.json({ ok: true });
});
