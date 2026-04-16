import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

export async function buildServer() {
  const app = Fastify({ logger: true });

  const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

  await app.register(cors, {
    origin: corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  await app.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024,
      files: 5
    }
  });

  return app;
}