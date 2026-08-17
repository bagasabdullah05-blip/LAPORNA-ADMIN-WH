import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const p = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  const counts = {
    User: await p.user.count(),
    Produk: await p.produk.count(),
    Apotek: await p.apotek.count(),
    Sales: await p.sales.count(),
    Pelanggan: await p.pelanggan.count(),
    Penjualan: await p.penjualan.count(),
    DetailPenjualan: await p.detailPenjualan.count(),
    KonsinyasiLog: await p.konsinyasiLog.count(),
    StokKonsinyasi: await p.stokKonsinyasi.count(),
    BarangMasukLog: await p.barangMasukLog.count(),
    Piutang: await p.piutang.count(),
  };
  console.log(JSON.stringify(counts, null, 2));
  await p.$disconnect();
}
main();
