import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  // Raw query to see tanggal values
  const rows = await p.$queryRaw`SELECT id, tanggal, "totalBayar", tipe FROM "Penjualan" LIMIT 10`;
  console.log("=== RAW PENJUALAN ===");
  for (const r of rows as any[]) {
    console.log(`  ${String(r.id).slice(0,20)} | tanggal: ${r.tanggal} (type: ${typeof r.tanggal}) | Rp${r.totalBayar} | ${r.tipe}`);
  }

  // Count by year
  const byYear = await p.$queryRaw`SELECT EXTRACT(YEAR FROM tanggal) as year, COUNT(*)::int as count FROM "Penjualan" GROUP BY EXTRACT(YEAR FROM tanggal) ORDER BY year`;
  console.log("\n=== BY YEAR ===");
  for (const r of byYear as any[]) {
    console.log(`  ${r.year} | ${r.count}`);
  }

  // Count piutang
  const piutangRows = await p.$queryRaw`SELECT id, total, sisa, status, "createdAt" FROM "Piutang"`;
  console.log("\n=== PIUTANG ===");
  for (const r of piutangRows as any[]) {
    console.log(`  total: ${r.total} | sisa: ${r.sisa} | ${r.status} | ${r.createdAt}`);
  }

  await p.$disconnect();
}
main();
