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
    const sortBy = searchParams.get("sortBy") || "totalRevenue";
    const sortDir = searchParams.get("sortDir") || "desc";

    const conditions: Prisma.Sql[] = [];
    if (search) conditions.push(Prisma.sql`AND pr.nama LIKE ${"%" + search + "%"}`);
    if (kategori) conditions.push(Prisma.sql`AND pr.kategori = ${kategori}`);

    const data = await prisma.$queryRaw<{
      produkId: string; nama: string; kategori: string; totalRevenue: number;
    }[]>`
      SELECT
        dp."produkId",
        pr.nama,
        pr.kategori,
        SUM(dp.subtotal) as "totalRevenue"
      FROM "DetailPenjualan" dp
      JOIN "Produk" pr ON pr.id = dp."produkId"
      WHERE 1=1 ${Prisma.join(conditions)}
      GROUP BY dp."produkId", pr.nama, pr.kategori
      ORDER BY "totalRevenue" DESC
    `;

    const totalRevenue = data.reduce((sum, d) => sum + Number(d.totalRevenue), 0);

    const validSortFields: Record<string, string> = {
      totalRevenue: "totalRevenue",
      nama: "nama",
    };
    const sortField = validSortFields[sortBy] || "totalRevenue";
    const sortDirection = sortDir === "asc" ? 1 : -1;

    let sorted = data.map((d) => ({
      ...d,
      totalRevenue: Number(d.totalRevenue),
      percentOfTotal: totalRevenue > 0 ? (Number(d.totalRevenue) / totalRevenue) * 100 : 0,
      cumulativePercent: 0,
      kategoriAbc: "C" as string,
    }));

    if (sortField === "totalRevenue") {
      sorted.sort((a, b) => (b.totalRevenue - a.totalRevenue) * sortDirection);
    } else {
      sorted.sort((a, b) => a.nama.toLowerCase().localeCompare(b.nama.toLowerCase()) * sortDirection);
    }

    let cumulative = 0;
    for (const item of sorted) {
      cumulative += item.totalRevenue;
      item.cumulativePercent = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      item.percentOfTotal = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0;
      if (item.cumulativePercent <= 50) item.kategoriAbc = "A";
      else if (item.cumulativePercent <= 80) item.kategoriAbc = "B";
      else item.kategoriAbc = "C";
    }

    return NextResponse.json({ success: true, data: sorted });
  } catch (error) {
    console.error("Get laporan pareto error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
