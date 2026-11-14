'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Wallet, Plus, Trash2 } from 'lucide-react';

interface Account {
  id: string;
  name: string;
  balance: number;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountName, setAccountName] = useState('');
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setFetching(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setFetching(false);
      return;
    }

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching accounts:', error.message);
    } else if (data) {
      setAccounts(data);
    }
    setFetching(false);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      alert('กรุณากรอกชื่อบัญชี');
      return;
    }

    setLoading(true);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      alert('กรุณาเข้าสู่ระบบก่อนเพิ่มบัญชี');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('accounts').insert([
      {
        user_id: user.id, // ส่ง user_id ให้ตรงกับ RLS Policy
        name: accountName.trim(),
        balance: Number(parseFloat(balance || '0').toFixed(2)),
      },
    ]);

    setLoading(false);

    if (error) {
      console.error('Error inserting account:', error.message);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      alert('เพิ่มบัญชีสำเร็จ!');
      setAccountName('');
      setBalance('');
      fetchAccounts(); // โหลดข้อมูลบัญชีใหม่ทันที
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('คุณต้องการลบบัญชีนี้ใช่หรือไม่?')) return;
    
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    } else {
      fetchAccounts();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">จัดการบัญชีเงิน</h1>

      {/* ฟอร์มเพิ่มบัญชี */}
      <form onSubmit={handleAddAccount} className="bg-[#161822] border border-gray-800 rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-4 items-end shadow-xl">
        <div className="w-full">
          <label className="block text-xs text-gray-400 mb-1">ชื่อบัญชี</label>
          <input
            type="text"
            required
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="เช่น ทหารไทย, เงินสด, KTB"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="w-full">
          <label className="block text-xs text-gray-400 mb-1">ยอดเงินเริ่มต้น (บาท)</label>
          <input
            type="number"
            step="0.01"
            required
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          {loading ? 'กำลังบันทึก...' : 'เพิ่มบัญชี'}
        </button>
      </form>

      {/* รายการบัญชีทั้งหมด */}
      <h2 className="text-lg font-semibold mb-4">บัญชีของคุณ</h2>
      {fetching ? (
        <p className="text-gray-400">กำลังโหลดข้อมูล...</p>
      ) : accounts.length === 0 ? (
        <div className="bg-[#161822] border border-gray-800 rounded-2xl p-6 text-center text-gray-400">
          ยังไม่มีบัญชีเงินฝาก กรุณาเพิ่มบัญชีด้านบน
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-[#161822] border border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{acc.name}</h3>
                  <p className="text-xs text-gray-400">ยอดเงินคงเหลือ</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-lg font-bold text-emerald-400">
                    ฿{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAccount(acc.id)}
                  className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  title="ลบบัญชี"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}