import React, { useState } from 'react';
import { X, ArrowUpCircle } from 'lucide-react';
import { Api, formatYen } from '../../api/client.ts';
import type { Settings } from '../../types.ts';

interface IncomeModalProps {
  settings: Settings;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const IncomeModal: React.FC<IncomeModalProps> = ({
  settings,
  onClose,
  onSuccess,
  onToast,
}) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [amount, setAmount] = useState<string>('');
  const defaultSavings = typeof settings?.normalSavingsDefault === 'number' ? settings.normalSavingsDefault : 10000;
  const defaultCar = typeof settings?.carMaintenanceDefault === 'number' ? settings.carMaintenanceDefault : 10000;
  const [savingsAmount, setSavingsAmount] = useState<number>(defaultSavings);
  const [carAmount, setCarAmount] = useState<number>(defaultCar);
  const [memo, setMemo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const numAmount = Number(amount) || 0;
  const freeAmount = numAmount - savingsAmount - carAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      onToast('有効な収入金額を入力してください', true);
      return;
    }

    setLoading(true);
    try {
      await Api.addIncome({
        year,
        month,
        amount: numAmount,
        normalSavingsAmount: savingsAmount,
        carMaintenanceAmount: carAmount,
        memo,
      });
      onToast('収入を登録しました');
      onSuccess();
      onClose();
    } catch (err: any) {
      onToast(err.message || '収入の登録に失敗しました', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-[#1D212C] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">収入を登録</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Year and Month */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">年</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                required
                className="w-full bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">月</label>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                required
                className="w-full bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">手取り収入金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250000"
                required
                min="1"
                className="w-full bg-[#14171F] text-base font-bold font-mono text-white rounded-xl pl-7 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
              />
            </div>
          </div>

          {/* Allocation Split Rules */}
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              資金プールへの自動振分
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-emerald-400 block mb-1">普通貯金へ</label>
                <input
                  type="number"
                  value={savingsAmount}
                  onChange={(e) => setSavingsAmount(Number(e.target.value))}
                  min="0"
                  step="1000"
                  className="w-full bg-[#14171F] text-xs font-mono text-white rounded-xl px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-sky-400 block mb-1">車維持費へ</label>
                <input
                  type="number"
                  value={carAmount}
                  onChange={(e) => setCarAmount(Number(e.target.value))}
                  min="0"
                  step="1000"
                  className="w-full bg-[#14171F] text-xs font-mono text-white rounded-xl px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            {/* Free Funds Result */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-gray-300">自由に使える金額:</span>
              <span className={`font-mono font-bold ${freeAmount >= 0 ? 'text-[#D4A15C]' : 'text-rose-400'}`}>
                {formatYen(freeAmount)}
              </span>
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">メモ (任意)</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例：10月分給与、臨時ボーナス等"
              className="w-full bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? '登録中...' : '収入を確定してプールに追加'}
          </button>
        </form>
      </div>
    </div>
  );
};
