import cors from "cors";
import express, {
  type Express
} from "express";
import { env } from "./config/env";
import {
  errorHandler,
  notFoundHandler
} from "./middleware/error.middleware";
import authRoutes from "./routes/auth.routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  if (env.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin =
          origin.replace(/\/+$/, "");

        if (
          env.corsOrigins.includes(
            normalizedOrigin
          )
        ) {
          callback(null, true);
          return;
        }

        callback(
          new Error("CORS_ORIGIN_REJECTED")
        );
      },

      credentials: false,

      methods: [
        "GET",
        "POST",
        "OPTIONS"
      ],

      allowedHeaders: [
        "Authorization",
        "Content-Type"
      ]
    })
  );

  app.use(
    express.json({
      limit: "64kb"
    })
  );

  app.get(
    "/health",
    (_request, response) => {
      response.status(200).json({
        status: "ok"
      });
    }
  );

  app.use(
    "/auth",
    authRoutes
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}