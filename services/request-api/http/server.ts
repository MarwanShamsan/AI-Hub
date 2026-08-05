import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

export async function buildServer() {
  const app = Fastify({ logger: true });

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
  ];

  console.log("[request-api] allowedOrigins =", allowedOrigins);

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        cb(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }

      cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
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