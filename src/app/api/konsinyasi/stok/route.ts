import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const apotekId = searchParams.get("apotekId");

    const where: Record<string, unknown> = {};
    if (apotekId) {
      where.apotekId = apotekId;
    }

    const stok = await prisma.stokKonsinyasi.findMany({
      where,
      include: {
        apotek: true,
        produk: true,
      },
      orderBy: { apotek: { nama: "asc" } },
    });

    return NextResponse.json({ success: true, data: stok });
  } catch (error) {
    console.error("Get stok konsinyasi error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
