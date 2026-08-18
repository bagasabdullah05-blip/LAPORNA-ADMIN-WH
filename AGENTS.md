# DistroFarmasi - Agent Context

## Project Overview
Pharmacy distribution system (DistroFarmasi) with sales, piutang, cicilan, consignment stock, warehouse, stock opname, laporan (reports), and setoran harian.

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

## PostgreSQL Quoting Rules (CRITICAL)
Prisma creates PascalCase tables (`"Produk"`, `"Penjualan"`, etc.) and camelCase columns (`"totalBayar"`, `"salesId"`, etc.) — **all raw SQL must use double-quoted identifiers**.

## Known Fixes Applied
1. **Prisma.join([]) fix**: Empty arrays crash Prisma 7; use `conditions.length > 0 ? Prisma.join(conditions) : Prisma.sql\`\`` pattern
2. **Laporan Penjualan double-count**: perSales and perTanggal queries use aggregated subqueries for item counts to avoid `SUM(p."totalBayar")` inflation from JOINs
3. **Pareto sort**: Kumulatif calculated on revenue-desc order always; sort only reorders display
4. **Invalid Date fix**: `tanggal::date` PostgreSQL converted via `toISOString().split('T')[0]`
5. **Dashboard API**: Quoted table name `"Produk"` in raw SQL

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

53 penjualan + 257 konsinyasiLog + 1 piutang dates corrected to real 2026-08-xx dates.

## Deploy Notes
- **User directive**: Do NOT auto-push to Netlify — test locally first
- Netlify CLI deploy on Windows fails with EPERM symlink error (`@netlify/plugin-nextjs` v5.15.13 tries to symlink `node_modules/@prisma/client`). GitHub push triggers Netlify auto-deploy if site is connected to repo
- **Middleware deprecation**: Next.js 16.3.1 shows warning `middleware → proxy` migration needed (non-blocking)

## Setoran Harian (INCOMPLETE)
- Model added to `prisma/schema.prisma` but `prisma db push` not yet run — needs user consent
- API route, page, and sidebar entry not yet created
- Next step: ask user for consent to run `npx prisma db push --accept-data-loss`, then create API + page

## Key Files
- `prisma/schema.prisma` — DB schema (14 models + SetoranHarian added but not migrated)
- `prisma/prisma.config.ts` — Prisma config with Neon adapter
- `src/lib/prisma.ts` — lazy Proxy singleton with Neon adapter
- `src/lib/ThemeContext.tsx` — dark/light mode context
- `src/lib/auth.ts` — JWT auth helpers
- `src/lib/export.ts` — CSV export utility
- `src/components/Sidebar.tsx` — sidebar with theme toggle
- `src/components/SearchSelect.tsx` — reusable search-select dropdown
- `src/app/globals.css` — Tailwind v4 theme, color palette, dark/light mode CSS overrides
- `src/app/api/dashboard/route.ts` — dashboard stats API
- `src/app/api/laporan/penjualan/route.ts` — laporan penjualan (fixed double-count)
- `src/app/api/laporan/margin/route.ts` — laporan margin
- `src/app/api/laporan/perputaran/route.ts` — laporan perputaran
- `src/app/api/laporan/pareto/route.ts` — pareto produk (with periode filter)
- `src/app/api/laporan/pareto/pelanggan/route.ts` — pareto pelanggan (with periode filter)
- `src/app/api/laporan/piutang/route.ts` — laporan piutang
- `netlify.toml` — build config
- `prisma/import.ts` — batch import script
- `prisma/fix-dates.ts` — Excel serial date fix
- `import-data/POS_Data.xlsx` — source data
