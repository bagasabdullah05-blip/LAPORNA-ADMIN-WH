'use client';

import { useEffect, useState } from 'react';

interface StokItem {
  id: string;
  nama: string;
  kategori: string;
  stokGudang: number;
  minStok: number;
}

export default function StokGudangPage() {
  const [data, setData] = useState<StokItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = (q = '') => {
    setLoading(true);
    const url = q ? `/api/gudang/stok?search=${encodeURIComponent(q)}` : '/api/gudang/stok';
    fetch(url)
      .then((res) => res.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const getStatus = (stok: number, minStok: number) => {
    if (stok === 0) return { label: 'Habis', color: 'bg-red-500/20 text-red-400' };
    if (stok <= minStok) return { label: 'Stok Menipis', color: 'bg-yellow-500/20 text-yellow-400' };
    return { label: 'Stok Aman', color: 'bg-green-500/20 text-green-400' };
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Stok Gudang</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchData(search)}
          placeholder="Cari produk..."
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => fetchData(search)}
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
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Nama Produk</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Kategori</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Stok Gudang</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Min Stok</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Status</th>
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
                data.map((item, idx) => {
                  const status = getStatus(item.stokGudang, item.minStok);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-800/50 hover:bg-gray-800/50 ${
                        idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                      <td className="px-4 py-3 text-white">{item.nama}</td>
                      <td className="px-4 py-3 text-gray-300">{item.kategori}</td>
                      <td className="px-4 py-3 text-gray-300 text-right">{item.stokGudang}</td>
                      <td className="px-4 py-3 text-gray-300 text-right">{item.minStok}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
