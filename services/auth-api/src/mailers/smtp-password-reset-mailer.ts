import nodemailer, {
  type Transporter
} from "nodemailer";
import { env } from "../config/env";
import type {
  PasswordResetMailer,
  SendPasswordResetEmailInput
} from "./password-reset-mailer";
import {
  renderPasswordResetTemplate
} from "./password-reset-templates";

export class SmtpPasswordResetMailer
  implements PasswordResetMailer {
  private readonly transporter:
    Transporter;

  public constructor() {
    if (
      !env.smtp.host ||
      !env.smtp.user ||
      !env.smtp.password
    ) {
      throw new Error(
        "SMTP configuration is incomplete"
      );
    }

    this.transporter =
      nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,

        auth: {
          user: env.smtp.user,
          pass: env.smtp.password
        }
      });
  }

  public async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput
  ): Promise<void> {
    const rendered =
      renderPasswordResetTemplate({
        recipientName:
          input.recipientName,
        resetUrl: input.resetUrl,
        locale: input.locale,
        expiresInMinutes:
          env.passwordResetTtlMinutes
      });

    await this.transporter.sendMail({
      from: env.emailFrom,
      to: input.recipientEmail,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html
    });
  }
}