import {
  type NextFunction,
  type Request,
  type Response
} from "express";
import { env } from "../config/env";
import {
  AuthError,
  isAuthError
} from "../errors/auth.error";

function isJsonSyntaxError(
  error: unknown
): boolean {
  return (
    error instanceof SyntaxError &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 400
  );
}

export function notFoundHandler(
  _request: Request,
  _response: Response,
  next: NextFunction
): void {
  next(
    new AuthError("REQUEST_FAILED", {
      statusCode: 404
    })
  );
}

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  next: NextFunction
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (isAuthError(error)) {
    response
      .status(error.statusCode)
      .json(error.toPublicResponse());

    return;
  }

  if (isJsonSyntaxError(error)) {
    const authError = new AuthError(
      "REQUEST_FAILED",
      {
        statusCode: 400
      }
    );

    response
      .status(authError.statusCode)
      .json(authError.toPublicResponse());

    return;
  }

  console.error("AUTH_UNHANDLED_ERROR", {
    method: request.method,
    path: request.path,
    errorName:
      error instanceof Error
        ? error.name
        : "UnknownError",
    errorMessage:
      error instanceof Error
        ? error.message
        : "Unknown error",
    stack:
      !env.isProduction &&
      error instanceof Error
        ? error.stack
        : undefined
  });

  const authError = new AuthError(
    "REQUEST_FAILED",
    {
      statusCode: 500
    }
  );

  response
    .status(authError.statusCode)
    .json(authError.toPublicResponse());
}