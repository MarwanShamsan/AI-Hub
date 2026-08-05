import {
  useEffect,
  useState
} from "react";
import {
  Link,
  useSearchParams
} from "react-router-dom";
import {
  verifyEmail
} from "../../features/auth/api";
import {
  resolveAuthErrorMessage
} from "../../features/auth/errorMessage";
import {
  useI18n
} from "../../i18n";

type VerificationState =
  | "loading"
  | "success"
  | "error";

const verificationRequests =
  new Map<string, Promise<unknown>>();

function verifyTokenOnce(
  token: string
): Promise<unknown> {
  const existing =
    verificationRequests.get(token);

  if (existing) {
    return existing;
  }

  const request =
    verifyEmail(token);

  verificationRequests.set(
    token,
    request
  );

  return request;
}

export function VerifyEmailPage() {
  const [searchParams] =
    useSearchParams();

  const {
    t,
    setLocale
  } = useI18n();

  const [state, setState] =
    useState<VerificationState>(
      "loading"
    );

  const [
    errorMessage,
    setErrorMessage
  ] = useState("");

  useEffect(() => {
    const requestedLocale =
      searchParams.get("locale");

    if (
      requestedLocale === "ar" ||
      requestedLocale === "en"
    ) {
      setLocale(requestedLocale);
    }
  }, [searchParams, setLocale]);

  useEffect(() => {
    const rawToken =
      searchParams.get("token");

    if (
      rawToken === null ||
      rawToken.trim() === ""
    ) {
      setState("error");

      setErrorMessage(
        t(
          "auth.verifyEmail.missingToken"
        )
      );

      return;
    }

    const token = rawToken.trim();

    async function runVerification():
      Promise<void> {
      try {
        await verifyTokenOnce(token);

        setState("success");
      } catch (error) {
        setState("error");

        setErrorMessage(
          resolveAuthErrorMessage(
            error,
            t,
            "auth.verifyEmail.failed"
          )
        );
      }
    }

    void runVerification();
  }, [searchParams, t]);

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
        aria-live={
          state === "error"
            ? "assertive"
            : "polite"
        }
      >
        {state === "loading" ? (
          <>
            <h1 style={{ margin: 0 }}>
              {t(
                "auth.verifyEmail.loadingTitle"
              )}
            </h1>

            <p style={{ margin: 0 }}>
              {t(
                "auth.verifyEmail.loadingDescription"
              )}
            </p>
          </>
        ) : null}

        {state === "success" ? (
          <>
            <h1 style={{ margin: 0 }}>
              {t(
                "auth.verifyEmail.successTitle"
              )}
            </h1>

            <p style={{ margin: 0 }}>
              {t(
                "auth.verifyEmail.successDescription"
              )}
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
                "auth.verifyEmail.signIn"
              )}
            </Link>
          </>
        ) : null}

        {state === "error" ? (
          <>
            <h1 style={{ margin: 0 }}>
              {t(
                "auth.verifyEmail.errorTitle"
              )}
            </h1>

            <p
              role="alert"
              style={{
                margin: 0,
                color: "#b91c1c"
              }}
            >
              {errorMessage}
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
                "auth.verifyEmail.returnToLogin"
              )}
            </Link>
          </>
        ) : null}
      </section>
    </main>
  );
}