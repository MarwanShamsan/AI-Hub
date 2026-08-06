import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

type EmailProvider =
  | "development"
  | "smtp"
  | "resend";

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function optionalEnv(name: string): string | null {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function parsePositiveInteger(
  name: string,
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Environment variable ${name} must be a positive integer`
    );
  }

  return parsed;
}

function parsePort(
  name: string,
  value: string | undefined,
  fallback: number
): number {
  const parsed = parsePositiveInteger(name, value, fallback);

  if (parsed > 65_535) {
    throw new Error(
      `Environment variable ${name} must be a valid TCP port`
    );
  }

  return parsed;
}

function parseBoolean(
  name: string,
  value: string | undefined,
  fallback: boolean
): boolean {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(
    `Environment variable ${name} must be either true or false`
  );
}

function parseEmailProvider(
  value: string | undefined
): EmailProvider {
  const normalized = (
    value ?? "development"
  )
    .trim()
    .toLowerCase();

  if (
    normalized === "development" ||
    normalized === "smtp" ||
    normalized === "resend"
  ) {
    return normalized;
  }

  throw new Error(
    "Environment variable EMAIL_PROVIDER must be development, smtp, or resend"
  );
}

function parseUrl(
  name: string,
  value: string | undefined,
  developmentDefault: string,
  isProduction: boolean
): string {
  const resolvedValue = value?.trim() || developmentDefault;

  if (isProduction && !value?.trim()) {
    throw new Error(
      `Missing required production environment variable: ${name}`
    );
  }

  try {
    const url = new URL(resolvedValue);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported URL protocol");
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error(
      `Environment variable ${name} must be a valid HTTP or HTTPS URL`
    );
  }
}

const nodeEnv = process.env.NODE_ENV?.trim() || "development";
const isProduction = nodeEnv === "production";
const emailProvider = parseEmailProvider(process.env.EMAIL_PROVIDER);

const smtpHost =
  emailProvider === "smtp"
    ? requireEnv("SMTP_HOST")
    : optionalEnv("SMTP_HOST");

const smtpUser =
  emailProvider === "smtp"
    ? requireEnv("SMTP_USER")
    : optionalEnv("SMTP_USER");

const smtpPassword =
  emailProvider === "smtp"
    ? requireEnv("SMTP_PASSWORD")
    : optionalEnv("SMTP_PASSWORD");

const resendApiKey =
  emailProvider === "resend"
    ? requireEnv("RESEND_API_KEY")
    : optionalEnv("RESEND_API_KEY");

const emailFrom =
  emailProvider === "smtp" ||
  emailProvider === "resend"
    ? requireEnv("EMAIL_FROM")
    : optionalEnv("EMAIL_FROM") ??
      "AI Hub <no-reply@localhost>";

export const env = {
  nodeEnv,
  isProduction,

  port: parsePort(
    "PORT",
    process.env.PORT ?? process.env.AUTH_API_PORT,
    4000
  ),

  host: process.env.HOST?.trim() || "0.0.0.0",

  databaseUrl: requireEnv("DATABASE_URL"),

  jwtAlg: process.env.JWT_ALG?.trim() || "EdDSA",
  jwtKid: process.env.JWT_KID?.trim() || "",
  jwtPrivateKeyPem: requireEnv("JWT_PRIVATE_KEY_PEM"),
  jwtPublicKeyPem: requireEnv("JWT_PUBLIC_KEY_PEM"),

  accessTokenExpiresIn:
    process.env.ACCESS_TOKEN_EXPIRES_IN?.trim() || "15m",

  refreshTokenExpiresIn:
    process.env.REFRESH_TOKEN_EXPIRES_IN?.trim() || "7d",

  corsOrigins: (
    process.env.CORS_ORIGIN ??
    "http://localhost:5173,http://localhost:5174"
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),

  emailProvider,

  smtp: {
    host: smtpHost,

    port: parsePort(
      "SMTP_PORT",
      process.env.SMTP_PORT,
      587
    ),

    secure: parseBoolean(
      "SMTP_SECURE",
      process.env.SMTP_SECURE,
      false
    ),

    user: smtpUser,
    password: smtpPassword
  },

  resend: {
      apiKey: resendApiKey
    },

  emailFrom,

  emailVerificationTtlMinutes: parsePositiveInteger(
    "EMAIL_VERIFICATION_TTL_MINUTES",
    process.env.EMAIL_VERIFICATION_TTL_MINUTES,
    30
  ),

  emailVerificationResendCooldownSeconds: parsePositiveInteger(
    "EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS",
    process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
    60
  ),

  emailVerificationResendWindowMinutes: parsePositiveInteger(
    "EMAIL_VERIFICATION_RESEND_WINDOW_MINUTES",
    process.env.EMAIL_VERIFICATION_RESEND_WINDOW_MINUTES,
    15
  ),

  emailVerificationResendMaxRequests: parsePositiveInteger(
    "EMAIL_VERIFICATION_RESEND_MAX_REQUESTS",
    process.env.EMAIL_VERIFICATION_RESEND_MAX_REQUESTS,
    5
  ),

    passwordResetTtlMinutes:
    parsePositiveInteger(
      "PASSWORD_RESET_TTL_MINUTES",
      process.env
        .PASSWORD_RESET_TTL_MINUTES,
      30
    ),

  passwordResetRequestCooldownSeconds:
    parsePositiveInteger(
      "PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS",
      process.env
        .PASSWORD_RESET_REQUEST_COOLDOWN_SECONDS,
      60
    ),

  passwordResetRequestWindowMinutes:
    parsePositiveInteger(
      "PASSWORD_RESET_REQUEST_WINDOW_MINUTES",
      process.env
        .PASSWORD_RESET_REQUEST_WINDOW_MINUTES,
      15
    ),

  passwordResetRequestMaxRequests:
    parsePositiveInteger(
      "PASSWORD_RESET_REQUEST_MAX_REQUESTS",
      process.env
        .PASSWORD_RESET_REQUEST_MAX_REQUESTS,
      5
    ),

  clientAppUrl: parseUrl(
    "CLIENT_APP_URL",
    process.env.CLIENT_APP_URL,
    "http://localhost:5173",
    isProduction
  ),

  supplierAppUrl: parseUrl(
    "SUPPLIER_APP_URL",
    process.env.SUPPLIER_APP_URL,
    "http://localhost:5174",
    isProduction
  )
} as const;