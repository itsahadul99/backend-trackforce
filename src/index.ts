import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth";
import blogRoutes from "./routes/blog";
import contentRoutes from "./routes/content";
import faqsRoutes from "./routes/faqs";
import howSectionsRoutes from "./routes/how-sections";
import mediaRoutes from "./routes/media";
import sliderRoutes from "./routes/slider";
import teamRoutes from "./routes/team";
import testimonialsRoutes from "./routes/testimonials";
import settingsRoutes from "./routes/settings";
import publicRoutes from "./routes/public";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: [
      process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
      process.env.PORTFOLIO_URL || "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Wide-open CORS for public API routes (portfolio site fetches these)
app.use("/api/public", (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.use("/api/auth", authRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/faqs", faqsRoutes);
app.use("/api/how-sections", howSectionsRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/slider", sliderRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/testimonials", testimonialsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/public", publicRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
