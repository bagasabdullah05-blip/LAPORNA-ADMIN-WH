# Sistem WareHouse CBM - Agent Context

## Project Overview
Sistem manajemen gudang (warehouse) dengan penjualan (konsinyasi & langsung), piutang, cicilan, setoran harian, stok konsinyasi, warehouse, stock opname, retur, dan laporan lengkap.

## Tech Stack
- **Framework**: Next.js 16.3.1 (App Router) + TypeScript
- **ORM**: Prisma 7.9.1 with driver adapters (`@prisma/adapter-neon`)
- **Database**: Neon PostgreSQL (serverless)
- **Styling**: Tailwind CSS v4 (no tailwind.config — uses `@theme` in globals.css)
- **Generated Client**: `src/generated/prisma/client` (Prisma 7 lazy Proxy pattern)

## Important Details
- **Prisma 7 quirks**: driver adapters required, generated client at `src/generated/prisma/client`, Float not Decimal, `url` removed from schema datasource (in `prisma.config.ts`), lazy Proxy in `prisma.ts`
- **Neon DATABASE_URL**: `postgresql://neondb_owner:npg_I6MZHE3GdKhe@ep-lively-shadow-axnjhcsb-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require`
- **GitHub repo**: https://github.com/bagasabdullah05-blip/LAPORNA-ADMIN-WH (user: `bagasabdullah05-blip`)
- **Netlify site**: `distro-farmasi` — site ID: `9f134f88-a12d-4d14-85df-99cbd7f4754c`, URL: https://distro-farmasi.netlify.app
- **Netlify env vars**: `DATABASE_URL` (Neon) and `JWT_SECRET=apotek-system-secret-key-2026`
- **Login**: `admin@apotek.com` / `admin123` (ADMIN), `agen@apotek.com` / `agen123` (STAFF)
- **Import data**: `import-data/POS_Data.xlsx` — 13 sheets: Produk 44, Apotek 1225, Sales 4, Pelanggan 9, KonsinyasiLog 4704, StokKonsinyasi 4223, PenjualanKonsinyasi 1863, PenjualanLangsung 32, BarangMasukLog 40, Piutang 1

## Alur Setoran (CRITICAL)
Semua setoran **OTOMATIS** — tidak ada input manual.

### Penjualan → Setoran
| Metode Bayar | Jumlah Bayar | Hasil |
|---|---|---|
| TUNAI | ≥ totalBayar | Setoran CASH (lunas) |
| TUNAI | < totalBayar | Setoran CICILAN/PELUNASAN + Piutang sisa |
| TUNAI | 0 | Piutang penuh, tidak ada setoran |
| TRANSFER | ≥ totalBayar | Setoran CASH (lunas) |
| TRANSFER | < totalBayar | Setoran CICILAN/PELUNASAN + Piutang sisa |
| TRANSFER | 0 | Piutang penuh, tidak ada setoran |

### Cicilan → Setoran
Bayar cicilan di `/piutang` → otomatis buat setoran:
- Konsinyasi + sisa > 0: `KONSINYASI_CICIL`
- Konsinyasi + sisa = 0: `KONSINYASI_LUNAS`
- Langsung + sisa > 0: `CICILAN`
- Langsung + sisa = 0: `PELUNASAN`

### Status Setoran
- `MENUNGGU` — baru dibuat, belum di-ACC
- `DISETUJUI` — sudah di-ACC oleh admin finance di `/setoran/approval`

### Nilai Setoran Tipe
`CASH`, `CICILAN`, `PELUNASAN`, `KONSINYASI_CICIL`, `KONSINYASI_LUNAS`

**PENTING**: Metode bayar hanya `TUNAI` atau `TRANSFER`. `PIUTANG` bukan metode bayar — piutang adalah KONSEKUENSI dari pembayaran sebagian/tidak bayar.

## PostgreSQL Quoting Rules (CRITICAL)
Prisma creates PascalCase tables (`"Produk"`, `"Penjualan"`, etc.) and camelCase columns (`"totalBayar"`, `"salesId"`, etc.) — **all raw SQL must use double-quoted identifiers**.

## Known Fixes Applied
1. **Prisma.join([]) fix**: Empty arrays crash Prisma 7; use `conditions.length > 0 ? Prisma.join(conditions) : Prisma.sql\`\`` pattern
2. **Laporan Penjualan double-count**: perSales and perTanggal queries use aggregated subqueries for item counts to avoid `SUM(p."totalBayar")` inflation from JOINs
3. **Pareto sort**: Kumulatif calculated on revenue-desc order always; sort only reorders display
4. **Invalid Date fix**: `tanggal::date` PostgreSQL converted via `toISOString().split('T')[0]`
5. **Dashboard API**: Quoted table name `"Produk"` in raw SQL
6. **Piutang API**: `GET /api/piutang` must include `cicilan: true` in include clause; page null-safety for `selectedPiutang.cicilan.length`
7. **NEON/NEXTJS NO TRANSACTION**: `prisma.$transaction(async (tx) => {...})` DOES NOT WORK on Neon serverless (Netlify). Interactive transactions cause "Transaction not found" errors. All database operations MUST use sequential `prisma.*` calls directly — NEVER wrap in `$transaction`.

## Color Theme
Primary colors defined in `globals.css` `@theme` block:
- **Purple (primary)**: `rgb(122, 61, 189)` → replaces Tailwind indigo
- **Green (secondary)**: `rgb(97, 177, 67)` → replaces Tailwind green
- **Light gray**: `rgb(229, 229, 229)`
- **White**: `rgb(255, 255, 255)`

## Dark/Light Mode
- Implemented via `ThemeContext` at `src/lib/ThemeContext.tsx`
- Class-based dark mode: `@variant dark (&:where(.dark, .dark *));` in globals.css
- Light mode: CSS variable remapping in `@layer base` (`:root:not(.dark)` overrides gray/slate palettes)
- Button text fix: `--color-white` forced to `#ffffff` on colored backgrounds (`bg-indigo-600`, `bg-green-600`, etc.)
- Toggle button in Sidebar (above Logout)
- Inline `<script>` in `<head>` prevents flash of wrong theme
- Theme persisted in `localStorage`

## Data Status
All data imported to Neon: Users 2, Produk 44, Apotek 1225, Sales 4, Pelanggan 9, Penjualan 502 (482 konsinyasi + 20 langsung), DetailPenjualan 1895, KonsinyasiLog 4704, StokKonsinyasi 4223, BarangMasukLog 40, Piutang 1

## Deploy Notes
- **User directive**: Do NOT auto-push to Netlify — test locally first
- Netlify CLI deploy on Windows fails with EPERM symlink error (`@netlify/plugin-nextjs` v5.15.13 tries to symlink `node_modules/@prisma/client`). GitHub push triggers Netlify auto-deploy if site is connected to repo
- **Middleware deprecation**: Next.js 16.3.1 shows warning `middleware → proxy` migration needed (non-blocking)

## Key Files

### Schema & Config
- `prisma/schema.prisma` — DB schema (15 models: User, Produk, Apotek, Sales, Pelanggan, Penjualan, DetailPenjualan, StokKonsinyasi, KonsinyasiLog, BarangMasukLog, Piutang, Cicilan, Retur, ReturDetail, Opname, **Setoran**)
- `prisma/prisma.config.ts` — Prisma config with Neon adapter
- `src/lib/prisma.ts` — lazy Proxy singleton with Neon adapter
- `src/lib/auth.ts` — JWT auth helpers
- `src/lib/ThemeContext.tsx` — dark/light mode context
- `src/lib/export.ts` — CSV export utility

### API Routes (Write)
- `src/app/api/penjualan/route.ts` — POST (bayar logic: TUNAI/TRANSFER → setoran + piutang), PUT (edit + stock reversal)
- `src/app/api/piutang/route.ts` — GET (includes cicilan relation), POST (piutang lama)
- `src/app/api/cicilan/route.ts` — POST (auto-create setoran saat cicilan dibayar)
- `src/app/api/setoran/route.ts` — GET, POST, PUT (ACC), DELETE
- `src/app/api/setoran/penjualan-list/route.ts` — penjualan list with setoran status

### API Routes (Read/Reports)
- `src/app/api/dashboard/route.ts` — dashboard stats
- `src/app/api/laporan/penjualan/route.ts` — laporan penjualan (fixed double-count)
- `src/app/api/laporan/penjualan-produk/route.ts` — penjualan per produk
- `src/app/api/laporan/penerimaan-kas/route.ts` — penerimaan kas (reads approved setoran)
- `src/app/api/laporan/setoran/route.ts` — laporan setoran
- `src/app/api/laporan/margin/route.ts` — laporan margin
- `src/app/api/laporan/perputaran/route.ts` — laporan perputaran
- `src/app/api/laporan/pareto/route.ts` — pareto produk
- `src/app/api/laporan/pareto/pelanggan/route.ts` — pareto pelanggan
- `src/app/api/laporan/piutang/route.ts` — laporan piutang

### API Routes (CRUD with DELETE + stock reversal)
- `src/app/api/produk/route.ts`, `src/app/api/produk/[id]/route.ts`
- `src/app/api/apotek/route.ts`, `src/app/api/apotek/[id]/route.ts`
- `src/app/api/sales/route.ts`, `src/app/api/sales/[id]/route.ts`
- `src/app/api/pelanggan/route.ts`, `src/app/api/pelanggan/[id]/route.ts`
- `src/app/api/retur/route.ts`, `src/app/api/opname/route.ts`
- `src/app/api/gudang/stok/route.ts`, `src/app/api/gudang/barang-masuk/route.ts`
- `src/app/api/konsinyasi/kirim/route.ts`, `src/app/api/konsinyasi/stok/route.ts`

### Pages
- `src/app/page.tsx` — login
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/master/produk/page.tsx`, `sales/page.tsx`, `apotek/page.tsx`, `pelanggan/page.tsx`
- `src/app/(app)/gudang/stok/page.tsx`, `barang-masuk/page.tsx`
- `src/app/(app)/konsinyasi/kirim/page.tsx`, `stok/page.tsx`
- `src/app/(app)/retur/page.tsx`, `opname/page.tsx`
- `src/app/(app)/penjualan/page.tsx` — form TUNAI/TRANSFER, jumlahBayar, summary
- `src/app/(app)/piutang/page.tsx` — piutang list + cicilan modal (auto-create setoran)
- `src/app/(app)/setoran/page.tsx` — daftar setoran (read-only, semua auto)
- `src/app/(app)/setoran/approval/page.tsx` — admin finance ACC setoran
- `src/app/(app)/laporan/penjualan/page.tsx`, `penjualan-produk/page.tsx`, `penerimaan-kas/page.tsx`, `setoran/page.tsx`, `margin/page.tsx`, `perputaran/page.tsx`, `pareto/page.tsx`, `pareto/pelanggan/page.tsx`

### Components
- `src/components/Sidebar.tsx` — sidebar with SVG icons, menu: Dashboard, Master Data, Gudang, Konsinyasi, Retur, Opname, Penjualan, Piutang & Cicilan, Approval Setoran, Laporan

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
