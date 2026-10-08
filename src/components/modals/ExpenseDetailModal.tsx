import React, { useState } from 'react';
import { X, Trash2, ArrowDownCircle, Layers } from 'lucide-react';
import { Api, formatYen, monthLabel, fundTypeLabel, fundTypeColor } from '../../api/client.ts';
import type { Expense } from '../../types.ts';

interface ExpenseDetailModalProps {
  expense: Expense;
  onClose: () => void;
  onSuccess: () => void;
  onToast: (msg: string, isError?: boolean) => void;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  onClose,
  onSuccess,
  onToast,
}) => {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await Api.deleteExpense(expense.id);
      onToast('支出を削除し、資金プールに返還しました');
      onSuccess();
      onClose();
    } catch (err: any) {
      onToast(err.message || '削除に失敗しました', true);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-md bg-[#1D212C] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">
              {expense.category}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title and Amount */}
        <div>
          <h2 className="text-lg font-bold text-white">{expense.name}</h2>
          <div className="text-3xl font-extrabold font-mono text-rose-400 my-1">
            -{formatYen(expense.amount)}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
            <span>{expense.date}</span>
            {expense.memo && <span>• {expense.memo}</span>}
          </div>
        </div>

        {/* Used Funds Breakdown (FIFO tracking) */}
        <div className="rounded-2xl bg-[#14171F] border border-white/5 p-3.5 space-y-2.5">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-gray-300">
            <Layers className="w-3.5 h-3.5 text-[#D4A15C]" />
            <span>この支出に使用された資金の内訳 (FIFO)</span>
          </div>

          <div className="space-y-1.5 text-xs">
            {expense.allocations && expense.allocations.length > 0 ? (
              expense.allocations.map((alloc, idx) => {
                const color = fundTypeColor(alloc.type);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 border-b border-white/5 last:border-0"
                  >
                    <span className="text-gray-300">
                      {monthLabel(alloc.sourceMonth)}{' '}
                      <span className={color.text}>({fundTypeLabel(alloc.type)})</span>
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {formatYen(alloc.amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-gray-500">内訳情報がありません</p>
            )}
          </div>
        </div>

        {/* Delete Action */}
        <div className="pt-2">
          {confirmDelete ? (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
              <p className="text-xs text-rose-300">
                この支出を削除しますか？消費された資金は元のプールに自動返還されます。
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 text-xs bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl transition"
                >
                  {deleting ? '削除中...' : 'はい、削除します'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 text-xs bg-white/10 hover:bg-white/15 text-gray-300 py-2 rounded-xl transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center space-x-1.5 text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 py-2.5 rounded-xl border border-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>この支出を削除（資金を復元）</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
