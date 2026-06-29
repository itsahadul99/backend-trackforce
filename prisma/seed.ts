import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@trackforce.com" },
    update: { password: "admin123" },
    create: {
      email: "admin@trackforce.com",
      password: "admin123",
      name: "Admin",
      role: "admin",
    },
  });

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      siteName: "TrackForce",
      siteUrl: "https://trackforce.io",
      logoUrl: "/trackforce_logo.png",
      description: "Employee monitoring and productivity tracking software.",
    },
  });

  const faqCount = await prisma.faqItem.count();
  if (faqCount === 0) {
    const defaultFaqs = [
      { page: "home", question: "What is TrackForce?", answer: "TrackForce is an advanced employee monitoring and productivity tracking software designed for modern teams.", order: 0 },
      { page: "home", question: "How does TrackForce protect employee privacy?", answer: "TrackForce is built with privacy-first principles. All monitoring is transparent and employees are aware of what data is collected.", order: 1 },
      { page: "home", question: "Can I integrate TrackForce with my existing tools?", answer: "Yes, TrackForce integrates seamlessly with popular project management, communication, and HR tools.", order: 2 },
      { page: "contact", question: "How quickly can I get support?", answer: "Our support team responds within 24 hours on business days. Enterprise customers get priority support.", order: 0 },
    ];
    for (const faq of defaultFaqs) {
      await prisma.faqItem.create({ data: faq });
    }
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    const testimonials = [
      { name: "Sarah Johnson", role: "Operations Manager", company: "TechCorp", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", text: "TrackForce has completely transformed how we manage our remote team. Productivity is up 40%.", rating: 5, order: 0 },
      { name: "Mark Davis", role: "CEO", company: "Startup Inc", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", text: "Best investment we've made for our team management. The analytics are incredible.", rating: 5, order: 1 },
    ];
    for (const t of testimonials) {
      await prisma.testimonial.create({ data: t });
    }
  }

  console.log("✅ Database seeded successfully!");
  console.log("📧 Admin email: admin@trackforce.com");
  console.log("🔑 Admin password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
