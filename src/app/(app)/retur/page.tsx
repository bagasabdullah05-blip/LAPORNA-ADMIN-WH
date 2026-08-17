'use client';

import { useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Apotek { id: string; nama: string; }
interface Produk { id: string; nama: string; }
interface ReturLog {
  id: string;
  jumlah: number;
  keterangan: string;
  tanggal: string;
  apotek: { nama: string };
  produk: { nama: string };
}

export default function ReturPage() {
  const [apotekList, setApotekList] = useState<Apotek[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [riwayat, setRiwayat] = useState<ReturLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    apotekId: '',
    produkId: '',
    jumlah: 0,
    keterangan: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/apotek').then((res) => res.json()),
      fetch('/api/produk').then((res) => res.json()),
      fetch('/api/retur').then((res) => res.json()),
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
      await fetch('/api/retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ apotekId: '', produkId: '', jumlah: 0, keterangan: '' });
      fetchData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Retur</h1>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Form Retur</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Apotek</label>
            <SearchSelect
              options={apotekList.map((a) => ({ value: a.id, label: a.nama }))}
              value={form.apotekId}
              onChange={(val) => setForm({ ...form, apotekId: val })}
              placeholder="Pilih Apotek"
            />
          </div>
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
            <label className="block text-sm text-gray-400 mb-1">Jumlah</label>
            <input
              type="number"
              value={form.jumlah || ''}
              onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              min={1}
              required
            />
          </div>
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
          <div className="lg:col-span-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Retur'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Riwayat Retur</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Produk</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Jumlah</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : riwayat.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data</td>
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
                    <td className="px-4 py-3 text-white">{item.apotek.nama}</td>
                    <td className="px-4 py-3 text-gray-300">{item.produk.nama}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{item.jumlah}</td>
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
