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
    const sortBy = searchParams.get("sortBy") || "totalRevenue";
    const sortDir = searchParams.get("sortDir") || "desc";
    const periode = searchParams.get("periode") || "";
    const bulan = searchParams.get("bulan") || "";
    const tahun = searchParams.get("tahun") || String(new Date().getFullYear());

    const conditions: Prisma.Sql[] = [];
    if (search) conditions.push(Prisma.sql`AND a.nama LIKE ${"%" + search + "%"}`);

    if (periode && bulan) {
      const b = parseInt(bulan);
      const y = parseInt(tahun);
      let startDate: string;
      let endDate: string;

      if (periode === "bulanan") {
        startDate = `${y}-${String(b).padStart(2, "0")}-01`;
        const lastDay = new Date(y, b, 0).getDate();
        endDate = `${y}-${String(b).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      } else if (periode === "semester") {
        const startMonth = b <= 6 ? 1 : 7;
        startDate = `${y}-${String(startMonth).padStart(2, "0")}-01`;
        const endMonth = b <= 6 ? 6 : 12;
        const lastDay = new Date(y, endMonth, 0).getDate();
        endDate = `${y}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      } else {
        startDate = `${y}-01-01`;
        endDate = `${y}-12-31`;
      }

      conditions.push(Prisma.sql`AND p.tanggal >= ${startDate}::date AND p.tanggal <= ${endDate}::date`);
    }

    const where = conditions.length > 0 ? Prisma.join(conditions) : Prisma.sql``;

    const data = await prisma.$queryRaw<{
      apotekId: string; nama: string; alamat: string; totalRevenue: number;
    }[]>`
      SELECT
        p."apotekId",
        a.nama,
        a.alamat,
        SUM(p."totalBayar") as "totalRevenue"
      FROM "Penjualan" p
      JOIN "Apotek" a ON a.id = p."apotekId"
      WHERE p."apotekId" IS NOT NULL ${where}
      GROUP BY p."apotekId", a.nama, a.alamat
      ORDER BY "totalRevenue" DESC
    `;

    const totalRevenue = data.reduce((sum, d) => sum + Number(d.totalRevenue), 0);

    let items = data.map((d) => ({
      nama: d.nama,
      alamat: d.alamat,
      totalRevenue: Number(d.totalRevenue),
      persentase: 0,
      kumulatif: 0,
      kategoriABC: "C",
    }));

    let cumulative = 0;
    for (const item of items) {
      cumulative += item.totalRevenue;
      item.kumulatif = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0;
      item.persentase = totalRevenue > 0 ? (item.totalRevenue / totalRevenue) * 100 : 0;
      if (item.kumulatif <= 50) item.kategoriABC = "A";
      else if (item.kumulatif <= 80) item.kategoriABC = "B";
      else item.kategoriABC = "C";
    }

    const validSortFields: Record<string, string> = {
      totalRevenue: "totalRevenue",
      nama: "nama",
    };
    const sortField = validSortFields[sortBy] || "totalRevenue";

    if (sortField === "nama") {
      items.sort((a, b) => sortDir === "asc"
        ? a.nama.toLowerCase().localeCompare(b.nama.toLowerCase())
        : b.nama.toLowerCase().localeCompare(a.nama.toLowerCase()));
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error("Get laporan pareto pelanggan error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
