import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { AuthError } from "../errors/auth.error";

export const emailVerificationResendRateLimiter =
  rateLimit({
    windowMs:
      env.emailVerificationResendWindowMinutes *
      60 *
      1000,

    limit:
      env.emailVerificationResendMaxRequests,

    standardHeaders: true,
    legacyHeaders: false,

    handler: (
      _request,
      _response,
      next
    ) => {
      next(
        new AuthError(
          "EMAIL_VERIFICATION_RESEND_RATE_LIMITED"
        )
      );
    }
  });