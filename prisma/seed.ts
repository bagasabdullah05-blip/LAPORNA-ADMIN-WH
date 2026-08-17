import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error("DATABASE_URL is required for seeding. Set it in .env");
}

const adapter = new PrismaNeon({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  const adminPassword = bcrypt.hashSync("admin123", 10);
  const agenPassword = bcrypt.hashSync("agen123", 10);

  await prisma.user.upsert({
    where: { email: "admin@apotek.com" },
    update: {},
    create: {
      email: "admin@apotek.com",
      nama: "Administrator",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "agen@apotek.com" },
    update: {},
    create: {
      email: "agen@apotek.com",
      nama: "Agen User",
      password: agenPassword,
      role: "STAFF",
    },
  });

  console.log("Default users created: admin@apotek.com / agen@apotek.com");
  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
