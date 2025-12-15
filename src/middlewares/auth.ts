// middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase/client";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    (req as any).user = data.user;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
export function setSessionCookie(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('sb-access-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000, // 1 jam
    sameSite: 'strict'
  });
  
  res.cookie('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 604800000, // 7 hari
    sameSite: 'strict'
  });
}