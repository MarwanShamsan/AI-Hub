import {
  type FormEvent,
  useState
} from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../features/auth/api";
import {
  resolveAuthErrorMessage
} from "../../features/auth/reasonMessages";
import { useI18n } from "../../i18n/useI18n";

type RegisterClientForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const USERNAME_PATTERN =
  /^[a-z0-9][a-z0-9._-]{2,31}$/;

export default function RegisterClientPage() {
  const {
    t,
    locale
  } = useI18n();

  const [form, setForm] =
    useState<RegisterClientForm>({
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    registrationComplete,
    setRegistrationComplete
  ] = useState(false);

  function updateField<
    K extends keyof RegisterClientForm
  >(
    key: K,
    value: RegisterClientForm[K]
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

    const username =
      form.username
        .trim()
        .toLowerCase();

    const email =
      form.email
        .trim()
        .toLowerCase();

    if (!username) {
      setError(
        t(
          "auth.register.usernameRequired"
        )
      );

      return;
    }

    if (
      !USERNAME_PATTERN.test(
        username
      )
    ) {
      setError(
        t(
          "auth.register.usernameInvalid"
        )
      );

      return;
    }

    if (!email) {
      setError(
        t(
          "auth.register.emailRequired"
        )
      );

      return;
    }

    if (!form.password) {
      setError(
        t(
          "auth.register.passwordRequired"
        )
      );

      return;
    }

    if (
      form.password.length < 8 ||
      !/[A-Za-z]/.test(
        form.password
      ) ||
      !/\d/.test(form.password)
    ) {
      setError(
        t(
          "auth.register.passwordPolicy"
        )
      );

      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        t(
          "auth.register.passwordMismatch"
        )
      );

      return;
    }

    try {
      setLoading(true);

      await authApi.register({
        username,
        email,
        password: form.password,
        role: "client",
        locale
      });

      setRegistrationComplete(true);
    } catch (caughtError) {
      setError(
        resolveAuthErrorMessage(
          caughtError,
          t,
          "auth.register.failed"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  if (registrationComplete) {
    return (
      <div
        className="stack-md"
        aria-live="polite"
      >
        <h1>
          {t(
            "auth.register.pendingTitle"
          )}
        </h1>

        <p>
          {t(
            "auth.register.pendingDescription"
          )}
        </p>

        <p className="muted">
          {form.email
            .trim()
            .toLowerCase()}
        </p>

        <Link
          className="button"
          to="/"
        >
          {t(
            "auth.register.returnToLogin"
          )}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1>
        {t("auth.register.title")}
      </h1>

      <p>
        {t(
          "auth.register.subtitle"
        )}
      </p>

      <form
        className="stack-md"
        onSubmit={handleSubmit}
      >
        <label className="stack-sm">
          <span>
            {t(
              "auth.register.username"
            )}
          </span>

          <input
            className="input"
            type="text"
            name="username"
            autoComplete="username"
            placeholder={t(
              "auth.register.usernamePlaceholder"
            )}
            value={form.username}
            disabled={loading}
            onChange={(event) =>
              updateField(
                "username",
                event.target.value
              )
            }
          />
        </label>

        <label className="stack-sm">
          <span>
            {t(
              "auth.register.email"
            )}
          </span>

          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder={t(
              "auth.register.emailPlaceholder"
            )}
            value={form.email}
            disabled={loading}
            onChange={(event) =>
              updateField(
                "email",
                event.target.value
              )
            }
          />
        </label>

        <label className="stack-sm">
          <span>
            {t(
              "auth.register.password"
            )}
          </span>

          <input
            className="input"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder={t(
              "auth.register.passwordPlaceholder"
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

        <label className="stack-sm">
          <span>
            {t(
              "auth.register.confirmPassword"
            )}
          </span>

          <input
            className="input"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder={t(
              "auth.register.confirmPasswordPlaceholder"
            )}
            value={
              form.confirmPassword
            }
            disabled={loading}
            onChange={(event) =>
              updateField(
                "confirmPassword",
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

        <button
          className="button"
          type="submit"
          disabled={loading}
        >
          {loading
            ? t(
                "auth.register.submitting"
              )
            : t(
                "auth.register.submit"
              )}
        </button>
      </form>

      <p className="muted top-gap">
        {t(
          "auth.register.haveAccount"
        )}{" "}
        <Link to="/">
          {t(
            "auth.register.signIn"
          )}
        </Link>
      </p>
    </div>
  );
}