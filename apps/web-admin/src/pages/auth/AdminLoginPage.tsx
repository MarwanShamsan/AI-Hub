import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../lib/authApi";
import {
  clearSessionStorage,
  setAccessToken,
  setRefreshToken,
  setStoredUser
} from "../../lib/storage";

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      clearSessionStorage();

      const loginResponse = await authApi.login({
        email: email.trim(),
        password
      });

      setAccessToken(loginResponse.access_token);
      setRefreshToken(loginResponse.refresh_token);

      const me = await authApi.me(loginResponse.access_token);

      if (me.role === "supplier") {
        clearSessionStorage();
        setError("This account does not have admin access.");
        return;
      }

      setStoredUser({
        id: me.id,
        email: me.email,
        tenant_id: me.tenant_id,
        role: me.role
      });

      navigate("/app/suppliers", { replace: true });
    } catch (err: any) {
      clearSessionStorage();
      setError(err?.message || "LOGIN_FAILED");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: 24
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
          display: "grid",
          gap: 18
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28 }}>Admin Login</h1>
          <p style={{ marginTop: 8, color: "#64748b" }}>
            Sign in to review suppliers, documents, and internal qualification flows.
          </p>
        </div>

        {error ? (
          <div
            style={{
              border: "1px solid #ef4444",
              background: "#fef2f2",
              color: "#991b1b",
              padding: 12,
              borderRadius: 12
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              style={{
                height: 44,
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                padding: "0 12px",
                fontSize: 14
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                height: 44,
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                padding: "0 12px",
                fontSize: 14
              }}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 46,
              borderRadius: 10,
              border: "1px solid #111827",
              background: "#111827",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer"
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}