import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/auth";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "PROVIDER"]).default("CLIENT"),
  // Optional provider fields, only used when role === "PROVIDER".
  categoryId: z.string().optional(),
  hourlyRate: z.number().optional(),
  bio: z.string().optional(),
});

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      providerProfile:
        data.role === "PROVIDER"
          ? {
              create: {
                categoryId: data.categoryId,
                hourlyRate: data.hourlyRate ?? 0,
                bio: data.bio,
              },
            }
          : undefined,
    },
    include: { providerProfile: true },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return res.status(201).json({ token, user: sanitize(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { providerProfile: true },
  });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ userId: user.id, role: user.role });
  return res.json({ token, user: sanitize(user) });
});

// GET /api/auth/me — current user from token.
authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { providerProfile: { include: { category: true } } },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user: sanitize(user) });
});

// Strip the password hash before returning a user object.
function sanitize<T extends { password?: string }>(user: T) {
  const { password, ...rest } = user;
  return rest;
}
