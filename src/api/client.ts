import type {
  Fund,
  FundType,
  Income,
  Expense,
  Settings,
  FundTotals,
  WidgetPayload,
} from '../types.ts';
import { ClientStore, normalizeSettings } from '../db/clientStore.ts';

export interface SummaryResponse {
  currentMonth: string;
  fundTotals: FundTotals;
  incomes: Income[];
  expenses: Expense[];
  funds: Fund[];
  settings: Settings;
  allMonths: string[];
  lastUpdated: string;
}

export function formatYen(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '¥0';
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

export function monthLabel(m: string): string {
  if (!m) return '';
  const parts = m.split('-');
  if (parts.length < 2) return m;
  return `${parts[0]}年${parseInt(parts[1], 10)}月`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function thisMonthISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function fundTypeLabel(type: FundType | string): string {
  switch (type) {
    case 'free':
      return '自由資金';
    case 'savings':
      return '普通貯金';
    case 'car':
      return '車維持費';
    default:
      return type;
  }
}

export function fundTypeColor(type: FundType | string): {
  text: string;
  bg: string;
  border: string;
  accent: string;
} {
  switch (type) {
    case 'free':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-400/10',
        border: 'border-amber-400/30',
        accent: '#D4A15C',
      };
    case 'savings':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/30',
        accent: '#6FAE9C',
      };
    case 'car':
      return {
        text: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/30',
        accent: '#8FB3D9',
      };
    default:
      return {
        text: 'text-gray-400',
        bg: 'bg-gray-400/10',
        border: 'border-gray-400/30',
        accent: '#A0AEC0',
      };
  }
}

function buildLocalSummary(): SummaryResponse {
  const db = ClientStore.load();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fundTotals = ClientStore.getFundTotals(db.funds);

  const allMonthsSet = new Set<string>();
  db.incomes.forEach((i) => allMonthsSet.add(i.month));
  db.expenses.forEach((e) => allMonthsSet.add(e.month));
  if (!allMonthsSet.has(currentMonth)) allMonthsSet.add(currentMonth);
  const allMonths = Array.from(allMonthsSet).sort();

  return {
    currentMonth,
    fundTotals,
    incomes: db.incomes,
    expenses: db.expenses,
    funds: db.funds,
    settings: normalizeSettings(db.settings),
    allMonths,
    lastUpdated: db.lastUpdated,
  };
}

export const Api = {
  async getSummary(): Promise<SummaryResponse> {
    // 1. Always have local state ready immediately
    const local = buildLocalSummary();

    // 2. Try fetching from server in background/online mode
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('/api/summary', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.incomes) && Array.isArray(data.expenses) && Array.isArray(data.funds)) {
          // Sync server data to local
          ClientStore.save({
            incomes: data.incomes,
            expenses: data.expenses,
            funds: data.funds,
            settings: normalizeSettings(data.settings),
            lastUpdated: data.lastUpdated || new Date().toISOString(),
          });
          return buildLocalSummary();
        }
      }
    } catch {
      // Offline or static Vercel deployment: seamlessly use local data!
    }

    return local;
  },

  async getWidgetData(): Promise<WidgetPayload> {
    try {
      const res = await fetch('/api/widget');
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Local fallback calculation
    }

    const summary = buildLocalSummary();
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftInMonth = Math.max(1, lastDayOfMonth - now.getDate() + 1);
    const dailyBudget = Math.max(0, Math.floor(summary.fundTotals.free / daysLeftInMonth));

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return {
      status: 'ok',
      title: '家計簿 残高ウィジェット',
      freeBalance: summary.fundTotals.free,
      formattedFreeBalance: formatYen(summary.fundTotals.free),
      savingsBalance: summary.fundTotals.savings,
      formattedSavingsBalance: formatYen(summary.fundTotals.savings),
      carBalance: summary.fundTotals.car,
      formattedCarBalance: formatYen(summary.fundTotals.car),
      totalAssets: summary.fundTotals.total,
      formattedTotalAssets: formatYen(summary.fundTotals.total),
      thisMonthIncome: summary.incomes.filter((i) => i.month === summary.currentMonth).reduce((s, i) => s + i.amount, 0),
      thisMonthExpense: summary.expenses.filter((e) => e.month === summary.currentMonth).reduce((s, e) => s + e.amount, 0),
      currentMonth: summary.currentMonth,
      monthLabel: monthLabel(summary.currentMonth),
      daysLeftInMonth,
      dailyBudget,
      formattedDailyBudget: formatYen(dailyBudget),
      healthStatus: summary.fundTotals.free < 10000 ? 'critical' : summary.fundTotals.free < 30000 ? 'warning' : 'healthy',
      healthLabel: summary.fundTotals.free < 10000 ? '要節約' : summary.fundTotals.free < 30000 ? '注意' : '順調',
      recentExpenses: [...summary.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5).map((e) => ({
        id: e.id,
        name: e.name,
        amount: e.amount,
        formattedAmount: formatYen(e.amount),
        category: e.category,
        date: e.date,
      })),
      updatedAt: new Date().toISOString(),
      appUrl: origin,
    };
  },

  async addIncome(data: {
    year: number;
    month: number;
    amount: number;
    normalSavingsAmount?: number;
    carMaintenanceAmount?: number;
    memo?: string;
  }): Promise<{ income: Income; fundTotals: FundTotals }> {
    // 1. Update client local storage immediately (always succeeds!)
    const localResult = ClientStore.addIncome(data);

    // 2. Sync to server in background if available
    try {
      fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}

    return localResult;
  },

  async deleteIncome(id: string): Promise<void> {
    ClientStore.deleteIncome(id);
    try {
      fetch(`/api/incomes/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
  },

  async addExpense(data: {
    date: string;
    amount: number;
    category?: string;
    name?: string;
    memo?: string;
    requestedByType?: Array<{ type: FundType; amount: number }>;
  }): Promise<{ expense: Expense; shortfall: Array<{ type: FundType; missing: number }>; fundTotals: FundTotals }> {
    // 1. Update client local storage immediately (always succeeds!)
    const localResult = ClientStore.addExpense(data);

    // 2. Sync to server in background if available
    try {
      fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}

    return localResult;
  },

  async deleteExpense(id: string): Promise<void> {
    ClientStore.deleteExpense(id);
    try {
      fetch(`/api/expenses/${id}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
  },

  async updateSettings(settings: Partial<Settings>): Promise<{ settings: Settings }> {
    const localResult = ClientStore.updateSettings(settings);
    try {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }).catch(() => {});
    } catch {}
    return localResult;
  },

  async resetData(): Promise<void> {
    ClientStore.resetData();
    try {
      fetch('/api/reset', { method: 'POST' }).catch(() => {});
    } catch {}
  },

  async exportData(): Promise<any> {
    return ClientStore.exportData();
  },

  async importData(data: any): Promise<void> {
    // 1. Import locally immediately (auto-normalizes format!)
    ClientStore.importData(data);

    // 2. Sync to server in background if available
    try {
      fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    } catch {}
  },
};
