import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import {
  EmailVerificationMailer,
  SendVerificationEmailInput
} from "./email-verification-mailer";
import { renderEmailVerificationTemplate } from "./email-verification-templates";

export class SmtpEmailVerificationMailer
  implements EmailVerificationMailer
{
  private readonly transporter: Transporter;

  public constructor() {
    const {
      host,
      port,
      secure,
      user,
      password
    } = env.smtp;

    if (!host || !user || !password) {
      throw new Error(
        "SMTP configuration is incomplete"
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password
      }
    });
  }

  public async sendVerificationEmail(
    input: SendVerificationEmailInput
  ): Promise<void> {
    const template = renderEmailVerificationTemplate({
      recipientName: input.recipientName,
      verificationUrl: input.verificationUrl,
      locale: input.locale,
      expiresInMinutes: env.emailVerificationTtlMinutes
    });

    await this.transporter.sendMail({
      from: env.emailFrom,
      to: input.recipientEmail,
      subject: template.subject,
      text: template.text,
      html: template.html
    });
  }
}