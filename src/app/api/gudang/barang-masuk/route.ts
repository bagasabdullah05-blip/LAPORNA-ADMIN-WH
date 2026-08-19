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
    const search = searchParams.get("search") || "";
    const date = searchParams.get("date") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.produk = { nama: { contains: search } };
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.tanggal = { gte: startDate, lte: endDate };
    }

    const logs = await prisma.barangMasukLog.findMany({
      where,
      include: { produk: true },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get barang masuk error:", error);
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
    const { produkId, jumlah, hargaBeli, keterangan, tanggal } = body;

    if (!produkId || !jumlah || !hargaBeli) {
      return NextResponse.json(
        { success: false, message: "produkId, jumlah, dan hargaBeli harus diisi" },
        { status: 400 }
      );
    }

    const existingProduk = await prisma.produk.findUnique({ where: { id: produkId } });
    if (!existingProduk) {
      return NextResponse.json(
        { success: false, message: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    const result = await prisma.barangMasukLog.create({
      data: {
        produkId,
        jumlah,
        hargaBeli,
        keterangan: keterangan || "",
        tanggal: tanggal ? new Date(tanggal) : new Date(),
      },
    });

    await prisma.produk.update({
      where: { id: produkId },
      data: { stokGudang: { increment: jumlah } },
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create barang masuk error:", error);
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
    const { id, produkId, jumlah, hargaBeli, keterangan, tanggal } = body;

    if (!id || !produkId || !jumlah || !hargaBeli) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const existing = await prisma.barangMasukLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data barang masuk tidak ditemukan" }, { status: 404 });
    }

    await prisma.produk.update({
      where: { id: existing.produkId },
      data: { stokGudang: { decrement: existing.jumlah } },
    });

    await prisma.produk.update({
      where: { id: produkId },
      data: { stokGudang: { increment: jumlah } },
    });

    await prisma.barangMasukLog.update({
      where: { id },
      data: {
        produkId,
        jumlah,
        hargaBeli,
        keterangan: keterangan || "",
        tanggal: tanggal ? new Date(tanggal) : existing.tanggal,
      },
    });

    return NextResponse.json({ success: true, message: "Barang masuk berhasil diupdate" });
  } catch (error) {
    console.error("Update barang masuk error:", error);
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

    const existing = await prisma.barangMasukLog.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data barang masuk tidak ditemukan" }, { status: 404 });
    }

    await prisma.produk.update({
      where: { id: existing.produkId },
      data: { stokGudang: { decrement: existing.jumlah } },
    });
    await prisma.barangMasukLog.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Barang masuk berhasil dihapus" });
  } catch (error) {
    console.error("Delete barang masuk error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
