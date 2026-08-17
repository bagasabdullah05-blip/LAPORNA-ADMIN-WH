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

    const pelanggan = await prisma.pelanggan.findMany({
      where: search
        ? {
            nama: { contains: search },
          }
        : undefined,
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: pelanggan });
  } catch (error) {
    console.error("Get pelanggan error:", error);
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
    const { nama, tipe, alamat, noTelp } = body;

    if (!nama || !alamat || !noTelp) {
      return NextResponse.json(
        { success: false, message: "Nama, alamat, dan noTelp harus diisi" },
        { status: 400 }
      );
    }

    const pelanggan = await prisma.pelanggan.create({
      data: {
        nama,
        tipe: tipe || "UMUM",
        alamat,
        noTelp,
      },
    });

    return NextResponse.json({ success: true, data: pelanggan }, { status: 201 });
  } catch (error) {
    console.error("Create pelanggan error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
