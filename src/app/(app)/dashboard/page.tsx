'use client';

import { useEffect, useState } from 'react';

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
    { label: 'Total Produk', value: stats?.totalProduk ?? 0, icon: '💊', color: 'indigo' },
    { label: 'Total Apotek', value: stats?.totalApotek ?? 0, icon: '🏪', color: 'purple' },
    { label: 'Total Sales', value: stats?.totalSales ?? 0, icon: '👤', color: 'cyan' },
    { label: 'Penjualan Hari Ini', value: stats?.penjualanHariIni ?? 0, icon: '💰', color: 'green' },
    { label: 'Piutang Belum Lunas', value: stats?.totalPiutangBelumLunas ?? 0, icon: '📄', color: 'yellow', isCurrency: true },
    { label: 'Stok Menipis', value: stats?.stokMenipis ?? 0, icon: '⚠️', color: 'red' },
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
              <span className="text-3xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
