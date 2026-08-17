import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Tidak terautentikasi" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan") || "";
    const tahun = searchParams.get("tahun") || "";
    const salesId = searchParams.get("salesId") || "";

    const conds: Prisma.Sql[] = [];
    const subConds: Prisma.Sql[] = [];
    const salesConds: Prisma.Sql[] = [];
    const subSalesConds: Prisma.Sql[] = [];

    if (bulan && tahun) {
      const y = Number(tahun);
      const m = Number(bulan);
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDate = `${y}-${String(m).padStart(2, "0")}-31 23:59:59.999`;
      conds.push(Prisma.sql`AND p.tanggal BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
      subConds.push(Prisma.sql`AND p2.tanggal BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
    }

    if (salesId) {
      salesConds.push(Prisma.sql`AND p."salesId" = ${salesId}`);
      subSalesConds.push(Prisma.sql`AND p2."salesId" = ${salesId}`);
    }

    const where = conds.length > 0 ? Prisma.join(conds) : Prisma.sql``;
    const subWhere = subConds.length > 0 ? Prisma.join(subConds) : Prisma.sql``;
    const salesWhere = salesConds.length > 0 ? Prisma.join(salesConds) : Prisma.sql``;
    const subSalesWhere = subSalesConds.length > 0 ? Prisma.join(subSalesConds) : Prisma.sql``;

    const summary = await prisma.$queryRaw<{ totalOmset: number; totalTransaksi: number; rataRata: number; totalItemTerjual: number }[]>`
      SELECT
        COALESCE(SUM(p."totalBayar"), 0) as "totalOmset",
        COUNT(*) as "totalTransaksi",
        CASE WHEN COUNT(*) > 0 THEN SUM(p."totalBayar") / COUNT(*) ELSE 0 END as "rataRata",
        COALESCE((SELECT SUM(dp.jumlah) FROM "DetailPenjualan" dp JOIN "Penjualan" p2 ON p2.id = dp."penjualanId" WHERE 1=1 ${subWhere} ${subSalesWhere}), 0) as "totalItemTerjual"
      FROM "Penjualan" p
      WHERE 1=1 ${where} ${salesWhere}
    `;

    const perSales = await prisma.$queryRaw<{ salesId: string; nama: string; totalOmset: number; jumlahTransaksi: number; rataRata: number; totalItem: number; margin: number; persentaseMargin: number }[]>`
      SELECT
        p."salesId",
        s.nama,
        SUM(p."totalBayar") as "totalOmset",
        COUNT(*) as "jumlahTransaksi",
        CASE WHEN COUNT(*) > 0 THEN SUM(p."totalBayar") / COUNT(*) ELSE 0 END as "rataRata",
        COALESCE(item_sales."totalItem", 0) as "totalItem",
        COALESCE(item_sales."margin", 0) as margin,
        CASE WHEN SUM(p."totalBayar") > 0 THEN COALESCE(item_sales."margin", 0) / SUM(p."totalBayar") * 100 ELSE 0 END as "persentaseMargin"
      FROM "Penjualan" p
      JOIN "Sales" s ON s.id = p."salesId"
      LEFT JOIN (
        SELECT p2."salesId", SUM(dp.jumlah) as "totalItem", SUM((dp."hargaSatuan" - pr.hpp) * dp.jumlah) as "margin"
        FROM "Penjualan" p2
        JOIN "DetailPenjualan" dp ON dp."penjualanId" = p2.id
        JOIN "Produk" pr ON pr.id = dp."produkId"
        WHERE 1=1 ${subWhere} ${subSalesWhere}
        GROUP BY p2."salesId"
      ) item_sales ON item_sales."salesId" = p."salesId"
      WHERE 1=1 ${where} ${salesWhere}
      GROUP BY p."salesId", s.nama, item_sales."totalItem", item_sales."margin"
      ORDER BY "totalOmset" DESC
    `;

    const perTanggal = await prisma.$queryRaw<{ tanggal: string; totalOmset: number; jumlahTransaksi: number; rataRata: number; totalItem: number; tunai: number; piutang: number }[]>`
      SELECT
        p.tanggal::date as tanggal,
        SUM(p."totalBayar") as "totalOmset",
        COUNT(*) as "jumlahTransaksi",
        CASE WHEN COUNT(*) > 0 THEN SUM(p."totalBayar") / COUNT(*) ELSE 0 END as "rataRata",
        COALESCE(item_hari."totalItem", 0) as "totalItem",
        COALESCE(SUM(CASE WHEN p."metodeBayar" = 'TUNAI' THEN p."totalBayar" ELSE 0 END), 0) as tunai,
        COALESCE(SUM(CASE WHEN p."metodeBayar" = 'PIUTANG' THEN p."totalBayar" ELSE 0 END), 0) as piutang
      FROM "Penjualan" p
      LEFT JOIN (
        SELECT p2.tanggal::date as dt, SUM(dp.jumlah) as "totalItem"
        FROM "Penjualan" p2
        JOIN "DetailPenjualan" dp ON dp."penjualanId" = p2.id
        WHERE 1=1 ${subWhere} ${subSalesWhere}
        GROUP BY p2.tanggal::date
      ) item_hari ON item_hari.dt = p.tanggal::date
      WHERE 1=1 ${where} ${salesWhere}
      GROUP BY p.tanggal::date, item_hari."totalItem"
      ORDER BY tanggal DESC
    `;

    const perTipe = await prisma.$queryRaw<{ tipe: string; total: number; jumlah: number }[]>`
      SELECT tipe, SUM("totalBayar") as total, COUNT(*) as jumlah
      FROM "Penjualan" p
      WHERE 1=1 ${where} ${salesWhere}
      GROUP BY tipe
    `;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOmset: Number(summary[0]?.totalOmset || 0),
          totalTransaksi: Number(summary[0]?.totalTransaksi || 0),
          rataRata: Number(summary[0]?.rataRata || 0),
          totalItemTerjual: Number(summary[0]?.totalItemTerjual || 0),
        },
        perSales: perSales.map((s) => ({
          ...s,
          totalOmset: Number(s.totalOmset),
          jumlahTransaksi: Number(s.jumlahTransaksi),
          rataRata: Number(s.rataRata),
          totalItem: Number(s.totalItem),
          margin: Number(s.margin),
          persentaseMargin: Number(s.persentaseMargin),
        })),
        perTanggal: perTanggal.map((d) => ({
          ...d,
          tanggal: d.tanggal ? new Date(String(d.tanggal)).toISOString().split('T')[0] : '',
          totalOmset: Number(d.totalOmset),
          jumlahTransaksi: Number(d.jumlahTransaksi),
          rataRata: Number(d.rataRata),
          totalItem: Number(d.totalItem),
          tunai: Number(d.tunai),
          piutang: Number(d.piutang),
        })),
        perTipe: perTipe.map((t) => ({ tipe: t.tipe, total: Number(t.total), jumlah: Number(t.jumlah) })),
      },
    });
  } catch (error) {
    console.error("Get laporan penjualan error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
