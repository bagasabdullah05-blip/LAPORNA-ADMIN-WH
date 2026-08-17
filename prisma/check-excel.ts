import path from "node:path";

const EXCEL_PATH = path.resolve(process.cwd(), "import-data", "POS_Data.xlsx");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require("xlsx");
const wb = XLSX.readFile(EXCEL_PATH);

// Check tgl values in PenjualanKonsinyasi
const pk = wb.Sheets["PenjualanKonsinyasi"];
const pkData = XLSX.utils.sheet_to_json(pk);
console.log("=== PenjualanKonsinyasi (first 5 rows) ===");
for (const r of pkData.slice(0, 5) as any[]) {
  console.log(`  tgl: ${r.tgl} (type: ${typeof r.tgl}) | tipe_harga: ${r.tipe_harga}`);
}

// Check tgl values in PenjualanLangsung
const pl = wb.Sheets["PenjualanLangsung"];
const plData = XLSX.utils.sheet_to_json(pl);
console.log("\n=== PenjualanLangsung (first 5 rows) ===");
for (const r of plData.slice(0, 5) as any[]) {
  console.log(`  tgl: ${r.tgl} (type: ${typeof r.tgl}) | tipe_harga: ${r.tipe_harga}`);
}

// Check KonsinyasiLog
const kl = wb.Sheets["KonsinyasiLog"];
const klData = XLSX.utils.sheet_to_json(kl);
console.log("\n=== KonsinyasiLog (first 5 rows) ===");
for (const r of klData.slice(0, 5) as any[]) {
  console.log(`  tgl: ${r.tgl} (type: ${typeof r.tgl})`);
}

// Check BarangMasukLog
const bm = wb.Sheets["BarangMasukLog"];
const bmData = XLSX.utils.sheet_to_json(bm);
console.log("\n=== BarangMasukLog (first 5 rows) ===");
for (const r of bmData.slice(0, 5) as any[]) {
  console.log(`  tgl: ${r.tgl} (type: ${typeof r.tgl})`);
}

// Check Piutang
const pi = wb.Sheets["Piutang"];
const piData = XLSX.utils.sheet_to_json(pi);
console.log("\n=== Piutang ===");
for (const r of piData as any[]) {
  console.log(`  created_at: ${r.created_at} (type: ${typeof r.created_at}) | status: ${r.status}`);
}

// Unique tgl values in PenjualanKonsinyasi
const uniqueTgl = [...new Set(pkData.map((r: any) => `${r.tgl} (${typeof r.tgl})`))];
console.log("\n=== PenjualanKonsinyasi unique tgl values ===");
for (const t of uniqueTgl) {
  console.log(`  ${t}`);
}

// Unique tgl in PenjualanLangsung
const uniqueTgl2 = [...new Set(plData.map((r: any) => `${r.tgl} (${typeof r.tgl})`))];
console.log("\n=== PenjualanLangsung unique tgl values ===");
for (const t of uniqueTgl2) {
  console.log(`  ${t}`);
}
