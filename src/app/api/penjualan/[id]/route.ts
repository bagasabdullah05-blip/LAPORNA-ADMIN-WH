import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const penjualan = await prisma.penjualan.findUnique({
      where: { id },
      include: {
        details: { include: { produk: true } },
        apotek: true,
        pelanggan: true,
        sales: true,
        user: { select: { id: true, nama: true } },
        piutang: true,
      },
    });

    if (!penjualan) {
      return NextResponse.json(
        { success: false, message: "Penjualan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: penjualan });
  } catch (error) {
    console.error("Get penjualan error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
