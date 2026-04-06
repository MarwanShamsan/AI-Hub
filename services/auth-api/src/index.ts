import cors from "cors";
import express from "express";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: false
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.listen(env.port, () => {
  console.log(`Auth API running on port ${env.port}`);
});