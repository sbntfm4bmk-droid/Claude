import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export const reviewsRouter = Router();

const createSchema = z.object({
  bookingId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// POST /api/reviews — a client reviews a completed booking.
// Also recomputes the provider's aggregate rating.
reviewsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { bookingId, rating, comment } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.clientId !== req.user!.userId) {
    return res.status(403).json({ error: "Only the booking's client can review it" });
  }
  if (booking.status !== "COMPLETED") {
    return res.status(400).json({ error: "Can only review completed bookings" });
  }

  const existing = await prisma.review.findUnique({ where: { bookingId } });
  if (existing) return res.status(409).json({ error: "Booking already reviewed" });

  const review = await prisma.review.create({
    data: {
      bookingId,
      authorId: req.user!.userId,
      providerId: booking.providerId,
      rating,
      comment,
    },
  });

  // Recompute the provider's rating aggregates.
  const agg = await prisma.review.aggregate({
    where: { providerId: booking.providerId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.providerProfile.update({
    where: { id: booking.providerId },
    data: {
      ratingAvg: agg._avg.rating ?? 0,
      ratingCount: agg._count.rating,
    },
  });

  res.status(201).json({ review });
});
