import {
  type FormEvent,
  useState
} from "react";
import { Link } from "react-router-dom";

import {
  requestPasswordReset
} from "../../features/auth/api";
import { useI18n } from "../../i18n/useI18n";

export default function ForgotPasswordPage() {
  const {
    t,
    locale
  } = useI18n();

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    setError("");

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(
        t("auth.passwordReset.emailRequired")
      );

      return;
    }

    try {
      setLoading(true);

      await requestPasswordReset({
        email: normalizedEmail,
        locale
      });

      setSubmitted(true);
    } catch {
      setError(
        t("auth.passwordReset.requestFailed")
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="stack-md">
        <h1>
          {t("auth.passwordReset.forgotTitle")}
        </h1>

        <p
          className="success-text"
          role="status"
        >
          {t(
            "auth.passwordReset.requestAccepted"
          )}
        </p>

        <p className="muted">
          {t("auth.passwordReset.checkInbox")}
        </p>

        <Link
          className="button"
          to="/login"
        >
          {t(
            "auth.passwordReset.returnToLogin"
          )}
        </Link>
      </div>
    );
  }

  return (
    <div className="stack-md">
      <div className="stack-sm">
        <h1>
          {t("auth.passwordReset.forgotTitle")}
        </h1>

        <p className="muted">
          {t(
            "auth.passwordReset.forgotSubtitle"
          )}
        </p>
      </div>

      <form
        className="stack-md"
        onSubmit={handleSubmit}
        aria-busy={loading}
      >
        <label className="stack-sm">
          <span>
            {t("auth.passwordReset.email")}
          </span>

          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={loading}
            value={email}
            placeholder={t(
              "auth.passwordReset.emailPlaceholder"
            )}
            onChange={(event) =>
              setEmail(event.target.value)
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

        <button
          className="button"
          type="submit"
          disabled={loading}
        >
          {loading
            ? t("auth.passwordReset.sending")
            : t("auth.passwordReset.sendLink")}
        </button>

        <p className="muted">
          <Link to="/login">
            {t(
              "auth.passwordReset.returnToLogin"
            )}
          </Link>
        </p>
      </form>
    </div>
  );
}