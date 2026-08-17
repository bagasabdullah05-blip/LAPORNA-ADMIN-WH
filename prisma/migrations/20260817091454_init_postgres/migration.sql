-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apotek" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "pemilik" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Apotek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produk" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,
    "bentuk" TEXT NOT NULL,
    "hargaMember" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaAgent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaKarton" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaAptCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaKonsinyasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hargaTerendah" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hpp" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stokGudang" INTEGER NOT NULL DEFAULT 0,
    "minStok" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sales" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pelanggan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" TEXT NOT NULL DEFAULT 'UMUM',
    "alamat" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,

    CONSTRAINT "Pelanggan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsinyasiLog" (
    "id" TEXT NOT NULL,
    "apotekId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "salesId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT NOT NULL,

    CONSTRAINT "KonsinyasiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StokKonsinyasi" (
    "id" TEXT NOT NULL,
    "apotekId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StokKonsinyasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarangMasukLog" (
    "id" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "hargaBeli" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BarangMasukLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturLog" (
    "id" TEXT NOT NULL,
    "apotekId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpnameLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "apotekId" TEXT,
    "produkId" TEXT NOT NULL,
    "stokSistem" INTEGER NOT NULL,
    "stokFisik" INTEGER NOT NULL,
    "selisih" INTEGER NOT NULL,
    "keterangan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpnameLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penjualan" (
    "id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "apotekId" TEXT,
    "pelangganId" TEXT,
    "salesId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalBayar" DOUBLE PRECISION NOT NULL,
    "metodeBayar" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SELESAI',

    CONSTRAINT "Penjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailPenjualan" (
    "id" TEXT NOT NULL,
    "penjualanId" TEXT NOT NULL,
    "produkId" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "tipeHarga" TEXT NOT NULL,
    "hargaSatuan" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DetailPenjualan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piutang" (
    "id" TEXT NOT NULL,
    "penjualanId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "sisa" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BELUM_LUNAS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piutang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cicilan" (
    "id" TEXT NOT NULL,
    "piutangId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jumlahBayar" DOUBLE PRECISION NOT NULL,
    "tanggalBayar" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT NOT NULL,

    CONSTRAINT "Cicilan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "entitas" TEXT NOT NULL,
    "entitasId" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Apotek_nama_idx" ON "Apotek"("nama");

-- CreateIndex
CREATE INDEX "Produk_nama_idx" ON "Produk"("nama");

-- CreateIndex
CREATE INDEX "Produk_kategori_idx" ON "Produk"("kategori");

-- CreateIndex
CREATE INDEX "Pelanggan_nama_idx" ON "Pelanggan"("nama");

-- CreateIndex
CREATE INDEX "KonsinyasiLog_apotekId_idx" ON "KonsinyasiLog"("apotekId");

-- CreateIndex
CREATE INDEX "KonsinyasiLog_produkId_idx" ON "KonsinyasiLog"("produkId");

-- CreateIndex
CREATE INDEX "KonsinyasiLog_salesId_idx" ON "KonsinyasiLog"("salesId");

-- CreateIndex
CREATE INDEX "KonsinyasiLog_tanggal_idx" ON "KonsinyasiLog"("tanggal");

-- CreateIndex
CREATE INDEX "StokKonsinyasi_produkId_idx" ON "StokKonsinyasi"("produkId");

-- CreateIndex
CREATE UNIQUE INDEX "StokKonsinyasi_apotekId_produkId_key" ON "StokKonsinyasi"("apotekId", "produkId");

-- CreateIndex
CREATE INDEX "BarangMasukLog_produkId_idx" ON "BarangMasukLog"("produkId");

-- CreateIndex
CREATE INDEX "BarangMasukLog_tanggal_idx" ON "BarangMasukLog"("tanggal");

-- CreateIndex
CREATE INDEX "ReturLog_apotekId_idx" ON "ReturLog"("apotekId");

-- CreateIndex
CREATE INDEX "ReturLog_produkId_idx" ON "ReturLog"("produkId");

-- CreateIndex
CREATE INDEX "ReturLog_tanggal_idx" ON "ReturLog"("tanggal");

-- CreateIndex
CREATE INDEX "OpnameLog_userId_idx" ON "OpnameLog"("userId");

-- CreateIndex
CREATE INDEX "OpnameLog_produkId_idx" ON "OpnameLog"("produkId");

-- CreateIndex
CREATE INDEX "OpnameLog_apotekId_idx" ON "OpnameLog"("apotekId");

-- CreateIndex
CREATE INDEX "OpnameLog_tanggal_idx" ON "OpnameLog"("tanggal");

-- CreateIndex
CREATE INDEX "Penjualan_tanggal_idx" ON "Penjualan"("tanggal");

-- CreateIndex
CREATE INDEX "Penjualan_salesId_idx" ON "Penjualan"("salesId");

-- CreateIndex
CREATE INDEX "Penjualan_apotekId_idx" ON "Penjualan"("apotekId");

-- CreateIndex
CREATE INDEX "Penjualan_pelangganId_idx" ON "Penjualan"("pelangganId");

-- CreateIndex
CREATE INDEX "Penjualan_userId_idx" ON "Penjualan"("userId");

-- CreateIndex
CREATE INDEX "Penjualan_status_idx" ON "Penjualan"("status");

-- CreateIndex
CREATE INDEX "Penjualan_tanggal_salesId_idx" ON "Penjualan"("tanggal", "salesId");

-- CreateIndex
CREATE INDEX "Penjualan_tipe_idx" ON "Penjualan"("tipe");

-- CreateIndex
CREATE INDEX "DetailPenjualan_penjualanId_idx" ON "DetailPenjualan"("penjualanId");

-- CreateIndex
CREATE INDEX "DetailPenjualan_produkId_idx" ON "DetailPenjualan"("produkId");

-- CreateIndex
CREATE INDEX "DetailPenjualan_produkId_subtotal_jumlah_idx" ON "DetailPenjualan"("produkId", "subtotal", "jumlah");

-- CreateIndex
CREATE UNIQUE INDEX "Piutang_penjualanId_key" ON "Piutang"("penjualanId");

-- CreateIndex
CREATE INDEX "Piutang_status_idx" ON "Piutang"("status");

-- CreateIndex
CREATE INDEX "Piutang_status_createdAt_idx" ON "Piutang"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Cicilan_piutangId_idx" ON "Cicilan"("piutangId");

-- CreateIndex
CREATE INDEX "Cicilan_userId_idx" ON "Cicilan"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entitas_entitasId_idx" ON "AuditLog"("entitas", "entitasId");

-- AddForeignKey
ALTER TABLE "KonsinyasiLog" ADD CONSTRAINT "KonsinyasiLog_apotekId_fkey" FOREIGN KEY ("apotekId") REFERENCES "Apotek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsinyasiLog" ADD CONSTRAINT "KonsinyasiLog_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsinyasiLog" ADD CONSTRAINT "KonsinyasiLog_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokKonsinyasi" ADD CONSTRAINT "StokKonsinyasi_apotekId_fkey" FOREIGN KEY ("apotekId") REFERENCES "Apotek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StokKonsinyasi" ADD CONSTRAINT "StokKonsinyasi_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarangMasukLog" ADD CONSTRAINT "BarangMasukLog_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturLog" ADD CONSTRAINT "ReturLog_apotekId_fkey" FOREIGN KEY ("apotekId") REFERENCES "Apotek"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturLog" ADD CONSTRAINT "ReturLog_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpnameLog" ADD CONSTRAINT "OpnameLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpnameLog" ADD CONSTRAINT "OpnameLog_apotekId_fkey" FOREIGN KEY ("apotekId") REFERENCES "Apotek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpnameLog" ADD CONSTRAINT "OpnameLog_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_apotekId_fkey" FOREIGN KEY ("apotekId") REFERENCES "Apotek"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_pelangganId_fkey" FOREIGN KEY ("pelangganId") REFERENCES "Pelanggan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penjualan" ADD CONSTRAINT "Penjualan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailPenjualan" ADD CONSTRAINT "DetailPenjualan_produkId_fkey" FOREIGN KEY ("produkId") REFERENCES "Produk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piutang" ADD CONSTRAINT "Piutang_penjualanId_fkey" FOREIGN KEY ("penjualanId") REFERENCES "Penjualan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cicilan" ADD CONSTRAINT "Cicilan_piutangId_fkey" FOREIGN KEY ("piutangId") REFERENCES "Piutang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cicilan" ADD CONSTRAINT "Cicilan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
