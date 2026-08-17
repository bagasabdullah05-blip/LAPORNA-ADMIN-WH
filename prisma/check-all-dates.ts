import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  // Check Penjualan
  const pj = await p.$queryRaw`SELECT TO_CHAR(tanggal, 'YYYY-MM-DD') as tgl, tipe, "totalBayar" FROM "Penjualan" ORDER BY tanggal DESC LIMIT 10`;
  console.log("=== Penjualan (latest 10) ===");
  for (const r of pj as any[]) console.log(`  ${r.tgl} | ${r.tipe} | Rp${r.totalBayar}`);

  const pjBad = await p.$queryRaw`SELECT COUNT(*)::int as cnt FROM "Penjualan" WHERE tanggal < '2000-01-01'::timestamp`;
  console.log(`  Bad dates: ${(pjBad as any[])[0].cnt}`);

  // Check KonsinyasiLog
  const kl = await p.$queryRaw`SELECT TO_CHAR(tanggal, 'YYYY-MM-DD') as tgl, jumlah FROM "KonsinyasiLog" ORDER BY tanggal DESC LIMIT 10`;
  console.log("\n=== KonsinyasiLog (latest 10) ===");
  for (const r of kl as any[]) console.log(`  ${r.tgl} | qty: ${r.jumlah}`);

  const klBad = await p.$queryRaw`SELECT COUNT(*)::int as cnt FROM "KonsinyasiLog" WHERE tanggal < '2000-01-01'::timestamp`;
  console.log(`  Bad dates: ${(klBad as any[])[0].cnt}`);

  // Check BarangMasukLog
  const bm = await p.$queryRaw`SELECT TO_CHAR(tanggal, 'YYYY-MM-DD') as tgl, jumlah FROM "BarangMasukLog" ORDER BY tanggal DESC LIMIT 5`;
  console.log("\n=== BarangMasukLog (latest 5) ===");
  for (const r of bm as any[]) console.log(`  ${r.tgl} | qty: ${r.jumlah}`);

  const bmBad = await p.$queryRaw`SELECT COUNT(*)::int as cnt FROM "BarangMasukLog" WHERE tanggal < '2000-01-01'::timestamp`;
  console.log(`  Bad dates: ${(bmBad as any[])[0].cnt}`);

  // Check Piutang
  const pi = await p.$queryRaw`SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as ct, total, sisa, status FROM "Piutang"`;
  console.log("\n=== Piutang ===");
  for (const r of pi as any[]) console.log(`  createdAt: ${r.ct} | total: ${r.total} | sisa: ${r.sisa} | ${r.status}`);

  // Summary
  console.log("\n=== SUMMARY ===");
  const counts = await p.$queryRaw`SELECT
    (SELECT COUNT(*)::int FROM "Penjualan") as penjualan,
    (SELECT COUNT(*)::int FROM "DetailPenjualan") as detail,
    (SELECT COUNT(*)::int FROM "KonsinyasiLog") as konsinyasi,
    (SELECT COUNT(*)::int FROM "BarangMasukLog") as barangmasuk,
    (SELECT COUNT(*)::int FROM "StokKonsinyasi") as stokkonsinyasi,
    (SELECT COUNT(*)::int FROM "Piutang") as piutang,
    (SELECT COUNT(*)::int FROM "Produk") as produk,
    (SELECT COUNT(*)::int FROM "Apotek") as apotek,
    (SELECT COUNT(*)::int FROM "Sales") as sales,
    (SELECT COUNT(*)::int FROM "Pelanggan") as pelanggan
  `;
  console.log(JSON.stringify(counts[0], null, 2));

  await p.$disconnect();
}
main();
