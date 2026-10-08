import React, { useState } from 'react';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Smartphone, Calendar, Sparkles, Gamepad2 } from 'lucide-react';
import { formatYen, monthLabel } from '../api/client.ts';
import { GamaguchiBar } from './GamaguchiBar.tsx';
import type { MonthSummary, FundTotals } from '../types.ts';

interface HeroCardProps {
  currentMonth: string;
  totals: FundTotals;
  summary?: MonthSummary;
  onOpenIncome: () => void;
  onOpenExpense: () => void;
  onOpenWidget: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  currentMonth,
  totals,
  onOpenIncome,
  onOpenExpense,
  onOpenWidget,
}) => {
  const [showGameStyle, setShowGameStyle] = useState(false);
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDay - now.getDate() + 1);
  const dailyBudget = Math.max(0, Math.floor(totals.free / daysLeft));

  let healthColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  let healthText = '余裕あり';
  if (totals.free < 10000) {
    healthColor = 'bg-red-500/20 text-red-400 border-red-500/30';
    healthText = '要節約';
  } else if (totals.free < 30000 || dailyBudget < 1500) {
    healthColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    healthText = 'ペース注意';
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1F2C] via-[#232939] to-[#161A24] border border-white/10 p-5 shadow-2xl">
      {/* Decorative ambient glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#D4A15C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#6FAE9C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-[#D4A15C]" />
          <span className="text-xs uppercase font-medium tracking-wider text-gray-400">
            {monthLabel(currentMonth)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGameStyle(!showGameStyle)}
            className={`flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
              showGameStyle
                ? 'bg-blue-600 text-yellow-300 border-yellow-400 font-bold shadow-sm'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
            }`}
            title="がま口ゲームHUD表示に切り替え"
          >
            <Gamepad2 className="w-3 h-3 text-yellow-300" />
            <span>がま口表示</span>
          </button>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${healthColor}`}>
            {healthText}
          </span>
          <button
            onClick={onOpenWidget}
            className="flex items-center space-x-1 text-[11px] bg-white/10 hover:bg-white/15 active:scale-95 text-[#D4A15C] px-2.5 py-0.5 rounded-full border border-[#D4A15C]/30 transition"
            title="iPhoneウィジェットで常時表示"
          >
            <Smartphone className="w-3 h-3" />
            <span>ウィジェット</span>
          </button>
        </div>
      </div>

      {/* Main Focus: Free Spending Amount */}
      <div className="relative z-10">
        <p className="text-xs text-gray-300 font-medium">今月あと自由に使える金額</p>
        
        {showGameStyle ? (
          <div className="my-2.5">
            <GamaguchiBar amount={totals.free} unit="円" size="lg" showBg={true} />
          </div>
        ) : (
          <div className="flex items-baseline space-x-2 my-1">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
              {formatYen(totals.free)}
            </h1>
          </div>
        )}

        {/* Daily Pace Calculation */}
        <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#D4A15C]" />
            <span>
              1日あたりの目安: <strong className="text-white font-semibold">{formatYen(dailyBudget)}</strong> / 日
            </span>
          </div>
          <span className="text-gray-400 text-[11px]">
            残 {daysLeft} 日
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 relative z-10">
        <button
          onClick={onOpenExpense}
          className="flex items-center justify-center space-x-1.5 bg-[#D4A15C] hover:bg-[#c2914c] active:scale-98 text-[#14171F] font-bold text-xs py-2.5 px-3 rounded-xl shadow-md transition"
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>支出を記録</span>
        </button>
        <button
          onClick={onOpenIncome}
          className="flex items-center justify-center space-x-1.5 bg-white/10 hover:bg-white/15 active:scale-98 text-white font-semibold text-xs py-2.5 px-3 rounded-xl border border-white/10 transition"
        >
          <ArrowUpCircle className="w-4 h-4 text-emerald-400" />
          <span>収入を記録</span>
        </button>
      </div>
    </div>
  );
};
