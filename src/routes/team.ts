import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const items = await prisma.teamMember.findMany({ orderBy: { order: "asc" } });
  res.json(items);
});

router.post("/", async (req, res) => {
  const item = await prisma.teamMember.create({ data: req.body });
  res.json(item);
});

router.put("/:id", async (req, res) => {
  const item = await prisma.teamMember.update({ where: { id: req.params.id }, data: req.body });
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  await prisma.teamMember.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
