import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const data = await prisma.opnameLog.findMany({
      include: {
        apotek: { select: { nama: true } },
        produk: { select: { nama: true } },
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get opname error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

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
    const { tipe, apotekId, produkId, stokFisik, keterangan, tanggal } = body;

    if (!tipe || !produkId || stokFisik === undefined || !keterangan) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const existingProduk = await prisma.produk.findUnique({ where: { id: produkId } });
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
      const stokKonsinyasi = await prisma.stokKonsinyasi.findUnique({
        where: { apotekId_produkId: { apotekId, produkId } },
      });
      stokSistem = stokKonsinyasi?.jumlah || 0;
    } else {
      throw new Error("Tipe harus GUDANG atau APOTEK");
    }

    const selisih = stokFisik - stokSistem;

    const result = await prisma.opnameLog.create({
      data: {
        userId: user.userId,
        tipe,
        apotekId: tipe === "APOTEK" ? apotekId : null,
        produkId,
        stokSistem,
        stokFisik,
        selisih,
        keterangan,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
      },
    });

    if (tipe === "GUDANG") {
      await prisma.produk.update({
        where: { id: produkId },
        data: { stokGudang: stokFisik },
      });
    } else {
      await prisma.stokKonsinyasi.update({
        where: { apotekId_produkId: { apotekId, produkId } },
        data: { jumlah: stokFisik },
      });
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create opname error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID harus diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.opnameLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data opname tidak ditemukan" }, { status: 404 });
    }

    if (existing.tipe === "GUDANG") {
      await prisma.produk.update({
        where: { id: existing.produkId },
        data: { stokGudang: existing.stokSistem },
      });
    } else if (existing.apotekId) {
      const stokExists = await prisma.stokKonsinyasi.findUnique({
        where: { apotekId_produkId: { apotekId: existing.apotekId, produkId: existing.produkId } },
      });
      if (stokExists) {
        await prisma.stokKonsinyasi.update({
          where: { apotekId_produkId: { apotekId: existing.apotekId, produkId: existing.produkId } },
          data: { jumlah: existing.stokSistem },
        });
      }
    }
    await prisma.opnameLog.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Opname berhasil dihapus, stok dikembalikan ke stok sistem" });
  } catch (error) {
    console.error("Delete opname error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
