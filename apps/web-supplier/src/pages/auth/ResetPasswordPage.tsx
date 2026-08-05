import {
  type FormEvent,
  useMemo,
  useState
} from "react";
import {
  Link,
  useSearchParams
} from "react-router-dom";

import {
  confirmPasswordReset
} from "../../features/auth/api";
import { useI18n } from "../../i18n";

function getReason(
  error: unknown
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "reason" in error &&
    typeof error.reason === "string"
  ) {
    return error.reason;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "REQUEST_FAILED";
}

export default function ResetPasswordPage() {
  const { t } = useI18n();

  const [searchParams] =
    useSearchParams();

  const token = useMemo(
    () =>
      searchParams
        .get("token")
        ?.trim() ?? "",
    [searchParams]
  );

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [error, setError] =
    useState("");

  function mapResetError(
    caughtError: unknown
  ): string {
    switch (getReason(caughtError)) {
      case "PASSWORD_RESET_TOKEN_EXPIRED":
        return t(
          "auth.passwordReset.tokenExpired"
        );

      case "PASSWORD_RESET_TOKEN_CONSUMED":
        return t(
          "auth.passwordReset.tokenConsumed"
        );

      case "PASSWORD_RESET_TOKEN_INVALID":
        return t(
          "auth.passwordReset.tokenInvalid"
        );

      case "PASSWORD_POLICY_FAILED":
        return t(
          "auth.passwordReset.passwordPolicy"
        );

      default:
        return t(
          "auth.passwordReset.confirmFailed"
        );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        t(
          "auth.passwordReset.tokenInvalid"
        )
      );

      return;
    }

    if (password.length < 8) {
      setError(
        t(
          "auth.passwordReset.passwordPolicy"
        )
      );

      return;
    }

    if (
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setError(
        t(
          "auth.passwordReset.passwordPolicy"
        )
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        t(
          "auth.passwordReset.passwordMismatch"
        )
      );

      return;
    }

    try {
      setLoading(true);

      await confirmPasswordReset({
        token,
        new_password: password
      });

      setPassword("");
      setConfirmPassword("");
      setCompleted(true);
    } catch (caughtError) {
      setError(
        mapResetError(caughtError)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>
          {t(
            "auth.passwordReset.resetTitle"
          )}
        </h1>

        <p>
          {t(
            "auth.passwordReset.resetSubtitle"
          )}
        </p>

        {completed ? (
          <div className="stack-md top-gap">
            <p
              className="success-text"
              role="status"
            >
              {t(
                "auth.passwordReset.resetSuccess"
              )}
            </p>

            <Link
              className="button"
              to="/login"
            >
              {t(
                "auth.passwordReset.loginNow"
              )}
            </Link>
          </div>
        ) : (
          <form
            className="stack-md top-gap"
            onSubmit={handleSubmit}
          >
            <label className="stack-sm">
              <span>
                {t(
                  "auth.passwordReset.newPassword"
                )}
              </span>

              <input
                className="input"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                disabled={loading}
                value={password}
                placeholder={t(
                  "auth.passwordReset.newPasswordPlaceholder"
                )}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />
            </label>

            <label className="stack-sm">
              <span>
                {t(
                  "auth.passwordReset.confirmPassword"
                )}
              </span>

              <input
                className="input"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                disabled={loading}
                value={confirmPassword}
                placeholder={t(
                  "auth.passwordReset.confirmPasswordPlaceholder"
                )}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
              />
            </label>

            <p className="muted">
              {t(
                "auth.passwordReset.passwordHelp"
              )}
            </p>

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
              disabled={
                loading || !token
              }
            >
              {loading
                ? t(
                    "auth.passwordReset.resetting"
                  )
                : t(
                    "auth.passwordReset.resetButton"
                  )}
            </button>

            <p className="muted">
              <Link to="/login">
                {t(
                  "auth.passwordReset.returnToLogin"
                )}
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}