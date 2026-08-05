import {
  type FormEvent,
  useState
} from "react";
import {
  Link
} from "react-router-dom";
import {
  registerSupplier
} from "../../features/auth/api";
import {
  resolveAuthErrorMessage
} from "../../features/auth/errorMessage";
import {
  useI18n
} from "../../i18n";

type RegisterForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const USERNAME_PATTERN =
  /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function RegisterSupplierPage() {
  const {
    t,
    locale
  } = useI18n();

  const [form, setForm] =
    useState<RegisterForm>({
      username: "",
      email: "",
      password: "",
      confirmPassword: ""
    });

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [
    registrationComplete,
    setRegistrationComplete
  ] = useState(false);

  function updateField<
    K extends keyof RegisterForm
  >(
    field: K,
    value: RegisterForm[K]
  ): void {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function normalizeUsername(
    value: string
  ): string {
    return value
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 32);
  }

  async function onSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setError(null);

    const username =
      form.username.trim().toLowerCase();

    const email =
      form.email.trim().toLowerCase();

    if (
      !USERNAME_PATTERN.test(username)
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

    if (
      form.password.length < 8 ||
      form.password.length > 128 ||
      !/[A-Za-z]/.test(form.password) ||
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

      await registerSupplier({
        username,
        email,
        password: form.password,
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
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "#f8fafc"
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: 480,
            display: "grid",
            gap: 18,
            padding: 30,
            borderRadius: 20,
            border:
              "1px solid #e2e8f0",
            background: "#ffffff"
          }}
          aria-live="polite"
        >
          <h1 style={{ margin: 0 }}>
            {t(
              "auth.register.pendingTitle"
            )}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#475569",
              lineHeight: 1.7
            }}
          >
            {t(
              "auth.register.pendingDescription"
            )}
          </p>

          <p
            style={{
              margin: 0,
              fontWeight: 700
            }}
          >
            {form.email
              .trim()
              .toLowerCase()}
          </p>

          <Link
            to="/login"
            style={{
              minHeight: 44,
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              background: "#0f766e",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 700
            }}
          >
            {t(
              "auth.register.returnToLogin"
            )}
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f8fafc"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 480,
          display: "grid",
          gap: 20,
          padding: 30,
          borderRadius: 20,
          border:
            "1px solid #e2e8f0",
          background: "#ffffff"
        }}
      >
        <header>
          <h1 style={{ margin: 0 }}>
            {t(
              "auth.register.title"
            )}
          </h1>

          <p
            style={{
              marginBottom: 0,
              color: "#64748b",
              lineHeight: 1.7
            }}
          >
            {t(
              "auth.register.subtitle"
            )}
          </p>
        </header>

        <form
          onSubmit={onSubmit}
          style={{
            display: "grid",
            gap: 14
          }}
        >
          <label
            style={{
              display: "grid",
              gap: 7
            }}
          >
            <span>
              {t(
                "auth.register.username"
              )}
            </span>

            <input
              type="text"
              autoComplete="username"
              value={form.username}
              disabled={loading}
              placeholder={t(
                "auth.register.usernamePlaceholder"
              )}
              onChange={(event) =>
                updateField(
                  "username",
                  normalizeUsername(
                    event.target.value
                  )
                )
              }
              style={{
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 10,
                border:
                  "1px solid #cbd5e1"
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 7
            }}
          >
            <span>
              {t(
                "auth.register.email"
              )}
            </span>

            <input
              type="email"
              autoComplete="email"
              value={form.email}
              disabled={loading}
              placeholder={t(
                "auth.register.emailPlaceholder"
              )}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              style={{
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 10,
                border:
                  "1px solid #cbd5e1"
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 7
            }}
          >
            <span>
              {t(
                "auth.register.password"
              )}
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              disabled={loading}
              placeholder={t(
                "auth.register.passwordPlaceholder"
              )}
              onChange={(event) =>
                updateField(
                  "password",
                  event.target.value
                )
              }
              style={{
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 10,
                border:
                  "1px solid #cbd5e1"
              }}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 7
            }}
          >
            <span>
              {t(
                "auth.register.confirmPassword"
              )}
            </span>

            <input
              type="password"
              autoComplete="new-password"
              value={
                form.confirmPassword
              }
              disabled={loading}
              placeholder={t(
                "auth.register.confirmPasswordPlaceholder"
              )}
              onChange={(event) =>
                updateField(
                  "confirmPassword",
                  event.target.value
                )
              }
              style={{
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 10,
                border:
                  "1px solid #cbd5e1"
              }}
            />
          </label>

          {error ? (
            <p
              role="alert"
              style={{
                margin: 0,
                color: "#b91c1c"
              }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              minHeight: 44,
              border: 0,
              borderRadius: 10,
              cursor: "pointer",
              background: "#0f766e",
              color: "#ffffff",
              fontWeight: 700
            }}
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

        <p
          style={{
            margin: 0,
            textAlign: "center",
            color: "#64748b"
          }}
        >
          {t(
            "auth.register.haveAccount"
          )}{" "}
          <Link to="/login">
            {t(
              "auth.register.signIn"
            )}
          </Link>
        </p>
      </section>
    </main>
  );
}