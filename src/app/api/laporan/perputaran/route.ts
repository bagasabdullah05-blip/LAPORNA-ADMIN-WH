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
    const search = searchParams.get("search") || "";
    const kategori = searchParams.get("kategori") || "";
    const sortBy = searchParams.get("sortBy") || "totalPenjualan";
    const sortDir = searchParams.get("sortDir") || "desc";

    const conditions: Prisma.Sql[] = [];
    if (search) conditions.push(Prisma.sql`AND pr.nama LIKE ${"%" + search + "%"}`);
    if (kategori) conditions.push(Prisma.sql`AND pr.kategori = ${kategori}`);

    const validSortFields: Record<string, string> = {
      nama: "pr.nama",
      totalPenjualan: "totalPenjualan",
      totalQuantity: "totalQuantity",
    };
    const sortField = validSortFields[sortBy] || "totalPenjualan";
    const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

    const data = await prisma.$queryRaw<{
      produkId: string; nama: string; kategori: string;
      totalPenjualan: number; totalQuantity: number; rataRataPerBulan: number;
    }[]>`
      SELECT
        dp."produkId",
        pr.nama,
        pr.kategori,
        SUM(dp.subtotal) as "totalPenjualan",
        SUM(dp.jumlah) as "totalQuantity",
        CAST(SUM(dp.jumlah) AS DOUBLE PRECISION) / 6 as "rataRataPerBulan"
      FROM "DetailPenjualan" dp
      JOIN "Produk" pr ON pr.id = dp."produkId"
      WHERE 1=1 ${Prisma.join(conditions)}
      GROUP BY dp."produkId", pr.nama, pr.kategori
      ORDER BY ${Prisma.raw(sortField)} ${Prisma.raw(sortDirection)}
    `;

    return NextResponse.json({
      success: true,
      data: data.map((d) => ({
        ...d,
        totalPenjualan: Number(d.totalPenjualan),
        totalQuantity: Number(d.totalQuantity),
        rataRataPerBulan: Number(d.rataRataPerBulan),
      })),
    });
  } catch (error) {
    console.error("Get laporan perputaran error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
