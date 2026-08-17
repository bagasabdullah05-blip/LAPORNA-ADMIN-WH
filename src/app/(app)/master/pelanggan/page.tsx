'use client';

import { useEffect, useState } from 'react';

interface Pelanggan {
  id: string;
  nama: string;
  tipe: string;
  alamat: string;
  noTelp: string;
}

const emptyForm = { nama: '', tipe: 'UMUM', alamat: '', noTelp: '' };

export default function PelangganPage() {
  const [data, setData] = useState<Pelanggan[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = (q = '') => {
    setLoading(true);
    const url = q ? `/api/pelanggan?search=${encodeURIComponent(q)}` : '/api/pelanggan';
    fetch(url)
      .then((res) => res.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => { fetchData(search); };

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (item: Pelanggan) => {
    setEditId(item.id);
    setForm({ nama: item.nama, tipe: item.tipe, alamat: item.alamat, noTelp: item.noTelp });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
    await fetch(`/api/pelanggan/${id}`, { method: 'DELETE' });
    fetchData(search);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/pelanggan/${editId}` : '/api/pelanggan';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    fetchData(search);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-2xl font-bold text-white">Master Pelanggan</h1>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Tambah Pelanggan
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari pelanggan..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
        >
          Cari
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Nama</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Alamat</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No Telp</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Tidak ada data</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-white">{item.nama}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.tipe === 'TOKO' ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.tipe}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{item.alamat}</td>
                    <td className="px-4 py-3 text-gray-300">{item.noTelp}</td>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">{editId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nama</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tipe</label>
                  <select
                    value={form.tipe}
                    onChange={(e) => setForm({ ...form, tipe: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UMUM">UMUM</option>
                    <option value="TOKO">TOKO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Alamat</label>
                  <textarea
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">No Telp</label>
                  <input
                    type="text"
                    value={form.noTelp}
                    onChange={(e) => setForm({ ...form, noTelp: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
