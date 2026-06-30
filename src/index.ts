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
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

// Sub-app mounted at /backend
const backend = express();

backend.use(corsOptions);

// Wide-open CORS for public routes
backend.use(["/backend/api/public", "/backend/api/media/file"], (_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

backend.use(cookieParser());
backend.use(express.json());

backend.use("/backend/api/auth", authRoutes);
backend.use("/backend/api/blog", blogRoutes);
backend.use("/backend/api/content", contentRoutes);
backend.use("/backend/api/faqs", faqsRoutes);
backend.use("/backend/api/how-sections", howSectionsRoutes);
backend.use("/backend/api/media", mediaRoutes);
backend.use("/backend/api/slider", sliderRoutes);
backend.use("/backend/api/team", teamRoutes);
backend.use("/backend/api/testimonials", testimonialsRoutes);
backend.use("/backend/api/settings", settingsRoutes);
backend.use("/backend/api/public", publicRoutes);

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
