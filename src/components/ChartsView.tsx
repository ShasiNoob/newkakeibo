import React, { useMemo, useState } from 'react';
import { PieChart, BarChart2, TrendingUp } from 'lucide-react';
import { formatYen, monthLabel } from '../api/client.ts';
import type { Income, Expense, FundTotals } from '../types.ts';

interface ChartsViewProps {
  incomes: Income[];
  expenses: Expense[];
  totals: FundTotals;
}

const CATEGORY_COLORS = [
  '#D4A15C',
  '#6FAE9C',
  '#8FB3D9',
  '#E15554',
  '#9B5DE5',
  '#F15BB5',
  '#00BBF9',
  '#00F5D4',
  '#FEE440',
  '#A0AEC0',
];

export const ChartsView: React.FC<ChartsViewProps> = ({ incomes, expenses, totals }) => {
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()));

  // Extract unique years
  const years = useMemo(() => {
    const set = new Set<string>();
    incomes.forEach((i) => {
      if (i && i.date) set.add(i.date.slice(0, 4));
    });
    expenses.forEach((e) => {
      if (e && e.date) set.add(e.date.slice(0, 4));
    });
    if (!set.has(String(new Date().getFullYear()))) {
      set.add(String(new Date().getFullYear()));
    }
    return Array.from(set).sort().reverse();
  }, [incomes, expenses]);

  // Category breakdown for selected year
  const categoryStats = useMemo(() => {
    const filtered = expenses.filter((e) => e && e.date && e.date.startsWith(selectedYear));
    const map: Record<string, number> = {};
    let total = 0;

    filtered.forEach((e) => {
      const cat = e.category || 'その他';
      const amt = Number(e.amount) || 0;
      map[cat] = (map[cat] || 0) + amt;
      total += amt;
    });

    const entries = Object.entries(map)
      .map(([category, amount], idx) => ({
        category,
        amount,
        percent: total > 0 ? (amount / total) * 100 : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    return { entries, total };
  }, [expenses, selectedYear]);

  // Monthly trends for selected year
  const monthlyTrends = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      return `${selectedYear}-${m}`;
    });

    return months.map((m) => {
      const inc = incomes.filter((i) => i.month === m).reduce((s, i) => s + i.amount, 0);
      const exp = expenses.filter((e) => e.month === m).reduce((s, e) => s + e.amount, 0);
      const monthNum = parseInt(m.split('-')[1], 10);
      return {
        month: `${monthNum}月`,
        monthKey: m,
        income: inc,
        expense: exp,
      };
    });
  }, [incomes, expenses, selectedYear]);

  const maxMonthlyVal = Math.max(
    ...monthlyTrends.map((t) => Math.max(t.income, t.expense)),
    50000
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">家計分析グラフ</h2>
          <p className="text-[11px] text-gray-400">支出の推移とカテゴリ別内訳</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-[#1D212C] text-xs text-gray-200 border border-white/10 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D4A15C]"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}年
            </option>
          ))}
        </select>
      </div>

      {/* Asset Distribution */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <PieChart className="w-3.5 h-3.5 text-[#D4A15C]" />
          <span>現在の資産構成</span>
        </h3>

        {/* Stacked Progress Bar */}
        <div className="h-4 rounded-full bg-white/5 overflow-hidden flex my-2 border border-white/10">
          {totals.total > 0 ? (
            <>
              <div
                style={{ width: `${(totals.free / totals.total) * 100}%` }}
                className="bg-[#D4A15C] h-full transition-all"
                title={`自由資金: ${formatYen(totals.free)}`}
              />
              <div
                style={{ width: `${(totals.savings / totals.total) * 100}%` }}
                className="bg-[#6FAE9C] h-full transition-all"
                title={`普通貯金: ${formatYen(totals.savings)}`}
              />
              <div
                style={{ width: `${(totals.car / totals.total) * 100}%` }}
                className="bg-[#8FB3D9] h-full transition-all"
                title={`車維持費: ${formatYen(totals.car)}`}
              />
            </>
          ) : (
            <div className="w-full bg-gray-600 h-full" />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#D4A15C]" />
              <span className="text-[10px] text-gray-400">自由資金</span>
            </div>
            <p className="text-xs font-bold text-amber-300 font-mono">{formatYen(totals.free)}</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#6FAE9C]" />
              <span className="text-[10px] text-gray-400">普通貯金</span>
            </div>
            <p className="text-xs font-bold text-[#6FAE9C] font-mono">{formatYen(totals.savings)}</p>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#8FB3D9]" />
              <span className="text-[10px] text-gray-400">車維持費</span>
            </div>
            <p className="text-xs font-bold text-[#8FB3D9] font-mono">{formatYen(totals.car)}</p>
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-[#D4A15C]" />
          <span>月別 収入・支出の推移 ({selectedYear}年)</span>
        </h3>

        <div className="flex items-center space-x-4 mb-4 text-[11px] text-gray-400">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span>収入</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
            <span>支出</span>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between space-x-1 pt-4 border-b border-white/10 overflow-x-auto pb-1">
          {monthlyTrends.map((t, idx) => {
            const incH = Math.max(2, (t.income / maxMonthlyVal) * 120);
            const expH = Math.max(2, (t.expense / maxMonthlyVal) * 120);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center min-w-[20px]">
                <div className="flex items-end space-x-0.5 w-full justify-center h-32">
                  <div
                    style={{ height: `${t.income > 0 ? incH : 2}px` }}
                    className="w-1.5 sm:w-2 bg-emerald-400 rounded-t-sm transition-all hover:opacity-80"
                    title={`${t.month} 収入: ${formatYen(t.income)}`}
                  />
                  <div
                    style={{ height: `${t.expense > 0 ? expH : 2}px` }}
                    className="w-1.5 sm:w-2 bg-rose-400 rounded-t-sm transition-all hover:opacity-80"
                    title={`${t.month} 支出: ${formatYen(t.expense)}`}
                  />
                </div>
                <span className="text-[9px] text-gray-400 mt-2 truncate">{t.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#D4A15C]" />
            <span>カテゴリ別 支出内訳</span>
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            年間合計: <strong className="text-white">{formatYen(categoryStats.total)}</strong>
          </span>
        </div>

        {categoryStats.entries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">支出データがありません</p>
        ) : (
          <div className="space-y-3">
            {categoryStats.entries.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-200 font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-gray-400 text-[11px]">{item.percent.toFixed(1)}%</span>
                    <span className="font-semibold text-white">{formatYen(item.amount)}</span>
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    style={{
                      width: `${item.percent}%`,
                      backgroundColor: item.color,
                    }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
