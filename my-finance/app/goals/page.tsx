'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { SavingsGoal } from '@/types/finance';

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [goalName, setGoalName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');

  const loadGoals = async () => {
    const { data } = await supabase.from('savings_goals').select('*').order('created_at');
    if (data) setGoals(data);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !goalName || !target) return;

    await supabase.from('savings_goals').insert([
      {
        user_id: user.id,
        goal_name: goalName,
        target_amount: parseFloat(target),
        current_amount: parseFloat(current) || 0,
      },
    ]);
    setGoalName('');
    setTarget('');
    setCurrent('');
    loadGoals();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">เป้าหมายการออม</h1>

      <form
        onSubmit={handleAddGoal}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <input
          type="text"
          required
          value={goalName}
          onChange={(e) => setGoalName(e.target.value)}
          placeholder="ชื่อเป้าหมาย (เช่น เงินสำรองฉุกเฉิน)"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <input
          type="number"
          required
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="ยอดเป้าหมาย (บาท)"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <input
          type="number"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="ยอดสะสมปัจจุบัน"
          className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
        />
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl py-2.5 text-sm"
        >
          สร้างเป้าหมาย
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = Math.min(
            100,
            Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
          );
          return (
            <div key={g.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-white">{g.goal_name}</h3>
                <span className="text-xs font-bold text-emerald-400">{pct}%</span>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                ฿{Number(g.current_amount).toLocaleString()} / ฿
                {Number(g.target_amount).toLocaleString()}
              </p>
              <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
