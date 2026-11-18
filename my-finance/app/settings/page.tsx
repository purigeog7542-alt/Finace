'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Category } from '@/types/finance';
import { Plus, X, Loader2, Sparkles, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const loadCategories = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error.message);
    } else if (data) {
      setCategories(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // ป้องกันการเพิ่มชื่อหมวดหมู่ซ้ำในประเภทเดียวกัน
    const isDuplicate = categories.some(
      (c) => c.type === type && c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (isDuplicate) {
      alert('มีหมวดหมู่นี้อยู่แล้วครับ');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('categories').insert([
      {
        name: name.trim(),
        type,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error('Error inserting category:', error.message);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setName('');
      loadCategories();
    }
  };

  const handleDeleteCategory = async (id: string, catName: string) => {
    if (!confirm(`ต้องการลบหมวดหมู่ "${catName}" ใช่หรือไม่?`)) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      alert('ไม่สามารถลบได้ (หมวดหมู่นี้อาจถูกใช้งานอยู่ในรายการหรือตั้งงบประมาณไว้แล้ว): ' + error.message);
    } else {
      loadCategories();
    }
  };

  // สร้างหมวดหมู่พื้นฐานอัตโนมัติ (กรณีเริ่มต้นใช้งาน)
  const handleSeedDefaults = async () => {
    setLoading(true);
    const defaults = [
      { name: 'เงินเดือน', type: 'income' },
      { name: 'รายได้เสริม', type: 'income' },
      { name: 'อาหารและเครื่องดื่ม', type: 'expense' },
      { name: 'ค่าน้ำมัน / เดินทาง', type: 'expense' },
      { name: 'ของใช้ส่วนตัว', type: 'expense' },
      { name: 'ค่าโทรศัพท์ / อินเทอร์เน็ต', type: 'expense' },
    ];

    const { error } = await supabase.from('categories').insert(defaults);
    setLoading(false);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      loadCategories();
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">ตั้งค่าหมวดหมู่รายรับ - รายจ่าย</h1>
          <p className="text-sm text-gray-400">จัดการหมวดหมู่สำหรับบันทึกรายการและตั้งงบประมาณ</p>
        </div>

        {categories.length === 0 && !fetching && (
          <button
            onClick={handleSeedDefaults}
            disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> สร้างหมวดหมู่เริ่มต้นอัตโนมัติ
          </button>
        )}
      </div>

      {/* ฟอร์มเพิ่มหมวดหมู่ */}
      <form
        onSubmit={handleAddCategory}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end shadow-xl"
      >
        <div>
          <label className="block text-xs text-gray-400 mb-1">ประเภท</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'income' | 'expense')}
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="expense">หมวดรายจ่าย</option>
            <option value="income">หมวดรายรับ</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">ชื่อหมวดหมู่</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น เงินเดือน, ร้านกาแฟ, ค่าน้ำมัน"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl py-3 px-4 text-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'กำลังเพิ่ม...' : 'เพิ่มหมวดหมู่'}
        </button>
      </form>

      {/* รายการหมวดหมู่แยกตามประเภท */}
      {fetching ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดหมวดหมู่...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* กล่องหมวดรายรับ */}
          <div className="bg-[#161822] border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4" /> หมวดรายรับ
              </h3>
              <span className="text-xs text-gray-500">{incomeCategories.length} หมวด</span>
            </div>

            {incomeCategories.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">ยังไม่มีหมวดรายรับ</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {incomeCategories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300"
                  >
                    {c.name}
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="text-emerald-400/60 hover:text-rose-400 transition cursor-pointer"
                      title="ลบหมวดหมู่"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* กล่องหมวดรายจ่าย */}
          <div className="bg-[#161822] border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-rose-400 flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4" /> หมวดรายจ่าย
              </h3>
              <span className="text-xs text-gray-500">{expenseCategories.length} หมวด</span>
            </div>

            {expenseCategories.length === 0 ? (
              <p className="text-xs text-gray-500 py-4 text-center">ยังไม่มีหมวดรายจ่าย</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300"
                  >
                    {c.name}
                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="text-rose-400/60 hover:text-rose-300 transition cursor-pointer"
                      title="ลบหมวดหมู่"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}