import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  res.json(posts);
});

router.post("/", async (req, res) => {
  const body = req.body;
  let slug = body.slug;
  let attempt = 0;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${body.slug}-${attempt}`;
  }
  try {
    const post = await prisma.blogPost.create({ data: { ...body, slug } });
    res.json(post);
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(409).json({ error: "A post with this slug already exists." });
      return;
    }
    throw e;
  }
});

router.put("/:id", async (req, res) => {
  const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: req.body });
  res.json(post);
});

router.delete("/:id", async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
