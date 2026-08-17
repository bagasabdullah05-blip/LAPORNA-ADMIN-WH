import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  // Check bad penjualan raw tanggal
  const rows = await p.$queryRaw`SELECT id, tanggal::text as tgl_str FROM "Penjualan" WHERE EXTRACT(YEAR FROM tanggal) > 2100 LIMIT 5`;
  console.log("=== BAD DATES ===");
  for (const r of rows as any[]) {
    console.log(`  ${r.id.slice(0,20)} | ${r.tgl_str}`);
  }

  // Check good penjualan raw
  const good = await p.$queryRaw`SELECT id, tanggal::text as tgl_str FROM "Penjualan" WHERE EXTRACT(YEAR FROM tanggal) = 2026 LIMIT 3`;
  console.log("\n=== GOOD DATES ===");
  for (const r of good as any[]) {
    console.log(`  ${r.id.slice(0,20)} | ${r.tgl_str}`);
  }

  // Check piutang
  const piut = await p.$queryRaw`SELECT id, "createdAt"::text as ct FROM "Piutang"`;
  console.log("\n=== PIUTANG ===");
  for (const r of piut as any[]) {
    console.log(`  ${r.id.slice(0,20)} | createdAt: ${r.ct}`);
  }

  await p.$disconnect();
}
main();
