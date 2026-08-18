'use client';

import { useEffect, useState, useMemo } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface StokItem {
  id: string;
  jumlah: number;
  apotek: { id: string; nama: string; alamat: string };
  produk: { id: string; nama: string; kategori: string; satuan: string; hargaKonsinyasi: number };
}

interface Apotek { id: string; nama: string; }

export default function StokKonsinyasiPage() {
  const [data, setData] = useState<StokItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApotek, setSelectedApotek] = useState('');

  const [apotekList, setApotekList] = useState<Apotek[]>([]);

  useEffect(() => {
    fetch('/api/apotek')
      .then((res) => res.json())
      .then((d) => { if (d.success) setApotekList(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedApotek) params.set('apotekId', selectedApotek);

    fetch(`/api/konsinyasi/stok?${params.toString()}`)
      .then((res) => res.json())
      .then((d) => { if (d.success) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedApotek]);

  const groupedByApotek = useMemo(() => {
    const groups: Record<string, { apotek: StokItem['apotek']; items: StokItem[]; totalNilai: number }> = {};
    for (const item of data) {
      const key = item.apotek.id;
      if (!groups[key]) {
        groups[key] = { apotek: item.apotek, items: [], totalNilai: 0 };
      }
      groups[key].items.push(item);
      groups[key].totalNilai += item.jumlah * item.produk.hargaKonsinyasi;
    }
    return Object.values(groups);
  }, [data]);

  const totalStok = data.reduce((sum, item) => sum + item.jumlah, 0);
  const totalNilai = data.reduce((sum, item) => sum + item.jumlah * item.produk.hargaKonsinyasi, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Stok Konsinyasi</h1>
        <p className="text-sm text-gray-400 mt-1">Lihat detail stok konsinyasi per apotek</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-72">
            <label className="block text-sm text-gray-400 mb-1">Filter Apotek</label>
            <SearchSelect
              options={[{ value: '', label: 'Semua Apotek' }, ...apotekList.map((a) => ({ value: a.id, label: a.nama }))]}
              value={selectedApotek}
              onChange={setSelectedApotek}
              placeholder="Semua Apotek"
            />
          </div>
          <div className="text-sm text-gray-400">
            {data.length} produk · Total stok: <span className="text-white font-semibold">{totalStok}</span> · Nilai: <span className="text-indigo-400 font-semibold">Rp {totalNilai.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-gray-400">Memuat data...</div>
        </div>
      ) : groupedByApotek.length === 0 ? (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 mb-3"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          <p className="text-gray-400">Tidak ada data stok konsinyasi</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByApotek.map((group) => (
            <div key={group.apotek.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{group.apotek.nama}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{group.apotek.alamat}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">{group.items.length} produk</p>
                    <p className="text-sm font-medium text-indigo-400">
                      Nilai: Rp {group.totalNilai.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-5 py-2.5 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">No</th>
                      <th className="px-5 py-2.5 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Produk</th>
                      <th className="px-5 py-2.5 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Kategori</th>
                      <th className="px-5 py-2.5 text-left text-gray-500 font-medium text-xs uppercase tracking-wider">Satuan</th>
                      <th className="px-5 py-2.5 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Harga Konsinyasi</th>
                      <th className="px-5 py-2.5 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Stok</th>
                      <th className="px-5 py-2.5 text-right text-gray-500 font-medium text-xs uppercase tracking-wider">Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`border-b border-gray-800/50 hover:bg-gray-800/30 ${
                          idx % 2 === 0 ? '' : 'bg-gray-800/10'
                        }`}
                      >
                        <td className="px-5 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-5 py-3 text-white font-medium">{item.produk.nama}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-600/10 text-indigo-400">
                            {item.produk.kategori}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-300">{item.produk.satuan}</td>
                        <td className="px-5 py-3 text-gray-300 text-right">
                          Rp {item.produk.hargaKonsinyasi.toLocaleString('id-ID')}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold">
                          <span className={item.jumlah <= 5 ? 'text-red-400' : item.jumlah <= 15 ? 'text-yellow-400' : 'text-green-400'}>
                            {item.jumlah}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-300 text-right">
                          Rp {(item.jumlah * item.produk.hargaKonsinyasi).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
