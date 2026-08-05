import {
  apiJson
} from "../../lib/apiClient";
import {
  type AuthRole,
  type SessionUser,
  setSession
} from "./session";

export type AuthLocale =
  | "ar"
  | "en";

type AuthUserResponse = {
  sub: string;
  actor_type: "USER";
  tenant_id: string;
  role: AuthRole;
  agent_id: number | null;
  username: string;
  email: string;
  email_verified_at: string | null;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: AuthUserResponse;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type RegisterSupplierInput = {
  username: string;
  email: string;
  password: string;
  locale: AuthLocale;
};

export type RegisterSupplierResponse = {
  status:
    "PENDING_EMAIL_VERIFICATION";

  user: {
    id: string;
    username: string;
    email: string;
    role: "supplier";
  };
};

export type VerifyEmailResponse = {
  status: "VERIFIED";

  user: {
    id: string;
    username: string;
    email: string;
    role: "supplier";
    email_verified_at: string;
  };
};

export type ResendVerificationResponse = {
  status: "ACCEPTED";
  message: string;
};

function mapSupplierUser(
  user: AuthUserResponse
): SessionUser {
  if (user.role !== "supplier") {
    throw new Error(
      "ROLE_MISMATCH"
    );
  }

  if (!user.email_verified_at) {
    throw new Error(
      "EMAIL_NOT_VERIFIED"
    );
  }

  return {
    id: user.sub,
    username: user.username,
    email: user.email,
    role: "supplier",
    tenant_id: user.tenant_id,
    agent_id: user.agent_id,
    email_verified_at:
      user.email_verified_at
  };
}

export async function login(
  input: LoginInput
): Promise<{
  access_token: string;
  refresh_token: string;
  user: SessionUser;
}> {
  const data =
    await apiJson<LoginResponse>(
      "auth",
      "/auth/login",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          identifier:
            input.identifier
              .trim()
              .toLowerCase(),

          password: input.password,

          expected_role:
            "supplier"
        })
      }
    );

  const sessionUser =
    mapSupplierUser(data.user);

  setSession({
    accessToken:
      data.access_token,

    refreshToken:
      data.refresh_token,

    user: sessionUser
  });

  return {
    access_token:
      data.access_token,

    refresh_token:
      data.refresh_token,

    user: sessionUser
  };
}

export async function registerSupplier(
  input: RegisterSupplierInput
): Promise<RegisterSupplierResponse> {
  return apiJson<RegisterSupplierResponse>(
    "auth",
    "/auth/register",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        username:
          input.username
            .trim()
            .toLowerCase(),

        email:
          input.email
            .trim()
            .toLowerCase(),

        password: input.password,
        role: "supplier",
        locale: input.locale
      })
    }
  );
}

export async function verifyEmail(
  token: string
): Promise<VerifyEmailResponse> {
  return apiJson<VerifyEmailResponse>(
    "auth",
    "/auth/email-verification/verify",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        token
      })
    }
  );
}

export async function resendVerification(
  input: {
    email: string;
    locale: AuthLocale;
  }
): Promise<ResendVerificationResponse> {
  return apiJson<ResendVerificationResponse>(
    "auth",
    "/auth/email-verification/resend",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        email:
          input.email
            .trim()
            .toLowerCase(),

        locale: input.locale
      })
    }
  );
}

export async function getMe():
  Promise<SessionUser> {
  const data =
    await apiJson<AuthUserResponse>(
      "auth",
      "/auth/me",
      {
        method: "GET"
      }
    );

  return mapSupplierUser(data);
}

export type RequestPasswordResetInput = {
  email: string;
  locale: "ar" | "en";
};

export type RequestPasswordResetResult = {
  status: "ACCEPTED";
  message: string;
};

export type ConfirmPasswordResetInput = {
  token: string;
  new_password: string;
};

export type ConfirmPasswordResetResult = {
  status: "PASSWORD_RESET";
};

export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<RequestPasswordResetResult> {
  return apiJson<RequestPasswordResetResult>(
    "auth",
    "/auth/password-reset/request",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    }
  );
}

export async function confirmPasswordReset(
  input: ConfirmPasswordResetInput
): Promise<ConfirmPasswordResetResult> {
  return apiJson<ConfirmPasswordResetResult>(
    "auth",
    "/auth/password-reset/confirm",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    }
  );
}