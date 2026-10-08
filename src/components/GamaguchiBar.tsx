import React from 'react';

interface GamaguchiBarProps {
  amount: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bar' | 'square';
  showBg?: boolean;
  useComma?: boolean;
  dailyBudget?: number;
  daysLeft?: number;
}

export const GamaguchiIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
    >
      {/* Clasp knobs (two gold/white balls) */}
      <circle cx="27" cy="14" r="5" fill="#FFE57F" stroke="#1A1A1A" strokeWidth="2.5" />
      <circle cx="25.5" cy="12.5" r="1.5" fill="#FFFFFF" />

      <circle cx="37" cy="14" r="5" fill="#FFE57F" stroke="#1A1A1A" strokeWidth="2.5" />
      <circle cx="35.5" cy="12.5" r="1.5" fill="#FFFFFF" />

      {/* Purse Metal Frame Rim */}
      <path
        d="M17 25 C 22 17, 42 17, 47 25 C 47 27, 17 27, 17 25 Z"
        fill="#FFD54F"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M21 21 C 28 18, 36 18, 43 21"
        stroke="#FFF9C4"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Purse Red Body */}
      <path
        d="M17 26 C 11 31, 8 43, 12 50 C 16 57, 48 57, 52 50 C 56 43, 53 31, 47 26 Z"
        fill="url(#gamaguchi-red-grad)"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Creases / Folds on Red Cloth */}
      <path
        d="M23 26 C 21 34, 21 46, 26 53"
        stroke="#B71C1C"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M41 26 C 43 34, 43 46, 38 53"
        stroke="#B71C1C"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Highlight on pouch */}
      <path
        d="M16 35 C 14 41, 16 46, 19 49"
        stroke="#FF8A80"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <defs>
        <linearGradient id="gamaguchi-red-grad" x1="32" y1="24" x2="32" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF3D00" />
          <stop offset="0.4" stopColor="#E53935" />
          <stop offset="1" stopColor="#B71C1C" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const GamaguchiBar: React.FC<GamaguchiBarProps> = ({
  amount,
  unit = '円',
  size = 'md',
  variant = 'bar',
  showBg = true,
  useComma = false,
  dailyBudget,
  daysLeft,
}) => {
  const formattedDigits = useComma ? amount.toLocaleString('ja-JP') : String(Math.round(amount));

  // Determine dynamic font size based on digit length to guarantee NO text clipping
  const digitLen = formattedDigits.length;

  // --- SQUARE LAYOUT (iOS Small Widget 2x2) ---
  if (variant === 'square') {
    // Dynamic font size for small widget square
    let squareNumFontSize = '1.7rem';
    let squareUnitFontSize = '1.05rem';
    if (digitLen > 6) {
      squareNumFontSize = '1.35rem';
      squareUnitFontSize = '0.9rem';
    } else if (digitLen > 5) {
      squareNumFontSize = '1.5rem';
      squareUnitFontSize = '0.95rem';
    }

    return (
      <div
        className="relative select-none rounded-[28px] p-3.5 border-2 border-[#548FFC] shadow-[0_6px_25px_rgba(24,80,200,0.6)] flex flex-col justify-between overflow-hidden"
        style={{
          width: '160px',
          height: '160px',
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.25) 0%, transparent 12%), radial-gradient(circle at 85% 85%, rgba(255,255,255,0.2) 0%, transparent 14%), linear-gradient(180deg, #3C7DF8 0%, #1A4EB8 60%, #0F3389 100%)',
        }}
      >
        {/* Star Accents */}
        <div className="absolute top-1.5 left-2 text-white/50 text-[10px] pointer-events-none">✦</div>
        <div className="absolute top-2 right-2.5 text-white/40 text-[11px] pointer-events-none">★</div>
        <div className="absolute bottom-1.5 left-2 text-white/40 text-[10px] pointer-events-none">★</div>
        <div className="absolute bottom-2 right-2 text-white/40 text-[9px] pointer-events-none">✦</div>

        {/* Top Header: Gamaguchi Purse Icon + Arcade Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <GamaguchiIcon className="w-8 h-8" />
            <span
              className="text-[10px] font-black italic tracking-tight"
              style={{
                color: '#FFF566',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                fontFamily: '"Impact", "Arial Black", sans-serif',
              }}
            >
              自由残高
            </span>
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
        </div>

        {/* Center: Inset Dark Cobalt Capsule Pill */}
        <div
          className="relative z-10 rounded-full bg-gradient-to-b from-[#091F5E] to-[#030D2C] border-2 border-[#2968E6] px-2.5 py-1.5 my-auto flex items-baseline justify-center shadow-[inset_0_3px_6px_rgba(0,0,0,0.85)]"
          style={{ minHeight: '44px' }}
        >
          {/* Top gloss highlight */}
          <div className="absolute top-0 left-2 right-2 h-[40%] rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          {/* Golden arcade number and unit - Extra right padding to avoid clipping */}
          <div className="flex items-baseline justify-center pr-1">
            <span
              className="font-black italic font-mono"
              style={{
                fontSize: squareNumFontSize,
                lineHeight: 1,
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF566 22%, #FFD600 55%, #FFA000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0px 1.5px 0px #7A4300) drop-shadow(0px 3px 3px rgba(0,0,0,0.8))',
                fontFamily: '"Impact", "Arial Black", "Hiragino Kaku Gothic Std", sans-serif',
                transform: 'skewX(-8deg)',
                letterSpacing: '-0.03em',
              }}
            >
              {formattedDigits}
            </span>

            <span
              className="font-black italic ml-0.5"
              style={{
                fontSize: squareUnitFontSize,
                lineHeight: 1,
                background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF566 25%, #FFD600 55%, #FFA000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0px 1.5px 0px #7A4300) drop-shadow(0px 2.5px 2.5px rgba(0,0,0,0.8))',
                fontFamily: '"Impact", "Arial Black", "Hiragino Kaku Gothic Std", sans-serif',
                transform: 'skewX(-8deg)',
              }}
            >
              {unit}
            </span>
          </div>
        </div>

        {/* Bottom Sub-info */}
        <div className="relative z-10 text-center">
          <p
            className="text-[9px] font-bold tracking-tight text-white/90 drop-shadow"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            {dailyBudget !== undefined
              ? `目安: ¥${dailyBudget.toLocaleString('ja-JP')}/日 (残${daysLeft || 0}日)`
              : 'タップで家計簿を開く'}
          </p>
        </div>
      </div>
    );
  }

  // --- HORIZONTAL BAR LAYOUT (Original Screenshot / Medium Widget) ---
  let barNumFontSize = size === 'lg' ? '2.4rem' : size === 'sm' ? '1.4rem' : '2.0rem';
  let barUnitFontSize = size === 'lg' ? '1.5rem' : size === 'sm' ? '0.95rem' : '1.3rem';

  if (digitLen > 7) {
    barNumFontSize = size === 'lg' ? '1.8rem' : size === 'sm' ? '1.15rem' : '1.6rem';
    barUnitFontSize = size === 'lg' ? '1.2rem' : size === 'sm' ? '0.8rem' : '1.1rem';
  } else if (digitLen > 6) {
    barNumFontSize = size === 'lg' ? '2.1rem' : size === 'sm' ? '1.25rem' : '1.85rem';
    barUnitFontSize = size === 'lg' ? '1.35rem' : size === 'sm' ? '0.85rem' : '1.2rem';
  }

  return (
    <div
      className={`relative select-none rounded-2xl transition-all ${
        showBg
          ? 'bg-gradient-to-b from-[#2E6BDE] via-[#1D51BF] to-[#123B9A] p-2.5 sm:p-3 border-2 border-[#548FFC] shadow-[0_4px_20px_rgba(24,80,200,0.5)]'
          : ''
      }`}
      style={{
        backgroundImage: showBg
          ? 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.2) 0%, transparent 8%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.18) 0%, transparent 10%), linear-gradient(180deg, #3B7CF7 0%, #1A4EB8 60%, #103487 100%)'
          : undefined,
      }}
    >
      {/* Sparkle star accents in background if showBg */}
      {showBg && (
        <>
          <div className="absolute top-1.5 left-4 text-white/40 text-[10px] select-none pointer-events-none">✦</div>
          <div className="absolute bottom-1.5 right-6 text-white/40 text-[12px] select-none pointer-events-none">★</div>
          <div className="absolute top-2 right-16 text-white/30 text-[8px] select-none pointer-events-none">✦</div>
          <div className="absolute bottom-2 left-14 text-white/30 text-[9px] select-none pointer-events-none">★</div>
        </>
      )}

      {/* Pill Capsule (Dark Cobalt Inner Slot) */}
      <div
        className="relative flex items-center justify-between rounded-full bg-gradient-to-b from-[#0A2266] to-[#04123E] border-2 border-[#2968E6] pl-2.5 sm:pl-3.5 pr-3.5 sm:pr-4 py-1.5 shadow-[inset_0_3px_8px_rgba(0,0,0,0.7)]"
        style={{
          boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.3)',
        }}
      >
        {/* Glossy top glass reflection streak */}
        <div className="absolute top-0 left-4 right-4 h-[42%] rounded-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        {/* Left: Red Gamaguchi Coin Purse Icon */}
        <div className="relative z-10 flex-shrink-0 mr-2 sm:mr-3 transform hover:scale-105 transition-transform">
          <GamaguchiIcon className={size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'} />
        </div>

        {/* Right: Golden Arcade Slanted Numbers + 円 - No overflow hidden, ample right padding to prevent clipping */}
        <div className="relative z-10 flex items-baseline justify-end flex-1 tracking-tighter pr-1">
          <span
            className="font-black italic text-right tracking-tight transition-all font-mono"
            style={{
              fontSize: barNumFontSize,
              lineHeight: 1,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF566 22%, #FFD600 55%, #FFA000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 2px 0px #7A4300) drop-shadow(0px 4px 4px rgba(0,0,0,0.8))',
              fontFamily: '"Impact", "Arial Black", "Hiragino Kaku Gothic Std", sans-serif',
              transform: 'skewX(-8deg)',
              letterSpacing: '-0.02em',
              display: 'inline-block',
            }}
          >
            {formattedDigits}
          </span>

          <span
            className="font-black italic text-right transition-all ml-1"
            style={{
              fontSize: barUnitFontSize,
              lineHeight: 1,
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF566 25%, #FFD600 55%, #FFA000 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 2px 0px #7A4300) drop-shadow(0px 3px 3px rgba(0,0,0,0.8))',
              fontFamily: '"Impact", "Arial Black", "Hiragino Kaku Gothic Std", sans-serif',
              transform: 'skewX(-8deg)',
              display: 'inline-block',
            }}
          >
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
};
