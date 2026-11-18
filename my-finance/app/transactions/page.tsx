'use client';

import React, { useEffect, useState } from 'react';
import { Search, Trash2, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { Transaction } from '@/types/finance';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name), accounts(name)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error.message);
    } else if (data) {
      setTransactions(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchTransactions();
    window.addEventListener('finance-data-updated', fetchTransactions);
    return () => window.removeEventListener('finance-data-updated', fetchTransactions);
  }, []);

  const handleDelete = async (tx: Transaction) => {
    if (!confirm('ต้องการลบรายการนี้ใช่หรือไม่? (ยอดเงินในบัญชีจะถูกปรับคืนอัตโนมัติ)')) return;

    setDeletingId(tx.id);

    // 1. คืนยอดเงินเข้า/ออกจากบัญชีที่ผูกกับรายการนี้ (ถ้ามี account_id)
    if (tx.account_id) {
      const { data: accData } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', tx.account_id)
        .single();

      if (accData) {
        const currentBalance = Number(accData.balance);
        const txAmount = Number(tx.amount);
        // ลบรายจ่าย = บวกเงินคืน | ลบรายรับ = หักเงินออก
        const revertedBalance =
          tx.type === 'expense' ? currentBalance + txAmount : currentBalance - txAmount;

        await supabase
          .from('accounts')
          .update({ balance: Number(revertedBalance.toFixed(2)) })
          .eq('id', tx.account_id);
      }
    }

    // 2. ลบรายการออกจากตาราง transactions
    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);

    setDeletingId(null);

    if (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    } else {
      window.dispatchEvent(new Event('finance-data-updated'));
      fetchTransactions();
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesSearch =
      (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.categories?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.accounts?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // สรุปยอดรวมของรายการที่แสดงผลอยู่
  const filteredTotal = filtered.reduce((sum, t) => {
    return t.type === 'income' ? sum + Number(t.amount) : sum - Number(t.amount);
  }, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">ประวัติรายการทั้งหมด</h1>
          <p className="text-sm text-gray-400">แสดง {filtered.length} รายการ</p>
        </div>
        <div className="text-sm bg-[#161822] border border-gray-800 px-4 py-2 rounded-xl">
          <span className="text-gray-400 mr-2">ยอดสุทธิที่แสดง:</span>
          <span className={`font-bold ${filteredTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {filteredTotal >= 0 ? '+' : ''}฿{filteredTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ช่องค้นหาและตัวกรองประเภท */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหารายละเอียด, หมวดหมู่ หรือบัญชี..."
            className="w-full bg-[#161822] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
        <div className="flex bg-[#161822] p-1 rounded-xl border border-gray-800">
          {(['all', 'income', 'expense'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                typeFilter === t ? 'bg-emerald-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'ทั้งหมด' : t === 'income' ? 'รายรับ' : 'รายจ่าย'}
            </button>
          ))}
        </div>
      </div>

      {/* รายการธุรกรรม */}
      {fetching ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดรายการ...
        </div>
      ) : (
        <div className="bg-[#161822] border border-gray-800/80 rounded-2xl divide-y divide-gray-800/80 shadow-xl overflow-hidden">
          {filtered.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    tx.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {tx.categories?.name || 'ไม่ระบุหมวดหมู่'}
                    {tx.description && (
                      <span className="text-gray-400 font-normal ml-2">({tx.description})</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tx.accounts?.name || 'ไม่ระบุบัญชี'} • {formatDate(tx.transaction_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`font-bold text-sm whitespace-nowrap ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}฿
                  {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <button
                  onClick={() => handleDelete(tx)}
                  disabled={deletingId === tx.id}
                  className="text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition cursor-pointer disabled:opacity-50"
                  title="ลบรายการ"
                >
                  {deletingId === tx.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-gray-500">ไม่พบรายการที่ค้นหา</div>
          )}
        </div>
      )}
    </div>
  );
}