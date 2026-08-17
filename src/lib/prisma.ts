import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<typeof PrismaClient> | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required. Set it in .env or Netlify environment variables.");
  }
  const adapter = new PrismaNeon({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
}

function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
