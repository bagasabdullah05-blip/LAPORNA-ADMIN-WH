import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalProduk,
      totalApotek,
      totalSales,
      totalPenjualan,
      piutangBelumLunas,
      penjualanHariIni,
      stokMenipis,
    ] = await Promise.all([
      prisma.produk.count(),
      prisma.apotek.count(),
      prisma.sales.count(),
      prisma.penjualan.count(),
      prisma.piutang.aggregate({
        where: { status: "BELUM_LUNAS" },
        _sum: { sisa: true },
      }),
      prisma.penjualan.count({
        where: {
          tanggal: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM Produk WHERE stokGudang <= minStok
      `,
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalProduk,
        totalApotek,
        totalSales,
        totalPenjualan,
        totalPiutangBelumLunas: piutangBelumLunas._sum.sisa || 0,
        penjualanHariIni,
        stokMenipis: Number(stokMenipis[0]?.count || 0),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
