import {
  type NextFunction,
  type Request,
  type Response
} from "express";
import { AuthError } from "../errors/auth.error";
import {
  type VerifiedAuthJwtPayload,
  verifyToken
} from "../utils/jwt";

export type AuthenticatedRequest =
  Request & {
    auth?: VerifiedAuthJwtPayload;
  };

export async function requireAuth(
  request: AuthenticatedRequest,
  _response: Response,
  next: NextFunction
): Promise<void> {
  const authorization =
    request.headers.authorization;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    next(
      new AuthError("UNAUTHORIZED")
    );
    return;
  }

  const token = authorization
    .slice("Bearer ".length)
    .trim();

  if (!token) {
    next(
      new AuthError("UNAUTHORIZED")
    );
    return;
  }

  try {
    const payload =
      await verifyToken(token);

    request.auth = payload;

    next();
  } catch {
    next(
      new AuthError("UNAUTHORIZED")
    );
  }
}