import Fastify from "fastify";
import cors from "@fastify/cors";

export async function buildServer() {
  const app = Fastify({ logger: true });

  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  return app;
}