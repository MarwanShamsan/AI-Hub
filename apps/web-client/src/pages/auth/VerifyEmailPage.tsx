import {
  useEffect,
  useRef,
  useState
} from "react";
import {
  Link,
  useSearchParams
} from "react-router-dom";
import { authApi } from "../../features/auth/api";
import {
  resolveAuthErrorMessage
} from "../../features/auth/reasonMessages";
import { useI18n } from "../../i18n/useI18n";

type VerificationState =
  | "loading"
  | "success"
  | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const {
    t,
    setLocale
  } = useI18n();

  const hasStartedRef = useRef(false);

  const [state, setState] =
    useState<VerificationState>("loading");

  const [errorMessage, setErrorMessage] =
    useState("");

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
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const token =
      searchParams.get("token");

    if (
      token === null ||
      token.trim() === ""
    ) {
      setState("error");

      setErrorMessage(
        t(
          "auth.verifyEmail.missingToken"
        )
      );

      return;
    }

    const verificationToken =
      token.trim();

    async function verify(): Promise<void> {
      try {
        await authApi.verifyEmail({
          token: verificationToken
        });

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

    void verify();
  }, [searchParams, t]);

  if (state === "loading") {
    return (
      <div
        className="stack-md"
        aria-live="polite"
      >
        <h1>
          {t(
            "auth.verifyEmail.loadingTitle"
          )}
        </h1>

        <p>
          {t(
            "auth.verifyEmail.loadingDescription"
          )}
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        className="stack-md"
        aria-live="polite"
      >
        <h1>
          {t(
            "auth.verifyEmail.successTitle"
          )}
        </h1>

        <p>
          {t(
            "auth.verifyEmail.successDescription"
          )}
        </p>

        <Link
          className="button"
          to="/"
        >
          {t(
            "auth.verifyEmail.signIn"
          )}
        </Link>
      </div>
    );
  }

  return (
    <div
      className="stack-md"
      aria-live="assertive"
    >
      <h1>
        {t(
          "auth.verifyEmail.errorTitle"
        )}
      </h1>

      <p
        className="error-text"
        role="alert"
      >
        {errorMessage}
      </p>

      <Link
        className="button"
        to="/"
      >
        {t(
          "auth.verifyEmail.returnToLogin"
        )}
      </Link>
    </div>
  );
}