import { env } from "../config/env";

import {
  DevelopmentEmailVerificationMailer
} from "./development-email-verification-mailer";

import {
  DevelopmentPasswordResetMailer
} from "./development-password-reset-mailer";

import type {
  EmailVerificationMailer
} from "./email-verification-mailer";

import type {
  PasswordResetMailer
} from "./password-reset-mailer";

import {
  ResendEmailVerificationMailer
} from "./resend-email-verification-mailer";

import {
  ResendPasswordResetMailer
} from "./resend-password-reset-mailer";

import {
  SmtpEmailVerificationMailer
} from "./smtp-email-verification-mailer";

import {
  SmtpPasswordResetMailer
} from "./smtp-password-reset-mailer";

let cachedEmailVerificationMailer:
  EmailVerificationMailer | null = null;

let cachedPasswordResetMailer:
  PasswordResetMailer | null = null;

export function createEmailVerificationMailer():
  EmailVerificationMailer {
  switch (env.emailProvider) {
    case "development":
      if (env.isProduction) {
        throw new Error(
          "EMAIL_PROVIDER=development is forbidden in production"
        );
      }

      return new DevelopmentEmailVerificationMailer();

    case "resend":
      return new ResendEmailVerificationMailer();

    case "smtp":
      return new SmtpEmailVerificationMailer();
  }
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
  switch (env.emailProvider) {
    case "development":
      if (env.isProduction) {
        throw new Error(
          "EMAIL_PROVIDER=development is forbidden in production"
        );
      }

      return new DevelopmentPasswordResetMailer();

    case "resend":
      return new ResendPasswordResetMailer();

    case "smtp":
      return new SmtpPasswordResetMailer();
  }
}

export function getPasswordResetMailer():
  PasswordResetMailer {
  if (!cachedPasswordResetMailer) {
    cachedPasswordResetMailer =
      createPasswordResetMailer();
  }

  return cachedPasswordResetMailer;
}