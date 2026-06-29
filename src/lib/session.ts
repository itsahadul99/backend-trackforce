import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret";
export const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export type SessionUser = { id: string; email: string; name: string; role: string };

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export function createSessionToken(user: SessionUser): string {
  const encoded = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const dot = token.lastIndexOf(".");
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (sign(encoded) !== sig) return null;
    return JSON.parse(Buffer.from(encoded, "base64url").toString());
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE * 1000, // Express uses milliseconds
    path: "/",
  };
}
