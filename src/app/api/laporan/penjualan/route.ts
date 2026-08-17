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

    const dateConditions: Prisma.Sql[] = [];
    const subDateConditions: Prisma.Sql[] = [];

    if (bulan && tahun) {
      const y = Number(tahun);
      const m = Number(bulan);
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDate = `${y}-${String(m).padStart(2, "0")}-31 23:59:59.999`;
      dateConditions.push(Prisma.sql`AND p.tanggal BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
      subDateConditions.push(Prisma.sql`AND p2.tanggal BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
    }

    const salesConditions: Prisma.Sql[] = [];
    const subSalesConditions: Prisma.Sql[] = [];
    if (salesId) {
      salesConditions.push(Prisma.sql`AND p.salesId = ${salesId}`);
      subSalesConditions.push(Prisma.sql`AND p2.salesId = ${salesId}`);
    }

    const summary = await prisma.$queryRaw<{ totalOmset: number; totalTransaksi: number; rataRata: number; totalItemTerjual: number }[]>`
      SELECT
        COALESCE(SUM(p.totalBayar), 0) as "totalOmset",
        COUNT(*) as "totalTransaksi",
        CASE WHEN COUNT(*) > 0 THEN SUM(p.totalBayar) / COUNT(*) ELSE 0 END as "rataRata",
        COALESCE((SELECT SUM(dp.jumlah) FROM "DetailPenjualan" dp JOIN "Penjualan" p2 ON p2.id = dp."penjualanId" WHERE 1=1 ${Prisma.join(subDateConditions)} ${Prisma.join(subSalesConditions)}), 0) as "totalItemTerjual"
      FROM "Penjualan" p
      WHERE 1=1 ${Prisma.join(dateConditions)} ${Prisma.join(salesConditions)}
    `;

    const perSales = await prisma.$queryRaw<{ salesId: string; nama: string; totalOmset: number; jumlahTransaksi: number; rataRata: number; totalItem: number; margin: number; persentaseMargin: number }[]>`
      SELECT
        p."salesId",
        s.nama,
        SUM(p.totalBayar) as "totalOmset",
        COUNT(*) as "jumlahTransaksi",
        CASE WHEN COUNT(*) > 0 THEN SUM(p.totalBayar) / COUNT(*) ELSE 0 END as "rataRata",
        COALESCE(SUM(dp.jumlah), 0) as "totalItem",
        COALESCE(SUM((dp."hargaSatuan" - pr.hpp) * dp.jumlah), 0) as margin,
        CASE WHEN SUM(p.totalBayar) > 0 THEN SUM((dp."hargaSatuan" - pr.hpp) * dp.jumlah) / SUM(p.totalBayar) * 100 ELSE 0 END as "persentaseMargin"
      FROM "Penjualan" p
      JOIN "Sales" s ON s.id = p."salesId"
      LEFT JOIN "DetailPenjualan" dp ON dp."penjualanId" = p.id
      LEFT JOIN "Produk" pr ON pr.id = dp."produkId"
      WHERE 1=1 ${Prisma.join(dateConditions)} ${Prisma.join(salesConditions)}
      GROUP BY p."salesId", s.nama
      ORDER BY "totalOmset" DESC
    `;

    const perTanggal = await prisma.$queryRaw<{ tanggal: string; totalOmset: number; jumlahTransaksi: number; rataRata: number; totalItem: number; tunai: number; piutang: number }[]>`
      SELECT
        p.tanggal::date as tanggal,
        SUM(p.totalBayar) as "totalOmset",
        COUNT(*) as "jumlahTransaksi",
        CASE WHEN COUNT(*) > 0 THEN SUM(p.totalBayar) / COUNT(*) ELSE 0 END as "rataRata",
        COALESCE(SUM(dp.jumlah), 0) as "totalItem",
        COALESCE(SUM(CASE WHEN p.metodeBayar = 'TUNAI' THEN p.totalBayar ELSE 0 END), 0) as tunai,
        COALESCE(SUM(CASE WHEN p.metodeBayar = 'PIUTANG' THEN p.totalBayar ELSE 0 END), 0) as piutang
      FROM "Penjualan" p
      LEFT JOIN "DetailPenjualan" dp ON dp."penjualanId" = p.id
      WHERE 1=1 ${Prisma.join(dateConditions)} ${Prisma.join(salesConditions)}
      GROUP BY p.tanggal::date
      ORDER BY tanggal DESC
    `;

    const perTipe = await prisma.$queryRaw<{ tipe: string; total: number; jumlah: number }[]>`
      SELECT tipe, SUM(totalBayar) as total, COUNT(*) as jumlah
      FROM "Penjualan" p
      WHERE 1=1 ${Prisma.join(dateConditions)} ${Prisma.join(salesConditions)}
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
          tanggal: String(d.tanggal),
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
