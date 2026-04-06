import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../features/auth/api";
import { setAccessToken, setRefreshToken, setStoredUser } from "../../lib/storage";

type RegisterClientForm = {
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterClientPage() {
  const navigate = useNavigate();

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
      setError("Email is required.");
      return;
    }

    if (!form.password.trim()) {
      setError("Password is required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
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
      setError(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Create Client Account</h1>
      <p>Create a client account to access sourcing requests and deal tracking.</p>

      <form className="stack-md" onSubmit={handleSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <input
          className="input"
          type="password"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
        />

        {error ? <p className="error-text">{error}</p> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Client Account"}
        </button>
      </form>

      <p className="muted top-gap">
        Already have an account? <Link to="/">Sign in</Link>
      </p>
    </div>
  );
}