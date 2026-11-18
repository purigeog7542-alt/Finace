'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export default function CloudPocketsPage() {
  const [pockets, setPockets] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [color, setColor] = useState('#10B981');
  const [loading, setLoading] = useState(false);

  const fetchPockets = async () => {
    const { data, error } = await supabase.from('pockets').select('*');
    if (error) {
      console.error('Error fetching pockets:', error);
    } else {
      setPockets(data || []);
    }
  };

  useEffect(() => {
    fetchPockets();
  }, []);

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    const { error } = await supabase.from('pockets').insert([
      {
        name,
        balance: parseFloat(balance) || 0,
        target_amount: parseFloat(targetAmount) || 0,
        color,
      },
    ]);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setName('');
      setBalance('');
      setTargetAmount('');
      fetchPockets();
    }
    setLoading(false);
  };

  const handleUpdateBalance = async (id: string, currentBalance: number) => {
    const amountStr = prompt('ระบุจำนวนเงินที่ต้องการเติมเข้า (ใส่เครื่องหมายลบ - หากต้องการถอนออก):', '100');
    if (!amountStr) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;

    const newBalance = currentBalance + amount;

    const { error } = await supabase
      .from('pockets')
      .update({ balance: newBalance })
      .eq('id', id);

    if (error) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      fetchPockets();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบกระเป๋านี้ใช่ไหม?')) return;
    const { error } = await supabase.from('pockets').delete().eq('id', id);
    if (!error) fetchPockets();
  };

  const totalPocketsBalance = pockets.reduce(
    (sum, p) => sum + Number(p.balance || p.amount || 0),
    0
  );

  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

  return (
    <div className="p-6 text-white max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-gray-900 p-6 rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ✨ Cloud Pockets (กระเป๋าย่อย)
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            แบ่งเงินเป็นสัดส่วน แบบฉบับ MAKE by KBank
          </p>
        </div>
        <div className="bg-gray-800 px-6 py-3 rounded-xl border border-gray-700 text-right">
          <p className="text-xs text-gray-400">เงินรวมทุกกระเป๋า</p>
          <p className="text-xl font-bold text-emerald-400">
            ฿{totalPocketsBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <form onSubmit={handleCreatePocket} className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
        <h2 className="text-lg font-semibold mb-4">สร้างกระเป๋าเงินย่อยใหม่</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="ชื่อกระเป๋า (เช่น เงินเก็บ, ช้อปปิ้ง)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            required
          />
          <input
            type="number"
            placeholder="ยอดเงินเริ่มต้น (บาท)"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          />
          <input
            type="number"
            placeholder="เป้าหมายเงิน (ถ้ามี)"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">สีธีม:</span>
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${
                  color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-semibold px-6 py-2.5 rounded-xl transition"
          >
            {loading ? 'กำลังสร้าง...' : '+ สร้างกระเป๋า'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pockets.length === 0 ? (
          <p className="text-gray-500 col-span-2 text-center py-8">ยังไม่มีกระเป๋าเงินย่อย เริ่มสร้างกระเป๋าแรกของคุณได้เลย</p>
        ) : (
          pockets.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex flex-col justify-between relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-1.5 h-full"
                style={{ backgroundColor: p.color || '#10B981' }}
              />
              <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ฿{Number(p.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  {p.target_amount > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      เป้าหมาย: ฿{Number(p.target_amount).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateBalance(p.id, Number(p.balance || 0))}
                    className="bg-gray-800 hover:bg-gray-700 text-xs px-3 py-1.5 rounded-lg border border-gray-700 transition"
                  >
                    + โยกเงินเข้า
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-gray-500 hover:text-red-400 p-1.5 transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}