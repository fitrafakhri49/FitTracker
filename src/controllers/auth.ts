// controllers/auth.ts
import { Request, Response } from "express";
import { supabase } from "../supabase/client";
export async function register(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ message: "User berhasil didaftarkan", user: data.user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email dan password wajib diisi" });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  res.json({ message: "Login berhasil", session: data.session });
}

// LOGIN DENGAN GOOGLE (ID TOKEN)
export async function googleVerify(req: Request, res: Response) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token,
    });

    if (error) {
      console.error("Supabase signInWithIdToken error:", error);
      return res.status(400).json({ error: error.message || error });
    }

    return res.status(200).json({ message: "Login berhasil", session: data.session, user: data.user });
  } catch (err) {
    console.error("Server error (googleVerify):", err);
    return res.status(500).json({ error: "Internal server error", detail: err });
  }
}