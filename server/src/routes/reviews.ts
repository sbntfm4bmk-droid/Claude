import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const reviewsRouter = Router();

const createSchema = z.object({
  appointmentId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// POST /api/reviews — a client reviews a completed appointment.
// Recomputes the business's aggregate rating.
reviewsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { appointmentId, rating, comment } = parsed.data;

  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  if (appt.clientId !== req.user!.userId) {
    return res.status(403).json({ error: "Only the client can review this appointment" });
  }
  if (appt.status !== "COMPLETED") {
    return res.status(400).json({ error: "Can only review completed appointments" });
  }

  const existing = await prisma.review.findUnique({ where: { appointmentId } });
  if (existing) return res.status(409).json({ error: "Appointment already reviewed" });

  const review = await prisma.review.create({
    data: {
      businessId: appt.businessId,
      authorId: req.user!.userId,
      appointmentId,
      rating,
      comment,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { businessId: appt.businessId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.business.update({
    where: { id: appt.businessId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
  });

  res.status(201).json({ review });
});
