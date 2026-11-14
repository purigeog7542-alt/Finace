'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { Category } from '@/types/finance';

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('created_at');
    if (data) setCategories(data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !name) return;

    await supabase.from('categories').insert([
      {
        user_id: user.id,
        name,
        type,
      },
    ]);
    setName('');
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">ตั้งค่าหมวดหมู่รายรับ - รายจ่าย</h1>

      <form
        onSubmit={handleAddCategory}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'income' | 'expense')}
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        >
          <option value="expense">หมวดรายจ่าย</option>
          <option value="income">หมวดรายรับ</option>
        </select>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อหมวดหมู่ (เช่น เงินเดือน, ร้านกาแฟ, ค่าน้ำมัน)"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl py-2.5 text-sm"
        >
          เพิ่มหมวดหมู่
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161822] border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-emerald-400 mb-3">หมวดรายรับ</h3>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.type === 'income')
              .map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300"
                >
                  {c.name}
                </span>
              ))}
          </div>
        </div>

        <div className="bg-[#161822] border border-gray-800 rounded-2xl p-5">
          <h3 className="font-bold text-rose-400 mb-3">หมวดรายจ่าย</h3>
          <div className="flex flex-wrap gap-2">
            {categories
              .filter((c) => c.type === 'expense')
              .map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-300"
                >
                  {c.name}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
