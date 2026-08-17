'use client';

import { useEffect, useState } from 'react';

interface Piutang {
  id: string;
  penjualanId: string;
  total: number;
  sisa: number;
  status: string;
  createdAt: string;
  penjualan: {
    tanggal: string;
    apotek: { nama: string } | null;
    pelanggan: { nama: string } | null;
  };
  cicilan: {
    id: string;
    jumlahBayar: number;
    tanggalBayar: string;
    keterangan: string;
  }[];
}

export default function PiutangPage() {
  const [data, setData] = useState<Piutang[]>([]);
  const [filter, setFilter] = useState('SEMUA');
  const [loading, setLoading] = useState(true);
  const [selectedPiutang, setSelectedPiutang] = useState<Piutang | null>(null);
  const [showCicilanModal, setShowCicilanModal] = useState(false);
  const [cicilanForm, setCicilanForm] = useState({ jumlahBayar: 0, keterangan: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    setLoading(true);
    const url = filter === 'SEMUA' ? '/api/piutang' : `/api/piutang?status=${filter}`;
    fetch(url)
      .then((res) => res.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [filter]);

  const openDetail = (item: Piutang) => {
    setSelectedPiutang(item);
  };

  const openCicilan = (item: Piutang) => {
    setSelectedPiutang(item);
    setCicilanForm({ jumlahBayar: 0, keterangan: '' });
    setShowCicilanModal(true);
  };

  const handleCicilan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPiutang) return;
    setSubmitting(true);
    try {
      await fetch('/api/cicilan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          piutangId: selectedPiutang.id,
          ...cicilanForm,
        }),
      });
      setShowCicilanModal(false);
      fetchData();
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const getNamaPelanggan = (item: Piutang) => {
    return item.penjualan.apotek?.nama || item.penjualan.pelanggan?.nama || '-';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Piutang & Cicilan</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {['SEMUA', 'BELUM_LUNAS', 'LUNAS'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {f === 'SEMUA' ? 'Semua' : f === 'BELUM_LUNAS' ? 'Belum Lunas' : 'Lunas'}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek/Pelanggan</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Total</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Sisa</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Status</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Tidak ada data</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer ${
                      idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'
                    }`}
                    onClick={() => openDetail(item)}
                  >
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300">{new Date(item.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 text-white">{getNamaPelanggan(item)}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">Rp {item.total.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">Rp {item.sisa.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'LUNAS' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      {item.status !== 'LUNAS' && (
                        <button
                          onClick={() => openCicilan(item)}
                          className="text-indigo-400 hover:text-indigo-300 text-xs"
                        >
                          Bayar Cicilan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPiutang && !showCicilanModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Detail Piutang</h2>
                <button
                  onClick={() => setSelectedPiutang(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Pelanggan</span>
                  <span className="text-white">{getNamaPelanggan(selectedPiutang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white">Rp {selectedPiutang.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sisa</span>
                  <span className="text-yellow-400 font-medium">Rp {selectedPiutang.sisa.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={selectedPiutang.status === 'LUNAS' ? 'text-green-400' : 'text-yellow-400'}>
                    {selectedPiutang.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
              </div>

              {selectedPiutang.cicilan.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Riwayat Cicilan</h3>
                  <div className="space-y-2">
                    {selectedPiutang.cicilan.map((c) => (
                      <div key={c.id} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300 text-sm">{new Date(c.tanggalBayar).toLocaleDateString('id-ID')}</span>
                          <span className="text-green-400 font-medium">Rp {c.jumlahBayar.toLocaleString('id-ID')}</span>
                        </div>
                        {c.keterangan && (
                          <p className="text-gray-500 text-xs mt-1">{c.keterangan}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCicilanModal && selectedPiutang && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Bayar Cicilan</h2>
              <p className="text-sm text-gray-400 mb-4">
                Sisa piutang: <span className="text-yellow-400 font-medium">Rp {selectedPiutang.sisa.toLocaleString('id-ID')}</span>
              </p>
              <form onSubmit={handleCicilan} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Jumlah Bayar</label>
                  <input
                    type="number"
                    value={cicilanForm.jumlahBayar || ''}
                    onChange={(e) => setCicilanForm({ ...cicilanForm, jumlahBayar: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min={1}
                    max={selectedPiutang.sisa}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Keterangan</label>
                  <input
                    type="text"
                    value={cicilanForm.keterangan}
                    onChange={(e) => setCicilanForm({ ...cicilanForm, keterangan: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Opsional"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCicilanModal(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Menyimpan...' : 'Bayar'}
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
