'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
];

const masterItems = [
  { label: 'Produk', href: '/master/produk', icon: '💊' },
  { label: 'Sales', href: '/master/sales', icon: '👤' },
  { label: 'Apotek', href: '/master/apotek', icon: '🏪' },
  { label: 'Pelanggan', href: '/master/pelanggan', icon: '👥' },
];

const gudangItems = [
  { label: 'Stok Gudang', href: '/gudang/stok', icon: '📦' },
  { label: 'Barang Masuk', href: '/gudang/barang-masuk', icon: '📥' },
];

const konsinyasiItems = [
  { label: 'Kirim Konsinyasi', href: '/konsinyasi/kirim', icon: '🚚' },
  { label: 'Stok Konsinyasi', href: '/konsinyasi/stok', icon: '📋' },
];

const laporanItems = [
  { label: 'Penjualan', href: '/laporan/penjualan', icon: '💰' },
  { label: 'Margin', href: '/laporan/margin', icon: '📈' },
  { label: 'Perputaran', href: '/laporan/perputaran', icon: '🔄' },
  { label: 'Pareto', href: '/laporan/pareto', icon: '📊' },
];

function SubMenu({ label, icon, items, pathname, openKey, toggleKey }: {
  label: string;
  icon: string;
  items: { label: string; href: string; icon: string }[];
  pathname: string;
  openKey: string;
  toggleKey: () => void;
}) {
  const isOpen = openKey !== '';
  const isActive = items.some((item) => pathname === item.href);

  return (
    <div>
      <button
        onClick={toggleKey}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-400'
            : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
        }`}
      >
        <span className="flex items-center gap-2">
          <span>{icon}</span>
          <span>{label}</span>
        </span>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>
      {isOpen && (
        <div className="ml-4 mt-1 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<Record<string, string>>({
    master: 'master',
    gudang: '',
    konsinyasi: '',
    laporan: '',
  });

  const toggle = (key: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: prev[key] ? '' : key,
    }));
  };

  // Close on route change (mobile)
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const navContent = (
    <>
      <div className="p-4 border-b border-slate-700/50">
        <h1 className="text-lg font-bold text-white">
          💊 DistroFarmasi
        </h1>
        <p className="text-xs text-gray-500 mt-1">Sistem Distribusi Farmasi</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-indigo-600/20 text-indigo-400'
                : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        <SubMenu
          label="Master Data"
          icon="📁"
          items={masterItems}
          pathname={pathname}
          openKey={openMenus.master}
          toggleKey={() => toggle('master')}
        />

        <SubMenu
          label="Gudang"
          icon="🏭"
          items={gudangItems}
          pathname={pathname}
          openKey={openMenus.gudang}
          toggleKey={() => toggle('gudang')}
        />

        <SubMenu
          label="Konsinyasi"
          icon="📋"
          items={konsinyasiItems}
          pathname={pathname}
          openKey={openMenus.konsinyasi}
          toggleKey={() => toggle('konsinyasi')}
        />

        <Link
          href="/retur"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/retur'
              ? 'bg-indigo-600/20 text-indigo-400'
              : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
          }`}
        >
          <span>↩️</span>
          <span>Retur</span>
        </Link>

        <Link
          href="/opname"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/opname'
              ? 'bg-indigo-600/20 text-indigo-400'
              : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
          }`}
        >
          <span>🔍</span>
          <span>Opname</span>
        </Link>

        <Link
          href="/penjualan"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/penjualan'
              ? 'bg-indigo-600/20 text-indigo-400'
              : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
          }`}
        >
          <span>💰</span>
          <span>Penjualan</span>
        </Link>

        <Link
          href="/piutang"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/piutang'
              ? 'bg-indigo-600/20 text-indigo-400'
              : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'
          }`}
        >
          <span>📄</span>
          <span>Piutang & Cicilan</span>
        </Link>

        <SubMenu
          label="Laporan"
          icon="📊"
          items={laporanItems}
          pathname={pathname}
          openKey={openMenus.laporan}
          toggleKey={() => toggle('laporan')}
        />

        <div className="pt-4 mt-4 border-t border-slate-700/50">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-700/50 flex-col min-h-screen shrink-0">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-700/50 flex flex-col z-50 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h1 className="text-lg font-bold text-white">💊 DistroFarmasi</h1>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </Link>
              ))}
              <SubMenu label="Master Data" icon="📁" items={masterItems} pathname={pathname} openKey={openMenus.master} toggleKey={() => toggle('master')} />
              <SubMenu label="Gudang" icon="🏭" items={gudangItems} pathname={pathname} openKey={openMenus.gudang} toggleKey={() => toggle('gudang')} />
              <SubMenu label="Konsinyasi" icon="📋" items={konsinyasiItems} pathname={pathname} openKey={openMenus.konsinyasi} toggleKey={() => toggle('konsinyasi')} />
              <Link href="/retur" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/retur' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                <span>↩️</span><span>Retur</span>
              </Link>
              <Link href="/opname" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/opname' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                <span>🔍</span><span>Opname</span>
              </Link>
              <Link href="/penjualan" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/penjualan' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                <span>💰</span><span>Penjualan</span>
              </Link>
              <Link href="/piutang" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/piutang' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                <span>📄</span><span>Piutang & Cicilan</span>
              </Link>
              <SubMenu label="Laporan" icon="📊" items={laporanItems} pathname={pathname} openKey={openMenus.laporan} toggleKey={() => toggle('laporan')} />
              <div className="pt-4 mt-4 border-t border-slate-700/50">
                <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors">
                  <span>🚪</span><span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
