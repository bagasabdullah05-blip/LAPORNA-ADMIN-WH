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
    const sales = await prisma.sales.findUnique({ where: { id } });
    if (!sales) {
      return NextResponse.json(
        { success: false, message: "Sales tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Get sales error:", error);
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

    const existing = await prisma.sales.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Sales tidak ditemukan" },
        { status: 404 }
      );
    }

    const sales = await prisma.sales.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Update sales error:", error);
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
    const existing = await prisma.sales.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Sales tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.sales.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Sales berhasil dihapus" });
  } catch (error) {
    console.error("Delete sales error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
