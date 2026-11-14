'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Budget, Category, Transaction } from '@/types/finance';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const loadData = async () => {
    const [{ data: bData }, { data: cData }, { data: tData }] = await Promise.all([
      supabase
        .from('budgets')
        .select('*, categories(name, color)')
        .eq('budget_month', currentMonth)
        .eq('budget_year', currentYear),
      supabase.from('categories').select('*').eq('type', 'expense'),
      supabase.from('transactions').select('*').eq('type', 'expense'),
    ]);
    if (bData) setBudgets(bData);
    if (cData) setCategories(cData);
    if (tData) setTransactions(tData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !categoryId || !limit) return;

    await supabase.from('budgets').insert([
      {
        user_id: user.id,
        category_id: categoryId,
        budget_month: currentMonth,
        budget_year: currentYear,
        amount_limit: parseFloat(limit),
      },
    ]);
    setLimit('');
    loadData();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">งบประมาณรายเดือน</h1>

      <form
        onSubmit={handleAddBudget}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        >
          <option value="">เลือกหมวดค่าใช้จ่าย</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          required
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          placeholder="วงเงินงบประมาณ (บาท)"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl py-2.5 text-sm"
        >
          บันทึกงบประมาณ
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const spent = transactions
            .filter((t) => t.category_id === b.category_id)
            .reduce((s, t) => s + Number(t.amount), 0);
          const pct = Math.min(100, Math.round((spent / Number(b.amount_limit)) * 100));

          return (
            <div key={b.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-white">{b.categories?.name}</span>
                <span className="text-gray-400">
                  ฿{spent.toLocaleString()} / ฿{Number(b.amount_limit).toLocaleString()} ({pct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
