import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const VALID_TIPE = ["CASH", "CICILAN", "PELUNASAN", "KONSINYASI_CICIL", "KONSINYASI_LUNAS"] as const;
type TipeSetoran = typeof VALID_TIPE[number];

const TIPE_PIUTANG: TipeSetoran[] = ["CICILAN", "PELUNASAN", "KONSINYASI_CICIL", "KONSINYASI_LUNAS"];
const TIPE_PELUNASAN: TipeSetoran[] = ["PELUNASAN", "KONSINYASI_LUNAS"];

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
    const status = searchParams.get("status") || "SEMUA";
    const bulan = searchParams.get("bulan") || "";
    const tahun = searchParams.get("tahun") || "";
    const tipe = searchParams.get("tipe") || "";
    const penjualanId = searchParams.get("penjualanId") || "";

    const where: Record<string, unknown> = {};

    if (status === "MENUNGGU") {
      where.disetujui = false;
    } else if (status === "DISETUJUI") {
      where.disetujui = true;
    }

    if (tipe) {
      where.tipe = tipe;
    }

    if (penjualanId) {
      where.penjualanId = penjualanId;
    }

    if (bulan && tahun) {
      const y = Number(tahun);
      const m = Number(bulan);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const setoran = await prisma.setoran.findMany({
      where,
      include: {
        penjualan: {
          include: {
            apotek: true,
            pelanggan: true,
            sales: true,
            piutang: true,
          },
        },
        piutang: true,
        apotek: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: setoran });
  } catch (error) {
    console.error("Get setoran error:", error);
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
    const { tipe, penjualanId, piutangId, apotekId, jumlah, keterangan } = body;

    if (!tipe || !penjualanId || !jumlah) {
      return NextResponse.json(
        { success: false, message: "tipe, penjualanId, dan jumlah harus diisi" },
        { status: 400 }
      );
    }

    if (!VALID_TIPE.includes(tipe)) {
      return NextResponse.json(
        { success: false, message: "Tipe tidak valid" },
        { status: 400 }
      );
    }

    const numJumlah = Number(jumlah);
    if (isNaN(numJumlah) || numJumlah <= 0) {
      return NextResponse.json(
        { success: false, message: "Jumlah harus lebih dari 0" },
        { status: 400 }
      );
    }

    const penjualan = await prisma.penjualan.findUnique({
      where: { id: penjualanId },
      include: { piutang: true },
    });
    if (!penjualan) {
      return NextResponse.json(
        { success: false, message: "Penjualan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (TIPE_PIUTANG.includes(tipe)) {
      if (!piutangId) {
        return NextResponse.json(
          { success: false, message: "piutangId harus diisi untuk tipe ini" },
          { status: 400 }
        );
      }

      const piutang = await prisma.piutang.findUnique({ where: { id: piutangId } });
      if (!piutang) {
        return NextResponse.json(
          { success: false, message: "Piutang tidak ditemukan" },
          { status: 404 }
        );
      }

      if (piutang.sisa < numJumlah) {
        return NextResponse.json(
          { success: false, message: `Sisa piutang (${piutang.sisa}) kurang dari jumlah setoran (${numJumlah})` },
          { status: 400 }
        );
      }

      if (TIPE_PELUNASAN.includes(tipe) && numJumlah !== piutang.sisa) {
        return NextResponse.json(
          { success: false, message: `Untuk pelunasan, jumlah harus sama dengan sisa piutang (${piutang.sisa})` },
          { status: 400 }
        );
      }
    }

    const setoran = await prisma.setoran.create({
      data: {
        tipe,
        penjualanId,
        piutangId: piutangId || null,
        apotekId: apotekId || penjualan.apotekId || null,
        jumlah: numJumlah,
        keterangan: keterangan || "",
        disetujui: false,
      },
    });

    return NextResponse.json({ success: true, data: setoran }, { status: 201 });
  } catch (error) {
    console.error("Create setoran error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "id harus diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.setoran.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Setoran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.disetujui) {
      return NextResponse.json(
        { success: false, message: "Setoran sudah disetujui" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { nama: true },
    });

    const setoran = await prisma.setoran.update({
      where: { id },
      data: {
        disetujui: true,
        disetujuiOleh: currentUser?.nama || user.email,
        tanggalAcc: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: setoran });
  } catch (error) {
    console.error("Approve setoran error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "id harus diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.setoran.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Setoran tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.disetujui) {
      return NextResponse.json(
        { success: false, message: "Tidak bisa menghapus setoran yang sudah disetujui" },
        { status: 400 }
      );
    }

    await prisma.setoran.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Setoran berhasil dihapus" });
  } catch (error) {
    console.error("Delete setoran error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
