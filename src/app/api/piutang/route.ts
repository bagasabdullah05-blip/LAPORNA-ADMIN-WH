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
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const piutang = await prisma.piutang.findMany({
      where,
      include: {
        penjualan: {
          include: {
            apotek: true,
            pelanggan: true,
          },
        },
        apotek: true,
        cicilan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: piutang });
  } catch (error) {
    console.error("Get piutang error:", error);
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
    const { apotekId, total, sisa, keterangan } = body;

    if (!total || total <= 0) {
      return NextResponse.json(
        { success: false, message: "Total harus lebih dari 0" },
        { status: 400 }
      );
    }

    const piutang = await prisma.piutang.create({
      data: {
        penjualanId: null,
        apotekId: apotekId || null,
        total,
        sisa: sisa ?? total,
        keterangan: keterangan || "",
      },
      include: {
        penjualan: { include: { apotek: true, pelanggan: true } },
        apotek: true,
      },
    });

    return NextResponse.json({ success: true, data: piutang }, { status: 201 });
  } catch (error) {
    console.error("Create piutang error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
