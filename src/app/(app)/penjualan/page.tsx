'use client';

import { useEffect, useState, useCallback } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  stokGudang: number;
  hargaMember: number;
  hargaAgent: number;
  hargaKarton: number;
  hargaAptCash: number;
  hargaKonsinyasi: number;
  hargaTerendah: number;
}

interface Apotek { id: string; nama: string; }
interface Sales { id: string; nama: string; }
interface Pelanggan { id: string; nama: string; }

interface StokKonsinyasi {
  produkId: string;
  jumlah: number;
}

interface ItemRow {
  produkId: string;
  jumlah: number;
  tipeHarga: string;
  hargaSatuan: number;
}

const tipeHargaOptions = [
  { value: 'Member', key: 'hargaMember' },
  { value: 'Agent', key: 'hargaAgent' },
  { value: 'Karton', key: 'hargaKarton' },
  { value: 'AptCash', key: 'hargaAptCash' },
  { value: 'Konsinyasi', key: 'hargaKonsinyasi' },
  { value: 'Terendah', key: 'hargaTerendah' },
];

export default function PenjualanPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [apotekList, setApotekList] = useState<Apotek[]>([]);
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [tipeTransaksi, setTipeTransaksi] = useState('KONSINYASI');
  const [apotekId, setApotekId] = useState('');
  const [pelangganId, setPelangganId] = useState('');
  const [salesId, setSalesId] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('TUNAI');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  const [stokKonsinyasi, setStokKonsinyasi] = useState<StokKonsinyasi[]>([]);
  const [loadingStok, setLoadingStok] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([
    { produkId: '', jumlah: 1, tipeHarga: 'Member', hargaSatuan: 0 },
  ]);

  useEffect(() => {
    Promise.all([
      fetch('/api/produk').then((res) => res.json()),
      fetch('/api/apotek').then((res) => res.json()),
      fetch('/api/sales').then((res) => res.json()),
      fetch('/api/pelanggan').then((res) => res.json()),
    ])
      .then(([produkRes, apotekRes, salesRes, pelangganRes]) => {
        if (produkRes.success) setProdukList(produkRes.data);
        if (apotekRes.success) setApotekList(apotekRes.data);
        if (salesRes.success) setSalesList(salesRes.data);
        if (pelangganRes.success) setPelangganList(pelangganRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fetchStokKonsinyasi = useCallback((id: string) => {
    if (!id) {
      setStokKonsinyasi([]);
      return;
    }
    setLoadingStok(true);
    fetch(`/api/konsinyasi/stok?apotekId=${id}`)
      .then((res) => res.json())
      .then((d) => { if (d.success) setStokKonsinyasi(d.data); })
      .catch(() => {})
      .finally(() => setLoadingStok(false));
  }, []);

  useEffect(() => {
    if (tipeTransaksi === 'KONSINYASI' && apotekId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStokKonsinyasi(apotekId);
    } else {
      setStokKonsinyasi([]);
    }
  }, [tipeTransaksi, apotekId, fetchStokKonsinyasi]);

  const getStokTersedia = (produkId: string): number => {
    if (tipeTransaksi === 'LANGSUNG') {
      const produk = produkList.find((p) => p.id === produkId);
      return produk?.stokGudang ?? 0;
    }
    const stok = stokKonsinyasi.find((s) => s.produkId === produkId);
    return stok?.jumlah ?? 0;
  };

  const getHargaByTipe = (produk: Produk, tipe: string) => {
    const opt = tipeHargaOptions.find((o) => o.value === tipe);
    if (!opt) return 0;
    return ((produk as unknown as Record<string, number>)[opt.key]) || 0;
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'produkId' || field === 'tipeHarga') {
        const produk = produkList.find((p) => p.id === updated[index].produkId);
        if (produk) {
          updated[index].hargaSatuan = getHargaByTipe(produk, updated[index].tipeHarga);
        }
      }

      return updated;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { produkId: '', jumlah: 1, tipeHarga: 'Member', hargaSatuan: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getSubtotal = (item: ItemRow) => item.jumlah * item.hargaSatuan;
  const getGrandTotal = () => items.reduce((sum, item) => sum + getSubtotal(item), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    if (tipeTransaksi === 'KONSINYASI' && !apotekId) {
      setMessage({ type: 'error', text: 'Pilih apotek terlebih dahulu' });
      setSubmitting(false);
      return;
    }

    if (tipeTransaksi === 'LANGSUNG' && !pelangganId) {
      setMessage({ type: 'error', text: 'Pilih pelanggan terlebih dahulu' });
      setSubmitting(false);
      return;
    }

    if (!salesId) {
      setMessage({ type: 'error', text: 'Pilih sales terlebih dahulu' });
      setSubmitting(false);
      return;
    }

    for (const item of items) {
      if (!item.produkId) {
        setMessage({ type: 'error', text: 'Semua baris harus memilih produk' });
        setSubmitting(false);
        return;
      }
      const stok = getStokTersedia(item.produkId);
      if (item.jumlah > stok) {
        const produk = produkList.find((p) => p.id === item.produkId);
        setMessage({
          type: 'error',
          text: `Stok ${produk?.nama || 'produk'} tidak mencukupi (tersedia: ${stok}, diminta: ${item.jumlah})`,
        });
        setSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        tipe: tipeTransaksi,
        tanggal,
        apotekId: tipeTransaksi === 'KONSINYASI' ? apotekId : undefined,
        pelangganId: tipeTransaksi === 'LANGSUNG' ? pelangganId : undefined,
        salesId,
        metodeBayar,
        items: items.map((item) => ({
          produkId: item.produkId,
          jumlah: item.jumlah,
          tipeHarga: item.tipeHarga,
          hargaSatuan: item.hargaSatuan,
          subtotal: getSubtotal(item),
        })),
        totalBayar: getGrandTotal(),
      };

      const res = await fetch('/api/penjualan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Penjualan berhasil disimpan!' });
        setItems([{ produkId: '', jumlah: 1, tipeHarga: 'Member', hargaSatuan: 0 }]);
        if (apotekId) fetchStokKonsinyasi(apotekId);
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menyimpan penjualan' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Penjualan</h1>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">Informasi Transaksi</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipe Transaksi</label>
              <select
                value={tipeTransaksi}
                onChange={(e) => {
                  setTipeTransaksi(e.target.value);
                  setApotekId('');
                  setPelangganId('');
                }}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="KONSINYASI">KONSINYASI (dari Apotek)</option>
                <option value="LANGSUNG">LANGSUNG (dari Gudang)</option>
              </select>
            </div>
            {tipeTransaksi === 'KONSINYASI' ? (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Apotek</label>
                <SearchSelect
                  options={apotekList.map((a) => ({ value: a.id, label: a.nama }))}
                  value={apotekId}
                  onChange={setApotekId}
                  placeholder="Pilih Apotek"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Pelanggan</label>
                <SearchSelect
                  options={pelangganList.map((p) => ({ value: p.id, label: p.nama }))}
                  value={pelangganId}
                  onChange={setPelangganId}
                  placeholder="Pilih Pelanggan"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sales</label>
              <SearchSelect
                options={salesList.map((s) => ({ value: s.id, label: s.nama }))}
                value={salesId}
                onChange={setSalesId}
                placeholder="Pilih Sales"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Metode Bayar</label>
              <select
                value={metodeBayar}
                onChange={(e) => setMetodeBayar(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TUNAI">TUNAI</option>
                <option value="PIUTANG">PIUTANG</option>
              </select>
            </div>
          </div>
        </div>

        {tipeTransaksi === 'KONSINYASI' && apotekId && (
          <div className="bg-slate-900/50 rounded-xl border border-indigo-500/20 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-indigo-400 font-medium text-sm">Stok Konsinyasi di Apotek Terpilih</span>
              {loadingStok && <span className="text-xs text-gray-500">Memuat...</span>}
            </div>
            {stokKonsinyasi.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada stok konsinyasi di apotek ini</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {stokKonsinyasi.map((stok) => {
                  const produk = produkList.find((p) => p.id === stok.produkId);
                  if (!produk) return null;
                  return (
                    <div
                      key={stok.produkId}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        stok.jumlah <= 5
                          ? 'bg-red-500/5 border-red-500/20'
                          : stok.jumlah <= 15
                          ? 'bg-yellow-500/5 border-yellow-500/20'
                          : 'bg-green-500/5 border-green-500/20'
                      }`}
                    >
                      <div className="text-gray-300 font-medium truncate">{produk.nama}</div>
                      <div className={`font-bold ${
                        stok.jumlah <= 5 ? 'text-red-400' : stok.jumlah <= 15 ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {stok.jumlah} {produk.satuan}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-white">Items</h2>
            <button type="button" onClick={addItem} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors">
              + Tambah Baris
            </button>
          </div>

          <div className="space-y-3">
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm text-gray-400 font-medium px-1">
              <div className="col-span-3">Produk</div>
              <div className="col-span-1">Stok</div>
              <div className="col-span-1">Jumlah</div>
              <div className="col-span-2">Tipe Harga</div>
              <div className="col-span-2">Harga Satuan</div>
              <div className="col-span-1 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => {
              const stok = getStokTersedia(item.produkId);
              const isOverStok = item.produkId && item.jumlah > stok;

              return (
                <div key={idx}>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={item.produkId} onChange={(val) => updateItem(idx, 'produkId', val)} placeholder="Pilih Produk" />
                    </div>
                    <div className="col-span-1 text-center">
                      {item.produkId ? (
                        <span className={`text-sm font-semibold ${isOverStok ? 'text-red-400' : stok <= 5 ? 'text-yellow-400' : 'text-gray-300'}`}>{stok}</span>
                      ) : <span className="text-sm text-gray-600">-</span>}
                    </div>
                    <div className="col-span-1">
                      <input type="number" value={item.jumlah} onChange={(e) => updateItem(idx, 'jumlah', Number(e.target.value))} className={`w-full px-2 py-2 bg-gray-800 border rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOverStok ? 'border-red-500/50' : 'border-gray-700'}`} min={1} required />
                    </div>
                    <div className="col-span-2">
                      <select value={item.tipeHarga} onChange={(e) => updateItem(idx, 'tipeHarga', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {tipeHargaOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.value}</option>))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={item.hargaSatuan} onChange={(e) => updateItem(idx, 'hargaSatuan', Number(e.target.value))} className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" min={0} required />
                    </div>
                    <div className="col-span-1 text-right text-gray-300 text-sm">Rp {getSubtotal(item).toLocaleString('id-ID')}</div>
                    <div className="col-span-1 text-center">
                      <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-sm">✕</button>
                    </div>
                  </div>

                  {/* Mobile card */}
                  <div className="md:hidden bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Item #{idx + 1}</span>
                      <button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-xs">Hapus</button>
                    </div>
                    <SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={item.produkId} onChange={(val) => updateItem(idx, 'produkId', val)} placeholder="Pilih Produk" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Stok</label>
                        <div className={`text-sm font-semibold ${isOverStok ? 'text-red-400' : stok <= 5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {item.produkId ? stok : '-'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Jumlah</label>
                        <input type="number" value={item.jumlah} onChange={(e) => updateItem(idx, 'jumlah', Number(e.target.value))} className={`w-full px-2 py-1.5 bg-gray-800 border rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOverStok ? 'border-red-500/50' : 'border-gray-700'}`} min={1} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Tipe Harga</label>
                        <select value={item.tipeHarga} onChange={(e) => updateItem(idx, 'tipeHarga', e.target.value)} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          {tipeHargaOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.value}</option>))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Harga Satuan</label>
                        <input type="number" value={item.hargaSatuan} onChange={(e) => updateItem(idx, 'hargaSatuan', Number(e.target.value))} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" min={0} required />
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-300">Subtotal: <span className="font-semibold text-white">Rp {getSubtotal(item).toLocaleString('id-ID')}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-800 flex justify-end">
            <div className="text-right">
              <p className="text-gray-400 text-sm">Grand Total</p>
              <p className="text-xl md:text-2xl font-bold text-white">Rp {getGrandTotal().toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg font-medium transition-colors">
            {submitting ? 'Menyimpan...' : 'Simpan Penjualan'}
          </button>
        </div>
      </form>
    </div>
  );
}
