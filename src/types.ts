export type FundType = 'free' | 'savings' | 'car';

export interface Fund {
  id: string;
  type: FundType;
  sourceMonth: string;
  originalAmount: number;
  remainingAmount: number;
  incomeId: string;
}

export interface FundAllocation {
  fundId: string;
  sourceMonth: string;
  type: FundType;
  amount: number;
}

export interface Income {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  amount: number;
  normalSavingsAmount: number;
  carMaintenanceAmount: number;
  freeAmount: number;
  memo?: string;
  createdAt?: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  amount: number;
  category: string;
  name: string;
  memo?: string;
  allocations: FundAllocation[];
  createdAt?: string;
}

export interface Settings {
  normalSavingsDefault: number;
  carMaintenanceDefault: number;
  categories: string[];
  widgetSecretKey?: string;
}

export interface FundTotals {
  free: number;
  savings: number;
  car: number;
  total: number;
}

export interface MonthSummary {
  monthStr: string;
  incomes: Income[];
  expenses: Expense[];
  incomeTotal: number;
  expenseTotal: number;
  savings: number;
  car: number;
  free: number;
}

export interface WidgetPayload {
  status: 'ok';
  title: string;
  freeBalance: number;
  formattedFreeBalance: string;
  savingsBalance: number;
  formattedSavingsBalance: string;
  carBalance: number;
  formattedCarBalance: string;
  totalAssets: number;
  formattedTotalAssets: string;
  thisMonthIncome: number;
  thisMonthExpense: number;
  currentMonth: string;
  monthLabel: string;
  daysLeftInMonth: number;
  dailyBudget: number;
  formattedDailyBudget: string;
  healthStatus: 'healthy' | 'warning' | 'critical';
  healthLabel: string;
  recentExpenses: Array<{
    id: string;
    name: string;
    amount: number;
    formattedAmount: string;
    category: string;
    date: string;
  }>;
  updatedAt: string;
  appUrl: string;
}
