'use client';

import { useEffect, useState } from 'react';

const DIcons: Record<string, (c?: string) => JSX.Element> = {
  cube: (c = 'currentColor') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  store: (c = 'currentColor') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M9 21V13h6v8"/></svg>,
  user: (c = 'currentColor') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  dollar: (c = 'currentColor') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  fileText: (c = 'currentColor') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  alert: (c = 'currentColor') => <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

interface DashboardStats {
  totalProduk: number;
  totalApotek: number;
  totalSales: number;
  totalPenjualan: number;
  totalPiutangBelumLunas: number;
  penjualanHariIni: number;
  stokMenipis: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Memuat data...</div>
      </div>
    );
  }

  const cards = [
    { label: 'Total Produk', value: stats?.totalProduk ?? 0, icon: 'cube', color: 'indigo' },
    { label: 'Total Apotek', value: stats?.totalApotek ?? 0, icon: 'store', color: 'purple' },
    { label: 'Total Sales', value: stats?.totalSales ?? 0, icon: 'user', color: 'cyan' },
    { label: 'Penjualan Hari Ini', value: stats?.penjualanHariIni ?? 0, icon: 'dollar', color: 'green' },
    { label: 'Piutang Belum Lunas', value: stats?.totalPiutangBelumLunas ?? 0, icon: 'fileText', color: 'yellow', isCurrency: true },
    { label: 'Stok Menipis', value: stats?.stokMenipis ?? 0, icon: 'alert', color: 'red' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/30',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/30',
    green: 'from-green-600/20 to-green-600/5 border-green-500/30',
    yellow: 'from-yellow-600/20 to-yellow-600/5 border-yellow-500/30',
    red: 'from-red-600/20 to-red-600/5 border-red-500/30',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-6 transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {card.isCurrency
                    ? `Rp ${card.value.toLocaleString('id-ID')}`
                    : card.value.toLocaleString('id-ID')}
                </p>
              </div>
              <span className="opacity-60">{DIcons[card.icon]?.('currentColor')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
