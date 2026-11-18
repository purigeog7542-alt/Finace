'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { FolderPlus, Wallet, ArrowRightLeft, Trash2, Loader2, Sparkles } from 'lucide-react';

interface Pocket {
  id: string;
  name: string;
  balance: number;
  color: string;
  target_amount?: number;
}

export default function PocketsPage() {
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [target, setTarget] = useState('');
  const [color, setColor] = useState('bg-emerald-500');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const colors = [
    { label: 'เขียวมรกต', value: 'bg-emerald-500' },
    { label: 'ฟ้า', value: 'bg-sky-500' },
    { label: 'ม่วง', value: 'bg-purple-500' },
    { label: 'ชมพู', value: 'bg-pink-500' },
    { label: 'ส้ม', value: 'bg-amber-500' },
  ];

  const fetchPockets = async () => {
    setFetching(true);
    // สมมติว่าดึงจากตาราง pockets (ถ้ายังไม่ได้สร้างตาราง ให้รัน SQL ด้านล่างก่อนครับ)
    const { data, error } = await supabase
      .from('pockets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pockets:', error.message);
    } else if (data) {
      setPockets(data);
    }
    setFetching(false);
  };

  useEffect(() => {
    fetchPockets();
  }, []);

  const handleAddPocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const { error } = await supabase.from('pockets').insert([
      {
        name: name.trim(),
        balance: parseFloat(balance || '0'),
        target_amount: target ? parseFloat(target) : null,
        color,
      },
    ]);

    setLoading(false);
    if (error) {
      alert('เกิดข้อผิดพลาด (ตรวจสอบว่าสร้างตาราง pockets ใน Supabase หรือยัง): ' + error.message);
    } else {
      setName('');
      setBalance('');
      setTarget('');
      fetchPockets();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบกระเป๋านี้ใช่หรือไม่?')) return;
    await supabase.from('pockets').delete().eq('id', id);
    fetchPockets();
  };

  const totalPocketBalance = pockets.reduce((sum, p) => sum + Number(p.balance), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" /> Cloud Pockets (กระเป๋าย่อย)
          </h1>
          <p className="text-sm text-gray-400">แบ่งเงินเป็นสัดส่วน แบบฉบับ MAKE by KBank</p>
        </div>
        <div className="bg-[#161822] border border-gray-800 px-5 py-3 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-400">เงินรวมทุกกระเป๋า</p>
            <p className="text-lg font-bold text-emerald-400">
              ฿{totalPocketBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* ฟอร์มสร้างกระเป๋าใหม่ */}
      <form onSubmit={handleAddPocket} className="bg-[#161822] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-gray-300">สร้างกระเป๋าเงินย่อยใหม่</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อกระเป๋า (เช่น ค่าเที่ยวญี่ปุ่น, เงินเก็บ)"
            className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <input
            type="number"
            step="0.01"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="ยอดเงินเริ่มต้น (บาท)"
            className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <input
            type="number"
            step="0.01"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="เป้าหมายเงินเก็บ (ถ้ามี)"
            className="bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {/* เลือกสี */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">สีธีม:</span>
            {colors.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`w-6 h-6 rounded-full ${c.value} transition cursor-pointer ${
                  color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-60'
                }`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-6 py-2.5 rounded-xl text-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            สร้างกระเป๋า
          </button>
        </div>
      </form>

      {/* แสดงรายการกระเป๋าแบบ Cloud Pockets */}
      {fetching ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> กำลังโหลดกระเป๋าเงิน...
        </div>
      ) : pockets.length === 0 ? (
        <div className="bg-[#161822] border border-gray-800 rounded-2xl p-8 text-center text-gray-400">
          ยังไม่มี Cloud Pocket เริ่มสร้างกระเป๋าแรกของคุณได้เลย
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pockets.map((p) => {
            const hasTarget = p.target_amount && p.target_amount > 0;
            const pct = hasTarget ? Math.min(100, Math.round((p.balance / p.target_amount!) * 100)) : 0;

            return (
              <div key={p.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                {/* แถบสีด้านบนการ์ด */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${p.color}`} />

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white text-base">{p.name}</h3>
                      <p className="text-xl font-extrabold text-emerald-400 mt-1">
                        ฿{Number(p.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-gray-500 hover:text-rose-400 p-2 rounded-lg transition cursor-pointer"
                      title="ลบกระเป๋า"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {hasTarget && (
                    <div className="space-y-1.5 mb-2">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>เป้าหมาย: ฿{Number(p.target_amount).toLocaleString()}</span>
                        <span className="text-emerald-400 font-bold">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${p.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
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