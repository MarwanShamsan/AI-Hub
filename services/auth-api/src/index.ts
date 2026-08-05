import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";

const app = createApp();

const server = app.listen(
  env.port,
  env.host,
  () => {
    console.log(
      `Auth API running on http://${env.host}:${env.port}`
    );
  }
);

server.on("error", (error) => {
  console.error("AUTH_API_START_ERROR", {
    name: error.name,
    message: error.message
  });

  process.exitCode = 1;
});

async function shutdown(
  signal: string
): Promise<void> {
  console.info("AUTH_API_SHUTDOWN", {
    signal
  });

  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error(
        "AUTH_API_SHUTDOWN_ERROR",
        {
          errorName:
            error instanceof Error
              ? error.name
              : "UnknownError"
        }
      );

      process.exit(1);
    }
  });
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});