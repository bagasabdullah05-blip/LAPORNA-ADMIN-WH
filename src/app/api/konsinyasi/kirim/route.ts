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

    const logs = await prisma.konsinyasiLog.findMany({
      include: {
        apotek: true,
        produk: true,
        sales: true,
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Get konsinyasi kirim error:", error);
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
    const { apotekId, salesId, keterangan, tanggal, items } = body;

    if (!apotekId || !salesId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const [existingApotek, existingSales] = await Promise.all([
      prisma.apotek.findUnique({ where: { id: apotekId } }),
      prisma.sales.findUnique({ where: { id: salesId } }),
    ]);

    if (!existingApotek || !existingSales) {
      return NextResponse.json(
        { success: false, message: "Data tidak valid" },
        { status: 404 }
      );
    }

    const produkIds = items.map((item: { produkId: string }) => item.produkId);

    const result = await prisma.$transaction(async (tx) => {
      const existingProduks = await tx.produk.findMany({
        where: { id: { in: produkIds } },
        select: { id: true, nama: true, stokGudang: true },
      });
      const produkMap = new Map(existingProduks.map((p) => [p.id, p]));

      for (const item of items) {
        const produk = produkMap.get(item.produkId);
        if (!produk) {
          throw new Error(`Produk ${item.produkId} tidak ditemukan`);
        }
        if (produk.stokGudang < item.jumlah) {
          throw new Error(`Stok gudang ${produk.nama} tidak mencukupi (tersedia: ${produk.stokGudang}, diminta: ${item.jumlah})`);
        }
      }

      const logs = [];
      for (const item of items) {
        const log = await tx.konsinyasiLog.create({
          data: { apotekId, produkId: item.produkId, salesId, jumlah: item.jumlah, keterangan: keterangan || "", tanggal: tanggal ? new Date(tanggal) : new Date() },
        });
        logs.push(log);

        await tx.produk.update({
          where: { id: item.produkId },
          data: { stokGudang: { decrement: item.jumlah } },
        });

        await tx.stokKonsinyasi.upsert({
          where: { apotekId_produkId: { apotekId, produkId: item.produkId } },
          create: { apotekId, produkId: item.produkId, jumlah: item.jumlah },
          update: { jumlah: { increment: item.jumlah } },
        });
      }

      return logs;
    });

    return NextResponse.json(
      { success: true, data: result, message: `${result.length} produk berhasil dikirim` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create konsinyasi kirim error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
