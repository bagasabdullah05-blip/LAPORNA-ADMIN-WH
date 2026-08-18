'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Summary {
  totalPenjualan: number;
  totalTunai: number;
  totalPiutangBaru: number;
  totalCicilanMasuk: number;
  totalKonsiLunas: number;
  totalPenerimaan: number;
  totalPiutangTersisa: number;
  totalMenunggu: number;
}

interface PerTanggal {
  tanggal: string;
  tunai: number;
  cicilan: number;
  total: number;
}

interface PerApotek {
  apotekId: string;
  nama: string;
  tunai: number;
  cicilan: number;
  total: number;
}

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

type Tab = 'ringkasan' | 'tanggal' | 'apotek';

export default function LaporanPenerimaanKasPage() {
  const [summary, setSummary] = useState<Summary>({
    totalPenjualan: 0,
    totalTunai: 0,
    totalPiutangBaru: 0,
    totalCicilanMasuk: 0,
    totalKonsiLunas: 0,
    totalPenerimaan: 0,
    totalPiutangTersisa: 0,
    totalMenunggu: 0,
  });
  const [perTanggal, setPerTanggal] = useState<PerTanggal[]>([]);
  const [perApotek, setPerApotek] = useState<PerApotek[]>([]);
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
      .then((d) => {
        if (d.success) setSalesList(d.data.map((s: { id: string; nama: string }) => ({ value: s.id, label: s.nama })));
      })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (appliedBulan) params.set('bulan', appliedBulan);
    if (appliedTahun) params.set('tahun', appliedTahun);
    if (appliedSalesId) params.set('salesId', appliedSalesId);

    fetch(`/api/laporan/penerimaan-kas?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setPerTanggal(d.data.perTanggal);
          setPerApotek(d.data.perApotek);
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
        <h1 className="text-2xl font-bold text-white">Laporan Penerimaan Kas</h1>
        <p className="text-gray-400 text-sm mt-1">Aliran kas masuk dari penjualan tunai dan cicilan piutang</p>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl border border-gray-800 p-1 mb-6">
        {([
          { key: 'ringkasan', label: 'Ringkasan' },
          { key: 'tanggal', label: 'Per Tanggal' },
          { key: 'apotek', label: 'Per Apotek' },
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Penerimaan Kas</p>
                  <p className="text-2xl font-bold text-green-400">{formatRupiah(summary.totalPenerimaan)}</p>
                  <p className="text-xs text-gray-500 mt-1">Tunai + Cicilan + Konsi</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Penjualan Tunai</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalTunai)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Cicilan Masuk</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalCicilanMasuk)}</p>
                  <p className="text-xs text-gray-500 mt-1">Cicilan + Konsi Cicil</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Pelunasan Piutang</p>
                  <p className="text-2xl font-bold text-purple-400">{formatRupiah(summary.totalKonsiLunas)}</p>
                  <p className="text-xs text-gray-500 mt-1">Pelunasan + Konsi Lunas</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Penjualan (Semua Metode)</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalPenjualan)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Piutang Baru (Periode Ini)</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatRupiah(summary.totalPiutangBaru)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Menunggu ACC</p>
                  <p className="text-2xl font-bold text-orange-400">{formatRupiah(summary.totalMenunggu)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Piutang Tersisa</p>
                  <p className="text-2xl font-bold text-red-400">{formatRupiah(summary.totalPiutangTersisa)}</p>
                  <p className="text-xs text-gray-500 mt-1">Belum Lunas (Kumulatif)</p>
                </div>
              </div>

              {/* Rincian */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Rincian Penerimaan</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">Cash Langsung (CASH)</span>
                    <span className="text-sm text-green-400 font-semibold">{formatRupiah(summary.totalTunai)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">Cicilan Piutang (CICILAN + KONSI CICIL)</span>
                    <span className="text-sm text-yellow-400 font-semibold">{formatRupiah(summary.totalCicilanMasuk)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                    <span className="text-sm text-gray-400">Pelunasan (PELUNASAN + KONSI LUNAS)</span>
                    <span className="text-sm text-purple-400 font-semibold">{formatRupiah(summary.totalKonsiLunas)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-white font-semibold">Total Penerimaan Kas</span>
                    <span className="text-sm text-green-400 font-bold">{formatRupiah(summary.totalPenerimaan)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PER TANGGAL ================= */}
          {tab === 'tanggal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Hari Aktif</p>
                  <p className="text-2xl font-bold text-white">{perTanggal.length}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Penerimaan</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalPenerimaan)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Rata-rata/Hari</p>
                  <p className="text-2xl font-bold text-white">
                    {formatRupiah(perTanggal.length > 0 ? summary.totalPenerimaan / perTanggal.length : 0)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Tunai</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Cicilan</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perTanggal.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                            Tidak ada data penerimaan kas
                          </td>
                        </tr>
                      ) : (
                        perTanggal.map((d, idx) => (
                          <tr
                            key={d.tanggal}
                            className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                              idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                            }`}
                          >
                            <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3 text-white font-medium">{formatDate(d.tanggal)}</td>
                            <td className="px-4 py-3 text-green-400 text-right">{formatRupiah(d.tunai)}</td>
                            <td className="px-4 py-3 text-blue-400 text-right">{formatRupiah(d.cicilan)}</td>
                            <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(d.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= PER APOTEK ================= */}
          {tab === 'apotek' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Apotek Aktif</p>
                  <p className="text-2xl font-bold text-white">{perApotek.length}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Total Penerimaan</p>
                  <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalPenerimaan)}</p>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-xs text-gray-400 mb-1">Rata-rata/Apotek</p>
                  <p className="text-2xl font-bold text-white">
                    {formatRupiah(perApotek.length > 0 ? summary.totalPenerimaan / perApotek.length : 0)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                        <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Tunai</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Cicilan</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">Total</th>
                        <th className="px-4 py-3 text-right text-gray-400 font-medium">% Kontribusi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perApotek.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                            Tidak ada data penerimaan kas
                          </td>
                        </tr>
                      ) : (
                        perApotek.map((a, idx) => {
                          const kontribusi = summary.totalPenerimaan > 0 ? (a.total / summary.totalPenerimaan) * 100 : 0;
                          return (
                            <tr
                              key={a.apotekId}
                              className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                                idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                              }`}
                            >
                              <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-3 text-white font-medium">{a.nama}</td>
                              <td className="px-4 py-3 text-green-400 text-right">{formatRupiah(a.tunai)}</td>
                              <td className="px-4 py-3 text-blue-400 text-right">{formatRupiah(a.cicilan)}</td>
                              <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(a.total)}</td>
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
        </>
      )}
    </div>
  );
}
