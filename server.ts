import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';
import type {
  Fund,
  FundAllocation,
  FundType,
  Income,
  Expense,
  Settings,
  WidgetPayload,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'kakeibo-db.json');

app.use(express.json());

// Enable CORS for external widgets / scriptable requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_SETTINGS: Settings = {
  normalSavingsDefault: 10000,
  carMaintenanceDefault: 10000,
  categories: ['食費', '交通費', '車', 'DJ・音楽', 'PC・ゲーム', 'ファッション', '趣味', '日用品', '娯楽', 'その他'],
  widgetSecretKey: 'kakeibo_widget_key_default',
};

interface DatabaseSchema {
  incomes: Income[];
  expenses: Expense[];
  funds: Fund[];
  settings: Settings;
  lastUpdated: string;
}

function getInitialDatabase(): DatabaseSchema {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const incomeId = uid('inc');
  const sampleIncome: Income = {
    id: incomeId,
    date: `${monthStr}-01`,
    month: monthStr,
    amount: 250000,
    normalSavingsAmount: 30000,
    carMaintenanceAmount: 15000,
    freeAmount: 205000,
    memo: '給与 (サンプルデータ)',
    createdAt: new Date().toISOString(),
  };

  const sampleFunds: Fund[] = [
    {
      id: uid('fnd'),
      type: 'savings',
      sourceMonth: monthStr,
      originalAmount: 30000,
      remainingAmount: 30000,
      incomeId,
    },
    {
      id: uid('fnd'),
      type: 'car',
      sourceMonth: monthStr,
      originalAmount: 15000,
      remainingAmount: 15000,
      incomeId,
    },
    {
      id: uid('fnd'),
      type: 'free',
      sourceMonth: monthStr,
      originalAmount: 205000,
      remainingAmount: 181200, // after sample expenses
      incomeId,
    },
  ];

  const sampleExpenses: Expense[] = [
    {
      id: uid('exp'),
      date: `${monthStr}-02`,
      month: monthStr,
      amount: 15800,
      category: '食費',
      name: '週末買い出し（スーパー）',
      memo: '食材まとめ買い',
      allocations: [
        {
          fundId: sampleFunds[2].id,
          sourceMonth: monthStr,
          type: 'free',
          amount: 15800,
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: uid('exp'),
      date: `${monthStr}-05`,
      month: monthStr,
      amount: 8000,
      category: '趣味',
      name: '書籍・カフェ利用',
      memo: '勉強と息抜き',
      allocations: [
        {
          fundId: sampleFunds[2].id,
          sourceMonth: monthStr,
          type: 'free',
          amount: 8000,
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    incomes: [sampleIncome],
    expenses: sampleExpenses,
    funds: sampleFunds,
    settings: { ...DEFAULT_SETTINGS },
    lastUpdated: new Date().toISOString(),
  };
}

let memoryDb: DatabaseSchema = getInitialDatabase();

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.incomes) && Array.isArray(parsed.expenses) && Array.isArray(parsed.funds)) {
        memoryDb = parsed;
        return memoryDb;
      }
    }
    saveDatabase(memoryDb);
  } catch (err) {
    console.error('Failed to load DB file, using memory fallback:', err);
  }
  return memoryDb;
}

function saveDatabase(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    data.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write DB file:', err);
  }
}

// Initialize DB on boot
loadDatabase();

// --- Logic Helpers ---
function formatYen(n: number): string {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

function getFundTotals(funds: Fund[]) {
  const totals = { free: 0, savings: 0, car: 0, total: 0 };
  for (const f of funds) {
    if (f.type in totals) {
      totals[f.type as 'free' | 'savings' | 'car'] += f.remainingAmount;
    }
  }
  totals.total = totals.free + totals.savings + totals.car;
  return totals;
}

function allocateFundsFIFO(funds: Fund[], requestedByType: Array<{ type: FundType; amount: number }>) {
  const allocations: FundAllocation[] = [];
  const shortfall: Array<{ type: FundType; missing: number }> = [];

  for (const req of requestedByType) {
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
}

function restoreAllocations(funds: Fund[], allocations: FundAllocation[]) {
  if (!allocations || !allocations.length) return;
  for (const alloc of allocations) {
    const fund = funds.find((f) => f.id === alloc.fundId);
    if (fund) {
      fund.remainingAmount += alloc.amount;
    }
  }
}

function buildWidgetPayload(req: Request): WidgetPayload {
  const db = memoryDb;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthLabel = `${now.getFullYear()}年${now.getMonth() + 1}月`;

  const fundTotals = getFundTotals(db.funds);
  const thisMonthExpenses = db.expenses.filter((e) => e.month === currentMonth);
  const thisMonthIncomes = db.incomes.filter((i) => i.month === currentMonth);

  const totalExpense = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = thisMonthIncomes.reduce((s, i) => s + i.amount, 0);

  // Calculate days left in month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeftInMonth = Math.max(1, lastDayOfMonth - currentDay + 1);

  const dailyBudget = Math.max(0, Math.floor(fundTotals.free / daysLeftInMonth));

  // Determine financial health
  let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
  let healthLabel = '順調';
  if (fundTotals.free < 10000) {
    healthStatus = 'critical';
    healthLabel = '要節約';
  } else if (fundTotals.free < 30000 || dailyBudget < 1500) {
    healthStatus = 'warning';
    healthLabel = '注意';
  }

  const sortedExpenses = [...db.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const appUrl = `${protocol}://${host}`;

  return {
    status: 'ok',
    title: '家計簿 残高ウィジェット',
    freeBalance: fundTotals.free,
    formattedFreeBalance: formatYen(fundTotals.free),
    savingsBalance: fundTotals.savings,
    formattedSavingsBalance: formatYen(fundTotals.savings),
    carBalance: fundTotals.car,
    formattedCarBalance: formatYen(fundTotals.car),
    totalAssets: fundTotals.total,
    formattedTotalAssets: formatYen(fundTotals.total),
    thisMonthIncome: totalIncome,
    thisMonthExpense: totalExpense,
    currentMonth,
    monthLabel,
    daysLeftInMonth,
    dailyBudget,
    formattedDailyBudget: formatYen(dailyBudget),
    healthStatus,
    healthLabel,
    recentExpenses: sortedExpenses.map((e) => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
      formattedAmount: formatYen(e.amount),
      category: e.category,
      date: e.date,
    })),
    updatedAt: new Date().toISOString(),
    appUrl,
  };
}

// ================= API ROUTES =================

// GET /api/summary - Full state for client
app.get('/api/summary', (req: Request, res: Response) => {
  const db = memoryDb;
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const fundTotals = getFundTotals(db.funds);

  // Group months
  const allMonthsSet = new Set<string>();
  db.incomes.forEach((i) => allMonthsSet.add(i.month));
  db.expenses.forEach((e) => allMonthsSet.add(e.month));
  if (!allMonthsSet.has(currentMonth)) allMonthsSet.add(currentMonth);

  const allMonths = Array.from(allMonthsSet).sort();

  res.json({
    currentMonth,
    fundTotals,
    incomes: db.incomes,
    expenses: db.expenses,
    funds: db.funds,
    settings: db.settings,
    allMonths,
    lastUpdated: db.lastUpdated,
  });
});

// GET /api/widget - Dedicated iPhone Widget API
app.get('/api/widget', (req: Request, res: Response) => {
  const payload = buildWidgetPayload(req);
  res.json(payload);
});

// GET /api/widget/badge.svg - Optional dynamic SVG widget / badge
app.get('/api/widget/badge.svg', (req: Request, res: Response) => {
  const payload = buildWidgetPayload(req);
  const color = payload.healthStatus === 'critical' ? '#E15554' : payload.healthStatus === 'warning' ? '#E1BC29' : '#3BB273';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150">
    <rect width="300" height="150" rx="24" fill="#14171F"/>
    <text x="24" y="38" fill="rgba(255,255,255,0.6)" font-size="13" font-family="-apple-system, sans-serif">今月あと自由に使える金額</text>
    <text x="24" y="86" fill="#F4E8D6" font-size="34" font-weight="700" font-family="-apple-system, sans-serif">${payload.formattedFreeBalance}</text>
    <circle cx="270" cy="34" r="6" fill="${color}" />
    <text x="24" y="122" fill="rgba(255,255,255,0.4)" font-size="12" font-family="-apple-system, sans-serif">1日あたり: ${payload.formattedDailyBudget}/日 (残${payload.daysLeftInMonth}日)</text>
  </svg>`;
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// GET /api/widget/gamaguchi.svg - Arcade Game HUD style coin counter bar matching uploaded image
app.get('/api/widget/gamaguchi.svg', (req: Request, res: Response) => {
  const payload = buildWidgetPayload(req);
  const queryAmount = req.query.amount ? Number(req.query.amount) : payload.freeBalance;
  const useComma = req.query.comma === '1';
  const size = req.query.size === 'small' ? 'small' : 'medium';
  const displayVal = useComma ? queryAmount.toLocaleString('ja-JP') : String(Math.round(queryAmount));

  if (size === 'small') {
    // SQUARE (Small 2x2 Widget Layout: 160x160)
    const numLen = displayVal.length;
    const numFontSize = numLen > 6 ? 25 : numLen > 5 ? 28 : 32;
    const unitFontSize = numLen > 6 ? 16 : 18;

    const smallSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="bgGradSm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3C7DF8" />
      <stop offset="55%" stop-color="#1B51BD" />
      <stop offset="100%" stop-color="#0F3389" />
    </linearGradient>
    <linearGradient id="pillGradSm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#081E5B" />
      <stop offset="100%" stop-color="#030D2C" />
    </linearGradient>
    <linearGradient id="goldGradSm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#FFF875" />
      <stop offset="60%" stop-color="#FFD600" />
      <stop offset="100%" stop-color="#FF9E00" />
    </linearGradient>
    <linearGradient id="purseGradSm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF3B30" />
      <stop offset="50%" stop-color="#E0281D" />
      <stop offset="100%" stop-color="#A8150D" />
    </linearGradient>
    <filter id="goldShadowSm" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="0" flood-color="#733E00" />
      <feDropShadow dx="0" dy="2.5" stdDeviation="1" flood-color="rgba(0,0,0,0.85)" />
    </filter>
  </defs>

  <!-- Outer Rounded Square -->
  <rect x="2" y="2" width="156" height="156" rx="28" fill="url(#bgGradSm)" stroke="#5E97FF" stroke-width="2" />

  <!-- Stars -->
  <text x="14" y="20" fill="rgba(255,255,255,0.45)" font-size="10">✦</text>
  <text x="136" y="22" fill="rgba(255,255,255,0.4)" font-size="11">★</text>
  <text x="18" y="146" fill="rgba(255,255,255,0.35)" font-size="10">★</text>
  <text x="138" y="146" fill="rgba(255,255,255,0.4)" font-size="9">✦</text>

  <!-- Top: Gamaguchi Icon + Title -->
  <g transform="translate(18, 14)">
    <!-- Purse -->
    <g transform="scale(0.75)">
      <circle cx="21" cy="9" r="4.2" fill="#FFE57F" stroke="#111" stroke-width="2" />
      <circle cx="20" cy="7.5" r="1.3" fill="#FFF" />
      <circle cx="29" cy="9" r="4.2" fill="#FFE57F" stroke="#111" stroke-width="2" />
      <circle cx="28" cy="7.5" r="1.3" fill="#FFF" />
      <path d="M 13 18 C 17 12, 33 12, 37 18 C 37 20, 13 20, 13 18 Z" fill="#FFCA28" stroke="#111" stroke-width="2" />
      <path d="M 13 19 C 8 24, 6 34, 9 41 C 12 47, 38 47, 41 41 C 44 34, 42 24, 37 19 Z" fill="url(#purseGradSm)" stroke="#111" stroke-width="2" />
      <path d="M 17 19 C 16 26, 16 36, 20 43" stroke="#8E0000" stroke-width="1.8" fill="none" />
      <path d="M 33 19 C 34 26, 34 36, 30 43" stroke="#8E0000" stroke-width="1.8" fill="none" />
      <path d="M 12 27 C 10 32, 11 37, 14 39" stroke="#FFA49D" stroke-width="1.8" fill="none" stroke-linecap="round" />
    </g>
    <!-- Label -->
    <text x="44" y="26" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="14" fill="#FFF566" filter="url(#goldShadowSm)">自由残高</text>
  </g>

  <!-- Center Capsule Pill Bar -->
  <rect x="8" y="58" width="144" height="48" rx="24" fill="url(#pillGradSm)" stroke="#2D6EE8" stroke-width="1.8" />
  <path d="M 24 60 L 136 60 A 10 10 0 0 1 144 70 L 16 70 A 10 10 0 0 1 24 60 Z" fill="white" opacity="0.25" />

  <!-- Digits & Yen (Centered with ample padding to prevent cutting) -->
  <g transform="skewX(-8)" filter="url(#goldShadowSm)">
    <text x="122" y="92" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${numFontSize}" fill="url(#goldGradSm)" letter-spacing="-1">${displayVal}</text>
    <text x="140" y="92" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${unitFontSize}" fill="url(#goldGradSm)">円</text>
  </g>

  <!-- Bottom Details -->
  <text x="80" y="132" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="700" font-size="10" fill="#E2E8F0">目安: ${payload.formattedDailyBudget}/日</text>
  <text x="80" y="145" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="500" font-size="8.5" fill="rgba(255,255,255,0.6)">(残${payload.daysLeftInMonth}日)</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(smallSvg);
  }

  // MEDIUM BANNER (Horizontal 360x88, Zero clipping)
  const numLen = displayVal.length;
  const numFontSize = numLen > 7 ? 36 : numLen > 6 ? 40 : 44;
  const unitFontSize = numLen > 7 ? 22 : 26;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="370" height="88" viewBox="0 0 370 88">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3C7DF8" />
      <stop offset="55%" stop-color="#1B51BD" />
      <stop offset="100%" stop-color="#0F3389" />
    </linearGradient>
    <linearGradient id="pillGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#081E5B" />
      <stop offset="100%" stop-color="#030D2C" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="20%" stop-color="#FFF875" />
      <stop offset="60%" stop-color="#FFD600" />
      <stop offset="100%" stop-color="#FF9E00" />
    </linearGradient>
    <linearGradient id="purseGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF3B30" />
      <stop offset="50%" stop-color="#E0281D" />
      <stop offset="100%" stop-color="#A8150D" />
    </linearGradient>
    <filter id="goldShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="0" flood-color="#733E00" />
      <feDropShadow dx="0" dy="3.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.85)" />
    </filter>
  </defs>

  <!-- Outer Blue Frame -->
  <rect x="2" y="2" width="366" height="84" rx="18" fill="url(#bgGrad)" stroke="#5E97FF" stroke-width="2.5" />

  <!-- Stars / Sparkles -->
  <text x="24" y="22" fill="rgba(255,255,255,0.4)" font-size="12">✦</text>
  <text x="340" y="22" fill="rgba(255,255,255,0.35)" font-size="10">✦</text>
  <text x="330" y="74" fill="rgba(255,255,255,0.4)" font-size="14">★</text>
  <text x="50" y="74" fill="rgba(255,255,255,0.3)" font-size="10">★</text>
  <text x="185" y="16" fill="rgba(255,255,255,0.25)" font-size="9">✦</text>

  <!-- Inner Dark Cobalt Pill Bar (with extra breathing room on the right) -->
  <rect x="12" y="14" width="346" height="60" rx="30" fill="url(#pillGrad)" stroke="#2D6EE8" stroke-width="2" />

  <!-- Glossy Glass Highlight Streak -->
  <path d="M 40 16 L 330 16 A 14 14 0 0 1 344 28 L 26 28 A 14 14 0 0 1 40 16 Z" fill="white" opacity="0.22" />

  <!-- Gamaguchi Purse Icon -->
  <g transform="translate(24, 19)">
    <!-- Ball clasps -->
    <circle cx="21" cy="9" r="4.2" fill="#FFE57F" stroke="#111" stroke-width="2" />
    <circle cx="20" cy="7.5" r="1.3" fill="#FFF" />
    <circle cx="29" cy="9" r="4.2" fill="#FFE57F" stroke="#111" stroke-width="2" />
    <circle cx="28" cy="7.5" r="1.3" fill="#FFF" />
    <!-- Gold Rim -->
    <path d="M 13 18 C 17 12, 33 12, 37 18 C 37 20, 13 20, 13 18 Z" fill="#FFCA28" stroke="#111" stroke-width="2" />
    <!-- Red Pouch -->
    <path d="M 13 19 C 8 24, 6 34, 9 41 C 12 47, 38 47, 41 41 C 44 34, 42 24, 37 19 Z" fill="url(#purseGrad)" stroke="#111" stroke-width="2" />
    <!-- Creases -->
    <path d="M 17 19 C 16 26, 16 36, 20 43" stroke="#8E0000" stroke-width="1.8" fill="none" />
    <path d="M 33 19 C 34 26, 34 36, 30 43" stroke="#8E0000" stroke-width="1.8" fill="none" />
    <!-- White Highlight -->
    <path d="M 12 27 C 10 32, 11 37, 14 39" stroke="#FFA49D" stroke-width="1.8" fill="none" stroke-linecap="round" />
  </g>

  <!-- Number & Yen (shifted left with safety margin so zero clipping occurs) -->
  <g transform="skewX(-8)" filter="url(#goldShadow)">
    <text x="320" y="58" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${numFontSize}" fill="url(#goldGrad)" letter-spacing="-1">${displayVal}</text>
    <text x="345" y="58" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${unitFontSize}" fill="url(#goldGrad)">円</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// GET /api/widget/script - Returns downloadable Scriptable widget JavaScript
app.get('/api/widget/script', (req: Request, res: Response) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const appUrl = `${protocol}://${host}`;
  const apiUrl = `${appUrl}/api/widget`;

  const scriptCode = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: wallet;
/**
 * 家計簿 iPhone ホーム画面ウィジェット (Scriptable 用)
 * 配布URL: ${appUrl}
 */

const API_URL = "${apiUrl}";
const APP_URL = "${appUrl}";

async function run() {
  const widget = await createWidget();
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // スクリプト単体実行時のプレビュー
    await widget.presentMedium();
  }
  Script.complete();
}

async function fetchKakeiboData() {
  try {
    const req = new Request(API_URL);
    req.timeoutInterval = 10;
    const json = await req.loadJSON();
    return json;
  } catch (err) {
    // オフライン時のフォールバック表示
    return {
      title: "家計簿 (オフライン)",
      formattedFreeBalance: "¥---,---",
      formattedDailyBudget: "¥---/日",
      daysLeftInMonth: 0,
      healthLabel: "オフライン",
      healthStatus: "warning",
      formattedSavingsBalance: "¥0",
      formattedCarBalance: "¥0",
      formattedTotalAssets: "¥0",
      recentExpenses: []
    };
  }
}

async function createWidget() {
  const data = await fetchKakeiboData();
  const widget = new ListWidget();
  widget.url = APP_URL; // タップで家計簿アプリを開く

  // 背景グラデーション (Apple ダークモード調)
  const gradient = new LinearGradient();
  gradient.colors = [new Color("#14171F"), new Color("#1F2432")];
  gradient.locations = [0.0, 1.0];
  widget.backgroundGradient = gradient;
  widget.setPadding(16, 16, 16, 16);

  const widgetFamily = config.widgetFamily || "medium";

  if (widgetFamily === "small") {
    // === Small ウィジェット ===
    const headerRow = widget.addStack();
    headerRow.layoutHorizontally();

    const titleText = headerRow.addText("家計簿 残高");
    titleText.textColor = new Color("#D4A15C");
    titleText.font = Font.boldSystemFont(11);

    headerRow.addSpacer();

    const dot = headerRow.addText(data.healthStatus === "critical" ? "●" : "●");
    dot.textColor = data.healthStatus === "critical" ? new Color("#E15554") : data.healthStatus === "warning" ? new Color("#E1BC29") : new Color("#48BB78");
    dot.font = Font.systemFont(9);

    widget.addSpacer(8);

    const lbl = widget.addText("自由に使える金額");
    lbl.textColor = new Color("#A0AEC0");
    lbl.font = Font.systemFont(11);

    const amount = widget.addText(data.formattedFreeBalance);
    amount.textColor = new Color("#FFFFFF");
    amount.font = Font.heavySystemFont(22);
    amount.minimumScaleFactor = 0.7;

    widget.addSpacer(8);

    const dailyStack = widget.addStack();
    dailyStack.layoutHorizontally();
    const dailyLbl = dailyStack.addText("目安: " + data.formattedDailyBudget + " (残" + data.daysLeftInMonth + "日)");
    dailyLbl.textColor = new Color("#718096");
    dailyLbl.font = Font.systemFont(10);

  } else {
    // === Medium / Large ウィジェット ===
    const topRow = widget.addStack();
    topRow.layoutHorizontally();

    const title = topRow.addText("家計簿 ・ " + (data.monthLabel || "今月"));
    title.textColor = new Color("#D4A15C");
    title.font = Font.boldSystemFont(13);

    topRow.addSpacer();

    const statusBadge = topRow.addStack();
    statusBadge.backgroundColor = data.healthStatus === "critical" ? new Color("#E15554", 0.25) : new Color("#48BB78", 0.2);
    statusBadge.cornerRadius = 6;
    statusBadge.setPadding(2, 6, 2, 6);
    const statusTxt = statusBadge.addText(data.healthLabel || "順調");
    statusTxt.textColor = data.healthStatus === "critical" ? new Color("#E15554") : new Color("#48BB78");
    statusTxt.font = Font.boldSystemFont(10);

    widget.addSpacer(6);

    const mainRow = widget.addStack();
    mainRow.layoutHorizontally();

    // 左列: 自由資金
    const leftCol = mainRow.addStack();
    leftCol.layoutVertically();

    const sub = leftCol.addText("自由に使える残高");
    sub.textColor = new Color("#A0AEC0");
    sub.font = Font.systemFont(11);

    const balance = leftCol.addText(data.formattedFreeBalance);
    balance.textColor = new Color("#FFFFFF");
    balance.font = Font.heavySystemFont(26);
    balance.minimumScaleFactor = 0.75;

    const dailyRow = leftCol.addStack();
    dailyRow.layoutHorizontally();
    const dailyTxt = dailyRow.addText("今日使える目安: " + data.formattedDailyBudget + " / 日 (残" + data.daysLeftInMonth + "日)");
    dailyTxt.textColor = new Color("#718096");
    dailyTxt.font = Font.systemFont(10);

    mainRow.addSpacer();

    // 右列: 貯金と車
    const rightCol = mainRow.addStack();
    rightCol.layoutVertically();
    rightCol.setPadding(0, 8, 0, 0);

    const savRow = rightCol.addStack();
    savRow.layoutHorizontally();
    const savLbl = savRow.addText("普通貯金: ");
    savLbl.textColor = new Color("#A0AEC0");
    savLbl.font = Font.systemFont(11);
    const savVal = savRow.addText(data.formattedSavingsBalance);
    savVal.textColor = new Color("#6FAE9C");
    savVal.font = Font.boldSystemFont(11);

    rightCol.addSpacer(2);

    const carRow = rightCol.addStack();
    carRow.layoutHorizontally();
    const carLbl = carRow.addText("車維持費: ");
    carLbl.textColor = new Color("#A0AEC0");
    carLbl.font = Font.systemFont(11);
    const carVal = carRow.addText(data.formattedCarBalance);
    carVal.textColor = new Color("#8FB3D9");
    carVal.font = Font.boldSystemFont(11);

    rightCol.addSpacer(2);

    const totRow = rightCol.addStack();
    totRow.layoutHorizontally();
    const totLbl = totRow.addText("総資産: ");
    totLbl.textColor = new Color("#A0AEC0");
    totLbl.font = Font.systemFont(11);
    const totVal = totRow.addText(data.formattedTotalAssets);
    totVal.textColor = new Color("#D4A15C");
    totVal.font = Font.boldSystemFont(11);

    if (widgetFamily === "large" && data.recentExpenses && data.recentExpenses.length > 0) {
      widget.addSpacer(12);
      const sep = widget.addText("最近の支出:");
      sep.textColor = new Color("#718096");
      sep.font = Font.boldSystemFont(11);
      widget.addSpacer(4);

      for (const exp of data.recentExpenses.slice(0, 3)) {
        const row = widget.addStack();
        row.layoutHorizontally();
        const nameTxt = row.addText("• " + exp.name);
        nameTxt.textColor = new Color("#CBD5E0");
        nameTxt.font = Font.systemFont(11);
        row.addSpacer();
        const amtTxt = row.addText(exp.formattedAmount);
        amtTxt.textColor = new Color("#F56565");
        amtTxt.font = Font.boldSystemFont(11);
        widget.addSpacer(2);
      }
    }
  }

  return widget;
}

await run();
`;

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kakeibo-widget.js"');
  res.send(scriptCode);
});

// POST /api/incomes - Add income
app.post('/api/incomes', (req: Request, res: Response) => {
  const { year, month, amount, normalSavingsAmount = 0, carMaintenanceAmount = 0, memo = '' } = req.body;
  if (!year || !month || amount === undefined || isNaN(Number(amount))) {
    return res.status(400).json({ error: '年、月、金額は必須です。' });
  }

  const numAmount = Number(amount);
  const numSavings = Number(normalSavingsAmount) || 0;
  const numCar = Number(carMaintenanceAmount) || 0;
  const numFree = numAmount - numSavings - numCar;
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;

  const income: Income = {
    id: uid('inc'),
    date: `${monthStr}-01`,
    month: monthStr,
    amount: numAmount,
    normalSavingsAmount: numSavings,
    carMaintenanceAmount: numCar,
    freeAmount: numFree,
    memo: memo.trim(),
    createdAt: new Date().toISOString(),
  };

  memoryDb.incomes.push(income);

  if (numSavings > 0) {
    memoryDb.funds.push({
      id: uid('fnd'),
      type: 'savings',
      sourceMonth: monthStr,
      originalAmount: numSavings,
      remainingAmount: numSavings,
      incomeId: income.id,
    });
  }

  if (numCar > 0) {
    memoryDb.funds.push({
      id: uid('fnd'),
      type: 'car',
      sourceMonth: monthStr,
      originalAmount: numCar,
      remainingAmount: numCar,
      incomeId: income.id,
    });
  }

  if (numFree !== 0) {
    memoryDb.funds.push({
      id: uid('fnd'),
      type: 'free',
      sourceMonth: monthStr,
      originalAmount: numFree,
      remainingAmount: numFree,
      incomeId: income.id,
    });
  }

  saveDatabase(memoryDb);
  res.json({ income, fundTotals: getFundTotals(memoryDb.funds) });
});

// DELETE /api/incomes/:id
app.delete('/api/incomes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const relatedFunds = memoryDb.funds.filter((f) => f.incomeId === id);
  const consumed = relatedFunds.some((f) => f.remainingAmount !== f.originalAmount);

  if (consumed) {
    return res.status(400).json({
      error: 'この収入から生まれた資金は既に一部使用されているため削除できません。支出を先に削除してください。',
    });
  }

  memoryDb.funds = memoryDb.funds.filter((f) => f.incomeId !== id);
  memoryDb.incomes = memoryDb.incomes.filter((i) => i.id !== id);

  saveDatabase(memoryDb);
  res.json({ ok: true, fundTotals: getFundTotals(memoryDb.funds) });
});

// POST /api/expenses - Add expense
app.post('/api/expenses', (req: Request, res: Response) => {
  const { date, amount, category, name, memo = '', requestedByType } = req.body;
  if (!date || !amount || !category || !name) {
    return res.status(400).json({ error: '日付、金額、カテゴリ、項目名は必須です。' });
  }

  const numAmount = Number(amount);
  const monthStr = date.slice(0, 7);

  // If user requested specific allocations: [{type: 'free', amount: X}, ...]
  let requests: Array<{ type: FundType; amount: number }> = [];
  if (Array.isArray(requestedByType) && requestedByType.length > 0) {
    requests = requestedByType;
  } else {
    // Default: draw from 'free' fund FIFO
    requests = [{ type: 'free', amount: numAmount }];
  }

  const { allocations, shortfall } = allocateFundsFIFO(memoryDb.funds, requests);

  const expense: Expense = {
    id: uid('exp'),
    date,
    month: monthStr,
    amount: numAmount,
    category,
    name: name.trim(),
    memo: memo.trim(),
    allocations,
    createdAt: new Date().toISOString(),
  };

  memoryDb.expenses.push(expense);
  saveDatabase(memoryDb);

  res.json({
    expense,
    shortfall,
    fundTotals: getFundTotals(memoryDb.funds),
  });
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const exp = memoryDb.expenses.find((e) => e.id === id);
  if (!exp) {
    return res.status(404).json({ error: '支出が見つかりません。' });
  }

  restoreAllocations(memoryDb.funds, exp.allocations);
  memoryDb.expenses = memoryDb.expenses.filter((e) => e.id !== id);

  saveDatabase(memoryDb);
  res.json({ ok: true, fundTotals: getFundTotals(memoryDb.funds) });
});

// PUT /api/settings - Update settings
app.put('/api/settings', (req: Request, res: Response) => {
  const { normalSavingsDefault, carMaintenanceDefault, categories, widgetSecretKey } = req.body;

  if (normalSavingsDefault !== undefined) memoryDb.settings.normalSavingsDefault = Number(normalSavingsDefault);
  if (carMaintenanceDefault !== undefined) memoryDb.settings.carMaintenanceDefault = Number(carMaintenanceDefault);
  if (Array.isArray(categories)) memoryDb.settings.categories = categories;
  if (widgetSecretKey !== undefined) memoryDb.settings.widgetSecretKey = widgetSecretKey;

  saveDatabase(memoryDb);
  res.json({ settings: memoryDb.settings });
});

// POST /api/reset - Reset to sample data
app.post('/api/reset', (req: Request, res: Response) => {
  memoryDb = getInitialDatabase();
  saveDatabase(memoryDb);
  res.json({ ok: true, message: '初期サンプルデータにリセットしました。' });
});

// POST /api/clear - Clear all data
app.post('/api/clear', (req: Request, res: Response) => {
  memoryDb = {
    incomes: [],
    expenses: [],
    funds: [],
    settings: { ...DEFAULT_SETTINGS },
    lastUpdated: new Date().toISOString(),
  };
  saveDatabase(memoryDb);
  res.json({ ok: true, message: 'すべてのデータを消去しました。' });
});

// GET /api/export - Export backup
app.get('/api/export', (req: Request, res: Response) => {
  res.json(memoryDb);
});

// POST /api/import - Restore backup
app.post('/api/import', (req: Request, res: Response) => {
  const data = req.body;
  if (!data || !Array.isArray(data.incomes) || !Array.isArray(data.expenses) || !Array.isArray(data.funds)) {
    return res.status(400).json({ error: 'バックアップデータの形式が正しくありません。' });
  }

  memoryDb = {
    incomes: data.incomes,
    expenses: data.expenses,
    funds: data.funds,
    settings: data.settings || { ...DEFAULT_SETTINGS },
    lastUpdated: new Date().toISOString(),
  };

  saveDatabase(memoryDb);
  res.json({ ok: true, message: 'データを復元しました。' });
});

// Vite middleware or static serving
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kakeibo Full-Stack Server running at http://0.0.0.0:${PORT}`);
});
