import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const logos = await prisma.sliderLogo.findMany({ orderBy: { order: "asc" } });
  res.json(logos);
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data.image) {
      res.status(400).json({ error: "Image is required" });
      return;
    }
    const logo = await prisma.sliderLogo.create({ data });
    res.status(201).json(logo);
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Failed to create" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.sliderLogo.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Failed to update" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.sliderLogo.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Failed to delete" });
  }
});

export default router;
