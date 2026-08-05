import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import {
  emailVerificationResendRateLimiter
} from "../middleware/rate-limit.middleware";

const router = Router();

router.post(
  "/register",
  authController.register
);

router.post(
  "/login",
  authController.login
);

router.post(
  "/refresh",
  authController.refresh
);

router.get(
  "/me",
  requireAuth,
  authController.me
);

router.post(
  "/email-verification/verify",
  authController.verifyEmail
);

router.post(
  "/email-verification/resend",
  emailVerificationResendRateLimiter,
  authController.resendEmailVerification
);

router.post(
  "/password-reset/request",
  authController.requestPasswordReset
);

router.post(
  "/password-reset/confirm",
  authController.confirmPasswordReset
);

export default router;