import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const bookingsRouter = Router();

const VALID_STATUS = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

const createSchema = z.object({
  providerId: z.string(),
  categoryId: z.string().optional(),
  description: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  scheduledAt: z.string().datetime().optional(),
});

// POST /api/bookings — a client requests a service from a provider.
bookingsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  const provider = await prisma.providerProfile.findUnique({
    where: { id: data.providerId },
  });
  if (!provider) return res.status(404).json({ error: "Provider not found" });

  const booking = await prisma.booking.create({
    data: {
      clientId: req.user!.userId,
      providerId: data.providerId,
      categoryId: data.categoryId ?? provider.categoryId,
      description: data.description,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      priceEstimate: provider.hourlyRate,
      status: "PENDING",
    },
  });
  res.status(201).json({ booking });
});

// GET /api/bookings — bookings for the current user (as client or as provider).
bookingsRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const profile = await prisma.providerProfile.findUnique({ where: { userId } });

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { clientId: userId },
        profile ? { providerId: profile.id } : { clientId: "__none__" },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      client: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
      provider: {
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, phone: true } },
        },
      },
      review: true,
    },
  });
  res.json({ bookings });
});

const statusSchema = z.object({
  status: z.enum(VALID_STATUS),
});

// PATCH /api/bookings/:id/status — provider or client updates booking status.
bookingsRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { provider: true },
  });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  // Only the client who created it or the assigned provider may update it.
  const userId = req.user!.userId;
  const isClient = booking.clientId === userId;
  const isProvider = booking.provider.userId === userId;
  if (!isClient && !isProvider) {
    return res.status(403).json({ error: "Not allowed to update this booking" });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: parsed.data.status },
  });
  res.json({ booking: updated });
});
