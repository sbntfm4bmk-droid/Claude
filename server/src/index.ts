import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { providersRouter } from "./routes/providers";
import { bookingsRouter } from "./routes/bookings";
import { reviewsRouter } from "./routes/reviews";

const app = express();
app.use(cors());
app.use(express.json());

// Health check.
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/providers", providersRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/reviews", reviewsRouter);

// Centralized error handler.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`ProConnect API listening on http://localhost:${port}`);
});
