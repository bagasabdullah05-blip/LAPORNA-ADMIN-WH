import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

function excelToJS(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs);
}

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  // Fix penjualan: extract year = excel serial
  const badP = await p.$queryRaw`SELECT id, EXTRACT(YEAR FROM tanggal)::int as yr FROM "Penjualan" WHERE EXTRACT(YEAR FROM tanggal) > 2100`;
  console.log(`Fixing ${badP.length} penjualan bad dates...`);
  for (const r of badP as any[]) {
    const real = excelToJS(r.yr);
    await p.$executeRaw`UPDATE "Penjualan" SET tanggal = ${real} WHERE id = ${r.id}`;
    console.log(`  serial=${r.yr} -> ${real.toISOString().slice(0,10)}`);
  }

  // Fix piutang
  const badPi = await p.$queryRaw`SELECT id, EXTRACT(YEAR FROM "createdAt")::int as yr FROM "Piutang" WHERE EXTRACT(YEAR FROM "createdAt") > 2100`;
  console.log(`\nFixing ${badPi.length} piutang...`);
  for (const r of badPi as any[]) {
    const real = excelToJS(r.yr);
    await p.$executeRaw`UPDATE "Piutang" SET "createdAt" = ${real}, "updatedAt" = ${real} WHERE id = ${r.id}`;
    console.log(`  serial=${r.yr} -> ${real.toISOString().slice(0,10)}`);
  }

  // Fix konsinyasiLog
  const badKL = await p.$queryRaw`SELECT id, EXTRACT(YEAR FROM tanggal)::int as yr FROM "KonsinyasiLog" WHERE EXTRACT(YEAR FROM tanggal) > 2100`;
  console.log(`\nFixing ${badKL.length} konsinyasiLog...`);
  for (const r of badKL as any[]) {
    const real = excelToJS(r.yr);
    await p.$executeRaw`UPDATE "KonsinyasiLog" SET tanggal = ${real} WHERE id = ${r.id}`;
  }
  console.log(`  Done: ${badKL.length} fixed`);

  // Fix barangMasukLog
  const badBM = await p.$queryRaw`SELECT id, EXTRACT(YEAR FROM tanggal)::int as yr FROM "BarangMasukLog" WHERE EXTRACT(YEAR FROM tanggal) > 2100`;
  console.log(`\nFixing ${badBM.length} barangMasukLog...`);
  for (const r of badBM as any[]) {
    const real = excelToJS(r.yr);
    await p.$executeRaw`UPDATE "BarangMasukLog" SET tanggal = ${real} WHERE id = ${r.id}`;
  }
  console.log(`  Done: ${badBM.length} fixed`);

  // Verify
  const verify = await p.$queryRaw`SELECT TO_CHAR(tanggal, 'YYYY-MM') as month, COUNT(*)::int as count, SUM("totalBayar")::int as total FROM "Penjualan" GROUP BY TO_CHAR(tanggal, 'YYYY-MM') ORDER BY month`;
  console.log(`\n=== VERIFIED PENJUALAN BY MONTH ===`);
  for (const r of verify as any[]) {
    console.log(`  ${r.month} | ${r.count} trx | Rp${r.total}`);
  }

  const piut = await p.$queryRaw`SELECT "createdAt"::text as ct, total, sisa, status FROM "Piutang"`;
  for (const r of piut as any[]) {
    console.log(`\nPiutang createdAt: ${r.ct} | total: ${r.total} | sisa: ${r.sisa}`);
  }

  await p.$disconnect();
}
main();
