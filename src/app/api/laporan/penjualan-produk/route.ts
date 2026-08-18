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

    if (bulan && tahun) {
      const y = Number(tahun);
      const m = Number(bulan);
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDate = `${y}-${String(m).padStart(2, "0")}-31 23:59:59.999`;
      conds.push(Prisma.sql`AND p.tanggal BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
    }

    if (salesId) {
      conds.push(Prisma.sql`AND p."salesId" = ${salesId}`);
    }

    const where = conds.length > 0 ? Prisma.join(conds) : Prisma.sql``;

    const rows = await prisma.$queryRaw<{
      produkId: string; nama: string; kategori: string; satuan: string;
      totalJumlah: number; totalOmset: number; rataRataHarga: number;
    }[]>`
      SELECT
        pr.id as "produkId",
        pr.nama,
        pr.kategori,
        pr.satuan,
        SUM(dp.jumlah) as "totalJumlah",
        SUM(dp.subtotal) as "totalOmset",
        CASE WHEN SUM(dp.jumlah) > 0 THEN SUM(dp.subtotal) / SUM(dp.jumlah) ELSE 0 END as "rataRataHarga"
      FROM "DetailPenjualan" dp
      JOIN "Penjualan" p ON p.id = dp."penjualanId"
      JOIN "Produk" pr ON pr.id = dp."produkId"
      WHERE 1=1 ${where}
      GROUP BY pr.id, pr.nama, pr.kategori, pr.satuan
      ORDER BY "totalOmset" DESC
    `;

    const grandTotal = rows.reduce((acc, r) => acc + Number(r.totalOmset), 0);

    const perProduk = rows.map((r) => ({
      produkId: r.produkId,
      nama: r.nama,
      kategori: r.kategori,
      satuan: r.satuan,
      totalJumlah: Number(r.totalJumlah),
      totalOmset: Number(r.totalOmset),
      rataRataHarga: Number(r.rataRataHarga),
      persentase: grandTotal > 0 ? (Number(r.totalOmset) / grandTotal) * 100 : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOmset: grandTotal,
          totalItemTerjual: perProduk.reduce((a, p) => a + p.totalJumlah, 0),
          jumlahProduk: perProduk.length,
        },
        perProduk,
      },
    });
  } catch (error) {
    console.error("Get laporan penjualan per produk error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
