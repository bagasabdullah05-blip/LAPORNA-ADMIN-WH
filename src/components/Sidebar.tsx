'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeContext';

const I = {
  grid: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  cube: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  user: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  store: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-4h16l1 4"/><path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9"/><path d="M9 21V13h6v8"/><path d="M3 9c0 1.1.9 2 2 2s2-.9 2-2"/><path d="M7 9c0 1.1.9 2 2 2s2-.9 2-2"/><path d="M11 9c0 1.1.9 2 2 2s2-.9 2-2"/><path d="M15 9c0 1.1.9 2 2 2s2-.9 2-2"/></svg>,
  users: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  archive: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>,
  download: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  truck: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  clipboard: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  dollar: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  trending: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  refresh: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  barChart: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  rotateCcw: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  checkCircle: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  fileText: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  sun: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  logOut: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  folder: (c = 'currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  chevron: (c = 'currentColor') => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
];

const masterItems = [
  { label: 'Produk', href: '/master/produk', icon: 'cube' },
  { label: 'Sales', href: '/master/sales', icon: 'user' },
  { label: 'Apotek', href: '/master/apotek', icon: 'store' },
  { label: 'Pelanggan', href: '/master/pelanggan', icon: 'users' },
];

const gudangItems = [
  { label: 'Stok Gudang', href: '/gudang/stok', icon: 'archive' },
  { label: 'Barang Masuk', href: '/gudang/barang-masuk', icon: 'download' },
];

const konsinyasiItems = [
  { label: 'Kirim Konsinyasi', href: '/konsinyasi/kirim', icon: 'truck' },
  { label: 'Stok Konsinyasi', href: '/konsinyasi/stok', icon: 'clipboard' },
];

const laporanItems = [
  { label: 'Penjualan', href: '/laporan/penjualan', icon: 'dollar' },
  { label: 'Margin', href: '/laporan/margin', icon: 'trending' },
  { label: 'Perputaran', href: '/laporan/perputaran', icon: 'refresh' },
  { label: 'Pareto Produk', href: '/laporan/pareto', icon: 'barChart' },
  { label: 'Pareto Pelanggan', href: '/laporan/pareto/pelanggan', icon: 'barChart' },
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
          {I[icon as keyof typeof I]()}
          <span>{label}</span>
        </span>
        <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>
          {I.chevron()}
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
              {I[item.icon as keyof typeof I]()}
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
  const { theme, toggleTheme } = useTheme();
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

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const navContent = (
    <>
      <div className="p-4 border-b border-slate-700/50">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Sistem WareHouse CBM
        </h1>
        <p className="text-xs text-gray-500 mt-1">Warehouse Management System</p>
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
            {I[item.icon as keyof typeof I]()}
            <span>{item.label}</span>
          </Link>
        ))}

        <SubMenu
          label="Master Data"
          icon="folder"
          items={masterItems}
          pathname={pathname}
          openKey={openMenus.master}
          toggleKey={() => toggle('master')}
        />

        <SubMenu
          label="Gudang"
          icon="archive"
          items={gudangItems}
          pathname={pathname}
          openKey={openMenus.gudang}
          toggleKey={() => toggle('gudang')}
        />

        <SubMenu
          label="Konsinyasi"
          icon="clipboard"
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
          {I.rotateCcw()}
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
          {I.checkCircle()}
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
          {I.dollar()}
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
          {I.fileText()}
          <span>Piutang & Cicilan</span>
        </Link>

        <SubMenu
          label="Laporan"
          icon="barChart"
          items={laporanItems}
          pathname={pathname}
          openKey={openMenus.laporan}
          toggleKey={() => toggle('laporan')}
        />

        <div className="pt-4 mt-4 border-t border-slate-700/50 space-y-1">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-slate-800 hover:text-gray-200 transition-colors"
          >
            {theme === 'dark' ? I.sun() : I.moon()}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/');
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
          >
            {I.logOut()}
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-700/50 flex-col min-h-screen shrink-0 transition-colors duration-200">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-700/50 flex flex-col z-50 overflow-y-auto transition-colors duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h1 className="text-lg font-bold text-white tracking-tight">Sistem WareHouse CBM</h1>
              <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                  {I[item.icon as keyof typeof I]()}<span>{item.label}</span>
                </Link>
              ))}
              <SubMenu label="Master Data" icon="folder" items={masterItems} pathname={pathname} openKey={openMenus.master} toggleKey={() => toggle('master')} />
              <SubMenu label="Gudang" icon="archive" items={gudangItems} pathname={pathname} openKey={openMenus.gudang} toggleKey={() => toggle('gudang')} />
              <SubMenu label="Konsinyasi" icon="clipboard" items={konsinyasiItems} pathname={pathname} openKey={openMenus.konsinyasi} toggleKey={() => toggle('konsinyasi')} />
              <Link href="/retur" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/retur' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                {I.rotateCcw()}<span>Retur</span>
              </Link>
              <Link href="/opname" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/opname' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                {I.checkCircle()}<span>Opname</span>
              </Link>
              <Link href="/penjualan" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/penjualan' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                {I.dollar()}<span>Penjualan</span>
              </Link>
              <Link href="/piutang" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${pathname === '/piutang' ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-slate-800 hover:text-gray-200'}`}>
                {I.fileText()}<span>Piutang & Cicilan</span>
              </Link>
              <SubMenu label="Laporan" icon="barChart" items={laporanItems} pathname={pathname} openKey={openMenus.laporan} toggleKey={() => toggle('laporan')} />
              <div className="pt-4 mt-4 border-t border-slate-700/50 space-y-1">
                <button onClick={toggleTheme} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-slate-800 hover:text-gray-200 transition-colors">
                  {theme === 'dark' ? I.sun() : I.moon()}<span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors">
                  {I.logOut()}<span>Logout</span>
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
