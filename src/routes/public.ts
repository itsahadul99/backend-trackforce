import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/blog", async (req, res) => {
  const slug = req.query.slug as string | undefined;
  if (slug) {
    const post = await prisma.blogPost.findUnique({ where: { slug } });
    res.json(post ?? null);
    return;
  }
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(posts);
});

router.get("/content", async (req, res) => {
  const page = req.query.page as string | undefined;
  if (!page) {
    res.status(400).json({ error: "page required" });
    return;
  }
  const items = await prisma.pageContent.findMany({ where: { page, active: true } });
  const result: Record<string, Record<string, string>> = {};
  for (const item of items) {
    if (!result[item.section]) result[item.section] = {};
    result[item.section][item.key] = item.value;
  }
  res.json(result);
});

router.get("/faqs", async (req, res) => {
  const page = req.query.page as string | undefined;
  const where = page ? { page, active: true } : { active: true };
  const items = await prisma.faqItem.findMany({
    where,
    orderBy: [{ page: "asc" }, { order: "asc" }],
  });
  res.json(items);
});

router.get("/how-sections", async (_req, res) => {
  const sections = await prisma.trackForceSection.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  res.json(sections);
});

router.get("/slider", async (_req, res) => {
  const logos = await prisma.sliderLogo.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  res.json(logos);
});

router.get("/testimonials", async (_req, res) => {
  const items = await prisma.testimonial.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  res.json(items);
});

router.get("/settings", async (_req, res) => {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  res.json(settings);
});

export default router;
