import { Router } from "express";
import { prisma } from "../lib/prisma";
import { createSessionToken, sessionCookieOptions, COOKIE_NAME } from "../lib/session";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = createSessionToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.cookie(COOKIE_NAME, token, sessionCookieOptions());
    res.json({ ok: true, token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

export default router;
