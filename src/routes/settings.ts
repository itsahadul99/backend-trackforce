import { Router } from "express";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// --- Site settings ---

router.get("/", async (_req, res) => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  res.json(settings);
});

router.put("/", async (req, res) => {
  let body: Record<string, unknown>;
  try {
    body = req.body;
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (body.siteName !== undefined) {
    if (typeof body.siteName !== "string" || !body.siteName.trim()) {
      res.status(400).json({ error: "siteName is required" });
      return;
    }
    if (body.siteName.trim().length > 100) {
      res.status(400).json({ error: "siteName must be under 100 characters" });
      return;
    }
  }

  if (body.siteUrl !== undefined) {
    if (typeof body.siteUrl !== "string" || !body.siteUrl.trim()) {
      res.status(400).json({ error: "siteUrl is required" });
      return;
    }
    try {
      new URL(body.siteUrl as string);
    } catch {
      res.status(400).json({ error: "siteUrl must be a valid URL" });
      return;
    }
  }

  if (body.logoUrl !== undefined && body.logoUrl !== "") {
    const logo = body.logoUrl as string;
    if (typeof logo !== "string" || (!logo.startsWith("/") && !logo.startsWith("http"))) {
      res.status(400).json({ error: "logoUrl must start with / or http" });
      return;
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      res.status(400).json({ error: "description must be a string" });
      return;
    }
    if ((body.description as string).length > 500) {
      res.status(400).json({ error: "description must be under 500 characters" });
      return;
    }
  }

  const update: Record<string, string> = {};
  for (const field of ["siteName", "siteUrl", "logoUrl", "description"]) {
    if (field in body && typeof body[field] === "string") {
      update[field] = (body[field] as string).trim();
    }
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update,
    create: { id: "singleton", ...update },
  });
  res.json(settings);
});

// --- Admin env vars ---

const ENV_PATH = path.join(process.cwd(), ".env");

const ADMIN_ALLOWED_VARS = ["NEXTAUTH_SECRET", "ADMIN_BASE_URL", "ADMIN_FRONTEND_URL", "PORTFOLIO_ENV_PATH"] as const;
type AdminAllowedVar = (typeof ADMIN_ALLOWED_VARS)[number];

function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    result[key] = val;
  }
  return result;
}

function serializeEnv<T extends string>(current: string, updates: Partial<Record<T, string>>, allowedVars: readonly T[]): string {
  let lines = current.split("\n");
  const handled = new Set<string>();

  lines = lines.map((line) => {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) return line;
    const key = line.slice(0, eqIdx).trim() as T;
    if (key in updates) {
      handled.add(key);
      return `${key}="${updates[key as T]}"`;
    }
    return line;
  });

  for (const key of allowedVars) {
    if (key in updates && !handled.has(key)) {
      lines.push(`${key}="${updates[key]}"`);
    }
  }

  return lines.join("\n");
}

router.get("/env", async (_req, res) => {
  try {
    const content = await readFile(ENV_PATH, "utf-8");
    const parsed = parseEnv(content);
    const filtered = Object.fromEntries(ADMIN_ALLOWED_VARS.map((k) => [k, parsed[k] ?? ""]));
    res.json(filtered);
  } catch {
    res.status(500).json({ error: "Could not read .env file" });
  }
});

router.put("/env", async (req, res) => {
  const body: Record<string, unknown> = req.body;

  const updates: Partial<Record<AdminAllowedVar, string>> = {};
  for (const key of ADMIN_ALLOWED_VARS) {
    if (key in body) {
      if (typeof body[key] !== "string") {
        res.status(400).json({ error: `${key} must be a string` });
        return;
      }
      updates[key] = (body[key] as string).trim();
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields provided" });
    return;
  }

  for (const field of ["ADMIN_BASE_URL", "ADMIN_FRONTEND_URL"] as const) {
    if (updates[field] !== undefined) {
      if (!updates[field]) {
        res.status(400).json({ error: `${field} is required` });
        return;
      }
      try {
        new URL(updates[field]!);
      } catch {
        res.status(400).json({ error: `${field} must be a valid URL` });
        return;
      }
    }
  }

  if (updates.NEXTAUTH_SECRET !== undefined) {
    if (!updates.NEXTAUTH_SECRET) {
      res.status(400).json({ error: "NEXTAUTH_SECRET is required" });
      return;
    }
    if (updates.NEXTAUTH_SECRET.length < 16) {
      res.status(400).json({ error: "NEXTAUTH_SECRET must be at least 16 characters" });
      return;
    }
  }

  try {
    const current = await readFile(ENV_PATH, "utf-8");
    const updated = serializeEnv(current, updates, ADMIN_ALLOWED_VARS);
    await writeFile(ENV_PATH, updated, "utf-8");
    res.json({
      success: true,
      message: "Environment variables saved. Restart the server for changes to take effect.",
    });
  } catch (err) {
    console.error("env write error:", err);
    res.status(500).json({ error: "Failed to write .env file" });
  }
});

// --- Portfolio env vars ---

const PORTFOLIO_ALLOWED_VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_API_URL",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_GSC_VERIFICATION",
] as const;
type PortfolioAllowedVar = (typeof PORTFOLIO_ALLOWED_VARS)[number];

function getPortfolioEnvPath(): string {
  return (
    process.env.PORTFOLIO_ENV_PATH ??
    path.join(process.cwd(), "../trackforce-port/.env.local")
  );
}

router.get("/portfolio-env", async (_req, res) => {
  const envPath = getPortfolioEnvPath();
  try {
    const content = await readFile(envPath, "utf-8");
    const parsed = parseEnv(content);
    const filtered = Object.fromEntries(PORTFOLIO_ALLOWED_VARS.map((k) => [k, parsed[k] ?? ""]));
    res.json({ ...filtered, _path: envPath });
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      const filtered = Object.fromEntries(PORTFOLIO_ALLOWED_VARS.map((k) => [k, ""]));
      res.json({ ...filtered, _path: envPath, _missing: true });
      return;
    }
    res.status(500).json({ error: "Could not read portfolio .env file", _path: envPath });
  }
});

router.put("/portfolio-env", async (req, res) => {
  const body: Record<string, unknown> = req.body;

  const updates: Partial<Record<PortfolioAllowedVar, string>> = {};
  for (const key of PORTFOLIO_ALLOWED_VARS) {
    if (key in body) {
      if (typeof body[key] !== "string") {
        res.status(400).json({ error: `${key} must be a string` });
        return;
      }
      updates[key] = (body[key] as string).trim();
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields provided" });
    return;
  }

  for (const field of ["NEXT_PUBLIC_SITE_URL", "ADMIN_API_URL"] as const) {
    if (updates[field] !== undefined) {
      if (!updates[field]) {
        res.status(400).json({ error: `${field} is required` });
        return;
      }
      try {
        new URL(updates[field]!);
      } catch {
        res.status(400).json({ error: `${field} must be a valid URL` });
        return;
      }
    }
  }

  const envPath = getPortfolioEnvPath();
  try {
    let current = "";
    try {
      current = await readFile(envPath, "utf-8");
    } catch {
      // File doesn't exist yet — start from empty
    }
    const updated = serializeEnv(current, updates, PORTFOLIO_ALLOWED_VARS);
    await writeFile(envPath, updated, "utf-8");
    res.json({
      success: true,
      message: "Portfolio environment variables saved. Restart the portfolio server for changes to take effect.",
    });
  } catch (err) {
    console.error("portfolio env write error:", err);
    res.status(500).json({ error: `Failed to write file at ${envPath}` });
  }
});

export default router;
