import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { buildFileUrl } from "../lib/storage";
import { requireAuth } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public route — serve image binary from DB
router.get("/file/:id", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
  if (!file || !file.data) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.send(file.data);
});

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const files = await prisma.mediaFile.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, url: true, size: true, mimeType: true, usedIn: true, createdAt: true },
  });
  res.json(files);
});

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file" });
    return;
  }

  const { originalname, size, mimetype, buffer } = req.file;
  const data = Uint8Array.from(buffer);

  const placeholder = await prisma.mediaFile.create({
    data: {
      name: originalname,
      url: "",
      size,
      mimeType: mimetype,
      data,
    },
  });

  const url = buildFileUrl(placeholder.id);
  const mediaFile = await prisma.mediaFile.update({
    where: { id: placeholder.id },
    data: { url },
    select: { id: true, name: true, url: true, size: true, mimeType: true, usedIn: true, createdAt: true },
  });

  res.json(mediaFile);
});

router.delete("/:id", async (req, res) => {
  const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
  if (!file) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.mediaFile.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
