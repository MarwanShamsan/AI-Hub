import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../features/auth/api";
import {
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "../../lib/storage";

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();

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
      setError("Email is required.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
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
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <p>Client portal access for AI Hub.</p>

      <form className="stack-md" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      <div className="stack-sm top-gap">
        <p className="muted">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>

        <p className="muted">
          New here? <Link to="/register/client">Create a client account</Link>
        </p>
      </div>
    </div>
  );
}