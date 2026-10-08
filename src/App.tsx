import React, { useState, useEffect, useCallback } from 'react';
import {
  Smartphone,
  RefreshCw,
  Plus,
  Coins,
  ChevronRight,
  Sparkles,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { Api, formatYen, monthLabel, thisMonthISO } from './api/client.ts';
import type {
  FundTotals,
  Income,
  Expense,
  Fund,
  Settings,
} from './types.ts';
import { BottomNav, type TabType } from './components/BottomNav.tsx';
import { HeroCard } from './components/HeroCard.tsx';
import { StatGrid } from './components/StatGrid.tsx';
import { WidgetStudio } from './components/WidgetStudio.tsx';
import { TransactionList } from './components/TransactionList.tsx';
import { ChartsView } from './components/ChartsView.tsx';
import { FundsView } from './components/FundsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { IncomeModal } from './components/modals/IncomeModal.tsx';
import { ExpenseModal } from './components/modals/ExpenseModal.tsx';
import { ExpenseDetailModal } from './components/modals/ExpenseDetailModal.tsx';

export default function App() {
  const [tab, setTab] = useState<TabType>('home');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Database State
  const [currentMonth, setCurrentMonth] = useState<string>(thisMonthISO());
  const [totals, setTotals] = useState<FundTotals>({ free: 0, savings: 0, car: 0, total: 0 });
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [settings, setSettings] = useState<Settings>({
    normalSavingsDefault: 10000,
    carMaintenanceDefault: 10000,
    categories: ['食費', '交通費', '車', 'DJ・音楽', 'PC・ゲーム', 'ファッション', '趣味', '日用品', '娯楽', 'その他'],
  });

  // Modal State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast((cur) => (cur?.message === message ? null : cur));
    }, 2800);
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await Api.getSummary();
      setCurrentMonth(data.currentMonth);
      setTotals(data.fundTotals);
      setIncomes(data.incomes);
      setExpenses(data.expenses);
      setFunds(data.funds);
      setSettings(data.settings);
    } catch (err: any) {
      console.error(err);
      showToast('データの読み込みに失敗しました', true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current month aggregates
  const thisMonthExpenses = expenses.filter((e) => e.month === currentMonth);
  const thisMonthIncomes = incomes.filter((i) => i.month === currentMonth);
  const incomeTotal = thisMonthIncomes.reduce((s, i) => s + i.amount, 0);
  const expenseTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14171F] flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-8 h-8 border-2 border-[#D4A15C] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 font-medium">家計簿を読み込み中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14171F] text-[#ECEBE6] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#14171F]/80 backdrop-blur-xl border-b border-white/5 px-4 pt-[max(env(safe-area-inset-top),10px)] pb-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4A15C]" />
            <span className="text-sm font-bold tracking-tight text-white">家計簿</span>
            <span className="text-[10px] text-gray-400 font-medium bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
              {monthLabel(currentMonth)}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setTab('widget')}
              className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full border transition ${
                tab === 'widget'
                  ? 'bg-[#D4A15C] text-black border-[#D4A15C] font-bold shadow'
                  : 'bg-white/5 hover:bg-white/10 text-[#D4A15C] border-[#D4A15C]/30'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px]">iPhone連携</span>
            </button>

            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
              title="データを更新"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-3 pb-24">
        {/* TAB 1: HOME */}
        {tab === 'home' && (
          <div className="space-y-4 animate-fade-in">
            {/* Hero Card */}
            <HeroCard
              currentMonth={currentMonth}
              totals={totals}
              onOpenIncome={() => setIsIncomeModalOpen(true)}
              onOpenExpense={() => setIsExpenseModalOpen(true)}
              onOpenWidget={() => setTab('widget')}
            />

            {/* iPhone Widget Promotion Banner */}
            <div
              onClick={() => setTab('widget')}
              className="rounded-2xl bg-gradient-to-r from-[#D4A15C]/20 via-[#1D212C] to-[#1D212C] border border-[#D4A15C]/30 p-3.5 flex items-center justify-between cursor-pointer hover:border-[#D4A15C]/60 transition active:scale-[0.99] group shadow-md"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#D4A15C]/20 text-[#D4A15C]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#D4A15C] transition flex items-center space-x-1">
                    <span>iPhoneのウィジェットに表示する</span>
                    <Sparkles className="w-3 h-3 text-[#D4A15C]" />
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    ホーム画面で「自由に使える残高」をいつでも確認
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
            </div>

            {/* 6 Stats Grid */}
            <StatGrid
              incomeTotal={incomeTotal}
              expenseTotal={expenseTotal}
              totals={totals}
            />

            {/* Recent Expenses List Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  最近の支出
                </h3>
                <button
                  onClick={() => setTab('transactions')}
                  className="text-[11px] text-[#D4A15C] hover:underline"
                >
                  すべて見る ({expenses.length}件)
                </button>
              </div>

              {expenses.slice(0, 4).map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpense(exp)}
                  className="rounded-2xl bg-[#1D212C] border border-white/5 hover:border-white/10 p-3 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                      <ArrowDownCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        {exp.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {exp.date} • {exp.category}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-rose-400">
                    -{formatYen(exp.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTIONS */}
        {tab === 'transactions' && (
          <TransactionList
            incomes={incomes}
            expenses={expenses}
            onSelectExpense={(exp) => setSelectedExpense(exp)}
            onOpenIncome={() => setIsIncomeModalOpen(true)}
            onOpenExpense={() => setIsExpenseModalOpen(true)}
          />
        )}

        {/* TAB 3: CHARTS */}
        {tab === 'charts' && (
          <ChartsView
            incomes={incomes}
            expenses={expenses}
            totals={totals}
          />
        )}

        {/* TAB 4: FUNDS */}
        {tab === 'funds' && (
          <FundsView funds={funds} totals={totals} />
        )}

        {/* TAB 5: WIDGET STUDIO (Core answer to user request) */}
        {tab === 'widget' && (
          <WidgetStudio
            totals={totals}
            currentMonth={monthLabel(currentMonth)}
          />
        )}

        {/* TAB 6: SETTINGS */}
        {tab === 'settings' && (
          <SettingsView
            settings={settings}
            expenses={expenses}
            onRefresh={() => loadData(true)}
            onToast={showToast}
          />
        )}
      </main>

      {/* Modals */}
      {isIncomeModalOpen && (
        <IncomeModal
          settings={settings}
          onClose={() => setIsIncomeModalOpen(false)}
          onSuccess={() => loadData(true)}
          onToast={showToast}
        />
      )}

      {isExpenseModalOpen && (
        <ExpenseModal
          settings={settings}
          totals={totals}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={() => loadData(true)}
          onToast={showToast}
        />
      )}

      {selectedExpense && (
        <ExpenseDetailModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onSuccess={() => loadData(true)}
          onToast={showToast}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav currentTab={tab} onTabChange={setTab} />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm px-4 py-2.5 rounded-2xl text-xs font-semibold shadow-2xl flex items-center space-x-2 transition-all ${
            toast.isError
              ? 'bg-rose-500 text-white'
              : 'bg-[#D4A15C] text-black'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
