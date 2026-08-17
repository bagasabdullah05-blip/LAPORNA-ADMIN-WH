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

    const produk = await prisma.produk.findMany({
      where: search
        ? {
            nama: { contains: search },
          }
        : undefined,
      orderBy: { nama: "asc" },
    });

    return NextResponse.json({ success: true, data: produk });
  } catch (error) {
    console.error("Get produk error:", error);
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

    const isBatch = Array.isArray(body.items);

    if (isBatch) {
      const items = body.items as Array<{
        nama: string;
        kategori: string;
        satuan: string;
        bentuk: string;
        hargaMember?: number;
        hargaAgent?: number;
        hargaKarton?: number;
        hargaAptCash?: number;
        hargaKonsinyasi?: number;
        hargaTerendah?: number;
        hpp?: number;
        stokGudang?: number;
        minStok?: number;
      }>;

      if (!items || items.length === 0) {
        return NextResponse.json(
          { success: false, message: "Tidak ada data produk" },
          { status: 400 }
        );
      }

      const created = await prisma.produk.createMany({
        data: items.map((item) => ({
          nama: item.nama,
          kategori: item.kategori,
          satuan: item.satuan,
          bentuk: item.bentuk,
          hargaMember: item.hargaMember || 0,
          hargaAgent: item.hargaAgent || 0,
          hargaKarton: item.hargaKarton || 0,
          hargaAptCash: item.hargaAptCash || 0,
          hargaKonsinyasi: item.hargaKonsinyasi || 0,
          hargaTerendah: item.hargaTerendah || 0,
          hpp: item.hpp || 0,
          stokGudang: item.stokGudang || 0,
          minStok: item.minStok || 0,
        })),
      });

      return NextResponse.json(
        { success: true, data: { count: created.count }, message: `${created.count} produk berhasil ditambahkan` },
        { status: 201 }
      );
    }

    const {
      nama,
      kategori,
      satuan,
      bentuk,
      hargaMember,
      hargaAgent,
      hargaKarton,
      hargaAptCash,
      hargaKonsinyasi,
      hargaTerendah,
      hpp,
      stokGudang,
      minStok,
    } = body;

    if (!nama || !kategori || !satuan || !bentuk) {
      return NextResponse.json(
        { success: false, message: "Nama, kategori, satuan, dan bentuk harus diisi" },
        { status: 400 }
      );
    }

    const produk = await prisma.produk.create({
      data: {
        nama,
        kategori,
        satuan,
        bentuk,
        hargaMember: hargaMember || 0,
        hargaAgent: hargaAgent || 0,
        hargaKarton: hargaKarton || 0,
        hargaAptCash: hargaAptCash || 0,
        hargaKonsinyasi: hargaKonsinyasi || 0,
        hargaTerendah: hargaTerendah || 0,
        hpp: hpp || 0,
        stokGudang: stokGudang || 0,
        minStok: minStok || 0,
      },
    });

    return NextResponse.json({ success: true, data: produk }, { status: 201 });
  } catch (error) {
    console.error("Create produk error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
