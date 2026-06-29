import { Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { saveFile, deleteFile } from "../lib/storage";
import { requireAuth } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const files = await prisma.mediaFile.findMany({ orderBy: { createdAt: "desc" } });
  res.json(files);
});

router.post("/", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file" });
    return;
  }

  let url: string;
  try {
    ({ url } = await saveFile(req.file.buffer, req.file.originalname));
  } catch (err) {
    console.error("File save error:", err);
    res.status(500).json({ error: "Upload failed" });
    return;
  }

  const mediaFile = await prisma.mediaFile.create({
    data: {
      name: req.file.originalname,
      url,
      size: req.file.size,
      mimeType: req.file.mimetype,
    },
  });

  res.json(mediaFile);
});

router.delete("/:id", async (req, res) => {
  const file = await prisma.mediaFile.findUnique({ where: { id: req.params.id } });
  if (!file) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await deleteFile(file.url);
  await prisma.mediaFile.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
