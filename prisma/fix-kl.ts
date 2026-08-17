import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

function excelToJS(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs);
}

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  const badKL = await p.$queryRaw`SELECT id, EXTRACT(YEAR FROM tanggal)::int as yr FROM "KonsinyasiLog" WHERE EXTRACT(YEAR FROM tanggal) > 2100`;
  console.log(`Fixing ${badKL.length} konsinyasiLog...`);
  
  for (const r of badKL as any[]) {
    const real = excelToJS(r.yr);
    await p.$executeRaw`UPDATE "KonsinyasiLog" SET tanggal = ${real} WHERE id = ${r.id}`;
  }
  console.log(`Done: ${badKL.length} fixed`);

  const verify = await p.$queryRaw`SELECT EXTRACT(YEAR FROM tanggal)::int as yr, COUNT(*)::int as cnt FROM "KonsinyasiLog" WHERE EXTRACT(YEAR FROM tanggal) > 2100 GROUP BY EXTRACT(YEAR FROM tanggal)`;
  console.log(`Remaining bad: ${(verify as any[]).length}`);

  await p.$disconnect();
}
main();
