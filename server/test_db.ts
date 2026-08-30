import { getPrisma } from "./src/prisma.js";

async function test() {
  const prisma = getPrisma();
  console.log("Categories:", await prisma.category.count());
  console.log("Systems:", await prisma.relatedSystem.count());
}
test().catch(console.error).finally(() => process.exit(0));
