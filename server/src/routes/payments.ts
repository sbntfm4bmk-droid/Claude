import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { charge, isLivePayments } from "../lib/payments";

export const paymentsRouter = Router();

// GET /api/payments/config — lets the client know if payments are live or simulated.
paymentsRouter.get("/config", (_req, res) => {
  res.json({ live: isLivePayments() });
});

// POST /api/payments/order/:id — client pays for a product order (full total).
paymentsRouter.post("/order/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { payment: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.clientId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your order" });
  }
  if (order.status === "PAID" || order.payment?.status === "SUCCEEDED") {
    return res.status(409).json({ error: "Order already paid" });
  }

  const result = await charge({ amount: order.total, description: `Commande ${order.id}` });
  if (result.status !== "SUCCEEDED") {
    return res.status(402).json({ error: "Payment failed" });
  }

  const [, updated] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        kind: "ORDER",
        amount: order.total,
        status: "SUCCEEDED",
        provider: result.provider,
        providerRef: result.providerRef,
        orderId: order.id,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    }),
  ]);

  res.json({ order: updated, paid: true });
});

const depositSchema = z.object({ appointmentId: z.string() });

// POST /api/payments/deposit — client pays the deposit to secure an appointment.
paymentsRouter.post("/deposit", requireAuth, async (req, res) => {
  const parsed = depositSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const appt = await prisma.appointment.findUnique({
    where: { id: parsed.data.appointmentId },
    include: { payment: true },
  });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  if (appt.clientId !== req.user!.userId) {
    return res.status(403).json({ error: "Not your appointment" });
  }
  if (appt.depositPaid) return res.status(409).json({ error: "Deposit already paid" });
  if (appt.depositAmount <= 0) {
    return res.json({ appointment: appt, paid: true, skipped: true });
  }

  const result = await charge({ amount: appt.depositAmount, description: `Acompte RDV ${appt.id}` });
  if (result.status !== "SUCCEEDED") {
    return res.status(402).json({ error: "Payment failed" });
  }

  const [, updated] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        kind: "DEPOSIT",
        amount: appt.depositAmount,
        status: "SUCCEEDED",
        provider: result.provider,
        providerRef: result.providerRef,
        appointmentId: appt.id,
      },
    }),
    prisma.appointment.update({
      where: { id: appt.id },
      data: { depositPaid: true },
    }),
  ]);

  res.json({ appointment: updated, paid: true });
});
