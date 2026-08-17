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

    const apotek = await prisma.apotek.findMany({
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: apotek });
  } catch (error) {
    console.error("Get apotek error:", error);
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
    const { nama, alamat, noTelp, pemilik, pic, aktif } = body;

    if (!nama || !alamat || !noTelp || !pemilik || !pic) {
      return NextResponse.json(
        { success: false, message: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    const apotek = await prisma.apotek.create({
      data: {
        nama,
        alamat,
        noTelp,
        pemilik,
        pic,
        aktif: aktif !== undefined ? aktif : true,
      },
    });

    return NextResponse.json({ success: true, data: apotek }, { status: 201 });
  } catch (error) {
    console.error("Create apotek error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
