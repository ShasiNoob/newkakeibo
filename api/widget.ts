// Vercel Serverless Function for /api/widget
export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const queryAmount = req.query.amount ? Number(req.query.amount) : 195964;
  const useComma = req.query.comma === '1';
  const size = req.query.size === 'small' ? 'small' : 'medium';
  const format = req.query.format || (req.url && req.url.includes('.svg') ? 'svg' : 'json');

  const displayVal = useComma ? queryAmount.toLocaleString('ja-JP') : String(Math.round(queryAmount));

  if (format === 'svg') {
    res.setHeader('Content-Type', 'image/svg+xml');

    if (size === 'small') {
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

  <rect x="2" y="2" width="156" height="156" rx="28" fill="url(#bgGradSm)" stroke="#5E97FF" stroke-width="2" />
  <text x="14" y="20" fill="rgba(255,255,255,0.45)" font-size="10">✦</text>
  <text x="136" y="22" fill="rgba(255,255,255,0.4)" font-size="11">★</text>
  <text x="18" y="146" fill="rgba(255,255,255,0.35)" font-size="10">★</text>
  <text x="138" y="146" fill="rgba(255,255,255,0.4)" font-size="9">✦</text>

  <g transform="translate(18, 14)">
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
    <text x="44" y="26" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="14" fill="#FFF566" filter="url(#goldShadowSm)">自由残高</text>
  </g>

  <rect x="8" y="58" width="144" height="48" rx="24" fill="url(#pillGradSm)" stroke="#2D6EE8" stroke-width="1.8" />
  <path d="M 24 60 L 136 60 A 10 10 0 0 1 144 70 L 16 70 A 10 10 0 0 1 24 60 Z" fill="white" opacity="0.25" />

  <g transform="skewX(-8)" filter="url(#goldShadowSm)">
    <text x="122" y="92" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${numFontSize}" fill="url(#goldGradSm)" letter-spacing="-1">${displayVal}</text>
    <text x="140" y="92" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${unitFontSize}" fill="url(#goldGradSm)">円</text>
  </g>

  <text x="80" y="132" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="700" font-size="10" fill="#E2E8F0">目安: ¥8,520/日</text>
  <text x="80" y="145" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="500" font-size="8.5" fill="rgba(255,255,255,0.6)">(残23日)</text>
</svg>`;
      return res.status(200).send(smallSvg);
    }

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

  <rect x="2" y="2" width="366" height="84" rx="18" fill="url(#bgGrad)" stroke="#5E97FF" stroke-width="2.5" />
  <text x="24" y="22" fill="rgba(255,255,255,0.4)" font-size="12">✦</text>
  <text x="340" y="22" fill="rgba(255,255,255,0.35)" font-size="10">✦</text>
  <text x="330" y="74" fill="rgba(255,255,255,0.4)" font-size="14">★</text>
  <text x="50" y="74" fill="rgba(255,255,255,0.3)" font-size="10">★</text>
  <text x="185" y="16" fill="rgba(255,255,255,0.25)" font-size="9">✦</text>

  <rect x="12" y="14" width="346" height="60" rx="30" fill="url(#pillGrad)" stroke="#2D6EE8" stroke-width="2" />
  <path d="M 40 16 L 330 16 A 14 14 0 0 1 344 28 L 26 28 A 14 14 0 0 1 40 16 Z" fill="white" opacity="0.22" />

  <g transform="translate(24, 19)">
    <circle cx="21" cy="9" r="4.2" fill="#FFE57F" stroke="#111" stroke-width="2" />
    <circle cx="20" cy="7.5" r="1.3" fill="#FFF" />
    <circle cx="29" cy="9" r="4.2" fill="#FFE57F" stroke="#111" stroke-width="2" />
    <circle cx="28" cy="7.5" r="1.3" fill="#FFF" />
    <path d="M 13 18 C 17 12, 33 12, 37 18 C 37 20, 13 20, 13 18 Z" fill="#FFCA28" stroke="#111" stroke-width="2" />
    <path d="M 13 19 C 8 24, 6 34, 9 41 C 12 47, 38 47, 41 41 C 44 34, 42 24, 37 19 Z" fill="url(#purseGrad)" stroke="#111" stroke-width="2" />
    <path d="M 17 19 C 16 26, 16 36, 20 43" stroke="#8E0000" stroke-width="1.8" fill="none" />
    <path d="M 33 19 C 34 26, 34 36, 30 43" stroke="#8E0000" stroke-width="1.8" fill="none" />
    <path d="M 12 27 C 10 32, 11 37, 14 39" stroke="#FFA49D" stroke-width="1.8" fill="none" stroke-linecap="round" />
  </g>

  <g transform="skewX(-8)" filter="url(#goldShadow)">
    <text x="320" y="58" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${numFontSize}" fill="url(#goldGrad)" letter-spacing="-1">${displayVal}</text>
    <text x="345" y="58" text-anchor="end" font-family="'Impact', 'Arial Black', sans-serif" font-weight="900" font-style="italic" font-size="${unitFontSize}" fill="url(#goldGrad)">円</text>
  </g>
</svg>`;

    return res.status(200).send(svg);
  }

  // JSON format
  return res.status(200).json({
    status: 'ok',
    title: '家計簿 残高ウィジェット',
    freeBalance: queryAmount,
    formattedFreeBalance: `¥${queryAmount.toLocaleString('ja-JP')}`,
    savingsBalance: 110000,
    formattedSavingsBalance: '¥110,000',
    carBalance: 40000,
    formattedCarBalance: '¥40,000',
    totalAssets: queryAmount + 110000 + 40000,
    formattedTotalAssets: `¥${(queryAmount + 150000).toLocaleString('ja-JP')}`,
    monthLabel: '今月',
    daysLeftInMonth: 23,
    dailyBudget: Math.round(queryAmount / 23),
    formattedDailyBudget: `¥${Math.round(queryAmount / 23).toLocaleString('ja-JP')}`,
    healthStatus: 'healthy',
    healthLabel: '順調',
    updatedAt: new Date().toISOString(),
  });
}
