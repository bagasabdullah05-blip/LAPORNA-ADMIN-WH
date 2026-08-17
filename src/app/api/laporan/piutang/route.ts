import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Tidak terautentikasi" }, { status: 401 });
    }

    const summary = await prisma.$queryRaw<{ totalPiutang: number; totalLunas: number; totalBelumLunas: number; jumlahPiutang: number; jumlahLunas: number; jumlahBelumLunas: number }[]>`
      SELECT
        SUM(total) as "totalPiutang",
        SUM(CASE WHEN status = 'LUNAS' THEN total ELSE 0 END) as "totalLunas",
        SUM(CASE WHEN status = 'BELUM_LUNAS' THEN sisa ELSE 0 END) as "totalBelumLunas",
        COUNT(*) as "jumlahPiutang",
        SUM(CASE WHEN status = 'LUNAS' THEN 1 ELSE 0 END) as "jumlahLunas",
        SUM(CASE WHEN status = 'BELUM_LUNAS' THEN 1 ELSE 0 END) as "jumlahBelumLunas"
      FROM "Piutang"
    `;

    const allPiutang = await prisma.piutang.findMany({
      include: {
        penjualan: {
          include: { apotek: true, pelanggan: true, sales: true },
        },
        cicilan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalPiutang: Number(summary[0]?.totalPiutang || 0),
        totalLunas: Number(summary[0]?.totalLunas || 0),
        totalBelumLunas: Number(summary[0]?.totalBelumLunas || 0),
        jumlahPiutang: Number(summary[0]?.jumlahPiutang || 0),
        jumlahLunas: Number(summary[0]?.jumlahLunas || 0),
        jumlahBelumLunas: Number(summary[0]?.jumlahBelumLunas || 0),
      },
      data: allPiutang,
    });
  } catch (error) {
    console.error("Get laporan piutang error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
