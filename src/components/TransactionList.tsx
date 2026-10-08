import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Trash2,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { formatYen, monthLabel } from '../api/client.ts';
import type { Income, Expense } from '../types.ts';

interface TransactionListProps {
  incomes: Income[];
  expenses: Expense[];
  onSelectExpense: (exp: Expense) => void;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
}

type CombinedItem =
  | { type: 'income'; data: Income; date: string }
  | { type: 'expense'; data: Expense; date: string };

export const TransactionList: React.FC<TransactionListProps> = ({
  incomes,
  expenses,
  onSelectExpense,
  onOpenIncome,
  onOpenExpense,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Compute unique months
  const months = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach((i) => set.add(i.month));
    expenses.forEach((e) => set.add(e.month));
    return Array.from(set).sort().reverse();
  }, [incomes, expenses]);

  // Combined sorted list
  const combinedList = useMemo(() => {
    const list: CombinedItem[] = [];

    if (filterType === 'all' || filterType === 'income') {
      incomes.forEach((inc) => list.push({ type: 'income', data: inc, date: inc.date }));
    }
    if (filterType === 'all' || filterType === 'expense') {
      expenses.forEach((exp) => list.push({ type: 'expense', data: exp, date: exp.date }));
    }

    return list
      .filter((item) => {
        if (selectedMonth !== 'all') {
          const itemMonth = item.date.slice(0, 7);
          if (itemMonth !== selectedMonth) return false;
        }

        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();

        if (item.type === 'expense') {
          const e = item.data;
          return (
            e.name.toLowerCase().includes(query) ||
            e.category.toLowerCase().includes(query) ||
            (e.memo && e.memo.toLowerCase().includes(query))
          );
        } else {
          const i = item.data;
          return (
            '収入'.includes(query) ||
            (i.memo && i.memo.toLowerCase().includes(query))
          );
        }
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [incomes, expenses, filterType, selectedMonth, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header and Quick Add */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">収支履歴</h2>
          <p className="text-[11px] text-gray-400">過去の収入・支出一覧</p>
        </div>
        <div className="flex space-x-1.5">
          <button
            onClick={onOpenExpense}
            className="flex items-center space-x-1 text-xs bg-[#D4A15C] text-black font-bold py-1.5 px-3 rounded-xl shadow hover:bg-[#c2914c] transition"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>支出</span>
          </button>
          <button
            onClick={onOpenIncome}
            className="flex items-center space-x-1 text-xs bg-white/10 text-white font-semibold py-1.5 px-3 rounded-xl border border-white/10 hover:bg-white/15 transition"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>収入</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="項目名、カテゴリ、メモで検索..."
              className="w-full bg-[#1D212C] text-xs text-white placeholder-gray-500 rounded-xl pl-8 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
            />
          </div>

          {/* Month selector */}
          {months.length > 0 && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-[#1D212C] text-xs text-gray-300 rounded-xl px-2.5 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
            >
              <option value="all">全期間</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex space-x-2">
          {(
            [
              { id: 'all', label: 'すべて' },
              { id: 'expense', label: '支出のみ' },
              { id: 'income', label: '収入のみ' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`text-xs py-1 px-3 rounded-lg font-medium transition ${
                filterType === tab.id
                  ? 'bg-[#D4A15C]/20 text-[#D4A15C] border border-[#D4A15C]/40'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {combinedList.length === 0 ? (
          <div className="rounded-2xl bg-[#1D212C] border border-white/5 p-8 text-center text-gray-400">
            <p className="text-xs">該当する収支データがありません</p>
          </div>
        ) : (
          combinedList.map((item) => {
            if (item.type === 'expense') {
              const exp = item.data;
              return (
                <div
                  key={exp.id}
                  onClick={() => onSelectExpense(exp)}
                  className="rounded-2xl bg-[#1D212C] border border-white/5 hover:border-white/15 p-3 flex items-center justify-between cursor-pointer transition active:scale-[0.99] group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white group-hover:text-[#D4A15C] transition">
                          {exp.name}
                        </span>
                        <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                          {exp.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-0.5">
                        <span>{exp.date}</span>
                        {exp.memo && <span>• {exp.memo}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold font-mono text-rose-400">
                      -{formatYen(exp.amount)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-300" />
                  </div>
                </div>
              );
            } else {
              const inc = item.data;
              return (
                <div
                  key={inc.id}
                  className="rounded-2xl bg-[#1D212C] border border-white/5 p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">収入登録</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {inc.month}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-0.5">
                        <span>普通貯金: {formatYen(inc.normalSavingsAmount)}</span>
                        <span>• 車: {formatYen(inc.carMaintenanceAmount)}</span>
                        <span>• 自由: {formatYen(inc.freeAmount)}</span>
                        {inc.memo && <span>• {inc.memo}</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      +{formatYen(inc.amount)}
                    </span>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
};
