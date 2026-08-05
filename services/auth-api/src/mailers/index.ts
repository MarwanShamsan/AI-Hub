import { env } from "../config/env";

import {
  DevelopmentEmailVerificationMailer
} from "./development-email-verification-mailer";

import type {
  EmailVerificationMailer
} from "./email-verification-mailer";

import {
  SmtpEmailVerificationMailer
} from "./smtp-email-verification-mailer";

import {
  DevelopmentPasswordResetMailer
} from "./development-password-reset-mailer";

import type {
  PasswordResetMailer
} from "./password-reset-mailer";

import {
  SmtpPasswordResetMailer
} from "./smtp-password-reset-mailer";

let cachedEmailVerificationMailer:
  EmailVerificationMailer | null = null;

let cachedPasswordResetMailer:
  PasswordResetMailer | null = null;

export function createEmailVerificationMailer():
  EmailVerificationMailer {
  if (
    env.emailProvider ===
    "development"
  ) {
    if (env.isProduction) {
      throw new Error(
        "EMAIL_PROVIDER=development is forbidden in production"
      );
    }

    return new DevelopmentEmailVerificationMailer();
  }

  return new SmtpEmailVerificationMailer();
}

export function getEmailVerificationMailer():
  EmailVerificationMailer {
  if (!cachedEmailVerificationMailer) {
    cachedEmailVerificationMailer =
      createEmailVerificationMailer();
  }

  return cachedEmailVerificationMailer;
}

export function createPasswordResetMailer():
  PasswordResetMailer {
  if (
    env.emailProvider ===
    "development"
  ) {
    if (env.isProduction) {
      throw new Error(
        "EMAIL_PROVIDER=development is forbidden in production"
      );
    }

    return new DevelopmentPasswordResetMailer();
  }

  return new SmtpPasswordResetMailer();
}

export function getPasswordResetMailer():
  PasswordResetMailer {
  if (!cachedPasswordResetMailer) {
    cachedPasswordResetMailer =
      createPasswordResetMailer();
  }

  return cachedPasswordResetMailer;
}