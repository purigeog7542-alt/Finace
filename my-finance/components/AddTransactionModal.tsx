'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { Account, Category, TransactionType } from '@/types/finance';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  // รีเซ็ต categoryId เมื่อเปลี่ยนประเภท รายรับ/รายจ่าย เพื่อป้องกันเลือกหมวดหมู่ผิดประเภท
  useEffect(() => {
    setCategoryId('');
  }, [type]);

  const fetchDropdownData = async () => {
    const [{ data: accData }, { data: catData }] = await Promise.all([
      supabase.from('accounts').select('*').order('created_at', { ascending: true }),
      supabase.from('categories').select('*').eq('is_active', true),
    ]);

    if (accData && accData.length > 0) {
      setAccounts(accData);
      setAccountId(accData[0].id);
    }
    if (catData) {
      setCategories(catData);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    if (!accountId) {
      alert('กรุณาเลือกบัญชีเงินฝาก');
      return;
    }

    if (type !== 'transfer' && !categoryId) {
      alert('กรุณาเลือกหมวดหมู่');
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert('กรุณาเข้าสู่ระบบก่อนบันทึกรายการ');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('transactions').insert([
        {
          user_id: user.id,
          account_id: accountId,
          category_id: type === 'transfer' ? null : categoryId,
          type,
          amount: Number(parseFloat(amount).toFixed(2)),
          description: description.trim() || null,
          transaction_date: date,
        },
      ]);

      if (error) {
        console.error('Insert error:', error.message);
        alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
      } else {
        setAmount('');
        setDescription('');
        setCategoryId('');
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#161822] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">บันทึกรายการใหม่</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* เลือกประเภทรายการ */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#0d0e12] rounded-xl mb-5">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              type === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            รายจ่าย
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              type === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            รายรับ
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`py-2 rounded-lg text-sm font-semibold transition ${
              type === 'transfer'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            โอนย้าย
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">บัญชี</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {accounts.length === 0 && <option value="">สร้างบัญชีก่อน</option>}
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">วันที่</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {type !== 'transfer' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">หมวดหมู่</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1">รายละเอียดเพิ่มเติม</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น เงินเดือน, ค่าอาหาร, รายได้ร้านกาแฟ"
              className="w-full bg-[#0d0e12] border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition"
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
          </button>
        </form>
      </div>
    </div>
  );
}