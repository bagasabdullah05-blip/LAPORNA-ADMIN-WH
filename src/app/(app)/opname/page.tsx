'use client';

import { useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Apotek { id: string; nama: string; }
interface Produk { id: string; nama: string; stokGudang: number; }
interface OpnameLog {
  id: string;
  tipe: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  keterangan: string;
  tanggal: string;
  apotek: { nama: string } | null;
  produk: { nama: string };
}

export default function OpnamePage() {
  const [apotekList, setApotekList] = useState<Apotek[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [riwayat, setRiwayat] = useState<OpnameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    tipe: 'GUDANG',
    apotekId: '',
    produkId: '',
    stokFisik: 0,
    keterangan: '',
    tanggal: new Date().toISOString().slice(0, 10),
  });

  const selectedProduk = produkList.find((p) => p.id === form.produkId);
  const stokSistem = selectedProduk ? selectedProduk.stokGudang : 0;
  const selisih = form.stokFisik - stokSistem;

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/apotek').then((res) => res.json()),
      fetch('/api/produk').then((res) => res.json()),
      fetch('/api/opname').then((res) => res.json()),
    ])
      .then(([apotekRes, produkRes, riwayatRes]) => {
        if (apotekRes.success) setApotekList(apotekRes.data);
        if (produkRes.success) setProdukList(produkRes.data);
        if (riwayatRes.success) setRiwayat(riwayatRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, stokSistem, tanggal: form.tanggal }),
      });
      setForm({ tipe: 'GUDANG', apotekId: '', produkId: '', stokFisik: 0, keterangan: '', tanggal: new Date().toISOString().slice(0, 10) });
      fetchData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Opname</h1>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Form Opname</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tanggal</label>
              <input
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipe</label>
              <select
                value={form.tipe}
                onChange={(e) => setForm({ ...form, tipe: e.target.value, apotekId: '' })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="GUDANG">GUDANG</option>
                <option value="APOTEK">APOTEK</option>
              </select>
            </div>
            {form.tipe === 'APOTEK' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Apotek</label>
                <SearchSelect
                  options={apotekList.map((a) => ({ value: a.id, label: a.nama }))}
                  value={form.apotekId}
                  onChange={(val) => setForm({ ...form, apotekId: val })}
                  placeholder="Pilih Apotek"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Produk</label>
              <SearchSelect
                options={produkList.map((p) => ({ value: p.id, label: p.nama }))}
                value={form.produkId}
                onChange={(val) => setForm({ ...form, produkId: val })}
                placeholder="Pilih Produk"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Stok Fisik</label>
              <input
                type="number"
                value={form.stokFisik || ''}
                onChange={(e) => setForm({ ...form, stokFisik: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={0}
                required
              />
            </div>
          </div>

          {form.produkId && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Stok Sistem</p>
                <p className="text-lg font-semibold text-white">{stokSistem}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Stok Fisik</p>
                <p className="text-lg font-semibold text-white">{form.stokFisik}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Selisih</p>
                <p className={`text-lg font-semibold ${selisih === 0 ? 'text-green-400' : selisih > 0 ? 'text-indigo-400' : 'text-red-400'}`}>
                  {selisih > 0 ? '+' : ''}{selisih}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Keterangan</label>
              <input
                type="text"
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Opsional"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Opname'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Riwayat Opname</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Produk</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Stok Sistem</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Stok Fisik</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Selisih</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Tidak ada data</td>
                </tr>
              ) : (
                riwayat.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.tipe === 'GUDANG' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{item.apotek?.nama || '-'}</td>
                    <td className="px-4 py-3 text-white">{item.produk.nama}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{item.stokSistem}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{item.stokFisik}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={item.selisih === 0 ? 'text-green-400' : item.selisih > 0 ? 'text-indigo-400' : 'text-red-400'}>
                        {item.selisih > 0 ? '+' : ''}{item.selisih}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{item.keterangan || '-'}</td>
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
