import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcryptjs";
import path from "node:path";

const EXCEL_PATH = path.resolve(process.cwd(), "import-data", "POS_Data.xlsx");

function parseExcel(filePath: string) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const wb = XLSX.readFile(filePath);
  const result: Record<string, Record<string, unknown>[]> = {};
  for (const name of wb.SheetNames) {
    result[name] = XLSX.utils.sheet_to_json(wb.Sheets[name]);
  }
  return result;
}

function generateCuid(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let c = "clx";
  for (let i = 0; i < 20; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith("postgres")) {
    throw new Error("DATABASE_URL must be PostgreSQL.");
  }

  const adapter = new PrismaNeon({ connectionString: dbUrl });
  const prisma = new PrismaClient({ adapter });

  console.log("Reading Excel...");
  const sheets = parseExcel(EXCEL_PATH);

  const produkMap = new Map<number, string>();
  const apotekMap = new Map<number, string>();
  const salesMap = new Map<number, string>();
  const pelangganMap = new Map<number, string>();

  // Users
  console.log("Users...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@apotek.com" }, update: {},
    create: { email: "admin@apotek.com", nama: "Administrator", password: bcrypt.hashSync("admin123", 10), role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "agen@apotek.com" }, update: {},
    create: { email: "agen@apotek.com", nama: "Agen User", password: bcrypt.hashSync("agen123", 10), role: "STAFF" },
  });
  console.log(`  Admin: ${admin.id}`);

  // Sales
  console.log("Sales...");
  await prisma.sales.createMany({
    data: sheets["Sales"].map((r: Record<string, unknown>) => {
      const id = generateCuid(); salesMap.set(Number(r["id"]), id);
      return { id, nama: String(r["nama"] || ""), noTelp: "", alamat: "" };
    }),
  });
  console.log(`  ${sheets["Sales"].length} done`);

  // Produk
  console.log("Produk...");
  const stokMap = new Map<number, number>();
  for (const r of sheets["StokGudang"]) stokMap.set(Number(r["Key"]), Number(r["Value"] || 0));
  await prisma.produk.createMany({
    data: sheets["Produk"].map((r: Record<string, unknown>) => {
      const srcId = Number(r["id"]); const id = generateCuid(); produkMap.set(srcId, id);
      const nl = String(r["nama"] || "").toLowerCase();
      let kat = "Umum";
      if (nl.includes("madu") || nl.includes("vitamin")) kat = "Vitamin";
      else if (nl.includes("salep") || nl.includes("cream") || nl.includes("gel")) kat = "Obat Luar";
      else if (nl.includes("kapsul") || nl.includes("herbal")) kat = "Suplemen";
      else if (nl.includes("masker") || nl.includes("alat")) kat = "Alat Kesehatan";
      else if (nl.includes("sirup") || nl.includes("cair") || nl.includes("drop")) kat = "Obat Cair";
      else if (nl.includes("tablet") || nl.includes("tab")) kat = "Obat Bebas";
      return {
        id, nama: String(r["nama"] || ""), kategori: kat, satuan: "Pcs", bentuk: "Lainnya",
        hpp: Number(r["hpp"] || 0), hargaMember: Number(r["harga_member"] || 0),
        hargaAgent: Number(r["harga_agent"] || 0), hargaKarton: Number(r["harga_karton"] || 0),
        hargaAptCash: Number(r["harga_apotek_cash"] || 0), hargaKonsinyasi: Number(r["harga_konsinyasi"] || 0),
        hargaTerendah: Number(r["harga_terendah"] || 0), stokGudang: stokMap.get(srcId) || 0, minStok: 0,
      };
    }),
  });
  console.log(`  ${sheets["Produk"].length} done`);

  // Apotek
  console.log("Apotek...");
  await prisma.apotek.createMany({
    data: sheets["Apotek"].map((r: Record<string, unknown>) => {
      const id = generateCuid(); apotekMap.set(Number(r["id"]), id);
      return { id, nama: String(r["nama"] || ""), alamat: String(r["alamat"] || ""), noTelp: "", pemilik: "", pic: "" };
    }),
  });
  console.log(`  ${sheets["Apotek"].length} done`);

  // Pelanggan
  console.log("Pelanggan...");
  await prisma.pelanggan.createMany({
    data: sheets["Pelanggan"].map((r: Record<string, unknown>) => {
      const id = generateCuid(); pelangganMap.set(Number(r["id"]), id);
      return { id, nama: String(r["nama"] || ""), tipe: String(r["tipe"] || "UMUM").toUpperCase(), alamat: "", noTelp: "" };
    }),
  });
  console.log(`  ${sheets["Pelanggan"].length} done`);

  // BarangMasukLog
  console.log("BarangMasukLog...");
  const bmRows: { produkId: string; jumlah: number; hargaBeli: number; keterangan: string; tanggal: Date }[] = [];
  for (const r of sheets["BarangMasukLog"]) {
    const pid = produkMap.get(Number(r["id_produk"]));
    if (pid) bmRows.push({ produkId: pid, jumlah: Number(r["qty"] || 0), hargaBeli: 0, keterangan: "Import", tanggal: new Date(String(r["tgl"])) });
  }
  if (bmRows.length) await prisma.barangMasukLog.createMany({ data: bmRows });
  console.log(`  ${bmRows.length} done`);

  // KonsinyasiLog
  console.log("KonsinyasiLog...");
  const defSales = salesMap.values().next().value || admin.id;
  const klRows: { apotekId: string; produkId: string; salesId: string; jumlah: number; keterangan: string; tanggal: Date }[] = [];
  for (const r of sheets["KonsinyasiLog"]) {
    const aid = apotekMap.get(Number(r["apotek_id"]));
    const pid = produkMap.get(Number(r["produk_id"]));
    if (aid && pid) klRows.push({ apotekId: aid, produkId: pid, salesId: defSales, jumlah: Number(r["qty"] || 0), keterangan: "Import", tanggal: new Date(String(r["tgl"])) });
  }
  for (let i = 0; i < klRows.length; i += 1000) {
    await prisma.konsinyasiLog.createMany({ data: klRows.slice(i, i + 1000) });
    console.log(`  ${Math.min(i + 1000, klRows.length)}/${klRows.length}`);
  }
  console.log(`  ${klRows.length} done`);

  // StokKonsinyasi via raw SQL batch
  console.log("StokKonsinyasi...");
  const stokRows: string[] = [];
  for (const r of sheets["StokKonsinyasi"]) {
    const key = String(r["Key"] || "");
    const [aStr, pStr] = key.split("|");
    if (!aStr || !pStr) continue;
    const aid = apotekMap.get(Number(aStr));
    const pid = produkMap.get(Number(pStr));
    if (!aid || !pid) continue;
    const jml = Number(r["Value"] || 0);
    if (jml <= 0) continue;
    stokRows.push(`('${esc(generateCuid())}','${esc(aid)}','${esc(pid)}',${jml})`);
  }
  const BATCH = 500;
  for (let i = 0; i < stokRows.length; i += BATCH) {
    const chunk = stokRows.slice(i, i + BATCH).join(",");
    await prisma.$executeRawUnsafe(`INSERT INTO "StokKonsinyasi" ("id","apotekId","produkId","jumlah") VALUES ${chunk}`);
    console.log(`  ${Math.min(i + BATCH, stokRows.length)}/${stokRows.length}`);
  }
  console.log(`  ${stokRows.length} done`);

  // PenjualanKonsinyasi
  console.log("Penjualan Konsinyasi...");
  type IR = Record<string, unknown>;
  const kg = new Map<string, { tgl: Date; aid: string; sid: string; items: IR[] }>();
  for (const r of sheets["PenjualanKonsinyasi"]) {
    const aid = apotekMap.get(Number(r["apotek_id"])) || "";
    const sid = salesMap.get(Number(r["sales_id"])) || defSales;
    const tgl = new Date(String(r["tgl"]));
    const dk = `${tgl.toISOString().slice(0, 10)}_${aid}_${sid}`;
    if (!kg.has(dk)) kg.set(dk, { tgl, aid, sid, items: [] });
    kg.get(dk)!.items.push(r);
  }
  let pk = 0, dk2 = 0;
  for (const [, g] of kg) {
    let tb = 0;
    const dd: { produkId: string; jumlah: number; tipeHarga: string; hargaSatuan: number; subtotal: number }[] = [];
    for (const it of g.items) {
      const pid = produkMap.get(Number(it["produk_id"]));
      if (!pid) continue;
      const q = Number(it["qty"] || 0), h = Number(it["harga_jual"] || 0);
      tb += q * h;
      dd.push({ produkId: pid, jumlah: q, tipeHarga: String(it["tipe_harga"] || "konsinyasi"), hargaSatuan: h, subtotal: q * h });
    }
    if (!dd.length) continue;
    const p = await prisma.penjualan.create({
      data: { tipe: "KONSINYASI", apotekId: g.aid, salesId: g.sid, userId: admin.id, tanggal: g.tgl, totalBayar: tb, metodeBayar: "TUNAI", status: "SELESAI" },
    });
    await prisma.detailPenjualan.createMany({ data: dd.map((d) => ({ penjualanId: p.id, ...d })) });
    dk2 += dd.length; pk++;
  }
  console.log(`  ${pk} trx, ${dk2} items`);

  // PenjualanLangsung
  console.log("Penjualan Langsung...");
  const lg = new Map<string, { tgl: Date; pid: string | null; sid: string; items: IR[] }>();
  for (const r of sheets["PenjualanLangsung"]) {
    const psid = r["pelanggan_id"] ? Number(r["pelanggan_id"]) : null;
    const pid = psid ? pelangganMap.get(psid) || null : null;
    const sid = salesMap.get(Number(r["sales_id"])) || defSales;
    const tgl = new Date(String(r["tgl"]));
    const dk = `${tgl.toISOString().slice(0, 10)}_${pid || "null"}_${sid}`;
    if (!lg.has(dk)) lg.set(dk, { tgl, pid, sid, items: [] });
    lg.get(dk)!.items.push(r);
  }
  let pl = 0, dl = 0;
  for (const [, g] of lg) {
    let tb = 0;
    const dd: { produkId: string; jumlah: number; tipeHarga: string; hargaSatuan: number; subtotal: number }[] = [];
    for (const it of g.items) {
      const pid = produkMap.get(Number(it["produk_id"]));
      if (!pid) continue;
      const q = Number(it["qty"] || 0), h = Number(it["harga_jual"] || 0);
      tb += q * h;
      dd.push({ produkId: pid, jumlah: q, tipeHarga: String(it["tipe_harga"] || "apotek_cash"), hargaSatuan: h, subtotal: q * h });
    }
    if (!dd.length) continue;
    const p = await prisma.penjualan.create({
      data: { tipe: "LANGSUNG", pelangganId: g.pid, salesId: g.sid, userId: admin.id, tanggal: g.tgl, totalBayar: tb, metodeBayar: "TUNAI", status: "SELESAI" },
    });
    await prisma.detailPenjualan.createMany({ data: dd.map((d) => ({ penjualanId: p.id, ...d })) });
    dl += dd.length; pl++;
  }
  console.log(`  ${pl} trx, ${dl} items`);

  // Piutang
  console.log("Piutang...");
  for (const r of sheets["Piutang"]) {
    const total = Number(r["total_amount"] || 0);
    const paid = Number(r["paid_amount"] || 0);
    const st = String(r["status"] || "").toLowerCase() === "lunas" ? "LUNAS" : "BELUM_LUNAS";
    const mp = await prisma.penjualan.findFirst({ where: { totalBayar: total }, orderBy: { tanggal: "desc" } });
    if (mp) {
      const ct = new Date(String(r["created_at"]));
      await prisma.piutang.create({ data: { penjualanId: mp.id, total, sisa: total - paid, status: st, createdAt: ct, updatedAt: ct } });
      console.log(`  Piutang linked`);
    }
  }

  console.log("\n=== DONE ===");
  await prisma.$disconnect();
}

main().catch((e) => { console.error("Import failed:", e); process.exit(1); });
