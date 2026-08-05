import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";

export async function buildServer() {
  const app = Fastify({
    logger: true
  });

  const allowedOrigins = (
    process.env.CORS_ORIGIN ??
    "http://localhost:5173,http://localhost:5174,http://localhost:5175"
  )
    .split(",")
    .map((origin) =>
      origin.trim().replace(/\/+$/, "")
    )
    .filter(Boolean);

  app.log.info(
    {
      allowedOrigins
    },
    "Request API CORS origins configured"
  );

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin =
        origin.replace(/\/+$/, "");

      if (
        allowedOrigins.includes(
          normalizedOrigin
        )
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `CORS blocked for origin: ${origin}`
        ),
        false
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  });

  await app.register(multipart, {
    limits: {
      fileSize: 15 * 1024 * 1024,
      files: 5
    }
  });

  return app;
}