import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../features/auth/api";
import {
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "../../lib/storage";
import { useI18n } from "../../i18n/useI18n";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: ""
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  function updateField<K extends keyof LoginForm>(key: K, value: LoginForm[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError(t("auth.login.emailRequired"));
      return;
    }

    if (!form.password.trim()) {
      setError(t("auth.login.passwordRequired"));
      return;
    }

    try {
      setLoading(true);

      const result = await authApi.login({
        email: form.email.trim().toLowerCase(),
        password: form.password
      });

      setAccessToken(result.access_token);
      setRefreshToken(result.refresh_token);
      setStoredUser(result.user);

      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>{t("auth.login.title")}</h1>
      <p>{t("auth.login.subtitle")}</p>

      <form className="stack-md" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder={t("auth.login.emailPlaceholder")}
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder={t("auth.login.passwordPlaceholder")}
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>

      <div className="stack-sm top-gap">
        <p className="muted">
          <Link to="/forgot-password">{t("auth.login.forgotPassword")}</Link>
        </p>

        <p className="muted">
          {t("auth.login.newHere")}{" "}
          <Link to="/register/client">{t("auth.login.createAccount")}</Link>
        </p>
      </div>
    </div>
  );
}