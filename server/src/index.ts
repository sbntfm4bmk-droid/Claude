import "dotenv/config";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { categoriesRouter } from "./routes/categories";
import { businessesRouter } from "./routes/businesses";
import { servicesRouter } from "./routes/services";
import { productsRouter } from "./routes/products";
import { appointmentsRouter } from "./routes/appointments";
import { ordersRouter } from "./routes/orders";
import { reviewsRouter } from "./routes/reviews";
import { favoritesRouter } from "./routes/favorites";

const app = express();
app.use(cors());
app.use(express.json());

// Health check.
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/businesses", businessesRouter);
app.use("/api/services", servicesRouter);
app.use("/api/products", productsRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/favorites", favoritesRouter);

// Centralized error handler.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`ProConnect API listening on http://localhost:${port}`);
});
