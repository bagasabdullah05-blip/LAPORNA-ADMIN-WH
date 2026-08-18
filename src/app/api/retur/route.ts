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

    const data = await prisma.returLog.findMany({
      include: { apotek: { select: { nama: true } }, produk: { select: { nama: true } } },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Get retur error:", error);
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

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, apotekId, produkId, jumlah, keterangan, tanggal } = body;

    if (!id || !apotekId || !produkId || !jumlah) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const existing = await prisma.returLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data retur tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.produk.update({
        where: { id: existing.produkId },
        data: { stokGudang: { decrement: existing.jumlah } },
      });
      await tx.stokKonsinyasi.update({
        where: { apotekId_produkId: { apotekId: existing.apotekId, produkId: existing.produkId } },
        data: { jumlah: { increment: existing.jumlah } },
      });

      const newStok = await tx.stokKonsinyasi.findUnique({
        where: { apotekId_produkId: { apotekId, produkId } },
      });
      if (!newStok || newStok.jumlah < jumlah) {
        throw new Error("Stok konsinyasi tidak mencukupi");
      }

      await tx.produk.update({
        where: { id: produkId },
        data: { stokGudang: { increment: jumlah } },
      });
      await tx.stokKonsinyasi.update({
        where: { apotekId_produkId: { apotekId, produkId } },
        data: { jumlah: { decrement: jumlah } },
      });

      await tx.returLog.update({
        where: { id },
        data: {
          apotekId,
          produkId,
          jumlah,
          keterangan: keterangan || "",
          tanggal: tanggal ? new Date(tanggal) : existing.tanggal,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Retur berhasil diupdate" });
  } catch (error) {
    console.error("Update retur error:", error);
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

    const existing = await prisma.returLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data retur tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.produk.update({
        where: { id: existing.produkId },
        data: { stokGudang: { decrement: existing.jumlah } },
      });
      await tx.stokKonsinyasi.update({
        where: { apotekId_produkId: { apotekId: existing.apotekId, produkId: existing.produkId } },
        data: { jumlah: { increment: existing.jumlah } },
      });
      await tx.returLog.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: "Retur berhasil dihapus" });
  } catch (error) {
    console.error("Delete retur error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
