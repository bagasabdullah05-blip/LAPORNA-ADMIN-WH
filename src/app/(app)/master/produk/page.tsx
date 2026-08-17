'use client';

import { useEffect, useState } from 'react';

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  bentuk: string;
  hargaMember: number;
  hargaAgent: number;
  hargaKarton: number;
  hargaAptCash: number;
  hargaKonsinyasi: number;
  hargaTerendah: number;
  hpp: number;
  stokGudang: number;
  minStok: number;
}

const emptyRow = {
  nama: '',
  kategori: '',
  satuan: '',
  bentuk: '',
  hargaMember: 0,
  hargaAgent: 0,
  hargaKarton: 0,
  hargaAptCash: 0,
  hargaKonsinyasi: 0,
  hargaTerendah: 0,
  hpp: 0,
  stokGudang: 0,
  minStok: 0,
};

type ProdukRow = typeof emptyRow;

export default function ProdukPage() {
  const [data, setData] = useState<Produk[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [rows, setRows] = useState<ProdukRow[]>([{ ...emptyRow }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchData = (q = '') => {
    setLoading(true);
    const url = q ? `/api/produk?search=${encodeURIComponent(q)}` : '/api/produk';
    fetch(url)
      .then((res) => res.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const handleSearch = () => { fetchData(search); };

  const openAdd = () => { setEditId(null); setRows([{ ...emptyRow }]); setShowModal(true); };

  const openEdit = (item: Produk) => {
    setEditId(item.id);
    setRows([{
      nama: item.nama,
      kategori: item.kategori,
      satuan: item.satuan,
      bentuk: item.bentuk,
      hargaMember: item.hargaMember,
      hargaAgent: item.hargaAgent,
      hargaKarton: item.hargaKarton,
      hargaAptCash: item.hargaAptCash,
      hargaKonsinyasi: item.hargaKonsinyasi,
      hargaTerendah: item.hargaTerendah,
      hpp: item.hpp,
      stokGudang: item.stokGudang,
      minStok: item.minStok,
    }]);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    await fetch(`/api/produk/${id}`, { method: 'DELETE' });
    fetchData(search);
  };

  const addRow = () => {
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  const duplicateRow = (index: number) => {
    setRows((prev) => [...prev, { ...prev[index] }]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ProdukRow, value: string | number) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    if (editId) {
      const row = rows[0];
      if (!row.nama || !row.kategori || !row.satuan || !row.bentuk) {
        setMessage({ type: 'error', text: 'Nama, kategori, satuan, dan bentuk harus diisi' });
        setSubmitting(false);
        return;
      }
      await fetch(`/api/produk/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      });
    } else {
      const valid = rows.filter((r) => r.nama && r.kategori && r.satuan && r.bentuk);
      if (valid.length === 0) {
        setMessage({ type: 'error', text: 'Minimal 1 produk dengan nama, kategori, satuan, dan bentuk terisi' });
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/produk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: valid }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Gagal menyimpan' });
        setSubmitting(false);
        return;
      }
    }

    setShowModal(false);
    setMessage({ type: 'success', text: editId ? 'Produk berhasil diupdate' : `${rows.filter((r) => r.nama).length} produk berhasil ditambahkan` });
    fetchData(search);
    setSubmitting(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Master Produk</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
          + Tambah Produk
        </button>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30 text-green-400'
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Cari produk..."
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
                <th className="px-3 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-3 py-3 text-left text-gray-400 font-medium">Nama</th>
                <th className="px-3 py-3 text-left text-gray-400 font-medium">Kategori</th>
                <th className="px-3 py-3 text-left text-gray-400 font-medium">Satuan</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Hrg Member</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Hrg Agent</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Hrg Karton</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Hrg AptCash</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Hrg Konsinyasi</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Hrg Terendah</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">HPP</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Stok</th>
                <th className="px-3 py-3 text-right text-gray-400 font-medium">Min Stok</th>
                <th className="px-3 py-3 text-center text-gray-400 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-3 py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                  >
                    <td className="px-3 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-3 py-3 text-white">{item.nama}</td>
                    <td className="px-3 py-3 text-gray-300">{item.kategori}</td>
                    <td className="px-3 py-3 text-gray-300">{item.satuan}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hargaMember.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hargaAgent.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hargaKarton.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hargaAptCash.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hargaKonsinyasi.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hargaTerendah.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.hpp.toLocaleString('id-ID')}</td>
                    <td className="px-3 py-3 text-right">
                      <span className={item.stokGudang <= item.minStok ? 'text-red-400 font-medium' : 'text-gray-300'}>
                        {item.stokGudang}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-300 text-right">{item.minStok}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => openEdit(item)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Hapus
                      </button>
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
            <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-full md:max-w-7xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {editId ? 'Edit Produk' : 'Tambah Produk'}
              </h2>

              {!editId && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-400">{rows.length} baris</span>
                  <button
                    type="button"
                    onClick={addRow}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    + Tambah Baris
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-3">
                  {!editId && (
                    <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
                      <div className="col-span-2">Nama *</div>
                      <div className="col-span-1">Kategori *</div>
                      <div className="col-span-1">Satuan *</div>
                      <div className="col-span-1">Bentuk *</div>
                      <div className="col-span-1">Member</div>
                      <div className="col-span-1">Agent</div>
                      <div className="col-span-1">Karton</div>
                      <div className="col-span-1">AptCash</div>
                      <div className="col-span-1">Konsinyasi</div>
                      <div className="col-span-1">Terendah</div>
                      <div className="text-center w-16">▾</div>
                    </div>
                  )}

                  {rows.map((row, idx) => (
                    <div key={idx} className={`grid gap-2 items-center ${editId ? 'grid-cols-1' : 'grid-cols-12'}`}>
                      {editId ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Nama Produk</label>
                            <input type="text" value={row.nama} onChange={(e) => updateRow(idx, 'nama', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Kategori</label>
                            <input type="text" value={row.kategori} onChange={(e) => updateRow(idx, 'kategori', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Satuan</label>
                            <input type="text" value={row.satuan} onChange={(e) => updateRow(idx, 'satuan', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Bentuk</label>
                            <input type="text" value={row.bentuk} onChange={(e) => updateRow(idx, 'bentuk', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Harga Member</label>
                            <input type="number" value={row.hargaMember} onChange={(e) => updateRow(idx, 'hargaMember', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Harga Agent</label>
                            <input type="number" value={row.hargaAgent} onChange={(e) => updateRow(idx, 'hargaAgent', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Harga Karton</label>
                            <input type="number" value={row.hargaKarton} onChange={(e) => updateRow(idx, 'hargaKarton', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Harga AptCash</label>
                            <input type="number" value={row.hargaAptCash} onChange={(e) => updateRow(idx, 'hargaAptCash', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Harga Konsinyasi</label>
                            <input type="number" value={row.hargaKonsinyasi} onChange={(e) => updateRow(idx, 'hargaKonsinyasi', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Harga Terendah</label>
                            <input type="number" value={row.hargaTerendah} onChange={(e) => updateRow(idx, 'hargaTerendah', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">HPP</label>
                            <input type="number" value={row.hpp} onChange={(e) => updateRow(idx, 'hpp', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Stok Gudang</label>
                            <input type="number" value={row.stokGudang} onChange={(e) => updateRow(idx, 'stokGudang', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Min Stok</label>
                            <input type="number" value={row.minStok} onChange={(e) => updateRow(idx, 'minStok', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <input type="text" value={row.nama} onChange={(e) => updateRow(idx, 'nama', e.target.value)} placeholder="Nama produk" className="col-span-2 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          <input type="text" value={row.kategori} onChange={(e) => updateRow(idx, 'kategori', e.target.value)} placeholder="Kategori" className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          <input type="text" value={row.satuan} onChange={(e) => updateRow(idx, 'satuan', e.target.value)} placeholder="Satuan" className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          <input type="text" value={row.bentuk} onChange={(e) => updateRow(idx, 'bentuk', e.target.value)} placeholder="Bentuk" className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                          <input type="number" value={row.hargaMember} onChange={(e) => updateRow(idx, 'hargaMember', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.hargaAgent} onChange={(e) => updateRow(idx, 'hargaAgent', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.hargaKarton} onChange={(e) => updateRow(idx, 'hargaKarton', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.hargaAptCash} onChange={(e) => updateRow(idx, 'hargaAptCash', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.hargaKonsinyasi} onChange={(e) => updateRow(idx, 'hargaKonsinyasi', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.hargaTerendah} onChange={(e) => updateRow(idx, 'hargaTerendah', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.hpp} onChange={(e) => updateRow(idx, 'hpp', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <input type="number" value={row.stokGudang} onChange={(e) => updateRow(idx, 'stokGudang', Number(e.target.value))} className="col-span-1 px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <div className="flex items-center justify-center gap-1">
                            <button type="button" onClick={() => duplicateRow(idx)} title="Duplikat baris" className="text-indigo-400 hover:text-indigo-300 text-xs px-1">⧉</button>
                            <button type="button" onClick={() => removeRow(idx)} disabled={rows.length <= 1} title="Hapus baris" className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-xs px-1">✕</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Menyimpan...' : editId ? 'Update' : `Simpan ${rows.filter((r) => r.nama).length || ''} Produk`}
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
