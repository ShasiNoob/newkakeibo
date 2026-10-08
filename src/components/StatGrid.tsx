import React from 'react';
import { ArrowUpRight, ArrowDownRight, Coins, ShieldCheck, Car, PiggyBank } from 'lucide-react';
import { formatYen } from '../api/client.ts';
import type { FundTotals } from '../types.ts';

interface StatGridProps {
  incomeTotal: number;
  expenseTotal: number;
  totals: FundTotals;
}

export const StatGrid: React.FC<StatGridProps> = ({ incomeTotal, expenseTotal, totals }) => {
  const cards = [
    {
      label: '今月の収入',
      value: incomeTotal,
      color: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      label: '今月の支出',
      value: expenseTotal,
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />,
    },
    {
      label: '自由資金 残高',
      value: totals.free,
      color: 'text-amber-300',
      badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      icon: <Coins className="w-3.5 h-3.5 text-amber-300" />,
    },
    {
      label: '普通貯金 残高',
      value: totals.savings,
      color: 'text-teal-300',
      badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
      icon: <PiggyBank className="w-3.5 h-3.5 text-teal-300" />,
    },
    {
      label: '車維持費 残高',
      value: totals.car,
      color: 'text-sky-300',
      badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
      icon: <Car className="w-3.5 h-3.5 text-sky-300" />,
    },
    {
      label: '総資産 (合計)',
      value: totals.total,
      color: 'text-white font-bold',
      badgeBg: 'bg-white/10 text-white border-white/20',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-white" />,
      spanFull: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-[#1D212C] border border-white/5 p-3 flex flex-col justify-between hover:border-white/15 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-gray-400 font-medium truncate">{card.label}</span>
            <div className={`p-1 rounded-lg border ${card.badgeBg}`}>{card.icon}</div>
          </div>
          <div className={`text-base sm:text-lg font-semibold font-mono tracking-tight ${card.color}`}>
            {formatYen(card.value)}
          </div>
        </div>
      ))}
    </div>
  );
};
