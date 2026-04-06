import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export async function requireAuth(
  req: Request & { auth?: { sub: string } },
  res: Response,
  next: NextFunction
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  try {
    const payload = await verifyToken(token);
    req.auth = { sub: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}