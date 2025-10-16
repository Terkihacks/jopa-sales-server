const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");


const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // ------------------------------
  // 🧹 WIPE EXISTING DATA
  // ------------------------------
  if (process.env.NODE_ENV === "production" && !process.env.FORCE_WIPE) {
    console.error("❌ Refusing to wipe data in production without FORCE_WIPE=true");
    process.exit(1);
  }

  console.log("⚠️ Wiping existing data...");

  await prisma.report.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Existing data wiped clean.");

  // ------------------------------
  // 🌱 SEED USERS
  // ------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@example.com",
      password: passwordHash,
      role: "ADMIN",
    },
  });

  const recordKeeper = await prisma.user.create({
    data: {
      name: "John Keeper",
      email: "keeper@example.com",
      password: passwordHash,
      role: "RECORD_KEEPER",
    },
  });

  // ------------------------------
  // 🌱 SEED PRODUCTS
  // ------------------------------
  const products = await prisma.product.createMany({
    data: [
      { name: "Paracetamol 500mg", code: "P001", category: "Pharmaceutical", price: 10.0 },
      { name: "Vitamin C Tablets", code: "P002", category: "Supplement", price: 15.5 },
      { name: "Surgical Gloves", code: "P003", category: "Medical Supply", price: 50.0 },
      { name: "Face Mask Pack", code: "P004", category: "Medical Supply", price: 25.0 },
    ],
  });

  console.log(`✅ ${products.count} products added.`);

  // ------------------------------
  // 🌱 SEED SALES
  // ------------------------------
  await prisma.sale.createMany({
    data: [
      { productId: 1, quantity: 10, total: 100.0, profit: 25.0, userId: recordKeeper.id },
      { productId: 2, quantity: 5, total: 77.5, profit: 20.0, userId: recordKeeper.id },
    ],
  });

  console.log("✅ Sales data created.");

  // ------------------------------
  // 🌱 SEED REPORTS
  // ------------------------------
  await prisma.report.create({
    data: {
      title: "Weekly Sales Report",
      reportType: "WEEKLY",
      totalSales: 177.5,
      totalProfit: 45.0,
      startDate: new Date("2025-10-01"),
      endDate: new Date("2025-10-07"),
      generatedById: admin.id,
      summary: "Steady weekly performance across all categories.",
    },
  });

  console.log("✅ Reports added.");
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
