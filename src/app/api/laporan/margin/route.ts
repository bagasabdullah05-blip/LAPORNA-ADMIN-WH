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
    const sortBy = searchParams.get("sortBy") || "totalMargin";
    const sortDir = searchParams.get("sortDir") || "desc";

    const conditions: Prisma.Sql[] = [];
    if (search) conditions.push(Prisma.sql`AND pr.nama LIKE ${"%" + search + "%"}`);
    if (kategori) conditions.push(Prisma.sql`AND pr.kategori = ${kategori}`);

    const where = conditions.length > 0 ? Prisma.join(conditions) : Prisma.sql``;

    const validSortFields: Record<string, string> = {
      nama: "pr.nama",
      totalMargin: `"totalMargin"`,
      persentaseMargin: `"persentaseMargin"`,
      totalTerjual: `"totalTerjual"`,
    };
    const sortField = validSortFields[sortBy] || `"totalMargin"`;
    const sortDirection = sortDir === "asc" ? "ASC" : "DESC";

    const data = await prisma.$queryRaw<{
      produkId: string; nama: string; kategori: string;
      totalTerjual: number; totalMargin: number; totalRevenue: number; totalHpp: number; persentaseMargin: number;
    }[]>`
      SELECT
        dp."produkId",
        pr.nama,
        pr.kategori,
        SUM(dp.jumlah) as "totalTerjual",
        SUM((dp."hargaSatuan" - pr.hpp) * dp.jumlah) as "totalMargin",
        SUM(dp."hargaSatuan" * dp.jumlah) as "totalRevenue",
        SUM(pr.hpp * dp.jumlah) as "totalHpp",
        CASE WHEN SUM(dp."hargaSatuan" * dp.jumlah) > 0 THEN SUM((dp."hargaSatuan" - pr.hpp) * dp.jumlah) / SUM(dp."hargaSatuan" * dp.jumlah) * 100 ELSE 0 END as "persentaseMargin"
      FROM "DetailPenjualan" dp
      JOIN "Produk" pr ON pr.id = dp."produkId"
      WHERE 1=1 ${where}
      GROUP BY dp."produkId", pr.nama, pr.kategori
      ORDER BY ${Prisma.raw(sortField)} ${Prisma.raw(sortDirection)}
    `;

    return NextResponse.json({
      success: true,
      data: data.map((d) => ({
        ...d,
        margin: Number(d.totalMargin),
        totalTerjual: Number(d.totalTerjual),
        totalMargin: Number(d.totalMargin),
        totalRevenue: Number(d.totalRevenue),
        totalHpp: Number(d.totalHpp),
        persentaseMargin: Number(d.persentaseMargin),
      })),
    });
  } catch (error) {
    console.error("Get laporan margin error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
