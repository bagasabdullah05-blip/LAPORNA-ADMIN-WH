'use client';

import { useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Apotek { id: string; nama: string; }
interface Produk { id: string; nama: string; }
interface ReturLog {
  id: string;
  apotekId: string;
  produkId: string;
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
  const [message, setMessage] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    apotekId: '',
    produkId: '',
    jumlah: 0,
    keterangan: '',
    tanggal: new Date().toISOString().slice(0, 10),
  });

  const [editItem, setEditItem] = useState<ReturLog | null>(null);
  const [editForm, setEditForm] = useState({ apotekId: '', produkId: '', jumlah: 0, keterangan: '', tanggal: '' });
  const [savingEdit, setSavingEdit] = useState(false);

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
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/retur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Retur berhasil disimpan' });
        setForm({ apotekId: '', produkId: '', jumlah: 0, keterangan: '', tanggal: new Date().toISOString().slice(0, 10) });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menyimpan' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus data retur ini? Stok akan dikembalikan.')) return;
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/retur', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Retur dihapus, stok dikembalikan' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menghapus' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    }
  };

  const openEdit = (item: ReturLog) => {
    setEditItem(item);
    setEditForm({ apotekId: item.apotekId, produkId: item.produkId, jumlah: item.jumlah, keterangan: item.keterangan, tanggal: item.tanggal.slice(0, 10) });
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSavingEdit(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/retur', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editItem.id, ...editForm }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Retur berhasil diupdate' });
        setEditItem(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal mengupdate' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Retur</h1>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Form Retur</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Apotek</label>
            <SearchSelect options={apotekList.map((a) => ({ value: a.id, label: a.nama }))} value={form.apotekId} onChange={(val) => setForm({ ...form, apotekId: val })} placeholder="Pilih Apotek" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Produk</label>
            <SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={form.produkId} onChange={(val) => setForm({ ...form, produkId: val })} placeholder="Pilih Produk" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Jumlah</label>
            <input type="number" value={form.jumlah || ''} onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" min={1} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Keterangan</label>
            <input type="text" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Opsional" />
          </div>
          <div className="lg:col-span-4">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-lg text-sm font-medium transition-colors">
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
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Aksi</th>
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
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-white">{item.apotek.nama}</td>
                    <td className="px-4 py-3 text-gray-300">{item.produk.nama}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{item.jumlah}</td>
                    <td className="px-4 py-3 text-gray-300">{item.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(item)} className="text-indigo-400 hover:text-indigo-300 text-xs mr-2">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-xs">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Edit Retur</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tanggal</label>
                <input type="date" value={editForm.tanggal} onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Apotek</label>
                <SearchSelect options={apotekList.map((a) => ({ value: a.id, label: a.nama }))} value={editForm.apotekId} onChange={(val) => setEditForm({ ...editForm, apotekId: val })} placeholder="Pilih Apotek" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Produk</label>
                <SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={editForm.produkId} onChange={(val) => setEditForm({ ...editForm, produkId: val })} placeholder="Pilih Produk" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Jumlah</label>
                <input type="number" value={editForm.jumlah} onChange={(e) => setEditForm({ ...editForm, jumlah: Number(e.target.value) })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100" min={1} />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Keterangan</label>
                <input type="text" value={editForm.keterangan} onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm">Batal</button>
              <button onClick={handleEdit} disabled={savingEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg text-sm">{savingEdit ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
