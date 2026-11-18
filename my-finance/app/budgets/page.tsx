'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Budget, Category, Transaction } from '@/types/finance';
import { Plus, Trash2, Loader2, PieChart } from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // สร้างช่วงวันที่ของเดือนปัจจุบัน (YYYY-MM-DD) สำหรับกรองรายจ่ายเฉพาะเดือนนี้
  const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
  const lastDay = new Date(currentYear, currentMonth, 0).getDate();
  const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const loadData = async () => {
    setFetching(true);
    const [{ data: bData }, { data: cData }, { data: tData }] = await Promise.all([
      supabase
        .from('budgets')
        .select('*, categories(name, color)')
        .eq('budget_month', currentMonth)
        .eq('budget_year', currentYear),
      supabase.from('categories').select('*').eq('type', 'expense'),
      supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense')
        .gte('transaction_date', startOfMonth) // หากใน DB ใช้ชื่อคอลัมน์ date ให้เปลี่ยนเป็น 'date'
        .lte('transaction_date', endOfMonth),
    ]);

    if (bData) setBudgets(bData);
    if (cData) setCategories(cData);
    if (tData) setTransactions(tData);
    setFetching(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !limit) return;

    setLoading(true);

    // ตรวจสอบว่าหมวดหมู่นี้มีงบในเดือนนี้แล้วหรือยัง
    const existingBudget = budgets.find((b) => b.category_id === categoryId);

    let error;
    if (existingBudget) {
      // อัปเดตวงเงินเดิม
      const res = await supabase
        .from('budgets')
        .update({ amount_limit: Number(parseFloat(limit).toFixed(2)) })
        .eq('id', existingBudget.id);
      error = res.error;
    } else {
      // เพิ่มงบประมาณใหม่ (ตัด user_id ออกให้สอดคล้องกับหน้า Accounts)
      const res = await supabase.from('budgets').insert([
        {
          category_id: categoryId,
          budget_month: currentMonth,
          budget_year: currentYear,
          amount_limit: Number(parseFloat(limit).toFixed(2)),
        },
      ]);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      console.error('Error saving budget:', error.message);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setCategoryId('');
      setLimit('');
      loadData();
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('ต้องการลบงบประมาณหมวดนี้ใช่หรือไม่?')) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    } else {
      loadData();
    }
  };

  // คำนวณภาพรวมงบประมาณทั้งหมดของเดือนนี้
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount_limit), 0);
  const totalSpentInBudgets = budgets.reduce((sum, b) => {
    const spent = transactions
      .filter((t) => t.category_id === b.category_id)
      .reduce((s, t) => s + Number(t.amount), 0);
    return sum + spent;
  }, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">งบประมาณรายเดือน</h1>
          <p className="text-sm text-gray-400">
            ประจำเดือน {currentMonth}/{currentYear}
          </p>
        </div>

        {/* การ์ดสรุปภาพรวมงบประมาณ */}
        <div className="bg-[#161822] border border-gray-800 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">ใช้ไป / งบรวมทั้งเดือน</p>
            <p className="text-base font-bold text-white">
              <span className="text-emerald-400">฿{totalSpentInBudgets.toLocaleString()}</span> / ฿{totalBudget.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ฟอร์มเพิ่ม / อัปเดตงบประมาณ */}
      <form
        onSubmit={handleAddBudget}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end shadow-xl"
      >
        <div>
          <label className="block text-xs text-gray-400 mb-1">หมวดหมู่ค่าใช้จ่าย</label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">เลือกหมวดค่าใช้จ่าย</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">วงเงินงบประมาณ (บาท)</label>
          <input
            type="number"
            step="0.01"
            required
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl py-3 px-4 text-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'กำลังบันทึก...' : 'บันทึกงบประมาณ'}
        </button>
      </form>

      {/* รายการงบประมาณแต่ละหมวด */}
      {fetching ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-[#161822] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
          ยังไม่มีการตั้งงบประมาณสำหรับเดือนนี้
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const spent = transactions
              .filter((t) => t.category_id === b.category_id)
              .reduce((s, t) => s + Number(t.amount), 0);
            const rawPct = Math.round((spent / Number(b.amount_limit)) * 100);
            const barPct = Math.min(100, rawPct);
            const remaining = Number(b.amount_limit) - spent;

            return (
              <div key={b.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-white text-base">{b.categories?.name || 'ไม่ระบุหมวดหมู่'}</span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {remaining >= 0
                        ? `คงเหลือ ฿${remaining.toLocaleString()}`
                        : `เกินงบ ฿${Math.abs(remaining).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-300">
                      ฿{spent.toLocaleString()} / ฿{Number(b.amount_limit).toLocaleString()} ({rawPct}%)
                    </span>
                    <button
                      onClick={() => handleDeleteBudget(b.id)}
                      className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                      title="ลบงบประมาณ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden mt-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      rawPct >= 100 ? 'bg-rose-500' : rawPct >= 75 ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}