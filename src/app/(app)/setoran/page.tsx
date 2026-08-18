'use client';

import { useCallback, useEffect, useState } from 'react';

interface SetoranItem {
  id: string;
  tipe: string;
  jumlah: number;
  keterangan: string;
  disetujui: boolean;
  disetujuiOleh: string | null;
  tanggalAcc: string | null;
  createdAt: string;
  apotek: { nama: string } | null;
  penjualan: {
    id: string;
    tipe: string;
    totalBayar: number;
    metodeBayar: string;
    apotek: { nama: string } | null;
    pelanggan: { nama: string } | null;
  } | null;
  piutang: {
    total: number;
    sisa: number;
    status: string;
  } | null;
}

function formatRupiah(v: number) {
  return `Rp ${v.toLocaleString('id-ID')}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function TipeBadge({ tipe }: { tipe: string }) {
  const styles: Record<string, string> = {
    CASH: 'bg-green-500/20 text-green-400 border border-green-500/30',
    CICILAN: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    PELUNASAN: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    KONSINYASI_CICIL: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    KONSINYASI_LUNAS: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };
  const labels: Record<string, string> = {
    CASH: 'CASH',
    CICILAN: 'CICILAN',
    PELUNASAN: 'PELUNASAN',
    KONSINYASI_CICIL: 'KONSI CICIL',
    KONSINYASI_LUNAS: 'KONSI LUNAS',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[tipe] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
      {labels[tipe] || tipe}
    </span>
  );
}

export default function SetoranPage() {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));

  const [setoranList, setSetoranList] = useState<SetoranItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (bulan) params.set('bulan', bulan);
    if (tahun) params.set('tahun', tahun);

    fetch(`/api/setoran?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSetoranList(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bulan, tahun]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pending = setoranList.filter((s) => !s.disetujui);
  const approved = setoranList.filter((s) => s.disetujui);

  const totalPending = pending.reduce((sum, s) => sum + s.jumlah, 0);
  const totalApproved = approved.reduce((sum, s) => sum + s.jumlah, 0);
  const totalCount = setoranList.length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Daftar Setoran</h1>
        <p className="text-gray-400 text-sm mt-1">Semua pemasukan uang dari penjualan & cicilan — menunggu ACC admin finance</p>
      </div>

      {/* Filter */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bulan</label>
            <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm">
              {['1','2','3','4','5','6','7','8','9','10','11','12'].map((m) => (
                <option key={m} value={m}>{new Date(2025, Number(m)-1).toLocaleDateString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Tahun</label>
            <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} className="w-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm" min={2020} />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">Menunggu ACC</p>
          <p className="text-xl font-bold text-yellow-400">{formatRupiah(totalPending)}</p>
          <p className="text-xs text-gray-500 mt-1">{pending.length} transaksi</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">Sudah Disetujui</p>
          <p className="text-xl font-bold text-green-400">{formatRupiah(totalApproved)}</p>
          <p className="text-xs text-gray-500 mt-1">{approved.length} transaksi</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-xs text-gray-400 mb-1">Total</p>
          <p className="text-xl font-bold text-white">{formatRupiah(totalPending + totalApproved)}</p>
          <p className="text-xs text-gray-500 mt-1">{totalCount} transaksi</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek/Pelanggan</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Sumber</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Jumlah</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Keterangan</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">Memuat data...</td></tr>
              ) : setoranList.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">Tidak ada data setoran</td></tr>
              ) : (
                setoranList.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}`}>
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3"><TipeBadge tipe={s.tipe} /></td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{s.apotek?.nama || s.penjualan?.pelanggan?.nama || '-'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {s.penjualan ? `Penjualan ${s.penjualan.tipe}` : 'Piutang Lama'}
                    </td>
                    <td className="px-4 py-3 text-white text-right font-medium text-xs">{formatRupiah(s.jumlah)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{s.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {s.disetujui ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          DISETUJUI
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          MENUNGGU
                        </span>
                      )}
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
