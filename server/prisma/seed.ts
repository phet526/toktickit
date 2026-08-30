import { getPrisma } from "../src/prisma.js";

async function main() {
  const prisma = getPrisma();

  console.log("Seeding reference data and requesters...");

  // 1. Categories
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network"
  ];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log("✅ Categories seeded");

  // 2. Related Systems
  const systems = [
    "ERP",
    "HRIS",
    "CRM",
    "Email System",
    "VPN",
    "Internal Portal"
  ];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log("✅ Related Systems seeded");

  // 3. Development Requesters
  const requesters = [
    { name: "Requester A", email: "requester_a@example.com", isActive: true },
    { name: "Requester B", email: "requester_b@example.com", isActive: true },
    { name: "Requester C (Inactive)", email: "requester_c@example.com", isActive: false },
    { name: "Requester D", email: "requester_d@example.com", isActive: true },
    { name: "Requester E", email: "requester_e@example.com", isActive: true },
  ];
  for (const req of requesters) {
    await prisma.developmentRequester.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: req
    });
  }
  console.log("✅ Development Requesters seeded");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });