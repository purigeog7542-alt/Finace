'use client';

import React, { useEffect, useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { Transaction } from '@/types/finance';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*, categories(name), accounts(name)')
      .order('transaction_date', { ascending: false });
    if (data) setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
    window.addEventListener('finance-data-updated', fetchTransactions);
    return () => window.removeEventListener('finance-data-updated', fetchTransactions);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return;
    await supabase.from('transactions').delete().eq('id', id);
    fetchTransactions();
  };

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesSearch =
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.categories?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">ประวัติรายการทั้งหมด</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารายละเอียดหรือหมวดหมู่..."
            className="w-full bg-[#161822] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex bg-[#161822] p-1 rounded-xl border border-gray-800">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium capitalize ${
                typeFilter === t ? 'bg-emerald-500 text-gray-950 font-bold' : 'text-gray-400'
              }`}
            >
              {t === 'all' ? 'ทั้งหมด' : t === 'income' ? 'รายรับ' : 'รายจ่าย'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#161822] border border-gray-800/80 rounded-2xl divide-y divide-gray-800/80">
        {filtered.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-white text-sm">
                {tx.categories?.name || 'ไม่ระบุหมวดหมู่'}
              </p>
              <p className="text-xs text-gray-400">
                {tx.description || '-'} • {tx.accounts?.name} • {tx.transaction_date}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`font-bold text-sm ${
                  tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {tx.type === 'income' ? '+' : '-'}฿{Number(tx.amount).toLocaleString()}
              </span>
              <button
                onClick={() => handleDelete(tx.id)}
                className="text-gray-500 hover:text-rose-400 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">ไม่พบรายการที่ค้นหา</div>
        )}
      </div>
    </div>
  );
}
