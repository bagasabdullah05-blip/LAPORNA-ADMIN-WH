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
      id: string;
      tanggal: string;
      tipe: string;
      metodeBayar: string;
      apotekNama: string | null;
      pelangganNama: string | null;
      salesNama: string;
      totalBayar: number;
      setoranTotal: number | null;
      piutangSisa: number | null;
    }[]>`
      SELECT
        p.id,
        p.tanggal::text as "tanggal",
        p.tipe,
        p."metodeBayar",
        a.nama as "apotekNama",
        pl.nama as "pelangganNama",
        s.nama as "salesNama",
        p."totalBayar",
        COALESCE(setoran_agg."setoranTotal", 0) as "setoranTotal",
        pt.sisa as "piutangSisa"
      FROM "Penjualan" p
      JOIN "Sales" s ON s.id = p."salesId"
      LEFT JOIN "Apotek" a ON a.id = p."apotekId"
      LEFT JOIN "Pelanggan" pl ON pl.id = p."pelangganId"
      LEFT JOIN "Piutang" pt ON pt."penjualanId" = p.id
      LEFT JOIN (
        SELECT st."penjualanId", SUM(st.jumlah) as "setoranTotal"
        FROM "Setoran" st
        WHERE st.disetujui = true
        GROUP BY st."penjualanId"
      ) setoran_agg ON setoran_agg."penjualanId" = p.id
      WHERE 1=1 ${where}
      ORDER BY p.tanggal DESC
    `;

    const detailTransaksi = rows.map((r) => {
      const totalPenjualan = Number(r.totalBayar);
      const totalDiterima = r.metodeBayar === "TUNAI" ? totalPenjualan : Number(r.setoranTotal || 0);
      const sisaPiutang = totalPenjualan - totalDiterima;

      let statusBayar: string;
      if (r.metodeBayar === "TUNAI") {
        statusBayar = "LUNAS";
      } else if (r.piutangSisa !== null && sisaPiutang <= 0) {
        statusBayar = "LUNAS";
      } else if (r.piutangSisa !== null && sisaPiutang > 0) {
        statusBayar = "BELUM_LUNAS";
      } else {
        statusBayar = "LUNAS";
      }

      return {
        id: r.id,
        tanggal: r.tanggal ? new Date(r.tanggal).toISOString().split("T")[0] : "",
        tipe: r.tipe,
        metodeBayar: r.metodeBayar,
        apotekNama: r.apotekNama || "-",
        pelangganNama: r.pelangganNama || "-",
        salesNama: r.salesNama,
        totalPenjualan,
        totalDiterima,
        sisaPiutang,
        statusBayar,
      };
    });

    const totalPenjualan = detailTransaksi.reduce((s, d) => s + d.totalPenjualan, 0);
    const totalPenerimaan = detailTransaksi.reduce((s, d) => s + d.totalDiterima, 0);
    const totalPiutangTersisa = detailTransaksi.reduce((s, d) => s + d.sisaPiutang, 0);

    const tanggalMap = new Map<string, { penjualan: number; penerimaan: number; piutang: number }>();
    for (const d of detailTransaksi) {
      const existing = tanggalMap.get(d.tanggal) || { penjualan: 0, penerimaan: 0, piutang: 0 };
      existing.penjualan += d.totalPenjualan;
      existing.penerimaan += d.totalDiterima;
      existing.piutang += d.sisaPiutang;
      tanggalMap.set(d.tanggal, existing);
    }

    const perTanggal = Array.from(tanggalMap.entries())
      .map(([tanggal, data]) => ({ tanggal, ...data }))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPenjualan,
          totalPenerimaan,
          totalPiutangTersisa,
          jumlahTransaksi: detailTransaksi.length,
        },
        perTanggal,
        detailTransaksi,
      },
    });
  } catch (error) {
    console.error("Get laporan setoran error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
