'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { Account } from '@/types/finance';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const loadAccounts = async () => {
    const { data } = await supabase.from('accounts').select('*').order('created_at');
    if (data) setAccounts(data);
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !name) return;

    await supabase.from('accounts').insert([
      {
        user_id: user.id,
        name,
        opening_balance: parseFloat(openingBalance) || 0,
      },
    ]);
    setName('');
    setOpeningBalance('');
    loadAccounts();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">จัดการบัญชีเงิน</h1>

      <form
        onSubmit={handleAddAccount}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อบัญชี (เช่น กรุงไทย, เงินสด)"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <input
          type="number"
          step="0.01"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          placeholder="ยอดเงินตั้งต้น (บาท)"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl py-2.5 flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> เพิ่มบัญชี
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white">{acc.name}</h3>
            </div>
            <p className="text-xs text-gray-400">ยอดตั้งต้น</p>
            <p className="text-xl font-bold text-white">
              ฿{Number(acc.opening_balance).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
