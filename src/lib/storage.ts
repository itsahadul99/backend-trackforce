import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PATH = "/uploads";

function baseUrl(): string {
  return (process.env.ADMIN_BASE_URL ?? "").replace(/\/+$/, "");
}

export function buildPublicUrl(filename: string): string {
  return `${baseUrl()}${PUBLIC_PATH}/${filename}`;
}

export async function saveFile(
  buffer: Buffer,
  originalName: string
): Promise<{ filename: string; url: string }> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return { filename, url: buildPublicUrl(filename) };
}

export async function deleteFile(url: string): Promise<void> {
  const filename = url.split("/").pop();
  if (!filename) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
