import cors from "cors";
import express from "express";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: false
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.listen(env.port, env.host, () => {
  console.log(`Auth API running on http://${env.host}:${env.port}`);
});