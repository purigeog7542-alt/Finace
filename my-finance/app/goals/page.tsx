'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { SavingsGoal } from '@/types/finance';
import { Plus, Trash2, Loader2, Target, TrendingUp } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [goalName, setGoalName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // สำหรับจัดการเพิ่มเงินออมเร่งด่วนในแต่ละการ์ดเป้าหมาย
  const [addingMoneyId, setAddingMoneyId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const loadGoals = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching goals:', error.message);
    } else if (data) {
      setGoals(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !target) return;

    setLoading(true);

    const { error } = await supabase.from('savings_goals').insert([
      {
        goal_name: goalName.trim(),
        target_amount: parseFloat(target),
        current_amount: parseFloat(current || '0'),
      },
    ]);

    setLoading(false);

    if (error) {
      console.error('Error inserting goal:', error.message);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setGoalName('');
      setTarget('');
      setCurrent('');
      loadGoals();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('คุณต้องการลบเป้าหมายการออมนี้ใช่หรือไม่?')) return;

    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) {
      alert('ลบไม่สำเร็จ: ' + error.message);
    } else {
      loadGoals();
    }
  };

  const handleDeposit = async (goal: SavingsGoal) => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newCurrent = Number(goal.current_amount) + amount;

    const { error } = await supabase
      .from('savings_goals')
      .update({ current_amount: newCurrent })
      .eq('id', goal.id);

    if (error) {
      alert('อัปเดตยอดไม่สำเร็จ: ' + error.message);
    } else {
      setAddingMoneyId(null);
      setDepositAmount('');
      loadGoals();
    }
  };

  // คำนวณสรุปเป้าหมายทั้งหมด
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalCurrent = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalCurrent / totalTarget) * 100)) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">เป้าหมายการออม</h1>
          <p className="text-sm text-gray-400">วางแผนเก็บเงินเพื่ออนุมัติเป้าหมายชีวิตของคุณ</p>
        </div>

        {/* การ์ดสรุปภาพรวมการออม */}
        <div className="bg-[#161822] border border-gray-800 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">ยอดสะสมรวม / เป้าหมายรวม</p>
            <p className="text-base font-bold text-white">
              <span className="text-emerald-400">฿{totalCurrent.toLocaleString()}</span> / ฿{totalTarget.toLocaleString()} ({overallPct}%)
            </p>
          </div>
        </div>
      </div>

      {/* ฟอร์มสร้างเป้าหมายใหม่ */}
      <form
        onSubmit={handleAddGoal}
        className="bg-[#161822] border border-gray-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end shadow-xl"
      >
        <div>
          <label className="block text-xs text-gray-400 mb-1">ชื่อเป้าหมาย</label>
          <input
            type="text"
            required
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder="เช่น เงินสำรองฉุกเฉิน, ทริปเที่ยว"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">ยอดเป้าหมาย (บาท)</label>
          <input
            type="number"
            step="0.01"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">ยอดสะสมเริ่มต้น (ถ้ามี)</label>
          <input
            type="number"
            step="0.01"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold rounded-xl py-3 px-4 text-sm transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'กำลังสร้าง...' : 'สร้างเป้าหมาย'}
        </button>
      </form>

      {/* รายการเป้าหมายการออม */}
      {fetching ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดข้อมูล...
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-[#161822] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
          ยังไม่มีเป้าหมายการออม เริ่มสร้างเป้าหมายแรกของคุณได้เลย
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const currentVal = Number(g.current_amount);
            const targetVal = Number(g.target_amount);
            const rawPct = targetVal > 0 ? Math.round((currentVal / targetVal) * 100) : 0;
            const pct = Math.min(100, rawPct);

            return (
              <div key={g.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-base">{g.goal_name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                        {rawPct}%
                      </span>
                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                        title="ลบเป้าหมาย"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    ฿{currentVal.toLocaleString()} / <span className="text-white font-medium">฿{targetVal.toLocaleString()}</span>
                  </p>
                </div>

                <div>
                  <div className="w-full h-2.5 bg-gray-800 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rawPct >= 100 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* ส่วนเพิ่มเงินออมเร่งด่วน */}
                  {addingMoneyId === g.id ? (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                      <input
                        type="number"
                        step="0.01"
                        autoFocus
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="จำนวนเงินที่ออมเพิ่ม"
                        className="w-full bg-[#0d0e12] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleDeposit(g)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-3 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer transition"
                      >
                        ยืนยัน
                      </button>
                      <button
                        onClick={() => {
                          setAddingMoneyId(null);
                          setDepositAmount('');
                        }}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-xl text-xs whitespace-nowrap cursor-pointer transition"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingMoneyId(g.id);
                        setDepositAmount('');
                      }}
                      className="w-full bg-gray-800/60 hover:bg-gray-800 text-gray-300 hover:text-white py-2 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer border border-gray-700/50"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> ออมเงินเพิ่มเข้าเป้าหมายนี้
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}