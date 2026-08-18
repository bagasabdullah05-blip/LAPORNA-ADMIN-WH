'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Summary {
  totalOmset: number;
  totalItemTerjual: number;
  jumlahProduk: number;
}

interface ProdukRow {
  produkId: string;
  nama: string;
  kategori: string;
  satuan: string;
  totalJumlah: number;
  totalOmset: number;
  rataRataHarga: number;
  persentase: number;
}

function formatRupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

const bulanOptions = [
  { value: '1', label: 'Januari' },
  { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' },
  { value: '4', label: 'April' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' },
  { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export default function LaporanPenjualanProdukPage() {
  const [summary, setSummary] = useState<Summary>({ totalOmset: 0, totalItemTerjual: 0, jumlahProduk: 0 });
  const [perProduk, setPerProduk] = useState<ProdukRow[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [salesId, setSalesId] = useState('');

  const [appliedBulan, setAppliedBulan] = useState(bulan);
  const [appliedTahun, setAppliedTahun] = useState(tahun);
  const [appliedSalesId, setAppliedSalesId] = useState('');

  const [salesList, setSalesList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/sales')
      .then((res) => res.json())
      .then((d) => { if (d.success) setSalesList(d.data.map((s: { id: string; nama: string }) => ({ value: s.id, label: s.nama }))); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (appliedBulan) params.set('bulan', appliedBulan);
    if (appliedTahun) params.set('tahun', appliedTahun);
    if (appliedSalesId) params.set('salesId', appliedSalesId);

    fetch(`/api/laporan/penjualan-produk?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setPerProduk(d.data.perProduk);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [appliedBulan, appliedTahun, appliedSalesId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApply = () => {
    setAppliedBulan(bulan);
    setAppliedTahun(tahun);
    setAppliedSalesId(salesId);
  };

  const handleReset = () => {
    const n = new Date();
    setBulan(String(n.getMonth() + 1));
    setTahun(String(n.getFullYear()));
    setSalesId('');
    setAppliedBulan(String(n.getMonth() + 1));
    setAppliedTahun(String(n.getFullYear()));
    setAppliedSalesId('');
  };

  const bulanLabel = bulanOptions.find((b) => b.value === appliedBulan)?.label || '';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Laporan Penjualan per Produk</h1>
        <p className="text-gray-400 text-sm mt-1">Analisis penjualan berdasarkan produk</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-44">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Bulan</label>
            <SearchSelect
              options={bulanOptions}
              value={bulan}
              onChange={setBulan}
              placeholder="Pilih bulan..."
              searchPlaceholder="Cari bulan..."
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Tahun</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              min={2020}
              max={2099}
            />
          </div>
          <div className="w-56">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Sales</label>
            <SearchSelect
              options={[{ value: '', label: 'Semua Sales' }, ...salesList]}
              value={salesId}
              onChange={setSalesId}
              placeholder="Semua Sales"
              searchPlaceholder="Cari sales..."
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

      {/* Period Label */}
      <div className="text-sm text-gray-400 mb-4">
        Periode: <span className="text-white font-medium">{bulanLabel} {tahun}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="flex items-center gap-2 text-gray-400">
            <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Memuat data...
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Total Omset</p>
              <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalOmset)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Total Item Terjual</p>
              <p className="text-2xl font-bold text-white">{summary.totalItemTerjual.toLocaleString('id-ID')}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Jumlah Produk</p>
              <p className="text-2xl font-bold text-white">{summary.jumlahProduk}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Produk</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Kategori</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Satuan</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Jumlah Terjual</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Total Omset</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Rata-rata Harga</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">% Kontribusi</th>
                  </tr>
                </thead>
                <tbody>
                  {perProduk.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        Tidak ada data penjualan
                      </td>
                    </tr>
                  ) : (
                    perProduk.map((p, idx) => (
                      <tr
                        key={p.produkId}
                        className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-white font-medium">{p.nama}</td>
                        <td className="px-4 py-3 text-gray-300">{p.kategori}</td>
                        <td className="px-4 py-3 text-gray-300">{p.satuan}</td>
                        <td className="px-4 py-3 text-gray-300 text-right">{p.totalJumlah.toLocaleString('id-ID')}</td>
                        <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(p.totalOmset)}</td>
                        <td className="px-4 py-3 text-gray-300 text-right">{formatRupiah(p.rataRataHarga)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${p.persentase}%` }}
                              />
                            </div>
                            <span className="text-gray-300 text-xs w-12 text-right">{p.persentase.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
