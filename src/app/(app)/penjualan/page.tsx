'use client';

import { useEffect, useState, useCallback } from 'react';
import SearchSelect from '@/components/SearchSelect';

interface Produk {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  stokGudang: number;
  hargaMember: number;
  hargaAgent: number;
  hargaKarton: number;
  hargaAptCash: number;
  hargaKonsinyasi: number;
  hargaTerendah: number;
}

interface Apotek { id: string; nama: string; }
interface Sales { id: string; nama: string; }
interface Pelanggan { id: string; nama: string; }

interface StokKonsinyasi {
  produkId: string;
  jumlah: number;
}

interface ItemRow {
  produkId: string;
  jumlah: number;
  tipeHarga: string;
  hargaSatuan: number;
}

interface DetailPenjualan {
  id: string;
  produkId: string;
  jumlah: number;
  tipeHarga: string;
  hargaSatuan: number;
  subtotal: number;
  produk: { nama: string };
}

interface PenjualanLog {
  id: string;
  tipe: string;
  tanggal: string;
  totalBayar: number;
  metodeBayar: string;
  status: string;
  apotek: { nama: string } | null;
  pelanggan: { nama: string } | null;
  sales: { nama: string };
  user: { nama: string };
  details: DetailPenjualan[];
}

const tipeHargaOptions = [
  { value: 'Member', key: 'hargaMember' },
  { value: 'Agent', key: 'hargaAgent' },
  { value: 'Karton', key: 'hargaKarton' },
  { value: 'AptCash', key: 'hargaAptCash' },
  { value: 'Konsinyasi', key: 'hargaKonsinyasi' },
  { value: 'Terendah', key: 'hargaTerendah' },
];

export default function PenjualanPage() {
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [apotekList, setApotekList] = useState<Apotek[]>([]);
  const [salesList, setSalesList] = useState<Sales[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [riwayat, setRiwayat] = useState<PenjualanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [tipeTransaksi, setTipeTransaksi] = useState('KONSINYASI');
  const [apotekId, setApotekId] = useState('');
  const [pelangganId, setPelangganId] = useState('');
  const [salesId, setSalesId] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('TUNAI');
  const [jumlahBayar, setJumlahBayar] = useState(0);
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));

  const [stokKonsinyasi, setStokKonsinyasi] = useState<StokKonsinyasi[]>([]);
  const [loadingStok, setLoadingStok] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([
    { produkId: '', jumlah: 1, tipeHarga: 'Konsinyasi', hargaSatuan: 0 },
  ]);

  const [editItem, setEditItem] = useState<PenjualanLog | null>(null);
  const [editTipe, setEditTipe] = useState('KONSINYASI');
  const [editApotekId, setEditApotekId] = useState('');
  const [editPelangganId, setEditPelangganId] = useState('');
  const [editSalesId, setEditSalesId] = useState('');
  const [editMetodeBayar, setEditMetodeBayar] = useState('TUNAI');
  const [editJumlahBayar, setEditJumlahBayar] = useState(0);
  const [editTanggal, setEditTanggal] = useState('');
  const [editItems, setEditItems] = useState<ItemRow[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/produk').then((res) => res.json()),
      fetch('/api/apotek').then((res) => res.json()),
      fetch('/api/sales').then((res) => res.json()),
      fetch('/api/pelanggan').then((res) => res.json()),
      fetch('/api/penjualan').then((res) => res.json()),
    ])
      .then(([produkRes, apotekRes, salesRes, pelangganRes, riwayatRes]) => {
        if (produkRes.success) setProdukList(produkRes.data);
        if (apotekRes.success) setApotekList(apotekRes.data);
        if (salesRes.success) setSalesList(salesRes.data);
        if (pelangganRes.success) setPelangganList(pelangganRes.data);
        if (riwayatRes.success) setRiwayat(riwayatRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchStokKonsinyasi = useCallback((id: string) => {
    if (!id) { setStokKonsinyasi([]); return; }
    setLoadingStok(true);
    fetch(`/api/konsinyasi/stok?apotekId=${id}`)
      .then((res) => res.json())
      .then((d) => { if (d.success) setStokKonsinyasi(d.data); })
      .catch(() => {})
      .finally(() => setLoadingStok(false));
  }, []);

  useEffect(() => {
    if (tipeTransaksi === 'KONSINYASI' && apotekId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchStokKonsinyasi(apotekId);
    } else {
      setStokKonsinyasi([]);
    }
  }, [tipeTransaksi, apotekId, fetchStokKonsinyasi]);

  const getStokTersedia = (produkId: string): number => {
    if (tipeTransaksi === 'LANGSUNG') {
      const produk = produkList.find((p) => p.id === produkId);
      return produk?.stokGudang ?? 0;
    }
    const stok = stokKonsinyasi.find((s) => s.produkId === produkId);
    return stok?.jumlah ?? 0;
  };

  const getHargaByTipe = (produk: Produk, tipe: string) => {
    const opt = tipeHargaOptions.find((o) => o.value === tipe);
    if (!opt) return 0;
    return ((produk as unknown as Record<string, number>)[opt.key]) || 0;
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'produkId' || field === 'tipeHarga') {
        const produk = produkList.find((p) => p.id === updated[index].produkId);
        if (produk) {
          updated[index].hargaSatuan = getHargaByTipe(produk, updated[index].tipeHarga);
        }
      }
      return updated;
    });
  };

  const addItem = () => {
    const defaultHarga = tipeTransaksi === 'KONSINYASI' ? 'Konsinyasi' : 'Member';
    setItems((prev) => [...prev, { produkId: '', jumlah: 1, tipeHarga: defaultHarga, hargaSatuan: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const getSubtotal = (item: ItemRow) => item.jumlah * item.hargaSatuan;
  const getGrandTotal = () => items.reduce((sum, item) => sum + getSubtotal(item), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    if (tipeTransaksi === 'KONSINYASI' && !apotekId) { setMessage({ type: 'error', text: 'Pilih apotek terlebih dahulu' }); setSubmitting(false); return; }
    if (tipeTransaksi === 'LANGSUNG' && !pelangganId) { setMessage({ type: 'error', text: 'Pilih pelanggan terlebih dahulu' }); setSubmitting(false); return; }
    if (!salesId) { setMessage({ type: 'error', text: 'Pilih sales terlebih dahulu' }); setSubmitting(false); return; }

    for (const item of items) {
      if (!item.produkId) { setMessage({ type: 'error', text: 'Semua baris harus memilih produk' }); setSubmitting(false); return; }
      const stok = getStokTersedia(item.produkId);
      if (item.jumlah > stok) {
        const produk = produkList.find((p) => p.id === item.produkId);
        setMessage({ type: 'error', text: `Stok ${produk?.nama || 'produk'} tidak mencukupi (tersedia: ${stok}, diminta: ${item.jumlah})` });
        setSubmitting(false); return;
      }
    }

    try {
      const payload = {
        tipe: tipeTransaksi, tanggal,
        apotekId: tipeTransaksi === 'KONSINYASI' ? apotekId : undefined,
        pelangganId: tipeTransaksi === 'LANGSUNG' ? pelangganId : undefined,
        salesId, metodeBayar,
        items: items.map((item) => ({ produkId: item.produkId, jumlah: item.jumlah, tipeHarga: item.tipeHarga, hargaSatuan: item.hargaSatuan, subtotal: getSubtotal(item) })),
        totalBayar: getGrandTotal(),
        jumlahBayar,
      };

      const res = await fetch('/api/penjualan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Penjualan berhasil disimpan!' });
        const defaultHarga = tipeTransaksi === 'KONSINYASI' ? 'Konsinyasi' : 'Member';
        setItems([{ produkId: '', jumlah: 1, tipeHarga: defaultHarga, hargaSatuan: 0 }]);
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menyimpan penjualan' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus penjualan ini? Stok akan dikembalikan.')) return;
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/penjualan', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.success) { setMessage({ type: 'success', text: 'Penjualan dihapus, stok dikembalikan' }); fetchData(); }
      else { setMessage({ type: 'error', text: data.message || 'Gagal menghapus' }); }
    } catch { setMessage({ type: 'error', text: 'Terjadi kesalahan' }); }
  };

  const openEdit = (item: PenjualanLog) => {
    setEditItem(item);
    setEditTipe(item.tipe);
    setEditApotekId(item.apotek?.nama ? apotekList.find((a) => a.nama === item.apotek!.nama)?.id || '' : '');
    setEditPelangganId(item.pelanggan?.nama ? pelangganList.find((p) => p.nama === item.pelanggan!.nama)?.id || '' : '');
    setEditSalesId(item.sales.nama ? salesList.find((s) => s.nama === item.sales.nama)?.id || '' : '');
    setEditMetodeBayar(item.metodeBayar);
    setEditJumlahBayar(0);
    setEditTanggal(item.tanggal.slice(0, 10));
    setEditItems(item.details.map((d) => ({ produkId: d.produkId, jumlah: d.jumlah, tipeHarga: d.tipeHarga, hargaSatuan: d.hargaSatuan })));
  };

  const updateEditItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setEditItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === 'produkId' || field === 'tipeHarga') {
        const produk = produkList.find((p) => p.id === updated[index].produkId);
        if (produk) { updated[index].hargaSatuan = getHargaByTipe(produk, updated[index].tipeHarga); }
      }
      return updated;
    });
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSavingEdit(true);
    setMessage({ type: '', text: '' });
    try {
      const payload = {
        id: editItem.id, tipe: editTipe, tanggal: editTanggal,
        apotekId: editTipe === 'KONSINYASI' ? editApotekId : undefined,
        pelangganId: editTipe === 'LANGSUNG' ? editPelangganId : undefined,
        salesId: editSalesId, metodeBayar: editMetodeBayar,
        items: editItems.map((item) => ({ produkId: item.produkId, jumlah: item.jumlah, tipeHarga: item.tipeHarga, hargaSatuan: item.hargaSatuan, subtotal: item.jumlah * item.hargaSatuan })),
        totalBayar: editItems.reduce((sum, item) => sum + item.jumlah * item.hargaSatuan, 0),
        jumlahBayar: editJumlahBayar,
      };
      const res = await fetch('/api/penjualan', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { setMessage({ type: 'success', text: 'Penjualan berhasil diupdate' }); setEditItem(null); fetchData(); }
      else { setMessage({ type: 'error', text: data.message || 'Gagal mengupdate' }); }
    } catch { setMessage({ type: 'error', text: 'Terjadi kesalahan' }); }
    finally { setSavingEdit(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Memuat data...</div></div>;
  }

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Penjualan</h1>

      {message.text && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 md:p-4 mb-3 md:mb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tanggal</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Tipe</label>
              <select value={tipeTransaksi} onChange={(e) => {
                const newTipe = e.target.value; setTipeTransaksi(newTipe); setApotekId(''); setPelangganId('');
                const defaultHarga = newTipe === 'KONSINYASI' ? 'Konsinyasi' : 'Member';
                setItems((prev) => prev.map((item) => ({ ...item, tipeHarga: defaultHarga, hargaSatuan: (() => { const p = produkList.find((pp) => pp.id === item.produkId); return p ? getHargaByTipe(p, defaultHarga) : 0; })() })));
              }} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="KONSINYASI">KONSINYASI</option>
                <option value="LANGSUNG">LANGSUNG</option>
              </select>
            </div>
            {tipeTransaksi === 'KONSINYASI' ? (
              <div><label className="block text-xs text-gray-400 mb-1">Apotek</label><SearchSelect options={apotekList.map((a) => ({ value: a.id, label: a.nama }))} value={apotekId} onChange={setApotekId} placeholder="Pilih" /></div>
            ) : (
              <div><label className="block text-xs text-gray-400 mb-1">Pelanggan</label><SearchSelect options={pelangganList.map((p) => ({ value: p.id, label: p.nama }))} value={pelangganId} onChange={setPelangganId} placeholder="Pilih" /></div>
            )}
            <div><label className="block text-xs text-gray-400 mb-1">Sales</label><SearchSelect options={salesList.map((s) => ({ value: s.id, label: s.nama }))} value={salesId} onChange={setSalesId} placeholder="Pilih" /></div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bayar</label>
              <select value={metodeBayar} onChange={(e) => { setMetodeBayar(e.target.value); setJumlahBayar(0); }} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="TUNAI">TUNAI</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>
          </div>
        </div>

        {tipeTransaksi === 'KONSINYASI' && apotekId && (
          <div className="bg-slate-900/50 rounded-lg border border-indigo-500/20 p-2 md:p-3 mb-3 md:mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-indigo-400 font-medium text-xs">Stok di Apotek</span>
              {loadingStok && <span className="text-xs text-gray-500">...</span>}
            </div>
            {stokKonsinyasi.length === 0 ? (
              <p className="text-xs text-gray-500">Belum ada stok</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stokKonsinyasi.map((stok) => {
                  const produk = produkList.find((p) => p.id === stok.produkId);
                  if (!produk) return null;
                  return (
                    <div key={stok.produkId} className={`px-2 py-1 rounded text-xs ${stok.jumlah <= 5 ? 'bg-red-500/10 text-red-400' : stok.jumlah <= 15 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                      <span className="truncate max-w-[100px] inline-block">{produk.nama}</span> <span className="font-semibold">{stok.jumlah}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 md:p-4 mb-3 md:mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Items</h2>
            <button type="button" onClick={addItem} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors">+ Tambah</button>
          </div>
          <div className="space-y-2">
            <div className="hidden md:grid grid-cols-12 gap-2 text-sm text-gray-400 font-medium px-1">
              <div className="col-span-3">Produk</div><div className="col-span-1">Stok</div><div className="col-span-1">Jumlah</div><div className="col-span-2">Tipe Harga</div><div className="col-span-2">Harga Satuan</div><div className="col-span-1 text-right">Subtotal</div><div className="col-span-1"></div>
            </div>
            {items.map((item, idx) => {
              const stok = getStokTersedia(item.produkId);
              const isOverStok = item.produkId && item.jumlah > stok;
              return (
                <div key={idx}>
                  <div className="hidden md:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3"><SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={item.produkId} onChange={(val) => updateItem(idx, 'produkId', val)} placeholder="Pilih Produk" /></div>
                    <div className="col-span-1 text-center">{item.produkId ? <span className={`text-sm font-semibold ${isOverStok ? 'text-red-400' : stok <= 5 ? 'text-yellow-400' : 'text-gray-300'}`}>{stok}</span> : <span className="text-sm text-gray-600">-</span>}</div>
                    <div className="col-span-1"><input type="number" value={item.jumlah} onChange={(e) => updateItem(idx, 'jumlah', Number(e.target.value))} className={`w-full px-2 py-2 bg-gray-800 border rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOverStok ? 'border-red-500/50' : 'border-gray-700'}`} min={1} required /></div>
                    <div className="col-span-2"><select value={item.tipeHarga} onChange={(e) => updateItem(idx, 'tipeHarga', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{tipeHargaOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.value}</option>))}</select></div>
                    <div className="col-span-2"><input type="number" value={item.hargaSatuan} onChange={(e) => updateItem(idx, 'hargaSatuan', Number(e.target.value))} className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" min={0} required /></div>
                    <div className="col-span-1 text-right text-gray-300 text-sm">Rp {getSubtotal(item).toLocaleString('id-ID')}</div>
                    <div className="col-span-1 text-center"><button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-sm">&#10005;</button></div>
                  </div>
                  <div className="md:hidden bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 space-y-2">
                    <div className="flex items-center justify-between"><span className="text-xs text-gray-400">Item #{idx + 1}</span><button type="button" onClick={() => removeItem(idx)} disabled={items.length <= 1} className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed text-xs">Hapus</button></div>
                    <SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={item.produkId} onChange={(val) => updateItem(idx, 'produkId', val)} placeholder="Pilih Produk" />
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-gray-400">Stok</label><div className={`text-sm font-semibold ${isOverStok ? 'text-red-400' : stok <= 5 ? 'text-yellow-400' : 'text-gray-300'}`}>{item.produkId ? stok : '-'}</div></div>
                      <div><label className="text-xs text-gray-400">Jumlah</label><input type="number" value={item.jumlah} onChange={(e) => updateItem(idx, 'jumlah', Number(e.target.value))} className={`w-full px-2 py-1.5 bg-gray-800 border rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isOverStok ? 'border-red-500/50' : 'border-gray-700'}`} min={1} required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-xs text-gray-400">Tipe Harga</label><select value={item.tipeHarga} onChange={(e) => updateItem(idx, 'tipeHarga', e.target.value)} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">{tipeHargaOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.value}</option>))}</select></div>
                      <div><label className="text-xs text-gray-400">Harga Satuan</label><input type="number" value={item.hargaSatuan} onChange={(e) => updateItem(idx, 'hargaSatuan', Number(e.target.value))} className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" min={0} required /></div>
                    </div>
                    <div className="text-right text-sm text-gray-300">Subtotal: <span className="font-semibold text-white">Rp {getSubtotal(item).toLocaleString('id-ID')}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-800">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div className="text-right md:text-right">
                <p className="text-gray-400 text-xs">Grand Total</p>
                <p className="text-xl md:text-2xl font-bold text-white">Rp {getGrandTotal().toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="mt-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Jumlah Dibayar Sekarang</label>
                  <input
                    type="number"
                    value={jumlahBayar}
                    onChange={(e) => setJumlahBayar(Math.max(0, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min={0}
                    placeholder="0 = belum bayar"
                  />
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-400 text-xs">Total: </span>
                    <span className="text-white font-medium">Rp {getGrandTotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs">Sisa: </span>
                    <span className={`font-medium ${getGrandTotal() - jumlahBayar > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      Rp {Math.max(0, getGrandTotal() - jumlahBayar).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getGrandTotal() - jumlahBayar > 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {getGrandTotal() - jumlahBayar > 0 ? 'ADA SISA PIUTANG' : 'LUNAS'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg text-sm font-medium transition-colors">
            {submitting ? 'Menyimpan...' : 'Simpan Penjualan'}
          </button>
        </div>
      </form>

      {/* Riwayat */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mt-8">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-base md:text-lg font-semibold text-white">Riwayat Penjualan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">No</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tanggal</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Tipe</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Sales</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Apotek/Pelanggan</th>
                <th className="px-4 py-3 text-right text-gray-400 font-medium">Total</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Bayar</th>
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Oleh</th>
                <th className="px-4 py-3 text-center text-gray-400 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {riwayat.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Tidak ada data</td></tr>
              ) : (
                riwayat.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-gray-800/50 hover:bg-gray-800/50 ${idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/30'}`}>
                    <td className="px-4 py-3 text-gray-300">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.tipe === 'KONSINYASI' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>{item.tipe}</span></td>
                    <td className="px-4 py-3 text-gray-300">{item.sales.nama}</td>
                    <td className="px-4 py-3 text-white text-xs">{item.tipe === 'KONSINYASI' ? (item.apotek?.nama || '-') : (item.pelanggan?.nama || '-')}</td>
                    <td className="px-4 py-3 text-gray-300 text-right">Rp {item.totalBayar.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${item.metodeBayar === 'TUNAI' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{item.metodeBayar}</span></td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{item.user.nama}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEdit(item)} className="text-indigo-400 hover:text-indigo-300 text-xs mr-2">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 text-xs">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)}>
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Edit Penjualan</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Tanggal</label><input type="date" value={editTanggal} onChange={(e) => setEditTanggal(e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Tipe</label><select value={editTipe} onChange={(e) => { setEditTipe(e.target.value); setEditApotekId(''); setEditPelangganId(''); }} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"><option value="KONSINYASI">KONSINYASI</option><option value="LANGSUNG">LANGSUNG</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {editTipe === 'KONSINYASI' ? (
                  <div><label className="block text-sm text-gray-400 mb-1">Apotek</label><SearchSelect options={apotekList.map((a) => ({ value: a.id, label: a.nama }))} value={editApotekId} onChange={setEditApotekId} placeholder="Pilih Apotek" /></div>
                ) : (
                  <div><label className="block text-sm text-gray-400 mb-1">Pelanggan</label><SearchSelect options={pelangganList.map((p) => ({ value: p.id, label: p.nama }))} value={editPelangganId} onChange={setEditPelangganId} placeholder="Pilih Pelanggan" /></div>
                )}
                <div><label className="block text-sm text-gray-400 mb-1">Sales</label><SearchSelect options={salesList.map((s) => ({ value: s.id, label: s.nama }))} value={editSalesId} onChange={setEditSalesId} placeholder="Pilih Sales" /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Metode Bayar</label><select value={editMetodeBayar} onChange={(e) => { setEditMetodeBayar(e.target.value); setEditJumlahBayar(0); }} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"><option value="TUNAI">TUNAI</option><option value="TRANSFER">TRANSFER</option></select></div>
              {editMetodeBayar && (
                <div><label className="block text-sm text-gray-400 mb-1">Jumlah Dibayar Sekarang</label>
                  <input type="number" value={editJumlahBayar} onChange={(e) => setEditJumlahBayar(Math.max(0, Number(e.target.value)))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100" min={0} />
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Total</span><span className="text-white">Rp {editItems.reduce((s, i) => s + i.jumlah * i.hargaSatuan, 0).toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Dibayar</span><span className="text-white">Rp {editJumlahBayar.toLocaleString('id-ID')}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-400">Sisa Piutang</span><span className={editItems.reduce((s, i) => s + i.jumlah * i.hargaSatuan, 0) - editJumlahBayar > 0 ? 'text-yellow-400' : 'text-green-400'}>Rp {Math.max(0, editItems.reduce((s, i) => s + i.jumlah * i.hargaSatuan, 0) - editJumlahBayar).toLocaleString('id-ID')}</span></div>
                  </div>
                </div>
              )}
              <div className="border-t border-gray-700 pt-3">
                <label className="block text-sm text-gray-400 mb-2">Items</label>
                {editItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center mb-2">
                    <div className="col-span-4"><SearchSelect options={produkList.map((p) => ({ value: p.id, label: p.nama }))} value={item.produkId} onChange={(val) => updateEditItem(idx, 'produkId', val)} placeholder="Produk" /></div>
                    <div className="col-span-2"><input type="number" value={item.jumlah} onChange={(e) => updateEditItem(idx, 'jumlah', Number(e.target.value))} className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm" min={1} /></div>
                    <div className="col-span-2"><select value={item.tipeHarga} onChange={(e) => updateEditItem(idx, 'tipeHarga', e.target.value)} className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm">{tipeHargaOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.value}</option>))}</select></div>
                    <div className="col-span-2"><input type="number" value={item.hargaSatuan} onChange={(e) => updateEditItem(idx, 'hargaSatuan', Number(e.target.value))} className="w-full px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm" min={0} /></div>
                    <div className="col-span-2 text-right text-sm text-gray-300">Rp {(item.jumlah * item.hargaSatuan).toLocaleString('id-ID')}</div>
                  </div>
                ))}
                <div className="text-right mt-2 text-white font-semibold">Total: Rp {editItems.reduce((s, i) => s + i.jumlah * i.hargaSatuan, 0).toLocaleString('id-ID')}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm">Batal</button>
              <button onClick={handleEdit} disabled={savingEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg text-sm">{savingEdit ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
