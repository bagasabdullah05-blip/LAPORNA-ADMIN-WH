'use client';

import { useCallback, useEffect, useState } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Summary {
  totalPenjualan: number;
  totalPenerimaan: number;
  totalPiutangTersisa: number;
  jumlahTransaksi: number;
}

interface PerTanggal {
  tanggal: string;
  penjualan: number;
  penerimaan: number;
  piutang: number;
}

interface DetailTransaksi {
  id: string;
  tanggal: string;
  tipe: string;
  metodeBayar: string;
  apotekNama: string;
  pelangganNama: string;
  salesNama: string;
  totalPenjualan: number;
  totalDiterima: number;
  sisaPiutang: number;
  statusBayar: string;
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'LUNAS') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">LUNAS</span>;
  }
  if (status === 'BELUM_LUNAS') {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">BELUM LUNAS</span>;
  }
  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">BELUM BAYAR</span>;
}

export default function LaporanSetoranPage() {
  const [summary, setSummary] = useState<Summary>({ totalPenjualan: 0, totalPenerimaan: 0, totalPiutangTersisa: 0, jumlahTransaksi: 0 });
  const [perTanggal, setPerTanggal] = useState<PerTanggal[]>([]);
  const [detailTransaksi, setDetailTransaksi] = useState<DetailTransaksi[]>([]);
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

    fetch(`/api/laporan/setoran?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setSummary(d.data.summary);
          setPerTanggal(d.data.perTanggal);
          setDetailTransaksi(d.data.detailTransaksi);
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
        <h1 className="text-2xl font-bold text-white">Laporan Setoran</h1>
        <p className="text-gray-400 text-sm mt-1">Perbandingan total penjualan vs uang benar-benar diterima</p>
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
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Total Penjualan</p>
              <p className="text-2xl font-bold text-white">{formatRupiah(summary.totalPenjualan)}</p>
              <p className="text-xs text-gray-500 mt-1">Total dari semua transaksi</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Total Penerimaan</p>
              <p className="text-2xl font-bold text-green-400">{formatRupiah(summary.totalPenerimaan)}</p>
              <p className="text-xs text-gray-500 mt-1">Tunai + Cicilan diterima</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Sisa Piutang</p>
              <p className="text-2xl font-bold text-yellow-400">{formatRupiah(summary.totalPiutangTersisa)}</p>
              <p className="text-xs text-gray-500 mt-1">Belum diterima</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-xs text-gray-400 mb-1">Jumlah Transaksi</p>
              <p className="text-2xl font-bold text-white">{summary.jumlahTransaksi.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Per Tanggal Table */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Ringkasan Per Tanggal</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Penjualan</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Penerimaan</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Piutang (Selisih)</th>
                  </tr>
                </thead>
                <tbody>
                  {perTanggal.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                        Tidak ada data setoran
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
                        <td className="px-4 py-3 text-white font-medium">{formatDate(d.tanggal)}</td>
                        <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(d.penjualan)}</td>
                        <td className="px-4 py-3 text-green-400 text-right">{formatRupiah(d.penerimaan)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={d.piutang > 0 ? 'text-yellow-400' : 'text-gray-500'}>
                            {formatRupiah(d.piutang)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {perTanggal.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-700 bg-gray-800/50">
                      <td className="px-4 py-3 text-white font-bold">Total</td>
                      <td className="px-4 py-3 text-white text-right font-bold">{formatRupiah(summary.totalPenjualan)}</td>
                      <td className="px-4 py-3 text-green-400 text-right font-bold">{formatRupiah(summary.totalPenerimaan)}</td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={summary.totalPiutangTersisa > 0 ? 'text-yellow-400' : 'text-gray-500'}>
                          {formatRupiah(summary.totalPiutangTersisa)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Detail Transaksi Table */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Detail Transaksi</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Tipe</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Metode</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek / Pelanggan</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Sales</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Total Penjualan</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Total Diterima</th>
                    <th className="px-4 py-3 text-right text-gray-400 font-medium">Sisa</th>
                    <th className="px-4 py-3 text-center text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-500">
                        Tidak ada data transaksi
                      </td>
                    </tr>
                  ) : (
                    detailTransaksi.map((d, idx) => (
                      <tr
                        key={d.id}
                        className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{formatDate(d.tanggal)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            d.tipe === 'KONSINYASI'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {d.tipe === 'KONSINYASI' ? 'Konsinyasi' : 'Langsung'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            d.metodeBayar === 'TUNAI'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {d.metodeBayar === 'TUNAI' ? 'Tunai' : 'Piutang'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {d.metodeBayar === 'TUNAI' ? d.apotekNama : (d.apotekNama !== '-' ? d.apotekNama : d.pelangganNama)}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{d.salesNama}</td>
                        <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(d.totalPenjualan)}</td>
                        <td className="px-4 py-3 text-green-400 text-right">{formatRupiah(d.totalDiterima)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={d.sisaPiutang > 0 ? 'text-yellow-400' : 'text-gray-500'}>
                            {formatRupiah(d.sisaPiutang)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={d.statusBayar} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
