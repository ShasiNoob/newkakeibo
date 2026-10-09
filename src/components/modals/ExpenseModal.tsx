import React, { useState } from 'react';
import { X, ArrowDownCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Api, todayISO, formatYen } from '../../api/client.ts';
import { cleanNum } from '../../db/clientStore.ts';
import type { Settings, FundTotals, FundType } from '../../types.ts';

interface ExpenseModalProps {
  settings: Settings;
  totals: FundTotals;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, isError?: boolean) => void;
}

const DEFAULT_CATEGORIES = [
  '食費',
  '交通費',
  '車',
  'DJ・音楽',
  'PC・ゲーム',
  'ファッション',
  '趣味',
  '日用品',
  '娯楽',
  'その他',
];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  settings,
  totals,
  onClose,
  onSuccess,
  onToast,
}) => {
  const categoriesList = Array.isArray(settings?.categories) && settings.categories.length > 0
    ? settings.categories
    : DEFAULT_CATEGORIES;

  const [date, setDate] = useState(todayISO());
  const [name, setName] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>(categoriesList[0] || '食費');
  const [memo, setMemo] = useState('');
  const [showAdvancedAllocation, setShowAdvancedAllocation] = useState(false);

  // Custom allocation overrides (optional)
  const [allocFree, setAllocFree] = useState<string>('');
  const [allocSavings, setAllocSavings] = useState<string>('');
  const [allocCar, setAllocCar] = useState<string>('');

  const [loading, setLoading] = useState(false);

  const numAmount = cleanNum(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      onToast('有効な金額を入力してください', true);
      return;
    }

    const safeName = name.trim() || '支出';

    let requestedByType: Array<{ type: FundType; amount: number }> | undefined = undefined;

    if (showAdvancedAllocation) {
      const freePart = cleanNum(allocFree);
      const savPart = cleanNum(allocSavings);
      const carPart = cleanNum(allocCar);

      if (freePart + savPart + carPart > 0) {
        if (freePart + savPart + carPart !== numAmount) {
          onToast(
            `支払い元の合計 (${formatYen(freePart + savPart + carPart)}) が支出金額 (${formatYen(numAmount)}) と一致しません`,
            true
          );
          return;
        }

        requestedByType = [];
        if (freePart > 0) requestedByType.push({ type: 'free', amount: freePart });
        if (savPart > 0) requestedByType.push({ type: 'savings', amount: savPart });
        if (carPart > 0) requestedByType.push({ type: 'car', amount: carPart });
      }
    }

    setLoading(true);
    try {
      const result = await Api.addExpense({
        date,
        name: safeName,
        amount: numAmount,
        category: category || 'その他',
        memo: memo.trim(),
        requestedByType,
      });

      if (result.shortfall && result.shortfall.length > 0) {
        const missingTotal = result.shortfall.reduce((s, it) => s + it.missing, 0);
        onToast(`支出を登録しました（資金不足分: ${formatYen(missingTotal)}）`);
      } else {
        onToast('支出を登録しました');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      onToast(err.message || '支出の登録に失敗しました', true);
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
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">支出を登録</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Date & Category */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-400 block mb-1">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#14171F] text-xs text-white rounded-xl px-2.5 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
              >
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Name */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">項目名 (任意)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：スーパー買い物、ガソリン代、書籍など"
              className="w-full bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">金額</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">¥</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2500"
                required
                min="1"
                className="w-full bg-[#14171F] text-base font-bold font-mono text-white rounded-xl pl-7 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
              />
            </div>
          </div>

          {/* Memo */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">メモ (任意)</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder=""
              className="w-full bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
            />
          </div>

          {/* Advanced Allocation Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedAllocation(!showAdvancedAllocation)}
              className="text-[11px] text-[#D4A15C] hover:underline flex items-center space-x-1"
            >
              <span>{showAdvancedAllocation ? '支払い元を自由資金(FIFO)自動に戻す' : '特定の資金から支払う (車維持費・貯金など)'}</span>
              {showAdvancedAllocation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvancedAllocation && (
              <div className="mt-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <p className="text-[10px] text-gray-400">
                  指定のない場合は「自由資金」から古い月順（FIFO）で自動消費されます。
                </p>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-300">自由資金 (残: {formatYen(totals.free)})</span>
                    <input
                      type="number"
                      value={allocFree}
                      onChange={(e) => setAllocFree(e.target.value)}
                      placeholder="自動"
                      className="w-28 bg-[#14171F] text-xs font-mono text-right text-white rounded-lg px-2 py-1 border border-white/10"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-400">普通貯金 (残: {formatYen(totals.savings)})</span>
                    <input
                      type="number"
                      value={allocSavings}
                      onChange={(e) => setAllocSavings(e.target.value)}
                      placeholder="0"
                      className="w-28 bg-[#14171F] text-xs font-mono text-right text-white rounded-lg px-2 py-1 border border-white/10"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-sky-400">車維持費 (残: {formatYen(totals.car)})</span>
                    <input
                      type="number"
                      value={allocCar}
                      onChange={(e) => setAllocCar(e.target.value)}
                      placeholder="0"
                      className="w-28 bg-[#14171F] text-xs font-mono text-right text-white rounded-lg px-2 py-1 border border-white/10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#D4A15C] hover:bg-[#c2914c] text-black font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {loading ? '登録中...' : '支出を登録する'}
          </button>
        </form>
      </div>
    </div>
  );
};
