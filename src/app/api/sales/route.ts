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

    const sales = await prisma.sales.findMany({
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Get sales error:", error);
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
    const { nama, noTelp, alamat, aktif } = body;

    if (!nama || !noTelp || !alamat) {
      return NextResponse.json(
        { success: false, message: "Nama, noTelp, dan alamat harus diisi" },
        { status: 400 }
      );
    }

    const sales = await prisma.sales.create({
      data: {
        nama,
        noTelp,
        alamat,
        aktif: aktif !== undefined ? aktif : true,
      },
    });

    return NextResponse.json({ success: true, data: sales }, { status: 201 });
  } catch (error) {
    console.error("Create sales error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
