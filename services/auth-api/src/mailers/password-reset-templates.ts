import type {
  AuthLocale
} from "../types/auth";

export type PasswordResetTemplateInput = {
  recipientName?: string | null;
  resetUrl: string;
  locale: AuthLocale;
  expiresInMinutes: number;
};

export type RenderedPasswordResetTemplate = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeName(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .replace(/[\r\n\t]+/g, " ")
    .trim();

  return normalized || null;
}

function renderArabicTemplate(
  input: PasswordResetTemplateInput
): RenderedPasswordResetTemplate {
  const name =
    sanitizeName(input.recipientName);

  const greeting = name
    ? `مرحبًا ${name}،`
    : "مرحبًا،";

  const escapedGreeting =
    escapeHtml(greeting);

  const escapedUrl =
    escapeHtml(input.resetUrl);

  return {
    subject:
      "إعادة تعيين كلمة المرور في AI Hub",

    text: [
      greeting,
      "",
      "تلقينا طلبًا لإعادة تعيين كلمة المرور لحسابك في AI Hub.",
      "افتح الرابط التالي لإنشاء كلمة مرور جديدة:",
      "",
      input.resetUrl,
      "",
      `تنتهي صلاحية الرابط خلال ${input.expiresInMinutes} دقيقة.`,
      "",
      "إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة.",
      "",
      "AI Hub"
    ].join("\n"),

    html: `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    >
    <title>إعادة تعيين كلمة المرور</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f1f5f9;
      font-family:Arial,Tahoma,sans-serif;
      color:#0f172a;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="padding:32px 16px;background:#f1f5f9;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="
              max-width:600px;
              background:#ffffff;
              border:1px solid #e2e8f0;
              border-radius:20px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 32px;
                  text-align:center;
                  background:#0f172a;
                "
              >
                <div
                  style="
                    font-size:28px;
                    font-weight:700;
                    color:#ffffff;
                  "
                >
                  AI Hub
                </div>

                <div
                  style="
                    margin-top:6px;
                    font-size:14px;
                    color:#94a3b8;
                  "
                >
                  Autonomous Infrastructure
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:36px 32px;
                  text-align:right;
                "
              >
                <h1
                  style="
                    margin:0 0 20px;
                    font-size:24px;
                    line-height:1.4;
                  "
                >
                  إعادة تعيين كلمة المرور
                </h1>

                <p
                  style="
                    margin:0 0 16px;
                    font-size:16px;
                    line-height:1.8;
                  "
                >
                  ${escapedGreeting}
                </p>

                <p
                  style="
                    margin:0 0 24px;
                    font-size:16px;
                    line-height:1.8;
                    color:#334155;
                  "
                >
                  تلقينا طلبًا لإعادة تعيين كلمة المرور
                  لحسابك. اضغط على الزر التالي لإنشاء
                  كلمة مرور جديدة.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  style="margin:0 auto 24px;"
                >
                  <tr>
                    <td
                      style="
                        background:#0f172a;
                        border-radius:12px;
                        text-align:center;
                      "
                    >
                      <a
                        href="${escapedUrl}"
                        style="
                          display:inline-block;
                          padding:14px 24px;
                          color:#ffffff;
                          text-decoration:none;
                          font-size:16px;
                          font-weight:700;
                        "
                      >
                        إعادة تعيين كلمة المرور
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:0 0 12px;
                    font-size:14px;
                    line-height:1.8;
                    color:#64748b;
                  "
                >
                  تنتهي صلاحية الرابط خلال
                  ${input.expiresInMinutes}
                  دقيقة.
                </p>

                <p
                  style="
                    margin:0 0 12px;
                    font-size:14px;
                    line-height:1.8;
                    color:#64748b;
                  "
                >
                  إذا لم يعمل الزر، انسخ الرابط التالي
                  والصقه في المتصفح:
                </p>

                <p
                  dir="ltr"
                  style="
                    margin:0 0 24px;
                    padding:12px;
                    background:#f8fafc;
                    border-radius:10px;
                    word-break:break-all;
                    font-size:13px;
                    line-height:1.6;
                    color:#1d4ed8;
                    text-align:left;
                  "
                >
                  ${escapedUrl}
                </p>

                <p
                  style="
                    margin:0;
                    font-size:14px;
                    line-height:1.8;
                    color:#64748b;
                  "
                >
                  إذا لم تطلب إعادة تعيين كلمة المرور،
                  تجاهل هذه الرسالة. لن تتغير كلمة المرور
                  الحالية.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim()
  };
}

function renderEnglishTemplate(
  input: PasswordResetTemplateInput
): RenderedPasswordResetTemplate {
  const name =
    sanitizeName(input.recipientName);

  const greeting = name
    ? `Hello ${name},`
    : "Hello,";

  const escapedGreeting =
    escapeHtml(greeting);

  const escapedUrl =
    escapeHtml(input.resetUrl);

  return {
    subject:
      "Reset your AI Hub password",

    text: [
      greeting,
      "",
      "We received a request to reset your AI Hub password.",
      "Open the following link to create a new password:",
      "",
      input.resetUrl,
      "",
      `This link expires in ${input.expiresInMinutes} minutes.`,
      "",
      "If you did not request a password reset, ignore this message.",
      "",
      "AI Hub"
    ].join("\n"),

    html: `
<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    >
    <title>Reset your password</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f1f5f9;
      font-family:Arial,sans-serif;
      color:#0f172a;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="padding:32px 16px;background:#f1f5f9;"
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="
              max-width:600px;
              background:#ffffff;
              border:1px solid #e2e8f0;
              border-radius:20px;
              overflow:hidden;
            "
          >
            <tr>
              <td
                style="
                  padding:28px 32px;
                  text-align:center;
                  background:#0f172a;
                "
              >
                <div
                  style="
                    font-size:28px;
                    font-weight:700;
                    color:#ffffff;
                  "
                >
                  AI Hub
                </div>

                <div
                  style="
                    margin-top:6px;
                    font-size:14px;
                    color:#94a3b8;
                  "
                >
                  Autonomous Infrastructure
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:36px 32px;">
                <h1
                  style="
                    margin:0 0 20px;
                    font-size:24px;
                    line-height:1.4;
                  "
                >
                  Reset your password
                </h1>

                <p
                  style="
                    margin:0 0 16px;
                    font-size:16px;
                    line-height:1.8;
                  "
                >
                  ${escapedGreeting}
                </p>

                <p
                  style="
                    margin:0 0 24px;
                    font-size:16px;
                    line-height:1.8;
                    color:#334155;
                  "
                >
                  We received a request to reset your
                  password. Select the button below to
                  create a new password.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  style="margin:0 auto 24px;"
                >
                  <tr>
                    <td
                      style="
                        background:#0f172a;
                        border-radius:12px;
                        text-align:center;
                      "
                    >
                      <a
                        href="${escapedUrl}"
                        style="
                          display:inline-block;
                          padding:14px 24px;
                          color:#ffffff;
                          text-decoration:none;
                          font-size:16px;
                          font-weight:700;
                        "
                      >
                        Reset password
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin:0 0 12px;
                    font-size:14px;
                    line-height:1.8;
                    color:#64748b;
                  "
                >
                  This link expires in
                  ${input.expiresInMinutes}
                  minutes.
                </p>

                <p
                  style="
                    margin:0 0 12px;
                    font-size:14px;
                    line-height:1.8;
                    color:#64748b;
                  "
                >
                  If the button does not work, copy and
                  paste this URL into your browser:
                </p>

                <p
                  style="
                    margin:0 0 24px;
                    padding:12px;
                    background:#f8fafc;
                    border-radius:10px;
                    word-break:break-all;
                    font-size:13px;
                    line-height:1.6;
                    color:#1d4ed8;
                  "
                >
                  ${escapedUrl}
                </p>

                <p
                  style="
                    margin:0;
                    font-size:14px;
                    line-height:1.8;
                    color:#64748b;
                  "
                >
                  If you did not request a password reset,
                  ignore this message. Your current password
                  will remain unchanged.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `.trim()
  };
}

export function renderPasswordResetTemplate(
  input: PasswordResetTemplateInput
): RenderedPasswordResetTemplate {
  return input.locale === "ar"
    ? renderArabicTemplate(input)
    : renderEnglishTemplate(input);
}