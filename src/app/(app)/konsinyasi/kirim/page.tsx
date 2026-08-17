'use client';

import { useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Apotek { id: string; nama: string; alamat: string; }
interface Produk { id: string; nama: string; stokGudang: number; satuan: string; }
interface Sales { id: string; nama: string; }
interface KirimLog {
  id: string;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  apotek: { nama: string };
  produk: { nama: string };
  sales: { nama: string };
}

interface ItemRow {
  produkId: string;
  jumlah: number;
}

const emptyItem: ItemRow = { produkId: '', jumlah: 1 };

export default function KirimKonsinyasiPage() {
  const [apotekList, setApotekList] = useState<Apotek[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [riwayat, setRiwayat] = useState<KirimLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [apotekId, setApotekId] = useState('');
  const [salesId, setSalesId] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }]);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/apotek').then((res) => res.json()),
      fetch('/api/produk').then((res) => res.json()),
      fetch('/api/sales').then((res) => res.json()),
      fetch('/api/konsinyasi/kirim').then((res) => res.json()),
    ])
      .then(([apotekRes, produkRes, salesRes, riwayatRes]) => {
        if (apotekRes.success) setApotekList(apotekRes.data);
        if (produkRes.success) setProdukList(produkRes.data);
        if (salesRes.success) setSalesList(salesRes.data);
        if (riwayatRes.success) setRiwayat(riwayatRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== index)); };
  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const getStokGudang = (produkId: string): number => {
    const p = produkList.find((p) => p.id === produkId);
    return p?.stokGudang ?? 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    if (!apotekId) { setMessage({ type: 'error', text: 'Pilih apotek terlebih dahulu' }); setSubmitting(false); return; }
    if (!salesId) { setMessage({ type: 'error', text: 'Pilih sales terlebih dahulu' }); setSubmitting(false); return; }

    for (const item of items) {
      if (!item.produkId) { setMessage({ type: 'error', text: 'Semua baris harus memilih produk' }); setSubmitting(false); return; }
      if (item.jumlah < 1) { setMessage({ type: 'error', text: 'Jumlah minimal 1' }); setSubmitting(false); return; }
      const stok = getStokGudang(item.produkId);
      if (item.jumlah > stok) {
        const produk = produkList.find((p) => p.id === item.produkId);
        setMessage({ type: 'error', text: `Stok ${produk?.nama || 'produk'} tidak mencukupi (tersedia: ${stok})` });
        setSubmitting(false); return;
      }
    }

    try {
      const res = await fetch('/api/konsinyasi/kirim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apotekId, salesId, keterangan, tanggal, items }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message || `${items.length} produk berhasil dikirim` });
        setItems([{ ...emptyItem }]);
        setKeterangan('');
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal mengirim' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalItem = items.reduce((sum, i) => sum + i.jumlah, 0);

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Kirim Konsinyasi</h1>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Info Section */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-white mb-4">Informasi Pengiriman</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <div>
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Apotek</label>
              <SearchSelect options={apotekList.map((a) => ({ value: a.id, label: a.nama }))} value={apotekId} onChange={setApotekId} placeholder="Pilih Apotek" />
            </div>
            <div>
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Sales</label>
              <SearchSelect options={salesList.map((s) => ({ value: s.id, label: s.nama }))} value={salesId} onChange={setSalesId} placeholder="Pilih Sales" />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs md:text-sm text-gray-400 mb-1">Keterangan</label>
              <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-white">Items</h2>
            <button type="button" onClick={addItem} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors">
              + Tambah Baris
            </button>
          </div>

          <div className="space-y-3">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm text-gray-400 font-medium px-1">
              <div className="col-span-4">Produk</div>
              <div className="col-span-2">Stok Gudang</div>
              <div className="col-span-2">Jumlah</div>
              <div className="col-span-3 text-right">Keterangan per Item</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => {
              const stok = getStokGudang(item.produkId);
              const isOverStok = item.produkId && item.jumlah > stok;

              return (
                <div key={idx}>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <SearchSelect options={produkList.map((p) => ({ value: p.id, label: `${p.nama} (${p.satuan})` }))} value={item.produkId} onChange={(val) => updateItem(idx, 'produkId', val)} placeholder="Pilih Produk" />
                    </div>
                    <div className="col-span-2 text-center">
                      {item.produkId ? (
                        <span className={`text-sm font-semibold ${isOverStok ? 'text-red-400' : stok <= 5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {stok.toLocaleString('id-ID')}
                        </span>
                      ) : <span className="text-sm text-gray-600">-</span>}
                    </div>
                    <div className="col-span-2">
                      <input type="number" value={item.jumlah} onChange={(e) => updateItem(idx, 'jumlah', Number(e.target.value))} className={`w-full px-2 py-2 bg-gray-800 border rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOverStok ? 'border-red-500/50' : 'border-gray-700'}`} min={1} required />
                    </div>
                    <div className="col-span-3"></div>
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
                    <SearchSelect options={produkList.map((p) => ({ value: p.id, label: `${p.nama} (${p.satuan})` }))} value={item.produkId} onChange={(val) => updateItem(idx, 'produkId', val)} placeholder="Pilih Produk" />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Stok Gudang</label>
                        <div className={`text-sm font-semibold ${isOverStok ? 'text-red-400' : stok <= 5 ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {item.produkId ? stok.toLocaleString('id-ID') : '-'}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Jumlah</label>
                        <input type="number" value={item.jumlah} onChange={(e) => updateItem(idx, 'jumlah', Number(e.target.value))} className={`w-full px-2 py-1.5 bg-gray-800 border rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOverStok ? 'border-red-500/50' : 'border-gray-700'}`} min={1} required />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-sm text-gray-400">Total: <span className="text-white font-semibold">{items.filter((i) => i.produkId).length}</span> produk &middot; <span className="text-white font-semibold">{totalItem.toLocaleString('id-ID')}</span> unit</span>
            <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg font-medium transition-colors">
              {submitting ? 'Mengirim...' : 'Kirim Semua'}
            </button>
          </div>
        </div>
      </form>

      {/* Riwayat */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-white">Riwayat Pengiriman</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-3 md:px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-3 md:px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-3 md:px-4 py-3 text-left text-gray-400 font-medium">Apotek</th>
                <th className="px-3 md:px-4 py-3 text-left text-gray-400 font-medium">Produk</th>
                <th className="px-3 md:px-4 py-3 text-left text-gray-400 font-medium">Sales</th>
                <th className="px-3 md:px-4 py-3 text-right text-gray-400 font-medium">Jumlah</th>
                <th className="px-3 md:px-4 py-3 text-left text-gray-400 font-medium">Ket</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : riwayat.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data</td></tr>
              ) : (
                riwayat.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-800/50 hover:bg-gray-800/50 ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}`}>
                    <td className="px-3 md:px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-300 text-xs">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 md:px-4 py-3 text-white">{item.apotek.nama}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-300">{item.produk.nama}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-300">{item.sales.nama}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-300 text-right font-semibold">{item.jumlah}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-400 text-xs">{item.keterangan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
