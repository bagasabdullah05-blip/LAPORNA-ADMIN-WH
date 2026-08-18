'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';
import { exportCsv } from '@/lib/export';

interface Summary {
  totalOmset: number;
  totalTransaksi: number;
  rataRata: number;
  totalItemTerjual: number;
}

interface SalesRow {
  salesId: string;
  nama: string;
  totalOmset: number;
  jumlahTransaksi: number;
  rataRata: number;
  totalItem: number;
  margin: number;
  persentaseMargin: number;
}

interface DailyRow {
  tanggal: string;
  totalOmset: number;
  jumlahTransaksi: number;
  rataRata: number;
  totalItem: number;
  tunai: number;
  piutang: number;
}

interface TipeRow {
  tipe: string;
  total: number;
  jumlah: number;
}

type Tab = 'ringkasan' | 'sales' | 'harian';

function formatRupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
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

export default function LaporanPenjualanPage() {
  const [summary, setSummary] = useState<Summary>({ totalOmset: 0, totalTransaksi: 0, rataRata: 0, totalItemTerjual: 0 });
  const [perSales, setPerSales] = useState<SalesRow[]>([]);
  const [perTanggal, setPerTanggal] = useState<DailyRow[]>([]);
  const [perTipe, setPerTipe] = useState<TipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('ringkasan');

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

    fetch(`/api/laporan/penjualan?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setPerSales(d.data.perSales);
          setPerTanggal(d.data.perTanggal);
          setPerTipe(d.data.perTipe);
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
  const maxOmset = Math.max(...perSales.map((s) => s.totalOmset), 1);

  const handleExport = () => {
    const prefix = `laporan-penjualan-${appliedTahun}-${appliedBulan}`;
    if (tab === 'ringkasan') {
      exportCsv(`${prefix}-ringkasan.csv`, ['Metrik', 'Nilai'], [
        ['Total Omset', summary.totalOmset],
        ['Total Transaksi', summary.totalTransaksi],
        ['Rata-rata/Transaksi', summary.rataRata],
        ['Total Item Terjual', summary.totalItemTerjual],
      ]);
    } else if (tab === 'sales') {
      exportCsv(`${prefix}-sales.csv`, ['Rank', 'Nama Sales', 'Total Omset', 'Transaksi', 'Rata-rata/Trx', 'Item Terjual', 'Margin', '% Margin', '% Kontribusi'], perSales.map((s, i) => [
        i + 1, s.nama, s.totalOmset, s.jumlahTransaksi, Math.round(s.rataRata), s.totalItem, Math.round(s.margin), `${s.persentaseMargin.toFixed(1)}%`, `${summary.totalOmset > 0 ? ((s.totalOmset / summary.totalOmset) * 100).toFixed(1) : 0}%`,
      ]));
    } else {
      exportCsv(`${prefix}-harian.csv`, ['Tanggal', 'Total Omset', 'Tunai', 'Piutang', 'Transaksi', 'Rata-rata/Trx', 'Item Terjual', '% Omset'], perTanggal.map((d) => [
        d.tanggal, d.totalOmset, d.tunai, d.piutang, d.jumlahTransaksi, Math.round(d.rataRata), d.totalItem, `${summary.totalOmset > 0 ? ((d.totalOmset / summary.totalOmset) * 100).toFixed(1) : 0}%`,
      ]));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Laporan Penjualan</h1>
          <p className="text-gray-400 text-sm mt-1">Omset sales, omset harian, dan analisis penjualan</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
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
        {appliedSalesId && (
          <> &middot; Sales: <span className="text-white font-medium">{perSales[0]?.nama || ''}</span></>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl border border-gray-800 p-1 mb-6">
        {([
          { key: 'ringkasan', label: 'Ringkasan' },
          { key: 'sales', label: 'Omset per Sales' },
          { key: 'harian', label: 'Omset per Hari' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
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
          {/* ================= RINGKASAN ================= */}
          {tab === 'ringkasan' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Omset</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalOmset)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Transaksi</p>
                  <p className="text-2xl font-bold text-white">{summary.totalTransaksi.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Rata-rata per Transaksi</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.rataRata)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Item Terjual</p>
                  <p className="text-2xl font-bold text-white">{summary.totalItemTerjual.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Tipe Transaksi */}
              {perTipe.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Berdasarkan Tipe Transaksi</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {perTipe.map((t) => (
                      <div key={t.tipe} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                        <p className="text-xs text-gray-400">{t.tipe === 'KONSINYASI' ? 'Konsinyasi' : 'Langsung'}</p>
                        <p className="text-lg font-bold text-white mt-1">{formatRupiah(t.total)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t.jumlah} transaksi</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Sales Quick View */}
              {perSales.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Top Sales</h3>
                  <div className="space-y-3">
                    {perSales.slice(0, 5).map((s, idx) => (
                      <div key={s.salesId} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-700/50 text-gray-400'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white font-medium truncate">{s.nama}</span>
                            <span className="text-sm text-gray-300 ml-2">{formatRupiah(s.totalOmset)}</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${(s.totalOmset / maxOmset) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= OMSET PER SALES ================= */}
          {tab === 'sales' && (
            <div className="space-y-6">
              {/* Sales Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Jumlah Sales Aktif</p>
                  <p className="text-2xl font-bold text-white">{perSales.length}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Omset Semua Sales</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalOmset)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Rata-rata Omset per Sales</p>
                  <p className="text-2xl font-bold text-white">
                    {formatRupiah(perSales.length > 0 ? summary.totalOmset / perSales.length : 0)}
                  </p>
                </div>
              </div>

              {/* Sales Table */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Rank</th>
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Nama Sales</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Total Omset</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Transaksi</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Rata-rata/Trx</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Item Terjual</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Margin</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">% Margin</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">% Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perSales.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                            Tidak ada data penjualan
                          </td>
                        </tr>
                      ) : (
                        perSales.map((s, idx) => {
                          const kontribusi = summary.totalOmset > 0 ? (s.totalOmset / summary.totalOmset) * 100 : 0;
                          return (
                            <tr
                              key={s.salesId}
                              className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                                idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                  idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                  idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                                  idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-gray-700/50 text-gray-400'
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-white font-medium">{s.nama}</td>
                              <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(s.totalOmset)}</td>
                              <td className="px-4 py-3 text-gray-300 text-right">{s.jumlahTransaksi}</td>
                              <td className="px-4 py-3 text-gray-300 text-right">{formatRupiah(s.rataRata)}</td>
                              <td className="px-4 py-3 text-gray-300 text-right">{s.totalItem.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={s.margin >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {formatRupiah(s.margin)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={s.persentaseMargin >= 0 ? 'text-green-400' : 'text-red-400'}>
                                  {s.persentaseMargin.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full"
                                      style={{ width: `${kontribusi}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-300 text-xs w-12 text-right">{kontribusi.toFixed(1)}%</span>
                                </div>
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
          )}

          {/* ================= OMSET PER HARI ================= */}
          {tab === 'harian' && (
            <div className="space-y-6">
              {/* Daily Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Hari Aktif</p>
                  <p className="text-2xl font-bold text-white">{perTanggal.length}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Omset</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalOmset)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Rata-rata/Hari</p>
                  <p className="text-2xl font-bold text-white">
                    {formatRupiah(perTanggal.length > 0 ? summary.totalOmset / perTanggal.length : 0)}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Omset Tertinggi</p>
                  <p className="text-2xl font-bold text-white">
                    {formatRupiah(Math.max(...perTanggal.map((d) => d.totalOmset), 0))}
                  </p>
                </div>
              </div>

              {/* Daily Table */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Total Omset</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Tunai</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Piutang</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Transaksi</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Rata-rata/Trx</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Item Terjual</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">% Omset</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perTanggal.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                            Tidak ada data penjualan
                          </td>
                        </tr>
                      ) : (
                        perTanggal.map((d, idx) => {
                          const persentase = summary.totalOmset > 0 ? (d.totalOmset / summary.totalOmset) * 100 : 0;
                          return (
                            <tr
                              key={d.tanggal}
                              className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                                idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                              }`}
                            >
                              <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 text-white font-medium">{formatDate(d.tanggal)}</td>
                              <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(d.totalOmset)}</td>
                              <td className="px-4 py-3 text-green-400 text-right">{formatRupiah(d.tunai)}</td>
                              <td className="px-4 py-3 text-yellow-400 text-right">{formatRupiah(d.piutang)}</td>
                              <td className="px-4 py-3 text-gray-300 text-right">{d.jumlahTransaksi}</td>
                              <td className="px-4 py-3 text-gray-300 text-right">{formatRupiah(d.rataRata)}</td>
                              <td className="px-4 py-3 text-gray-300 text-right">{d.totalItem.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full"
                                      style={{ width: `${persentase}%` }}
                                    />
                                  </div>
                                  <span className="text-gray-300 text-xs w-12 text-right">{persentase.toFixed(1)}%</span>
                                </div>
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
          )}
        </>
      )}
    </div>
  );
}
