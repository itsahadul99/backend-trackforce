import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";

import authRoutes from "./routes/auth";
import blogRoutes from "./routes/blog";
import contentRoutes from "./routes/content";
import faqsRoutes from "./routes/faqs";
import howSectionsRoutes from "./routes/how-sections";
import mediaRoutes from "./routes/media";
import publicRoutes from "./routes/public";
import settingsRoutes from "./routes/settings";
import sliderRoutes from "./routes/slider";
import teamRoutes from "./routes/team";
import testimonialsRoutes from "./routes/testimonials";

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = cors({
  origin: [
    process.env.ADMIN_FRONTEND_URL || "http://localhost:3001",
    process.env.PORTFOLIO_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://admin.trackforce.io",
    "https://trackforce-portfolio-admin.vercel.app",
    "http://portfolio.trackforce.io"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Sub-app mounted at /backend
const backend = express();

backend.use(corsOptions);

// Wide-open CORS for public routes
backend.use(["/api/public", "/api/media/file"], (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

backend.use(cookieParser());
backend.use(express.json());

backend.use("/api/auth", authRoutes);
backend.use("/api/blog", blogRoutes);
backend.use("/api/content", contentRoutes);
backend.use("/api/faqs", faqsRoutes);
backend.use("/api/how-sections", howSectionsRoutes);
backend.use("/api/media", mediaRoutes);
backend.use("/api/slider", sliderRoutes);
backend.use("/api/team", teamRoutes);
backend.use("/api/testimonials", testimonialsRoutes);
backend.use("/api/settings", settingsRoutes);
backend.use("/api/public", publicRoutes);

backend.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Trackforce Portfolio Backend is running 🚀" });
});

app.use("/backend", backend);

// Root health check
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Trackforce Portfolio Backend is running 🚀" });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
