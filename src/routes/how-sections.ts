import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const sections = await prisma.trackForceSection.findMany({ orderBy: { order: "asc" } });
  res.json(sections);
});

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data.heading) {
      res.status(400).json({ error: "Heading is required" });
      return;
    }
    const section = await prisma.trackForceSection.create({ data });
    res.status(201).json(section);
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Failed to create" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await prisma.trackForceSection.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Failed to update" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.trackForceSection.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message ?? "Failed to delete" });
  }
});

export default router;
