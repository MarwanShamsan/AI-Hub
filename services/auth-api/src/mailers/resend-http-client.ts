import { createHash } from "node:crypto";

type FetchImplementation =
  typeof fetch;

export type ResendEmailInput = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
};

type ResendErrorResponse = {
  name?: string;
};

export function createResendIdempotencyKey(
  emailType: "verification" | "password-reset",
  recipientEmail: string,
  actionUrl: string
): string {
  const digest = createHash("sha256")
    .update(
      `${emailType}\n${recipientEmail.toLowerCase()}\n${actionUrl}`,
      "utf8"
    )
    .digest("hex");

  return `ai-hub-${emailType}-${digest}`;
}

export class ResendHttpClient {
  public constructor(
    private readonly apiKey: string,
    private readonly fetchImplementation:
      FetchImplementation = fetch
  ) {
    if (!apiKey.trim()) {
      throw new Error(
        "Resend API key is required"
      );
    }
  }

  public async sendEmail(
    input: ResendEmailInput
  ): Promise<void> {
    const controller =
      new AbortController();

    const timeout = setTimeout(
      () => controller.abort(),
      10_000
    );

    try {
      const response =
        await this.fetchImplementation(
          "https://api.resend.com/emails",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${this.apiKey}`,

              "Content-Type":
                "application/json",

              "Idempotency-Key":
                input.idempotencyKey
            },

            body: JSON.stringify({
              from: input.from,
              to: [input.to],
              subject: input.subject,
              text: input.text,
              html: input.html
            }),

            signal: controller.signal
          }
        );

      if (response.ok) {
        return;
      }

      let errorName =
        "unknown_error";

      try {
        const payload =
          await response.json() as
            ResendErrorResponse;

        if (payload.name) {
          errorName = payload.name;
        }
      } catch {
        // Never expose the response body or secrets.
      }

      throw new Error(
        `Resend delivery failed: HTTP ${response.status} (${errorName})`
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error(
          "Resend delivery timed out"
        );
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}