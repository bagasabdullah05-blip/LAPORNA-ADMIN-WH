import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });

  const badP = await p.$queryRaw`SELECT EXTRACT(YEAR FROM tanggal)::int as yr, COUNT(*)::int as cnt FROM "Penjualan" WHERE EXTRACT(YEAR FROM tanggal) > 2100 GROUP BY EXTRACT(YEAR FROM tanggal)`;
  console.log("Penjualan bad:", JSON.stringify(badP));

  const badKL = await p.$queryRaw`SELECT EXTRACT(YEAR FROM tanggal)::int as yr, COUNT(*)::int as cnt FROM "KonsinyasiLog" WHERE EXTRACT(YEAR FROM tanggal) > 2100 GROUP BY EXTRACT(YEAR FROM tanggal)`;
  console.log("KonsinyasiLog bad:", JSON.stringify(badKL));

  const badBM = await p.$queryRaw`SELECT EXTRACT(YEAR FROM tanggal)::int as yr, COUNT(*)::int as cnt FROM "BarangMasukLog" WHERE EXTRACT(YEAR FROM tanggal) > 2100 GROUP BY EXTRACT(YEAR FROM tanggal)`;
  console.log("BarangMasukLog bad:", JSON.stringify(badBM));

  const piutang = await p.$queryRaw`SELECT EXTRACT(YEAR FROM "createdAt")::int as yr, COUNT(*)::int as cnt FROM "Piutang" GROUP BY EXTRACT(YEAR FROM "createdAt")`;
  console.log("Piutang:", JSON.stringify(piutang));

  const totalP = await p.penjualan.count();
  const totalKL = await p.konsinyasiLog.count();
  console.log(`\nTotal Penjualan: ${totalP}, Total KL: ${totalKL}`);

  await p.$disconnect();
}
main();
