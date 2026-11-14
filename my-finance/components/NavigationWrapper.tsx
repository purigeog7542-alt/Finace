'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  Settings,
  Plus,
} from 'lucide-react';
import AddTransactionModal from './AddTransactionModal';

const navItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'รายการ', href: '/transactions', icon: ArrowLeftRight },
  { name: 'บัญชี', href: '/accounts', icon: Wallet },
  { name: 'งบประมาณ', href: '/budgets', icon: PieChart },
  { name: 'เป้าหมาย', href: '/goals', icon: Target },
  { name: 'ตั้งค่า', href: '/settings', icon: Settings },
];

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTransactionSuccess = () => {
    window.dispatchEvent(new Event('finance-data-updated'));
  };

  return (
    <>
      {/* Desktop & iPad Landscape Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#161822] border-r border-gray-800/80 p-5 shrink-0 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-gray-950 font-black text-lg">
            ฿
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide text-white">MY FINANCE</h1>
            <p className="text-xs text-emerald-400">Cloud Personal Ledger</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mb-6 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/10"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>เพิ่มรายการ</span>
        </button>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">{children}</div>
      </main>

      {/* Mobile & Tablet Portrait Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#161822]/95 backdrop-blur-md border-t border-gray-800 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                  isActive ? 'text-emerald-400' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px]">{item.name}</span>
              </Link>
            );
          })}

          {/* Center Floating Add Button (+) */}
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="เพิ่มรายการ"
            className="w-12 h-12 -mt-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition active:scale-95"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                  isActive ? 'text-emerald-400' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px]">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />
    </>
  );
}
