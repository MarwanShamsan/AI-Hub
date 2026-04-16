import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../features/auth/api";
import {
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "../../lib/storage";
import { useI18n } from "../../i18n/useI18n";

type RegisterClientForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterClientPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [form, setForm] = useState<RegisterClientForm>({
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function updateField<K extends keyof RegisterClientForm>(
    key: K,
    value: RegisterClientForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError(t("auth.register.emailRequired"));
      return;
    }

    if (!form.password.trim()) {
      setError(t("auth.register.passwordRequired"));
      return;
    }

    if (form.password.length < 6) {
      setError(t("auth.register.passwordMin"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError(t("auth.register.passwordMismatch"));
      return;
    }

    try {
      setLoading(true);

      const result = await authApi.register({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: "client"
      });

      setAccessToken(result.access_token);
      setRefreshToken(result.refresh_token);
      setStoredUser(result.user);

      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.register.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>{t("auth.register.title")}</h1>
      <p>{t("auth.register.subtitle")}</p>

      <form className="stack-md" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder={t("auth.register.emailPlaceholder")}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder={t("auth.register.passwordPlaceholder")}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder={t("auth.register.confirmPasswordPlaceholder")}
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
      </form>

      <p className="muted top-gap">
        {t("auth.register.haveAccount")} <Link to="/">{t("auth.register.signIn")}</Link>
      </p>
    </div>
  );
}