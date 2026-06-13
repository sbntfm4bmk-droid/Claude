import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const appointmentsRouter = Router();

const VALID_STATUS = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

const createSchema = z.object({
  serviceId: z.string(),
  startAt: z.string().datetime(),
  notes: z.string().optional(),
});

// POST /api/appointments — a client books a service on a chosen slot.
appointmentsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { serviceId, startAt, notes } = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.isActive) return res.status(404).json({ error: "Service not found" });

  const start = new Date(startAt);
  const end = new Date(start.getTime() + service.durationMin * 60_000);

  // Guard against double-booking the same slot.
  const clash = await prisma.appointment.findFirst({
    where: {
      businessId: service.businessId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { lt: end },
      endAt: { gt: start },
    },
  });
  if (clash) return res.status(409).json({ error: "Slot no longer available" });

  const appointment = await prisma.appointment.create({
    data: {
      businessId: service.businessId,
      serviceId,
      clientId: req.user!.userId,
      startAt: start,
      endAt: end,
      priceAtBooking: service.price,
      notes,
      status: "PENDING",
    },
    include: { service: true, business: { include: { category: true } } },
  });
  res.status(201).json({ appointment });
});

// GET /api/appointments — appointments for the current user (client or provider).
appointmentsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const business = await prisma.business.findUnique({ where: { userId } });

  const appointments = await prisma.appointment.findMany({
    where: {
      OR: [
        { clientId: userId },
        business ? { businessId: business.id } : { clientId: "__none__" },
      ],
    },
    orderBy: { startAt: "desc" },
    include: {
      service: true,
      review: true,
      client: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
      business: {
        include: {
          category: true,
          user: { select: { id: true, fullName: true } },
        },
      },
    },
  });
  res.json({ appointments });
});

const statusSchema = z.object({ status: z.enum(VALID_STATUS) });

// PATCH /api/appointments/:id/status — client or provider updates status.
appointmentsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const appt = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { business: true },
  });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  const userId = req.user!.userId;
  const isClient = appt.clientId === userId;
  const isProvider = appt.business.userId === userId;
  if (!isClient && !isProvider) {
    return res.status(403).json({ error: "Not allowed to update this appointment" });
  }

  const updated = await prisma.appointment.update({
    where: { id: appt.id },
    data: { status: parsed.data.status },
  });
  res.json({ appointment: updated });
});
