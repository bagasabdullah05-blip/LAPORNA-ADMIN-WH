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
    const setoranConds: Prisma.Sql[] = [];

    let startDate = "";
    let endDate = "";

    if (bulan && tahun) {
      const y = Number(tahun);
      const m = Number(bulan);
      startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      endDate = `${y}-${String(m).padStart(2, "0")}-31 23:59:59.999`;
      conds.push(Prisma.sql`AND p.tanggal BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
      setoranConds.push(Prisma.sql`AND s."createdAt" BETWEEN ${startDate}::timestamp AND ${endDate}::timestamp`);
    }

    if (salesId) {
      conds.push(Prisma.sql`AND p."salesId" = ${salesId}`);
    }

    const where = conds.length > 0 ? Prisma.join(conds) : Prisma.sql``;
    const setoranWhere = setoranConds.length > 0 ? Prisma.join(setoranConds) : Prisma.sql``;

    const summary = await prisma.$queryRaw<{
      totalPenjualan: number;
      totalTunai: number;
      totalPiutangBaru: number;
      totalCicilanMasuk: number;
      totalKonsiLunas: number;
      totalPenerimaan: number;
      totalPiutangTersisa: number;
      totalMenunggu: number;
    }[]>`
      WITH penjualan_period AS (
        SELECT COALESCE(SUM(p."totalBayar"), 0) as total
        FROM "Penjualan" p
        WHERE 1=1 ${where}
      ),
      piutang_period AS (
        SELECT COALESCE(SUM(p."totalBayar"), 0) as total
        FROM "Penjualan" p
        WHERE p."metodeBayar" = 'PIUTANG' ${where}
      ),
      setoran_tunai AS (
        SELECT COALESCE(SUM(s.jumlah), 0) as total
        FROM "Setoran" s
        WHERE s.tipe = 'CASH' AND s.disetujui = true ${setoranWhere}
      ),
      setoran_cicilan AS (
        SELECT COALESCE(SUM(s.jumlah), 0) as total
        FROM "Setoran" s
        WHERE s.tipe IN ('CICILAN', 'KONSINYASI_CICIL') AND s.disetujui = true ${setoranWhere}
      ),
      setoran_konsi AS (
        SELECT COALESCE(SUM(s.jumlah), 0) as total
        FROM "Setoran" s
        WHERE s.tipe IN ('PELUNASAN', 'KONSINYASI_LUNAS') AND s.disetujui = true ${setoranWhere}
      ),
      setoran_menunggu AS (
        SELECT COALESCE(SUM(s.jumlah), 0) as total
        FROM "Setoran" s
        WHERE s.disetujui = false ${setoranWhere}
      ),
      piutang_tersisa AS (
        SELECT COALESCE(SUM(pi.sisa), 0) as total
        FROM "Piutang" pi
        WHERE pi.status = 'BELUM_LUNAS'
      )
      SELECT
        penjualan_period.total as "totalPenjualan",
        setoran_tunai.total as "totalTunai",
        piutang_period.total as "totalPiutangBaru",
        setoran_cicilan.total as "totalCicilanMasuk",
        setoran_konsi.total as "totalKonsiLunas",
        setoran_tunai.total + setoran_cicilan.total + setoran_konsi.total as "totalPenerimaan",
        piutang_tersisa.total as "totalPiutangTersisa",
        setoran_menunggu.total as "totalMenunggu"
      FROM penjualan_period, piutang_period, setoran_tunai, setoran_cicilan, setoran_konsi, piutang_tersisa, setoran_menunggu
    `;

    const perTanggal = await prisma.$queryRaw<{
      tanggal: string;
      tunai: number;
      cicilan: number;
      total: number;
    }[]>`
      WITH setoran_per_tanggal AS (
        SELECT s."createdAt"::date as dt,
          COALESCE(SUM(CASE WHEN s.tipe = 'CASH' THEN s.jumlah ELSE 0 END), 0) as tunai,
          COALESCE(SUM(CASE WHEN s.tipe IN ('CICILAN', 'KONSINYASI_CICIL') THEN s.jumlah ELSE 0 END), 0) as cicilan,
          COALESCE(SUM(s.jumlah), 0) as total
        FROM "Setoran" s
        WHERE s.disetujui = true ${setoranWhere}
        GROUP BY s."createdAt"::date
      )
      SELECT dt as tanggal, tunai, cicilan, total
      FROM setoran_per_tanggal
      ORDER BY dt DESC
    `;

    const perApotek = await prisma.$queryRaw<{
      apotekId: string;
      nama: string;
      tunai: number;
      cicilan: number;
      total: number;
    }[]>`
      WITH setoran_apotek AS (
        SELECT s."apotekId",
          COALESCE(SUM(CASE WHEN s.tipe = 'CASH' THEN s.jumlah ELSE 0 END), 0) as tunai,
          COALESCE(SUM(CASE WHEN s.tipe IN ('CICILAN', 'PELUNASAN', 'KONSINYASI_CICIL', 'KONSINYASI_LUNAS') THEN s.jumlah ELSE 0 END), 0) as cicilan,
          COALESCE(SUM(s.jumlah), 0) as total
        FROM "Setoran" s
        WHERE s.disetujui = true
          AND s."apotekId" IS NOT NULL ${setoranWhere}
        GROUP BY s."apotekId"
      )
      SELECT sa."apotekId", a.nama, sa.tunai, sa.cicilan, sa.total
      FROM setoran_apotek sa
      JOIN "Apotek" a ON a.id = sa."apotekId"
      ORDER BY sa.total DESC
    `;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPenjualan: Number(summary[0]?.totalPenjualan || 0),
          totalTunai: Number(summary[0]?.totalTunai || 0),
          totalPiutangBaru: Number(summary[0]?.totalPiutangBaru || 0),
          totalCicilanMasuk: Number(summary[0]?.totalCicilanMasuk || 0),
          totalKonsiLunas: Number(summary[0]?.totalKonsiLunas || 0),
          totalPenerimaan: Number(summary[0]?.totalPenerimaan || 0),
          totalPiutangTersisa: Number(summary[0]?.totalPiutangTersisa || 0),
          totalMenunggu: Number(summary[0]?.totalMenunggu || 0),
        },
        perTanggal: perTanggal.map((d) => ({
          tanggal: d.tanggal ? new Date(String(d.tanggal)).toISOString().split("T")[0] : "",
          tunai: Number(d.tunai),
          cicilan: Number(d.cicilan),
          total: Number(d.total),
        })),
        perApotek: perApotek.map((a) => ({
          apotekId: a.apotekId,
          nama: a.nama,
          tunai: Number(a.tunai),
          cicilan: Number(a.cicilan),
          total: Number(a.total),
        })),
      },
    });
  } catch (error) {
    console.error("Get laporan penerimaan kas error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
