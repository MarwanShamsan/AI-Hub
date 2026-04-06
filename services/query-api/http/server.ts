import Fastify from "fastify";
import cors from "@fastify/cors";

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });

  return app;
}