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
    const pelanggan = await prisma.pelanggan.findUnique({ where: { id } });
    if (!pelanggan) {
      return NextResponse.json(
        { success: false, message: "Pelanggan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: pelanggan });
  } catch (error) {
    console.error("Get pelanggan error:", error);
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

    const existing = await prisma.pelanggan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Pelanggan tidak ditemukan" },
        { status: 404 }
      );
    }

    const pelanggan = await prisma.pelanggan.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: pelanggan });
  } catch (error) {
    console.error("Update pelanggan error:", error);
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
    const existing = await prisma.pelanggan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Pelanggan tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.pelanggan.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Pelanggan berhasil dihapus" });
  } catch (error) {
    console.error("Delete pelanggan error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
