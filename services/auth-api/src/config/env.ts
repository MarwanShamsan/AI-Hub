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

export const env = {
  port: Number(process.env.AUTH_API_PORT ?? 4000),
  databaseUrl: requireEnv("DATABASE_URL"),

  jwtAlg: process.env.JWT_ALG ?? "EdDSA",
  jwtKid: process.env.JWT_KID ?? "",
  jwtPrivateKeyPem: requireEnv("JWT_PRIVATE_KEY_PEM"),
  jwtPublicKeyPem: requireEnv("JWT_PUBLIC_KEY_PEM"),

  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "7d",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173"
};