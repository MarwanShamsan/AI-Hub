import {
  type FormEvent,
  useState
} from "react";
import {
  Link,
  useNavigate
} from "react-router-dom";
import { authApi } from "../../features/auth/api";
import {
  resolveAuthErrorMessage
} from "../../features/auth/reasonMessages";
import {
  isApiError
} from "../../lib/apiClient";
import {
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "../../lib/storage";
import { useI18n } from "../../i18n/useI18n";

type LoginForm = {
  identifier: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();

  const {
    t,
    locale
  } = useI18n();

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

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  function updateField<
    K extends keyof LoginForm
  >(
    key: K,
    value: LoginForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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

    try {
      setLoading(true);

      const result =
        await authApi.login({
          identifier,
          password: form.password,
          expected_role: "client"
        });

      setAccessToken(
        result.access_token
      );

      setRefreshToken(
        result.refresh_token
      );

      setStoredUser(result.user);

      navigate("/app");
    } catch (caughtError) {
      if (
        isApiError(caughtError) &&
        caughtError.reason ===
          "EMAIL_NOT_VERIFIED"
      ) {
        setShowVerificationResend(
          true
        );

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

  async function handleResendVerification() {
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

      await authApi
        .resendEmailVerification({
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
    <div className="lux-auth-form">
      <div className="lux-auth-form__header">
        <span className="lux-auth-form__eyebrow">
          {locale === "ar"
            ? "دخول العميل"
            : "CLIENT SIGN IN"}
        </span>

        <h1>
          {t("auth.login.title")}
        </h1>

        <p>
          {t("auth.login.subtitle")}
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
            placeholder={t(
              "auth.login.identifierPlaceholder"
            )}
            value={form.identifier}
            disabled={loading}
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
            placeholder={t(
              "auth.login.passwordPlaceholder"
            )}
            value={form.password}
            disabled={loading}
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
              placeholder={t(
                "auth.login.verificationEmailPlaceholder"
              )}
              value={
                verificationEmail
              }
              disabled={resending}
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
                  "auth.login.resendingVerification"
                )
              : t(
                  "auth.login.resendVerification"
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
            "auth.login.newHere"
          )}{" "}

          <Link to="/register/client">
            {t(
              "auth.login.createAccount"
            )}
          </Link>
        </p>
      </div>
    </div>
  );
}