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

    const cicilan = await prisma.cicilan.findMany({
      include: {
        piutang: {
          include: {
            penjualan: {
              include: {
                apotek: true,
                pelanggan: true,
              },
            },
          },
        },
        user: { select: { id: true, nama: true } },
      },
      orderBy: { tanggalBayar: "desc" },
    });

    return NextResponse.json({ success: true, data: cicilan });
  } catch (error) {
    console.error("Get cicilan error:", error);
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
    const { piutangId, userId, jumlahBayar, keterangan } = body;

    if (!piutangId || !userId || !jumlahBayar) {
      return NextResponse.json(
        { success: false, message: "piutangId, userId, dan jumlahBayar harus diisi" },
        { status: 400 }
      );
    }

    const existingPiutang = await prisma.piutang.findUnique({ where: { id: piutangId } });
    if (!existingPiutang) {
      return NextResponse.json(
        { success: false, message: "Piutang tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existingPiutang.status === "LUNAS") {
      return NextResponse.json(
        { success: false, message: "Piutang sudah lunas" },
        { status: 400 }
      );
    }

    if (jumlahBayar > existingPiutang.sisa) {
      return NextResponse.json(
        { success: false, message: "Jumlah bayar melebihi sisa piutang" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const cicilan = await tx.cicilan.create({
        data: {
          piutangId,
          userId,
          jumlahBayar,
          keterangan: keterangan || "",
        },
      });

      const newSisa = existingPiutang.sisa - jumlahBayar;

      await tx.piutang.update({
        where: { id: piutangId },
        data: {
          sisa: newSisa,
          status: newSisa <= 0 ? "LUNAS" : "BELUM_LUNAS",
        },
      });

      return cicilan;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create cicilan error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
