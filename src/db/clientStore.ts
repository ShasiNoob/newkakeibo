import type {
  Fund,
  FundAllocation,
  FundType,
  Income,
  Expense,
  Settings,
  FundTotals,
  WidgetPayload,
} from '../types.ts';

const STORAGE_KEY = 'kakeibo_data_v1';

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const DEFAULT_SETTINGS: Settings = {
  normalSavingsDefault: 10000,
  carMaintenanceDefault: 10000,
  categories: ['食費', '交通費', '車', 'DJ・音楽', 'PC・ゲーム', 'ファッション', '趣味', '日用品', '娯楽', 'その他'],
  widgetSecretKey: 'kakeibo_widget_key_default',
};

export function normalizeSettings(raw: any): Settings {
  const result: Settings = {
    normalSavingsDefault: DEFAULT_SETTINGS.normalSavingsDefault,
    carMaintenanceDefault: DEFAULT_SETTINGS.carMaintenanceDefault,
    categories: [...DEFAULT_SETTINGS.categories],
    widgetSecretKey: DEFAULT_SETTINGS.widgetSecretKey,
  };

  if (!raw) return result;

  if (Array.isArray(raw)) {
    // Original ShasiNoob/kakeibo export: [{ key: 'categories', value: [...] }, ...]
    for (const item of raw) {
      if (item && item.key) {
        if (item.key === 'normalSavingsDefault' && typeof item.value === 'number') {
          result.normalSavingsDefault = item.value;
        } else if (item.key === 'carMaintenanceDefault' && typeof item.value === 'number') {
          result.carMaintenanceDefault = item.value;
        } else if (item.key === 'categories' && Array.isArray(item.value) && item.value.length > 0) {
          result.categories = item.value;
        } else if (item.key === 'widgetSecretKey') {
          result.widgetSecretKey = item.value;
        }
      }
    }
  } else if (typeof raw === 'object') {
    if (typeof raw.normalSavingsDefault === 'number') {
      result.normalSavingsDefault = raw.normalSavingsDefault;
    }
    if (typeof raw.carMaintenanceDefault === 'number') {
      result.carMaintenanceDefault = raw.carMaintenanceDefault;
    }
    if (Array.isArray(raw.categories) && raw.categories.length > 0) {
      result.categories = raw.categories;
    }
    if (raw.widgetSecretKey) {
      result.widgetSecretKey = raw.widgetSecretKey;
    }
  }

  if (!result.categories || result.categories.length === 0) {
    result.categories = [...DEFAULT_SETTINGS.categories];
  }

  return result;
}

export interface DatabaseState {
  incomes: Income[];
  expenses: Expense[];
  funds: Fund[];
  settings: Settings;
  lastUpdated: string;
}

// User's verified real data as initial seed
export const INITIAL_USER_DATA: DatabaseState = {
  incomes: [
    { id: "id_mtgwtmyy_zkjr1ym", date: "2025-10-01", month: "2025-10", amount: 11034, normalSavingsAmount: 0, carMaintenanceAmount: 0, freeAmount: 11034, memo: "" },
    { id: "id_mtgwula2_ond0brm", date: "2025-11-01", month: "2025-11", amount: 41684, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 21684, memo: "" },
    { id: "id_mtgwv3by_a1etxtw", date: "2025-12-01", month: "2025-12", amount: 42910, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 22910, memo: "" },
    { id: "id_mtgwve5d_mb1w9t0", date: "2026-01-01", month: "2026-01", amount: 55170, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 35170, memo: "" },
    { id: "id_mtgwvloy_n8ld5mw", date: "2026-02-01", month: "2026-02", amount: 55170, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 35170, memo: "" },
    { id: "id_mtgwvwt3_jul6dcm", date: "2026-03-01", month: "2026-03", amount: 53944, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 33944, memo: "" },
    { id: "id_mtgww53q_pzfdlrs", date: "2026-04-01", month: "2026-04", amount: 53944, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 33944, memo: "" },
    { id: "id_mtgwwe8t_uniux6g", date: "2026-05-01", month: "2026-05", amount: 42910, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 22910, memo: "" },
    { id: "id_mtgwwlwn_74psaey", date: "2026-06-01", month: "2026-06", amount: 55170, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 35170, memo: "" },
    { id: "id_mtgwwvaf_jnj4nsa", date: "2026-07-01", month: "2026-07", amount: 42910, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 22910, memo: "" },
    { id: "id_mtgwx4le_am4jzze", date: "2026-08-01", month: "2026-08", amount: 49040, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 29040, memo: "" },
    { id: "id_mtgwxddt_eqo6j48", date: "2026-09-01", month: "2026-09", amount: 61300, normalSavingsAmount: 10000, carMaintenanceAmount: 10000, freeAmount: 41300, memo: "" }
  ],
  funds: [
    { id: "id_mtgwtmz0_dk07pss", type: "free", sourceMonth: "2025-10", originalAmount: 11034, remainingAmount: 0, incomeId: "id_mtgwtmyy_zkjr1ym" },
    { id: "id_mtgwula5_5v4our3", type: "car", sourceMonth: "2025-11", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgwula2_ond0brm" },
    { id: "id_mtgwula5_mvgd3bf", type: "savings", sourceMonth: "2025-11", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwula2_ond0brm" },
    { id: "id_mtgwula5_nij8ne5", type: "free", sourceMonth: "2025-11", originalAmount: 21684, remainingAmount: 0, incomeId: "id_mtgwula2_ond0brm" },
    { id: "id_mtgwv3c0_fqntfk4", type: "car", sourceMonth: "2025-12", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgwv3by_a1etxtw" },
    { id: "id_mtgwv3c0_xvq3d48", type: "free", sourceMonth: "2025-12", originalAmount: 22910, remainingAmount: 0, incomeId: "id_mtgwv3by_a1etxtw" },
    { id: "id_mtgwv3c0_ya1mq0o", type: "savings", sourceMonth: "2025-12", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwv3by_a1etxtw" },
    { id: "id_mtgwve5e_5cjfgqp", type: "car", sourceMonth: "2026-01", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgwve5d_mb1w9t0" },
    { id: "id_mtgwve5e_wow6fvf", type: "savings", sourceMonth: "2026-01", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwve5d_mb1w9t0" },
    { id: "id_mtgwve5e_x7d6ccy", type: "free", sourceMonth: "2026-01", originalAmount: 35170, remainingAmount: 0, incomeId: "id_mtgwve5d_mb1w9t0" },
    { id: "id_mtgwvloy_94cdk3w", type: "car", sourceMonth: "2026-02", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgwvloy_n8ld5mw" },
    { id: "id_mtgwvloy_fzqdp5f", type: "savings", sourceMonth: "2026-02", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwvloy_n8ld5mw" },
    { id: "id_mtgwvloy_mtp7sbd", type: "free", sourceMonth: "2026-02", originalAmount: 35170, remainingAmount: 0, incomeId: "id_mtgwvloy_n8ld5mw" },
    { id: "id_mtgwvwt4_483v33x", type: "car", sourceMonth: "2026-03", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgwvwt3_jul6dcm" },
    { id: "id_mtgwvwt4_d4yrtov", type: "savings", sourceMonth: "2026-03", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwvwt3_jul6dcm" },
    { id: "id_mtgwvwt4_lonn3ot", type: "free", sourceMonth: "2026-03", originalAmount: 33944, remainingAmount: 10690, incomeId: "id_mtgwvwt3_jul6dcm" },
    { id: "id_mtgww53t_086p5kj", type: "free", sourceMonth: "2026-04", originalAmount: 33944, remainingAmount: 33944, incomeId: "id_mtgww53q_pzfdlrs" },
    { id: "id_mtgww53t_39e8bh6", type: "savings", sourceMonth: "2026-04", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgww53q_pzfdlrs" },
    { id: "id_mtgww53t_kd1f826", type: "car", sourceMonth: "2026-04", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgww53q_pzfdlrs" },
    { id: "id_mtgwwe8u_euj0hnk", type: "car", sourceMonth: "2026-05", originalAmount: 10000, remainingAmount: 0, incomeId: "id_mtgwwe8t_uniux6g" },
    { id: "id_mtgwwe8u_ghjl2ry", type: "free", sourceMonth: "2026-05", originalAmount: 22910, remainingAmount: 22910, incomeId: "id_mtgwwe8t_uniux6g" },
    { id: "id_mtgwwe8u_nzf8bya", type: "savings", sourceMonth: "2026-05", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwwe8t_uniux6g" },
    { id: "id_mtgwwlwo_croh9s9", type: "free", sourceMonth: "2026-06", originalAmount: 35170, remainingAmount: 35170, incomeId: "id_mtgwwlwn_74psaey" },
    { id: "id_mtgwwlwo_d7qq2db", type: "savings", sourceMonth: "2026-06", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwwlwn_74psaey" },
    { id: "id_mtgwwlwo_gcjmevz", type: "car", sourceMonth: "2026-06", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwwlwn_74psaey" },
    { id: "id_mtgwwvaf_gv9441j", type: "savings", sourceMonth: "2026-07", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwwvaf_jnj4nsa" },
    { id: "id_mtgwwvaf_jp05gc6", type: "free", sourceMonth: "2026-07", originalAmount: 22910, remainingAmount: 22910, incomeId: "id_mtgwwvaf_jnj4nsa" },
    { id: "id_mtgwwvaf_ne8v282", type: "car", sourceMonth: "2026-07", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwwvaf_jnj4nsa" },
    { id: "id_mtgwx4lf_0oqksb0", type: "free", sourceMonth: "2026-08", originalAmount: 29040, remainingAmount: 29040, incomeId: "id_mtgwx4le_am4jzze" },
    { id: "id_mtgwx4lf_sx8ikd4", type: "car", sourceMonth: "2026-08", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwx4le_am4jzze" },
    { id: "id_mtgwx4lf_xcc6g2q", type: "savings", sourceMonth: "2026-08", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwx4le_am4jzze" },
    { id: "id_mtgwxddu_0ch3p37", type: "car", sourceMonth: "2026-09", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwxddt_eqo6j48" },
    { id: "id_mtgwxddu_1gpdtca", type: "free", sourceMonth: "2026-09", originalAmount: 41300, remainingAmount: 41300, incomeId: "id_mtgwxddt_eqo6j48" },
    { id: "id_mtgwxddu_ioh0213", type: "savings", sourceMonth: "2026-09", originalAmount: 10000, remainingAmount: 10000, incomeId: "id_mtgwxddt_eqo6j48" }
  ],
  expenses: [
    { id: "id_mtgxrz1c_l8bhgru", date: "2026-03-24", month: "2026-03", amount: 5000, category: "車", name: "カスタム", memo: "", allocations: [{ fundId: "id_mtgwtmz0_dk07pss", sourceMonth: "2025-10", type: "free", amount: 5000 }] },
    { id: "id_mtgxsosc_f187fez", date: "2026-03-09", month: "2026-03", amount: 10000, category: "PC・ゲーム", name: "VRCHATアバター", memo: "", allocations: [{ fundId: "id_mtgwtmz0_dk07pss", sourceMonth: "2025-10", type: "free", amount: 6034 }, { fundId: "id_mtgwula5_nij8ne5", sourceMonth: "2025-11", type: "free", amount: 3966 }] },
    { id: "id_mtgxte9t_iu57oni", date: "2026-04-20", month: "2026-04", amount: 9000, category: "DJ・音楽", name: "エフェクター", memo: "", allocations: [{ fundId: "id_mtgwula5_nij8ne5", sourceMonth: "2025-11", type: "free", amount: 9000 }] },
    { id: "id_mtgxu1bb_ltzul41", date: "2026-05-22", month: "2026-05", amount: 5000, category: "趣味", name: "　", memo: "", allocations: [{ fundId: "id_mtgwula5_nij8ne5", sourceMonth: "2025-11", type: "free", amount: 5000 }] },
    { id: "id_mtgxvtpq_zih5jxp", date: "2025-12-24", month: "2025-12", amount: 17500, category: "車", name: "エアロ", memo: "", allocations: [{ fundId: "id_mtgwula5_nij8ne5", sourceMonth: "2025-11", type: "free", amount: 3718 }, { fundId: "id_mtgwv3c0_xvq3d48", sourceMonth: "2025-12", type: "free", amount: 13782 }] },
    { id: "id_mtgxwnnf_z7fu36a", date: "2025-12-08", month: "2025-12", amount: 38000, category: "車", name: "ステアリング", memo: "", allocations: [{ fundId: "id_mtgwv3c0_xvq3d48", sourceMonth: "2025-12", type: "free", amount: 9128 }, { fundId: "id_mtgwve5e_x7d6ccy", sourceMonth: "2026-01", type: "free", amount: 28872 }] },
    { id: "id_mtgxxlb2_5dxie7c", date: "2026-08-28", month: "2026-08", amount: 20222, category: "DJ・音楽", name: "DDJ-RB", memo: "", allocations: [{ fundId: "id_mtgwve5e_x7d6ccy", sourceMonth: "2026-01", type: "free", amount: 6298 }, { fundId: "id_mtgwvloy_mtp7sbd", sourceMonth: "2026-02", type: "free", amount: 13924 }] },
    { id: "id_mtgxy0n6_8b8umns", date: "2026-08-26", month: "2026-08", amount: 11000, category: "車", name: "ジャッキウマ", memo: "", allocations: [{ fundId: "id_mtgwvloy_mtp7sbd", sourceMonth: "2026-02", type: "free", amount: 11000 }] },
    { id: "id_mtgxyf21_fl1anvp", date: "2026-08-25", month: "2026-08", amount: 33500, category: "車", name: "ホイールタイヤ", memo: "", allocations: [{ fundId: "id_mtgwvloy_mtp7sbd", sourceMonth: "2026-02", type: "free", amount: 10246 }, { fundId: "id_mtgwvwt4_lonn3ot", sourceMonth: "2026-03", type: "free", amount: 23254 }] },
    { id: "id_mtgy6cfi_0np0hnr", date: "2026-07-10", month: "2026-07", amount: 70000, category: "車", name: "車検", memo: "", allocations: [{ fundId: "id_mtgwula5_5v4our3", sourceMonth: "2025-11", type: "car", amount: 10000 }, { fundId: "id_mtgwv3c0_fqntfk4", sourceMonth: "2025-12", type: "car", amount: 10000 }, { fundId: "id_mtgwve5e_5cjfgqp", sourceMonth: "2026-01", type: "car", amount: 10000 }, { fundId: "id_mtgwvloy_94cdk3w", sourceMonth: "2026-02", type: "car", amount: 10000 }, { fundId: "id_mtgwvwt4_483v33x", sourceMonth: "2026-03", type: "car", amount: 10000 }, { fundId: "id_mtgww53t_kd1f826", sourceMonth: "2026-04", type: "car", amount: 10000 }, { fundId: "id_mtgwwe8u_euj0hnk", sourceMonth: "2026-05", type: "car", amount: 10000 }] }
  ],
  settings: {
    normalSavingsDefault: 10000,
    carMaintenanceDefault: 10000,
    categories: ['食費', '交通費', '車', 'DJ・音楽', 'PC・ゲーム', 'ファッション', '趣味', '日用品', '娯楽', 'その他'],
    widgetSecretKey: 'kakeibo_widget_key_default',
  },
  lastUpdated: new Date().toISOString(),
};

export const ClientStore = {
  load(): DatabaseState {
    if (typeof window === 'undefined') return INITIAL_USER_DATA;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.incomes) && Array.isArray(parsed.expenses) && Array.isArray(parsed.funds)) {
          return {
            incomes: parsed.incomes,
            expenses: parsed.expenses,
            funds: parsed.funds,
            settings: normalizeSettings(parsed.settings),
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage, resetting to initial user data', e);
    }
    // Save initial user data
    this.save(INITIAL_USER_DATA);
    return INITIAL_USER_DATA;
  },

  save(data: DatabaseState): void {
    if (typeof window === 'undefined') return;
    try {
      data.lastUpdated = new Date().toISOString();
      data.settings = normalizeSettings(data.settings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  },

  getFundTotals(funds: Fund[]): FundTotals {
    const totals = { free: 0, savings: 0, car: 0, total: 0 };
    for (const f of funds) {
      if (f.type in totals) {
        totals[f.type as 'free' | 'savings' | 'car'] += f.remainingAmount;
      }
    }
    totals.total = totals.free + totals.savings + totals.car;
    return totals;
  },

  allocateFundsFIFO(funds: Fund[], requests: Array<{ type: FundType; amount: number }>) {
    const allocations: FundAllocation[] = [];
    const shortfall: Array<{ type: FundType; missing: number }> = [];

    for (const req of requests) {
      if (!req.amount || req.amount <= 0) continue;
      let remaining = req.amount;

      const pool = funds
        .filter((f) => f.type === req.type && f.remainingAmount > 0)
        .sort((a, b) => (a.sourceMonth < b.sourceMonth ? -1 : a.sourceMonth > b.sourceMonth ? 1 : 0));

      for (const fund of pool) {
        if (remaining <= 0) break;
        const use = Math.min(fund.remainingAmount, remaining);
        fund.remainingAmount -= use;
        remaining -= use;
        allocations.push({
          fundId: fund.id,
          sourceMonth: fund.sourceMonth,
          type: fund.type,
          amount: use,
        });
      }

      if (remaining > 0) {
        shortfall.push({ type: req.type, missing: remaining });
      }
    }

    return { allocations, shortfall };
  },

  restoreAllocations(funds: Fund[], allocations: FundAllocation[]) {
    if (!allocations || !allocations.length) return;
    for (const alloc of allocations) {
      const fund = funds.find((f) => f.id === alloc.fundId);
      if (fund) {
        fund.remainingAmount += alloc.amount;
      }
    }
  },

  addIncome(data: {
    year: number;
    month: number;
    amount: number;
    normalSavingsAmount?: number;
    carMaintenanceAmount?: number;
    memo?: string;
  }) {
    const db = this.load();
    const numAmount = Number(data.amount);
    const numSavings = Number(data.normalSavingsAmount) || 0;
    const numCar = Number(data.carMaintenanceAmount) || 0;
    const numFree = numAmount - numSavings - numCar;
    const monthStr = `${data.year}-${String(data.month).padStart(2, '0')}`;

    const income: Income = {
      id: uid('inc'),
      date: `${monthStr}-01`,
      month: monthStr,
      amount: numAmount,
      normalSavingsAmount: numSavings,
      carMaintenanceAmount: numCar,
      freeAmount: numFree,
      memo: String(data.memo || '').trim(),
      createdAt: new Date().toISOString(),
    };

    db.incomes.push(income);

    if (numSavings > 0) {
      db.funds.push({
        id: uid('fnd'),
        type: 'savings',
        sourceMonth: monthStr,
        originalAmount: numSavings,
        remainingAmount: numSavings,
        incomeId: income.id,
      });
    }

    if (numCar > 0) {
      db.funds.push({
        id: uid('fnd'),
        type: 'car',
        sourceMonth: monthStr,
        originalAmount: numCar,
        remainingAmount: numCar,
        incomeId: income.id,
      });
    }

    if (numFree !== 0) {
      db.funds.push({
        id: uid('fnd'),
        type: 'free',
        sourceMonth: monthStr,
        originalAmount: numFree,
        remainingAmount: numFree,
        incomeId: income.id,
      });
    }

    this.save(db);
    return { income, fundTotals: this.getFundTotals(db.funds) };
  },

  deleteIncome(id: string) {
    const db = this.load();
    const relatedFunds = db.funds.filter((f) => f.incomeId === id);
    const consumed = relatedFunds.some((f) => f.remainingAmount !== f.originalAmount);

    if (consumed) {
      throw new Error('この収入から生まれた資金は既に一部使用されているため削除できません。支出を先に削除してください。');
    }

    db.funds = db.funds.filter((f) => f.incomeId !== id);
    db.incomes = db.incomes.filter((i) => i.id !== id);
    this.save(db);
    return { ok: true, fundTotals: this.getFundTotals(db.funds) };
  },

  addExpense(data: {
    date: string;
    amount: number;
    category?: string;
    name?: string;
    memo?: string;
    requestedByType?: Array<{ type: FundType; amount: number }>;
  }) {
    const db = this.load();
    const numAmount = Number(data.amount);
    const monthStr = data.date.slice(0, 7);
    const safeName = (data.name !== undefined && String(data.name).trim() !== '') ? String(data.name).trim() : '支出';
    const safeCategory = (data.category !== undefined && String(data.category).trim() !== '') ? String(data.category).trim() : 'その他';

    let requests: Array<{ type: FundType; amount: number }> = [];
    if (Array.isArray(data.requestedByType) && data.requestedByType.length > 0) {
      requests = data.requestedByType;
    } else {
      requests = [{ type: 'free', amount: numAmount }];
    }

    const { allocations, shortfall } = this.allocateFundsFIFO(db.funds, requests);

    const expense: Expense = {
      id: uid('exp'),
      date: data.date,
      month: monthStr,
      amount: numAmount,
      category: safeCategory,
      name: safeName,
      memo: String(data.memo || '').trim(),
      allocations,
      createdAt: new Date().toISOString(),
    };

    db.expenses.push(expense);
    this.save(db);

    return {
      expense,
      shortfall,
      fundTotals: this.getFundTotals(db.funds),
    };
  },

  deleteExpense(id: string) {
    const db = this.load();
    const exp = db.expenses.find((e) => e.id === id);
    if (!exp) throw new Error('支出が見つかりません');

    this.restoreAllocations(db.funds, exp.allocations);
    db.expenses = db.expenses.filter((e) => e.id !== id);
    this.save(db);
    return { ok: true, fundTotals: this.getFundTotals(db.funds) };
  },

  updateSettings(settings: Partial<Settings>) {
    const db = this.load();
    if (settings.normalSavingsDefault !== undefined) db.settings.normalSavingsDefault = Number(settings.normalSavingsDefault);
    if (settings.carMaintenanceDefault !== undefined) db.settings.carMaintenanceDefault = Number(settings.carMaintenanceDefault);
    if (Array.isArray(settings.categories)) db.settings.categories = settings.categories;
    if (settings.widgetSecretKey !== undefined) db.settings.widgetSecretKey = settings.widgetSecretKey;
    db.settings = normalizeSettings(db.settings);
    this.save(db);
    return { settings: db.settings };
  },

  importData(data: any) {
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    if (!data || !Array.isArray(data.incomes) || !Array.isArray(data.expenses) || !Array.isArray(data.funds)) {
      throw new Error('バックアップデータの形式が正しくありません。(incomes, expenses, funds配列が必要です)');
    }

    const newState: DatabaseState = {
      incomes: data.incomes,
      expenses: data.expenses,
      funds: data.funds,
      settings: normalizeSettings(data.settings),
      lastUpdated: new Date().toISOString(),
    };

    this.save(newState);
    return { ok: true, fundTotals: this.getFundTotals(newState.funds) };
  },

  exportData(): DatabaseState {
    return this.load();
  },

  resetData(): void {
    this.save(INITIAL_USER_DATA);
  },
};
