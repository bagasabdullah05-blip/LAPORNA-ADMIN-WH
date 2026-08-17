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
    const apotek = await prisma.apotek.findUnique({
      where: { id },
      include: { stokKonsinyasi: { include: { produk: true } } },
    });

    if (!apotek) {
      return NextResponse.json(
        { success: false, message: "Apotek tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: apotek });
  } catch (error) {
    console.error("Get apotek error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();

    const existing = await prisma.apotek.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Apotek tidak ditemukan" },
        { status: 404 }
      );
    }

    const apotek = await prisma.apotek.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: apotek });
  } catch (error) {
    console.error("Update apotek error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existing = await prisma.apotek.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Apotek tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.apotek.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Apotek berhasil dihapus" });
  } catch (error) {
    console.error("Delete apotek error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
