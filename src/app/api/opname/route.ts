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
    const { tipe, apotekId, produkId, stokFisik, keterangan } = body;

    if (!tipe || !produkId || stokFisik === undefined || !keterangan) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const existingProduk = await tx.produk.findUnique({ where: { id: produkId } });
      if (!existingProduk) {
        throw new Error("Produk tidak ditemukan");
      }

      let stokSistem: number;

      if (tipe === "GUDANG") {
        stokSistem = existingProduk.stokGudang;
      } else if (tipe === "APOTEK") {
        if (!apotekId) {
          throw new Error("apotekId harus diisi untuk opname apotek");
        }
        const stokKonsinyasi = await tx.stokKonsinyasi.findUnique({
          where: { apotekId_produkId: { apotekId, produkId } },
        });
        stokSistem = stokKonsinyasi?.jumlah || 0;
      } else {
        throw new Error("Tipe harus GUDANG atau APOTEK");
      }

      const selisih = stokFisik - stokSistem;

      const log = await tx.opnameLog.create({
        data: {
          userId: user.userId,
          tipe,
          apotekId: tipe === "APOTEK" ? apotekId : null,
          produkId,
          stokSistem,
          stokFisik,
          selisih,
          keterangan,
        },
      });

      if (tipe === "GUDANG") {
        await tx.produk.update({
          where: { id: produkId },
          data: { stokGudang: stokFisik },
        });
      } else {
        await tx.stokKonsinyasi.update({
          where: { apotekId_produkId: { apotekId, produkId } },
          data: { jumlah: stokFisik },
        });
      }

      return log;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create opname error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
