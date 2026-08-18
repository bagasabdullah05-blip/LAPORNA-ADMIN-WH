import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bulan = searchParams.get("bulan") || "";
    const tahun = searchParams.get("tahun") || "";

    const where: Record<string, unknown> = {};

    if (bulan && tahun) {
      const y = Number(tahun);
      const m = Number(bulan);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);
      where.tanggal = { gte: startDate, lte: endDate };
    }

    const penjualanList = await prisma.penjualan.findMany({
      where,
      include: {
        apotek: true,
        pelanggan: true,
        sales: true,
        piutang: true,
        details: { include: { produk: true } },
        setoran: {
          where: { disetujui: true },
          select: { jumlah: true, tipe: true },
        },
      },
      orderBy: { tanggal: "desc" },
    });

    const result = penjualanList.map((p) => {
      const totalSetoran = p.setoran.reduce((sum, s) => sum + s.jumlah, 0);
      const sisaBayar = p.totalBayar - totalSetoran;

      let applicableType: string | null = null;
      let applicableAmount = 0;

      if (p.metodeBayar === "TUNAI" && !p.piutang) {
        applicableType = "CASH";
        applicableAmount = sisaBayar > 0 ? sisaBayar : 0;
      } else if (p.metodeBayar === "PIUTANG" && p.piutang && p.piutang.sisa > 0) {
        if (p.tipe === "LANGSUNG") {
          if (p.piutang.sisa === p.piutang.total || totalSetoran === 0) {
            applicableType = sisaBayar <= p.piutang.sisa && sisaBayar > 0 ? "CICILAN" : "PELUNASAN";
          } else {
            applicableType = "CICILAN";
          }
          if (applicableType === "PELUNASAN") {
            applicableAmount = p.piutang.sisa;
          } else {
            applicableAmount = p.piutang.sisa;
          }
        } else if (p.tipe === "KONSINYASI") {
          if (p.piutang.sisa === p.piutang.total || totalSetoran === 0) {
            applicableType = "KONSINYASI_CICIL";
          } else {
            applicableType = "KONSINYASI_CICIL";
          }
          if (p.piutang.sisa <= sisaBayar) {
            applicableType = "KONSINYASI_LUNAS";
            applicableAmount = p.piutang.sisa;
          } else {
            applicableAmount = p.piutang.sisa;
          }
        }
      }

      if (applicableType === "PELUNASAN" || applicableType === "KONSINYASI_LUNAS") {
        applicableAmount = p.piutang?.sisa || 0;
      }

      return {
        id: p.id,
        tipe: p.tipe,
        tanggal: p.tanggal,
        metodeBayar: p.metodeBayar,
        totalBayar: p.totalBayar,
        status: p.status,
        apotek: p.apotek ? { id: p.apotek.id, nama: p.apotek.nama } : null,
        pelanggan: p.pelanggan ? { id: p.pelanggan.id, nama: p.pelanggan.nama } : null,
        sales: { id: p.sales.id, nama: p.sales.nama },
        piutang: p.piutang
          ? { id: p.piutang.id, total: p.piutang.total, sisa: p.piutang.sisa, status: p.piutang.status }
          : null,
        details: p.details.map((d) => ({
          produk: { nama: d.produk.nama },
          jumlah: d.jumlah,
          hargaSatuan: d.hargaSatuan,
          subtotal: d.subtotal,
        })),
        totalSetoran,
        sisaBayar,
        applicableType,
        applicableAmount,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Get penjualan list error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
