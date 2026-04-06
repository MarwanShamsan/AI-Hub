import { Request, Response } from "express";
import * as authService from "../services/auth.service";

function getIpAddress(req: Request): string | null {
  return req.ip ?? null;
}

function getUserAgent(req: Request): string | null {
  const userAgent = req.headers["user-agent"];
  return typeof userAgent === "string" ? userAgent : null;
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, role } = req.body as {
      email?: string;
      password?: string;
      role?: "client" | "supplier";
    };

    if (!email || !password || !role) {
      res.status(400).json({ error: "email, password, and role are required" });
      return;
    }

    if (!["client", "supplier"].includes(role)) {
      res.status(400).json({ error: "Only client or supplier role is allowed" });
      return;
    }

    const result = await authService.register({
      email,
      password,
      role,
      userAgent: getUserAgent(req),
      ipAddress: getIpAddress(req)
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Register failed"
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    const result = await authService.login({
      email,
      password,
      userAgent: getUserAgent(req),
      ipAddress: getIpAddress(req)
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("LOGIN_ERROR", error);
    res.status(401).json({
      error: error instanceof Error ? error.message : "Login failed"
    });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refresh_token } = req.body as {
      refresh_token?: string;
    };

    if (!refresh_token) {
      res.status(400).json({ error: "refresh_token is required" });
      return;
    }

    const result = await authService.refresh({
      refreshToken: refresh_token,
      userAgent: getUserAgent(req),
      ipAddress: getIpAddress(req)
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("REFRESH_ERROR", error);
    res.status(401).json({
      error: error instanceof Error ? error.message : "Refresh failed"
    });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as Request & { auth?: { sub: string } }).auth?.sub;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await authService.me(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : "User not found"
    });
  }
}