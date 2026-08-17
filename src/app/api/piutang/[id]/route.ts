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
    const piutang = await prisma.piutang.findUnique({
      where: { id },
      include: {
        penjualan: {
          include: {
            details: { include: { produk: true } },
            apotek: true,
            pelanggan: true,
            sales: true,
          },
        },
        cicilan: {
          include: {
            user: { select: { id: true, nama: true } },
          },
          orderBy: { tanggalBayar: "desc" },
        },
      },
    });

    if (!piutang) {
      return NextResponse.json(
        { success: false, message: "Piutang tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: piutang });
  } catch (error) {
    console.error("Get piutang error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
