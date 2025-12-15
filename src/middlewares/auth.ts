// middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase/client";

export interface AuthRequest extends Request {
  user?: any;
}
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Cek header Authorization
    let token = req.headers.authorization?.split(" ")[1];

    // 2. Jika tidak ada header, cek query (misal untuk Expo GET request)
    if (!token && req.query?.access_token) {
      token = String(req.query.access_token);
    }

    // 3. Jika token tetap null → unauthorized
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // 4. Ambil user dari Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // 5. Simpan user ke request
    req.user = data.user;

    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Set cookie untuk web (opsional)
export function setSessionCookie(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  res.cookie("sb-access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600 * 1000, // 1 jam
    sameSite: "strict",
  });

  res.cookie("sb-refresh-token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600 * 1000, // 7 hari
    sameSite: "strict",
  });
}
