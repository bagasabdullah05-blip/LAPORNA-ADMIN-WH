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

    const penjualan = await prisma.penjualan.findMany({
      include: {
        details: { include: { produk: true } },
        apotek: true,
        pelanggan: true,
        sales: true,
        user: { select: { id: true, nama: true } },
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json({ success: true, data: penjualan });
  } catch (error) {
    console.error("Get penjualan error:", error);
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
    const { tipe, tanggal, apotekId, pelangganId, salesId, metodeBayar, items, jumlahBayar } = body;

    if (!tipe || !salesId || !metodeBayar || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const [existingSales, existingApotek, existingPelanggan] = await Promise.all([
      prisma.sales.findUnique({ where: { id: salesId } }),
      apotekId ? prisma.apotek.findUnique({ where: { id: apotekId } }) : null,
      pelangganId ? prisma.pelanggan.findUnique({ where: { id: pelangganId } }) : null,
    ]);

    if (!existingSales) {
      return NextResponse.json({ success: false, message: "Sales tidak ditemukan" }, { status: 404 });
    }
    if (apotekId && !existingApotek) {
      return NextResponse.json({ success: false, message: "Apotek tidak ditemukan" }, { status: 404 });
    }
    if (pelangganId && !existingPelanggan) {
      return NextResponse.json({ success: false, message: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    const produkIds = items.map((item: { produkId: string }) => item.produkId);

    const existingProduks = await prisma.produk.findMany({
      where: { id: { in: produkIds } },
    });
    const produkMap = new Map(existingProduks.map((p) => [p.id, p]));

    let totalBayar = 0;
    const detailData = [];

    for (const item of items) {
      const existingProduk = produkMap.get(item.produkId);
      if (!existingProduk) {
        throw new Error(`Produk dengan id ${item.produkId} tidak ditemukan`);
      }
      const subtotal = item.jumlah * item.hargaSatuan;
      totalBayar += subtotal;
      detailData.push({
        produkId: item.produkId,
        jumlah: item.jumlah,
        tipeHarga: item.tipeHarga,
        hargaSatuan: item.hargaSatuan,
        subtotal,
      });
    }

    const result = await prisma.penjualan.create({
      data: {
        tipe,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        apotekId: apotekId || null,
        pelangganId: pelangganId || null,
        salesId,
        userId: user.userId,
        totalBayar,
        metodeBayar,
        status: "SELESAI",
      },
    });

    await prisma.detailPenjualan.createMany({
      data: detailData.map((d) => ({ penjualanId: result.id, ...d })),
    });

    const bayar = Number(jumlahBayar) || 0;

    if (bayar >= totalBayar) {
      await prisma.setoran.create({
        data: {
          tipe: "CASH",
          penjualanId: result.id,
          apotekId: apotekId || null,
          jumlah: totalBayar,
          keterangan: `Auto: ${metodeBayar} penjualan (lunas)`,
          disetujui: false,
        },
      });
    } else if (bayar > 0) {
      const piutang = await prisma.piutang.create({
        data: { penjualanId: result.id, apotekId: apotekId || null, total: totalBayar, sisa: totalBayar - bayar, status: "BELUM_LUNAS" },
      });
      await prisma.setoran.create({
        data: {
          tipe: tipe === "KONSINYASI" ? "KONSINYASI_CICIL" : "CICILAN",
          penjualanId: result.id,
          piutangId: piutang.id,
          apotekId: apotekId || null,
          jumlah: bayar,
          keterangan: `Auto: ${metodeBayar} penjualan (bayar sebagian)`,
          disetujui: false,
        },
      });
    } else {
      await prisma.piutang.create({
        data: { penjualanId: result.id, apotekId: apotekId || null, total: totalBayar, sisa: totalBayar, status: "BELUM_LUNAS" },
      });
    }

    if (tipe === "KONSINYASI") {
      const stokRows = await prisma.stokKonsinyasi.findMany({
        where: { apotekId, produkId: { in: produkIds } },
      });
      const stokMap = new Map(stokRows.map((s) => [s.produkId, s]));

      for (const item of items) {
        const stok = stokMap.get(item.produkId);
        if (!stok || stok.jumlah < item.jumlah) {
          throw new Error(`Stok konsinyasi tidak mencukupi untuk produk ${item.produkId}`);
        }
        await prisma.stokKonsinyasi.update({
          where: { apotekId_produkId: { apotekId, produkId: item.produkId } },
          data: { jumlah: { decrement: item.jumlah } },
        });
      }
    } else if (tipe === "LANGSUNG") {
      for (const item of items) {
        const produk = produkMap.get(item.produkId);
        if (!produk || produk.stokGudang < item.jumlah) {
          throw new Error(`Stok gudang tidak mencukupi untuk produk ${item.produkId}`);
        }
        await prisma.produk.update({
          where: { id: item.produkId },
          data: { stokGudang: { decrement: item.jumlah } },
        });
      }
    }

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Create penjualan error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
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
    const { id, tipe, tanggal, apotekId, pelangganId, salesId, metodeBayar, items, jumlahBayar } = body;

    if (!id || !tipe || !salesId || !metodeBayar || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const existing = await prisma.penjualan.findUnique({
      where: { id },
      include: { details: true, piutang: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Penjualan tidak ditemukan" }, { status: 404 });
    }

    const produkIds = items.map((item: { produkId: string }) => item.produkId);

    for (const d of existing.details) {
      if (existing.tipe === "KONSINYASI" && existing.apotekId) {
        await prisma.stokKonsinyasi.update({
          where: { apotekId_produkId: { apotekId: existing.apotekId, produkId: d.produkId } },
          data: { jumlah: { increment: d.jumlah } },
        });
      } else if (existing.tipe === "LANGSUNG") {
        await prisma.produk.update({
          where: { id: d.produkId },
          data: { stokGudang: { increment: d.jumlah } },
        });
      }
    }

    if (existing.piutang) {
      await prisma.cicilan.deleteMany({ where: { piutangId: existing.piutang.id } });
      await prisma.piutang.delete({ where: { id: existing.piutang.id } });
    }
    await prisma.setoran.deleteMany({ where: { penjualanId: id } });
    await prisma.detailPenjualan.deleteMany({ where: { penjualanId: id } });

    const existingProduks = await prisma.produk.findMany({
      where: { id: { in: produkIds } },
    });
    const produkMap = new Map(existingProduks.map((p) => [p.id, p]));

    let totalBayar = 0;
    const detailData = [];
    for (const item of items) {
      const subtotal = item.jumlah * item.hargaSatuan;
      totalBayar += subtotal;
      detailData.push({
        produkId: item.produkId,
        jumlah: item.jumlah,
        tipeHarga: item.tipeHarga,
        hargaSatuan: item.hargaSatuan,
        subtotal,
      });
    }

    await prisma.penjualan.update({
      where: { id },
      data: {
        tipe,
        tanggal: tanggal ? new Date(tanggal) : existing.tanggal,
        apotekId: tipe === "KONSINYASI" ? (apotekId || null) : null,
        pelangganId: tipe === "LANGSUNG" ? (pelangganId || null) : null,
        salesId,
        totalBayar,
        metodeBayar,
      },
    });

    await prisma.detailPenjualan.createMany({
      data: detailData.map((d) => ({ penjualanId: id, ...d })),
    });

    const bayar = Number(jumlahBayar) || 0;

    if (bayar >= totalBayar) {
      await prisma.setoran.create({
        data: {
          tipe: "CASH",
          penjualanId: id,
          apotekId: apotekId || null,
          jumlah: totalBayar,
          keterangan: `Auto: ${metodeBayar} penjualan (lunas)`,
          disetujui: false,
        },
      });
    } else if (bayar > 0) {
      const piutang = await prisma.piutang.create({
        data: { penjualanId: id, apotekId: apotekId || null, total: totalBayar, sisa: totalBayar - bayar, status: "BELUM_LUNAS" },
      });
      await prisma.setoran.create({
        data: {
          tipe: tipe === "KONSINYASI" ? "KONSINYASI_CICIL" : "CICILAN",
          penjualanId: id,
          piutangId: piutang.id,
          apotekId: apotekId || null,
          jumlah: bayar,
          keterangan: `Auto: ${metodeBayar} penjualan (bayar sebagian)`,
          disetujui: false,
        },
      });
    } else {
      await prisma.piutang.create({
        data: { penjualanId: id, apotekId: apotekId || null, total: totalBayar, sisa: totalBayar, status: "BELUM_LUNAS" },
      });
    }

    if (tipe === "KONSINYASI" && apotekId) {
      const stokRows = await prisma.stokKonsinyasi.findMany({
        where: { apotekId, produkId: { in: produkIds } },
      });
      const stokMap = new Map(stokRows.map((s) => [s.produkId, s]));
      for (const item of items) {
        const stok = stokMap.get(item.produkId);
        if (!stok || stok.jumlah < item.jumlah) {
          throw new Error(`Stok konsinyasi tidak mencukupi untuk produk ${item.produkId}`);
        }
        await prisma.stokKonsinyasi.update({
          where: { apotekId_produkId: { apotekId, produkId: item.produkId } },
          data: { jumlah: { decrement: item.jumlah } },
        });
      }
    } else if (tipe === "LANGSUNG") {
      for (const item of items) {
        const produk = produkMap.get(item.produkId);
        if (!produk || produk.stokGudang < item.jumlah) {
          throw new Error(`Stok gudang tidak mencukupi untuk produk ${item.produkId}`);
        }
        await prisma.produk.update({
          where: { id: item.produkId },
          data: { stokGudang: { decrement: item.jumlah } },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Penjualan berhasil diupdate" });
  } catch (error) {
    console.error("Update penjualan error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
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
        { success: false, message: "ID harus diisi" },
        { status: 400 }
      );
    }

    const existing = await prisma.penjualan.findUnique({
      where: { id },
      include: { details: true, piutang: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Penjualan tidak ditemukan" }, { status: 404 });
    }

    for (const d of existing.details) {
      if (existing.tipe === "KONSINYASI" && existing.apotekId) {
        await prisma.stokKonsinyasi.update({
          where: { apotekId_produkId: { apotekId: existing.apotekId, produkId: d.produkId } },
          data: { jumlah: { increment: d.jumlah } },
        });
      } else if (existing.tipe === "LANGSUNG") {
        await prisma.produk.update({
          where: { id: d.produkId },
          data: { stokGudang: { increment: d.jumlah } },
        });
      }
    }

    if (existing.piutang) {
      await prisma.cicilan.deleteMany({ where: { piutangId: existing.piutang.id } });
      await prisma.piutang.delete({ where: { id: existing.piutang.id } });
    }
    await prisma.setoran.deleteMany({ where: { penjualanId: id } });
    await prisma.detailPenjualan.deleteMany({ where: { penjualanId: id } });
    await prisma.penjualan.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Penjualan berhasil dihapus" });
  } catch (error) {
    console.error("Delete penjualan error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
