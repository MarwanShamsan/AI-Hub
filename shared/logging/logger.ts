import pino from "pino";

/**
 * Minimal production-grade logger (pino).
 * - No app logic here
 * - Safe defaults
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined, // avoid noisy pid/hostname unless you want them
  timestamp: pino.stdTimeFunctions.isoTime,
});