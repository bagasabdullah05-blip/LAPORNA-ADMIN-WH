'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';
import { exportCsv } from '@/lib/export';

interface ParetoItem {
  nama: string;
  totalRevenue: number;
  persentase: number;
  kumulatif: number;
  kategoriABC: string;
}

const kategoriOptions = [
  { value: '', label: 'Semua' },
  { value: 'Obat Bebas', label: 'Obat Bebas' },
  { value: 'Obat Keras', label: 'Obat Keras' },
  { value: 'Vitamin', label: 'Vitamin' },
  { value: 'Suplemen', label: 'Suplemen' },
  { value: 'Alat Kesehatan', label: 'Alat Kesehatan' },
];

const sortOptions = [
  { value: 'totalRevenue:desc', label: 'Revenue Terbesar' },
  { value: 'totalRevenue:asc', label: 'Revenue Terkecil' },
  { value: 'nama:asc', label: 'Nama A-Z' },
  { value: 'nama:desc', label: 'Nama Z-A' },
];

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function getAbcBadge(kategori: string) {
  switch (kategori) {
    case 'A':
      return 'bg-green-500/20 text-green-400';
    case 'B':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'C':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

function getAbcBar(kategori: string) {
  switch (kategori) {
    case 'A':
      return 'bg-green-500';
    case 'B':
      return 'bg-yellow-500';
    case 'C':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export default function ParetoPage() {
  const [data, setData] = useState<ParetoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [sort, setSort] = useState('totalRevenue:desc');

  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedKategori, setAppliedKategori] = useState('');
  const [appliedSort, setAppliedSort] = useState('totalRevenue:desc');

  const fetchData = useCallback(() => {
    setLoading(true);
    const [sortBy, sortDir] = appliedSort.split(':');
    const params = new URLSearchParams();
    if (appliedSearch) params.set('search', appliedSearch);
    if (appliedKategori) params.set('kategori', appliedKategori);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortDir) params.set('sortDir', sortDir);

    fetch(`/api/laporan/pareto?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) setData(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appliedSearch, appliedKategori, appliedSort]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  const handleApply = () => {
    setAppliedSearch(search);
    setAppliedKategori(kategori);
    setAppliedSort(sort);
  };

  const handleReset = () => {
    setSearch('');
    setKategori('');
    setSort('totalRevenue:desc');
    setAppliedSearch('');
    setAppliedKategori('');
    setAppliedSort('totalRevenue:desc');
  };

  const handleExport = () => {
    exportCsv('laporan-pareto.csv', ['No', 'Nama Produk', 'Total Revenue', 'Persentase', 'Kumulatif', 'Kategori ABC'], data.map((item, i) => [
      i + 1, item.nama, Math.round(item.totalRevenue), `${item.persentase.toFixed(1)}%`, `${item.kumulatif.toFixed(1)}%`, item.kategoriABC,
    ]));
  };

  const maxKumulatif = data.length > 0 ? Math.min(data[data.length - 1].kumulatif, 100) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Laporan Pareto</h1>
          <p className="text-gray-400 text-sm mt-1">Analisis ABC produk berdasarkan kontribusi revenue</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Cari Produk</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama produk..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApply();
              }}
            />
          </div>

          <div className="w-48">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Kategori</label>
            <SearchSelect
              options={kategoriOptions}
              value={kategori}
              onChange={setKategori}
              placeholder="Semua"
              searchPlaceholder="Cari kategori..."
            />
          </div>

          <div className="w-56">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Urutkan</label>
            <SearchSelect
              options={sortOptions}
              value={sort}
              onChange={setSort}
              placeholder="Pilih urutan..."
              searchPlaceholder="Cari urutan..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Terapkan
            </button>
            <button
              onClick={handleReset}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Nama Produk</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Total Revenue</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Persentase</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Kumulatif</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Kategori ABC</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium w-48">Grafik Kumulatif</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span>Tidak ada data pareto ditemukan</span>
                      <span className="text-xs text-gray-600">Coba ubah filter atau kata kunci pencarian</span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.nama}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{formatRupiah(item.totalRevenue)}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{item.persentase.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-gray-300 text-right">{item.kumulatif.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getAbcBadge(item.kategoriABC)}`}>
                        {item.kategoriABC}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${getAbcBar(item.kategoriABC)}`}
                          style={{ width: `${maxKumulatif > 0 ? (item.kumulatif / maxKumulatif) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
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
