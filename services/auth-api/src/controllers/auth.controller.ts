import {
  type NextFunction,
  type Request,
  type Response
} from "express";
import {
  type AuthenticatedRequest
} from "../middleware/auth.middleware";
import * as authService from "../services/auth.service";
import {
  parseLoginInput,
  parseRefreshInput,
  parseRegisterInput,
  parseResendEmailVerificationInput,
  parseVerifyEmailInput,
  parseConfirmPasswordResetInput,
  parseRequestPasswordResetInput,
} from "../validators/auth.schemas";
import { AuthError } from "../errors/auth.error";

function getIpAddress(
  request: Request
): string | null {
  return request.ip || null;
}

function getUserAgent(
  request: Request
): string | null {
  const userAgent =
    request.headers["user-agent"];

  return typeof userAgent === "string"
    ? userAgent
    : null;
}

export async function register(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseRegisterInput(
      request.body
    );

    const result = await authService.register({
      ...input,
      userAgent: getUserAgent(request),
      ipAddress: getIpAddress(request)
    });

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseLoginInput(
      request.body
    );

    const result = await authService.login({
      ...input,
      userAgent: getUserAgent(request),
      ipAddress: getIpAddress(request)
    });

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseRefreshInput(
      request.body
    );

    const result = await authService.refresh({
      refreshToken:
        input.refresh_token,
      userAgent: getUserAgent(request),
      ipAddress: getIpAddress(request)
    });

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = parseVerifyEmailInput(
      request.body
    );

    const result =
      await authService.verifyEmail(
        input
      );

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function resendEmailVerification(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input =
      parseResendEmailVerificationInput(
        request.body
      );

    const result =
      await authService.resendEmailVerification(
        {
          ...input,
          userAgent:
            getUserAgent(request),
          ipAddress:
            getIpAddress(request)
        }
      );

    response.status(202).json(result);
  } catch (error) {
    next(error);
  }
}

export async function requestPasswordReset(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input =
      parseRequestPasswordResetInput(
        request.body
      );

    const result =
      await authService.requestPasswordReset(
        {
          ...input,

          userAgent:
            getUserAgent(request),

          ipAddress:
            getIpAddress(request)
        }
      );

    response.status(202).json(
      result
    );
  } catch (error) {
    next(error);
  }
}

export async function confirmPasswordReset(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input =
      parseConfirmPasswordResetInput(
        request.body
      );

    const result =
      await authService.confirmPasswordReset(
        {
          ...input,

          userAgent:
            getUserAgent(request),

          ipAddress:
            getIpAddress(request)
        }
      );

    response.status(200).json(
      result
    );
  } catch (error) {
    next(error);
  }
}

export async function me(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = request.auth?.sub;

    if (!userId) {
      throw new AuthError(
        "UNAUTHORIZED"
      );
    }

    const result =
      await authService.me(userId);

    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}