import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const produkSchema = z.object({
  nama: z.string().min(1, "Nama produk wajib diisi"),
  kategori: z.string().min(1, "Kategori wajib diisi"),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  bentuk: z.string().min(1, "Bentuk wajib diisi"),
  hargaMember: z.number().optional(),
  hargaAgent: z.number().optional(),
  hargaKarton: z.number().optional(),
  hargaAptCash: z.number().optional(),
  hargaKonsinyasi: z.number().optional(),
  hargaTerendah: z.number().optional(),
  hpp: z.number().optional(),
  stokGudang: z.number().optional(),
  minStok: z.number().optional(),
});

export const apotekSchema = z.object({
  nama: z.string().min(1, "Nama apotek wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  noTelp: z.string().min(1, "No. telp wajib diisi"),
  pemilik: z.string().min(1, "Pemilik wajib diisi"),
  pic: z.string().min(1, "PIC wajib diisi"),
});

export const salesSchema = z.object({
  nama: z.string().min(1, "Nama sales wajib diisi"),
  noTelp: z.string().min(1, "No. telp wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
});

export const pelangganSchema = z.object({
  nama: z.string().min(1, "Nama pelanggan wajib diisi"),
  tipe: z.enum(["UMUM", "TOKO"]),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  noTelp: z.string().min(1, "No. telp wajib diisi"),
});

export const penjualanItemSchema = z.object({
  produkId: z.string().min(1, "Produk wajib dipilih"),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  tipeHarga: z.string().min(1, "Tipe harga wajib dipilih"),
  hargaSatuan: z.number().positive("Harga satuan harus lebih dari 0"),
});

export const penjualanSchema = z.object({
  tipe: z.enum(["KONSINYASI", "LANGSUNG"]),
  apotekId: z.string().optional(),
  pelangganId: z.string().optional(),
  salesId: z.string().min(1, "Sales wajib dipilih"),
  metodeBayar: z.enum(["TUNAI", "PIUTANG"]),
  items: z
    .array(penjualanItemSchema)
    .min(1, "Minimal ada 1 item penjualan"),
});

export const cicilanSchema = z.object({
  piutangId: z.string().min(1, "Piutang wajib dipilih"),
  jumlahBayar: z
    .number()
    .positive("Jumlah bayar harus lebih dari 0"),
  keterangan: z.string().optional(),
});
