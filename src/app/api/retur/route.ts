import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { apotekId, produkId, jumlah, keterangan, tanggal } = body;

    if (!apotekId || !produkId || !jumlah) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const [existingApotek, existingProduk] = await Promise.all([
      prisma.apotek.findUnique({ where: { id: apotekId } }),
      prisma.produk.findUnique({ where: { id: produkId } }),
    ]);

    if (!existingApotek || !existingProduk) {
      return NextResponse.json(
        { success: false, message: "Data tidak valid" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const stokKonsinyasi = await tx.stokKonsinyasi.findUnique({
        where: { apotekId_produkId: { apotekId, produkId } },
      });

      if (!stokKonsinyasi || stokKonsinyasi.jumlah < jumlah) {
        throw new Error("Stok konsinyasi tidak mencukupi");
      }

      const log = await tx.returLog.create({
        data: { apotekId, produkId, jumlah, keterangan: keterangan || "", tanggal: tanggal ? new Date(tanggal) : new Date() },
      });

      await tx.produk.update({
        where: { id: produkId },
        data: { stokGudang: { increment: jumlah } },
      });

      await tx.stokKonsinyasi.update({
        where: { apotekId_produkId: { apotekId, produkId } },
        data: { jumlah: { decrement: jumlah } },
      });

      return log;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create retur error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
