import { NextResponse } from "next/server";
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

    const produk = await prisma.produk.findMany({
      select: {
        id: true,
        nama: true,
        kategori: true,
        satuan: true,
        stokGudang: true,
        minStok: true,
        hpp: true,
      },
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: produk });
  } catch (error) {
    console.error("Get stok gudang error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
