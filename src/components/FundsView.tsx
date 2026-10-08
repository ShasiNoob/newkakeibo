import React, { useState } from 'react';
import { Wallet, ShieldCheck, Car, Coins, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatYen, monthLabel, fundTypeLabel, fundTypeColor } from '../api/client.ts';
import type { Fund, FundTotals, FundType } from '../types.ts';

interface FundsViewProps {
  funds: Fund[];
  totals: FundTotals;
}

export const FundsView: React.FC<FundsViewProps> = ({ funds, totals }) => {
  const [activeType, setActiveType] = useState<FundType>('free');

  const types: Array<{ type: FundType; label: string; icon: React.ReactNode; total: number }> = [
    { type: 'free', label: '自由資金', icon: <Coins className="w-4 h-4 text-amber-300" />, total: totals.free },
    { type: 'savings', label: '普通貯金', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, total: totals.savings },
    { type: 'car', label: '車維持費', icon: <Car className="w-4 h-4 text-sky-400" />, total: totals.car },
  ];

  const currentFunds = funds
    .filter((f) => f.type === activeType)
    .sort((a, b) => (a.sourceMonth < b.sourceMonth ? 1 : -1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white">資金プール・FIFO管理</h2>
        <p className="text-[11px] text-gray-400">
          収入から生成された資金の残高と、古い月から順に消費されるFIFO詳細
        </p>
      </div>

      {/* Type Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {types.map((t) => {
          const isActive = activeType === t.type;
          return (
            <button
              key={t.type}
              onClick={() => setActiveType(t.type)}
              className={`p-3 rounded-2xl border text-left transition ${
                isActive
                  ? 'bg-[#1D212C] border-[#D4A15C] shadow-lg ring-1 ring-[#D4A15C]'
                  : 'bg-[#1D212C]/60 border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center space-x-1.5 mb-1">
                {t.icon}
                <span className="text-xs font-semibold text-gray-200">{t.label}</span>
              </div>
              <p className="text-sm font-bold font-mono text-white tracking-tight">
                {formatYen(t.total)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Description of FIFO logic */}
      <div className="rounded-2xl bg-white/5 border border-white/5 p-3.5 text-xs text-gray-300 flex items-start space-x-2.5">
        <div className="p-1 rounded bg-[#D4A15C]/20 text-[#D4A15C] mt-0.5">
          <Wallet className="w-3.5 h-3.5" />
        </div>
        <div className="leading-relaxed text-[11px]">
          <strong>先入れ先出し (FIFO) ルール:</strong> 支出が発生すると、最も古い月の{fundTypeLabel(activeType)}から自動で消費されます。
          支出を削除した際は、消費された元のプールへ自動的に資金が戻されます。
        </div>
      </div>

      {/* Fund Pool Cards List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {fundTypeLabel(activeType)}の月別プール一覧 ({currentFunds.length}件)
        </h3>

        {currentFunds.length === 0 ? (
          <div className="rounded-2xl bg-[#1D212C] border border-white/5 p-8 text-center text-gray-400 text-xs">
            {fundTypeLabel(activeType)}のプールはまだ登録されていません
          </div>
        ) : (
          currentFunds.map((fund) => {
            const consumed = fund.originalAmount - fund.remainingAmount;
            const percentRemaining =
              fund.originalAmount > 0
                ? Math.round((fund.remainingAmount / fund.originalAmount) * 100)
                : 0;

            const isDepleted = fund.remainingAmount === 0;

            return (
              <div
                key={fund.id}
                className={`rounded-2xl bg-[#1D212C] border p-4 transition ${
                  isDepleted
                    ? 'border-white/5 opacity-50'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      {monthLabel(fund.sourceMonth)} 発生分
                    </span>
                    {isDepleted ? (
                      <span className="text-[10px] bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full border border-gray-500/20">
                        全額使用済
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        残 {percentRemaining}%
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-white">
                      {formatYen(fund.remainingAmount)}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-1">
                      / {formatYen(fund.originalAmount)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-white/10 overflow-hidden my-2">
                  <div
                    style={{ width: `${percentRemaining}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      activeType === 'free'
                        ? 'bg-amber-400'
                        : activeType === 'savings'
                        ? 'bg-emerald-400'
                        : 'bg-sky-400'
                    }`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>使用済み: {formatYen(consumed)}</span>
                  <span>プールID: {fund.id.slice(0, 8)}...</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
