import {
  type FormEvent,
  useState
} from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";

import {
  login,
  resendVerification
} from "../../features/auth/api";

import {
  resolveAuthErrorMessage
} from "../../features/auth/errorMessage";

import {
  clearSession
} from "../../features/auth/session";

import {
  isApiError
} from "../../lib/apiClient";

import {
  useI18n
} from "../../i18n";

import {
  supplierClient
} from "../../services/supplier-client";

import "../../styles/auth.css";
import AuthPortalShell from "../../components/auth/AuthPortalShell";

type LoginForm = {
  identifier: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();

  const {
    t,
    locale
  } = useI18n();

  const landingUrl =
    (
      import.meta.env
        .VITE_LANDING_URL
        ?.trim()
        .replace(/\/+$/, "")
    ) ||
    "http://localhost:5172";

  const clientPortalUrl =
    (
      import.meta.env
        .VITE_CLIENT_PORTAL_URL
        ?.trim()
        .replace(/\/+$/, "")
    ) ||
    "http://localhost:5173";

  const shellCopy =
    locale === "ar"
      ? {
          portalLabel:
            "بوابة المورد",

          title:
            "هوية مورد موثقة ضمن مسار تجاري محكوم.",

          description:
            "ادخل إلى مساحة المورد لإدارة بيانات الشركة ووثائق التأهيل ومتابعة الجاهزية للتنفيذ.",

          points: [
            "إدارة ملف الشركة",
            "رفع وثائق التأهيل",
            "متابعة المراجعة والجاهزية"
          ],

          backLabel:
            "العودة إلى AI Hub",

          switchPortalLabel:
            "الانتقال إلى بوابة العميل"
        }
      : {
          portalLabel:
            "SUPPLIER PORTAL",

          title:
            "A verified supplier identity in governed trade.",

          description:
            "Enter the supplier workspace to manage company data, qualification documents, and execution readiness.",

          points: [
            "Manage company profile",
            "Submit qualification documents",
            "Follow review and readiness"
          ],

          backLabel:
            "Back to AI Hub",

          switchPortalLabel:
            "Continue to Client Portal"
        };

  const [form, setForm] =
    useState<LoginForm>({
      identifier: "",
      password: ""
    });

  const [
    verificationEmail,
    setVerificationEmail
  ] = useState("");

  const [
    showVerificationResend,
    setShowVerificationResend
  ] = useState(false);

  const [
    error,
    setError
  ] = useState("");

  const [
    success,
    setSuccess
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(false);

  const [
    resending,
    setResending
  ] = useState(false);

  function updateField<
    Key extends keyof LoginForm
  >(
    key: Key,
    value: LoginForm[Key]
  ): void {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");
    setShowVerificationResend(false);

    const identifier =
      form.identifier
        .trim()
        .toLowerCase();

    if (!identifier) {
      setError(
        t(
          "auth.login.identifierRequired"
        )
      );

      return;
    }

    if (!form.password) {
      setError(
        t(
          "auth.login.passwordRequired"
        )
      );

      return;
    }

    let sessionCreated = false;

    try {
      setLoading(true);

      await login({
        identifier,
        password: form.password
      });

      sessionCreated = true;

      await supplierClient.bootstrap();

      navigate(
        "/app",
        {
          replace: true
        }
      );
    } catch (caughtError) {
      if (sessionCreated) {
        clearSession();
      }

      if (
        isApiError(caughtError) &&
        caughtError.reason ===
          "EMAIL_NOT_VERIFIED"
      ) {
        setShowVerificationResend(true);

        if (identifier.includes("@")) {
          setVerificationEmail(
            identifier
          );
        }
      }

      setError(
        resolveAuthErrorMessage(
          caughtError,
          t,
          "auth.login.failed"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function
  handleResendVerification():
    Promise<void> {
    setError("");
    setSuccess("");

    const email =
      verificationEmail
        .trim()
        .toLowerCase();

    if (!email) {
      setError(
        t(
          "auth.login.verificationEmailRequired"
        )
      );

      return;
    }

    try {
      setResending(true);

      await resendVerification({
        email,
        locale
      });

      setSuccess(
        t(
          "auth.login.verificationSent"
        )
      );
    } catch (caughtError) {
      setError(
        resolveAuthErrorMessage(
          caughtError,
          t,
          "auth.login.resendFailed"
        )
      );
    } finally {
      setResending(false);
    }
  }

   return (
    <AuthPortalShell
      portalLabel={
        shellCopy.portalLabel
      }
      title={shellCopy.title}
      description={
        shellCopy.description
      }
      points={shellCopy.points}
      landingUrl={landingUrl}
      backLabel={
        shellCopy.backLabel
      }
      switchPortalUrl={
        clientPortalUrl
      }
      switchPortalLabel={
        shellCopy.switchPortalLabel
      }
    >
      <div className="lux-auth-form">
        <div className="lux-auth-form__header">
          <span className="lux-auth-form__eyebrow">
            {locale === "ar"
              ? "دخول المورد"
              : "SUPPLIER SIGN IN"}
          </span>

          <h1>
            {t(
              "auth.login.title"
            )}
          </h1>

          <p>
            {t(
              "auth.login.subtitle"
            )}
          </p>
        </div>

        <form
          className="stack-md lux-auth-form__fields"
          onSubmit={handleSubmit}
          aria-busy={loading}
        >
          <label className="stack-sm">
            <span>
              {t(
                "auth.login.identifier"
              )}
            </span>

            <input
              className="input"
              type="text"
              name="identifier"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={form.identifier}
              disabled={loading}
              placeholder={t(
                "auth.login.identifierPlaceholder"
              )}
              onChange={(event) =>
                updateField(
                  "identifier",
                  event.target.value
                )
              }
            />
          </label>

          <label className="stack-sm">
            <span>
              {t(
                "auth.login.password"
              )}
            </span>

            <input
              className="input"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={form.password}
              disabled={loading}
              placeholder={t(
                "auth.login.passwordPlaceholder"
              )}
              onChange={(event) =>
                updateField(
                  "password",
                  event.target.value
                )
              }
            />
          </label>

          {error ? (
            <p
              className="error-text"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {success ? (
            <p
              className="success-text"
              role="status"
            >
              {success}
            </p>
          ) : null}

          <button
            className="button"
            type="submit"
            disabled={
              loading || resending
            }
          >
            {loading
              ? t(
                  "auth.login.submitting"
                )
              : t(
                  "auth.login.submit"
                )}
          </button>
        </form>

        {showVerificationResend ? (
          <div
            className="stack-md top-gap"
            aria-live="polite"
          >
            <label className="stack-sm">
              <span>
                {t(
                  "auth.login.verificationEmail"
                )}
              </span>

              <input
                className="input"
                type="email"
                name="verificationEmail"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={
                  verificationEmail
                }
                disabled={resending}
                placeholder={t(
                  "auth.login.verificationEmailPlaceholder"
                )}
                onChange={(event) =>
                  setVerificationEmail(
                    event.target.value
                  )
                }
              />
            </label>

            <button
              className="button button-secondary"
              type="button"
              disabled={
                resending || loading
              }
              onClick={() => {
                void handleResendVerification();
              }}
            >
              {resending
                ? t(
                    "auth.login.resending"
                  )
                : t(
                    "auth.login.resend"
                  )}
            </button>
          </div>
        ) : null}

        <div className="stack-sm lux-auth-form__footer">
          <p>
            <Link to="/forgot-password">
              {t(
                "auth.login.forgotPassword"
              )}
            </Link>
          </p>

          <p>
            {t(
              "auth.login.newToAiHub"
            )}{" "}

            <Link to="/register">
              {t(
                "auth.login.createSupplierAccount"
              )}
            </Link>
          </p>
        </div>
      </div>
    </AuthPortalShell>
  );
}
