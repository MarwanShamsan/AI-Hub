import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid port: ${value}`);
  }

  return parsed;
}

export const env = {
  port: parsePort(process.env.PORT ?? process.env.AUTH_API_PORT, 4000),
  host: process.env.HOST ?? "0.0.0.0",

  databaseUrl: requireEnv("DATABASE_URL"),

  jwtAlg: process.env.JWT_ALG ?? "EdDSA",
  jwtKid: process.env.JWT_KID ?? "",
  jwtPrivateKeyPem: requireEnv("JWT_PRIVATE_KEY_PEM"),
  jwtPublicKeyPem: requireEnv("JWT_PUBLIC_KEY_PEM"),

  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",

  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
};