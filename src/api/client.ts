import type {
  Fund,
  FundType,
  Income,
  Expense,
  Settings,
  FundTotals,
  WidgetPayload,
} from '../types.ts';

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

export const Api = {
  async getSummary(): Promise<SummaryResponse> {
    const res = await fetch('/api/summary');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async getWidgetData(): Promise<WidgetPayload> {
    const res = await fetch('/api/widget');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },

  async addIncome(data: {
    year: number;
    month: number;
    amount: number;
    normalSavingsAmount: number;
    carMaintenanceAmount: number;
    memo?: string;
  }): Promise<{ income: Income; fundTotals: FundTotals }> {
    const res = await fetch('/api/incomes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '収入の登録に失敗しました');
    }
    return res.json();
  },

  async deleteIncome(id: string): Promise<void> {
    const res = await fetch(`/api/incomes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '収入の削除に失敗しました');
    }
  },

  async addExpense(data: {
    date: string;
    amount: number;
    category: string;
    name: string;
    memo?: string;
    requestedByType?: Array<{ type: FundType; amount: number }>;
  }): Promise<{ expense: Expense; shortfall: Array<{ type: FundType; missing: number }>; fundTotals: FundTotals }> {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '支出の登録に失敗しました');
    }
    return res.json();
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '支出の削除に失敗しました');
    }
  },

  async updateSettings(settings: Partial<Settings>): Promise<{ settings: Settings }> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('設定の更新に失敗しました');
    return res.json();
  },

  async resetData(): Promise<void> {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('リセットに失敗しました');
  },

  async clearData(): Promise<void> {
    const res = await fetch('/api/clear', { method: 'POST' });
    if (!res.ok) throw new Error('データの全消去に失敗しました');
  },

  async exportData(): Promise<any> {
    const res = await fetch('/api/export');
    return res.json();
  },

  async importData(data: any): Promise<void> {
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'インポートに失敗しました');
    }
  },
};
