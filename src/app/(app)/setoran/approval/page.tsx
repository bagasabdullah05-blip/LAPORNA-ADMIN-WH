'use client';

import { useCallback, useEffect, useState } from 'react';

interface PenjualanInfo {
  id: string;
  tipe: string;
  totalBayar: number;
  apotek: { nama: string } | null;
  pelanggan: { nama: string } | null;
}

interface SetoranItem {
  id: string;
  tipe: string;
  jumlah: number;
  tanggal: string;
  keterangan: string;
  disetujui: boolean;
  disetujuiOleh: string | null;
  tanggalAcc: string | null;
  createdAt: string;
  apotek: { nama: string } | null;
  penjualan: PenjualanInfo | null;
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

export default function ApprovalSetoranPage() {
  const [setoranList, setSetoranList] = useState<SetoranItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  const fetchSetoran = useCallback(() => {
    setLoading(true);
    fetch('/api/setoran')
      .then((res) => res.json())
      .then((d) => { if (d.success) setSetoranList(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSetoran(); }, [fetchSetoran]);

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      const res = await fetch('/api/setoran', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d.success) {
        fetchSetoran();
      } else {
        alert(d.message || 'Gagal menyetujui');
      }
    } catch {
      alert('Terjadi kesalahan');
    } finally {
      setApproving(null);
    }
  };

  const pending = setoranList.filter((s) => !s.disetujui);
  const approved = setoranList.filter((s) => s.disetujui);

  const totalMenunggu = pending.reduce((sum, s) => sum + s.jumlah, 0);
  const totalDisetujui = approved.reduce((sum, s) => sum + s.jumlah, 0);
  const totalKeseluruhan = setoranList.reduce((sum, s) => sum + s.jumlah, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Approval Setoran</h1>
        <p className="text-gray-400 text-sm mt-1">Setujui setoran masuk dari lapangan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 mb-1">Menunggu ACC</p>
          <p className="text-2xl font-bold text-yellow-400">{formatRupiah(totalMenunggu)}</p>
          <p className="text-xs text-gray-500 mt-1">{pending.length} transaksi</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 mb-1">Disetujui</p>
          <p className="text-2xl font-bold text-green-400">{formatRupiah(totalDisetujui)}</p>
          <p className="text-xs text-gray-500 mt-1">{approved.length} transaksi</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 mb-1">Total Keseluruhan</p>
          <p className="text-2xl font-bold text-white">{formatRupiah(totalKeseluruhan)}</p>
          <p className="text-xs text-gray-500 mt-1">{setoranList.length} transaksi</p>
        </div>
      </div>

      {/* Menunggu ACC */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-yellow-400">Menunggu ACC ({pending.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Penjualan</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Jumlah</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Keterangan</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">Tidak ada setoran menunggu ACC</td>
                </tr>
              ) : (
                pending.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3"><TipeBadge tipe={s.tipe} /></td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {s.penjualan ? (
                        <div>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                            s.penjualan.tipe === 'KONSINYASI' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{s.penjualan.tipe === 'KONSINYASI' ? 'KONSI' : 'LANGSUNG'}</span>
                          <span className="text-gray-400">#{s.penjualan.id.slice(0, 8)}</span>
                          <span className="ml-1 text-gray-300">{s.penjualan.apotek?.nama || s.penjualan.pelanggan?.nama || '-'}</span>
                          <span className="ml-1 text-gray-500">Rp {s.penjualan.totalBayar.toLocaleString('id-ID')}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{s.apotek?.nama || '-'}</td>
                    <td className="px-4 py-3 text-white text-right font-semibold">{formatRupiah(s.jumlah)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{s.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleApprove(s.id)}
                        disabled={approving === s.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        {approving === s.id ? '...' : 'ACC'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disetujui */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-green-400">Disetujui ({approved.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Penjualan</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Jumlah</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Keterangan</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Disetujui Oleh</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal ACC</th>
              </tr>
            </thead>
            <tbody>
              {approved.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">Belum ada setoran disetujui</td>
                </tr>
              ) : (
                approved.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                  >
                    <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3"><TipeBadge tipe={s.tipe} /></td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {s.penjualan ? (
                        <div>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mr-1 ${
                            s.penjualan.tipe === 'KONSINYASI' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{s.penjualan.tipe === 'KONSINYASI' ? 'KONSI' : 'LANGSUNG'}</span>
                          <span className="text-gray-400">#{s.penjualan.id.slice(0, 8)}</span>
                          <span className="ml-1 text-gray-300">{s.penjualan.apotek?.nama || s.penjualan.pelanggan?.nama || '-'}</span>
                          <span className="ml-1 text-gray-500">Rp {s.penjualan.totalBayar.toLocaleString('id-ID')}</span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{s.apotek?.nama || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 text-right font-semibold">{formatRupiah(s.jumlah)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">{s.keterangan || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{s.disetujuiOleh || '-'}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs whitespace-nowrap">{s.tanggalAcc ? formatDate(s.tanggalAcc) : '-'}</td>
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
