import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const page = req.query.page as string | undefined;
  if (!page) {
    res.status(400).json({ error: "page required" });
    return;
  }
  const items = await prisma.pageContent.findMany({
    where: { page },
    orderBy: [{ section: "asc" }, { key: "asc" }, { createdAt: "desc" }],
  });
  res.json(items);
});

router.post("/", async (req, res) => {
  const { updates, groupId } = req.body as {
    updates: { page: string; section: string; key: string; value: string; type: string }[];
    groupId?: string;
  };

  const sections = new Set(updates.map((u) => `${u.page}::${u.section}`));
  for (const key of sections) {
    const [page, section] = key.split("::");
    await prisma.pageContent.updateMany({
      where: { page, section, active: true },
      data: { active: false },
    });
  }

  const versionLabel = groupId ?? new Date().toISOString();
  for (const u of updates) {
    await prisma.pageContent.create({
      data: {
        page: u.page,
        section: u.section,
        key: u.key,
        value: u.value,
        type: u.type,
        active: true,
        label: versionLabel,
      },
    });
  }

  res.json({ ok: true });
});

router.get("/versions", async (req, res) => {
  const page = req.query.page as string | undefined;
  const section = req.query.section as string | undefined;

  if (!page || !section) {
    res.status(400).json({ error: "page and section required" });
    return;
  }

  const rows = await prisma.pageContent.findMany({
    where: { page, section, label: { not: null } },
    orderBy: { createdAt: "desc" },
  });

  const groups: Record<string, typeof rows> = {};
  for (const row of rows) {
    const gid = row.label!;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(row);
  }

  type Row = (typeof rows)[number];
  const result = Object.entries(groups).map(([groupId, fields]: [string, Row[]]) => ({
    groupId,
    createdAt: fields[0].createdAt,
    active: fields.some((f) => f.active),
    fields: fields.map((f) => ({ key: f.key, value: f.value, type: f.type, id: f.id })),
  }));

  result.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(b.createdAt) > new Date(a.createdAt) ? 1 : -1;
  });

  res.json(result);
});

router.post("/restore", async (req, res) => {
  const { page, section, groupId } = req.body as {
    page: string;
    section: string;
    groupId: string;
  };

  if (!page || !section || !groupId) {
    res.status(400).json({ error: "page, section, groupId required" });
    return;
  }

  await prisma.pageContent.updateMany({
    where: { page, section, active: true },
    data: { active: false },
  });

  await prisma.pageContent.updateMany({
    where: { page, section, label: groupId },
    data: { active: true },
  });

  res.json({ ok: true });
});

router.patch("/:id", async (req, res) => {
  const body = req.body as {
    section?: string;
    key?: string;
    value?: string;
    type?: string;
    label?: string | null;
    active?: boolean;
  };

  const updated = await prisma.pageContent.update({
    where: { id: req.params.id },
    data: {
      ...(body.section !== undefined && { section: body.section }),
      ...(body.key !== undefined && { key: body.key }),
      ...(body.value !== undefined && { value: body.value }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.label !== undefined && { label: body.label }),
      ...(body.active !== undefined && { active: body.active }),
    },
  });

  res.json(updated);
});

router.patch("/:id/activate", async (req, res) => {
  const target = await prisma.pageContent.findUnique({ where: { id: req.params.id } });
  if (!target) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await prisma.pageContent.updateMany({
    where: { page: target.page, section: target.section, key: target.key },
    data: { active: false },
  });

  await prisma.pageContent.update({
    where: { id: req.params.id },
    data: { active: true },
  });

  res.json({ ok: true, value: target.value });
});

router.delete("/:id", async (req, res) => {
  await prisma.pageContent.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
