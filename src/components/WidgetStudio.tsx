import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Gamepad2,
  Play,
  Layers,
  Terminal,
  Grid,
} from 'lucide-react';
import { formatYen } from '../api/client.ts';
import { GamaguchiBar, GamaguchiIcon } from './GamaguchiBar.tsx';
import type { WidgetPayload, FundTotals } from '../types.ts';

interface WidgetStudioProps {
  totals: FundTotals;
  currentMonth: string;
}

export const WidgetStudio: React.FC<WidgetStudioProps> = ({ totals, currentMonth }) => {
  const [styleMode, setStyleMode] = useState<'gamaguchi' | 'apple'>('gamaguchi');
  const [gamaguchiSize, setGamaguchiSize] = useState<'small' | 'medium'>('small');
  const [useComma, setUseComma] = useState<boolean>(false);
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [apiData, setApiData] = useState<WidgetPayload | null>(null);
  const [loadingApi, setLoadingApi] = useState<boolean>(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const widgetApiUrl = `${currentOrigin}/api/widget`;
  const gamaguchiSvgUrl = `${currentOrigin}/api/widget/gamaguchi.svg`;

  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDay - now.getDate() + 1);
  const dailyBudget = Math.max(0, Math.floor(totals.free / daysLeft));

  const fetchLiveWidgetData = async () => {
    setLoadingApi(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/widget');
      const data = await res.json();
      const end = performance.now();
      setApiData(data);
      setApiLatency(Math.round(end - start));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    fetchLiveWidgetData();
  }, [totals]);

  // Gamaguchi Game HUD Scriptable script supporting both Small (2x2) and Medium (2x4)
  const gamaguchiScriptCode = `// Variables used by Scriptable.
// icon-color: blue; icon-glyph: coins;
/**
 * ============================================================
 * 家計簿 がま口レトロゲーム風 ウィジェット (Scriptable 用)
 * 小サイズ (2x2 正方形) ＆ 中サイズ (2x4 横長) 両対応！
 * 文字欠け・数字切れ防止パッチ適用済み
 * ============================================================
 */

const API_URL = "${widgetApiUrl}";
const APP_URL = "${currentOrigin}";
const SVG_URL = "${gamaguchiSvgUrl}";

async function run() {
  const widget = await createWidget();
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // スクリプト単体実行時のプレビュー (小サイズ・中サイズ対応)
    if (config.widgetFamily === "medium") {
      await widget.presentMedium();
    } else {
      await widget.presentSmall();
    }
  }
  Script.complete();
}

async function createWidget() {
  const widget = new ListWidget();
  widget.url = APP_URL; // タップで直接家計簿を開く
  widget.setPadding(0, 0, 0, 0);

  // iPhoneで配置されたウィジェットのサイズ (小: small, 中: medium) を自動判定
  const family = config.widgetFamily || "${gamaguchiSize}";
  const sizeParam = family === "medium" ? "medium" : "small";

  try {
    // 1. 最新の残高データを取得
    const dataReq = new Request(API_URL);
    dataReq.timeoutInterval = 8;
    const data = await dataReq.loadJSON();

    // 2. 最適なサイズで文字切れのないがま口SVG画像をサーバーから取得
    const imgUrl = SVG_URL + "?amount=" + encodeURIComponent(data.freeBalance) + "&size=" + sizeParam + "${useComma ? '&comma=1' : ''}";
    const imgReq = new Request(imgUrl);
    imgReq.timeoutInterval = 8;
    const img = await imgReq.loadImage();
    
    widget.backgroundImage = img;
  } catch (err) {
    // オフライン・通信待機時のフォールバック表示
    const grad = new LinearGradient();
    grad.colors = [new Color("#2E6BDE"), new Color("#123B9A")];
    grad.locations = [0, 1];
    widget.backgroundGradient = grad;
    widget.setPadding(14, 14, 14, 14);

    const txt = widget.addText("家計簿 更新待機中");
    txt.textColor = Color.white();
    txt.font = Font.boldSystemFont(12);
    txt.centerAlignText();
  }

  return widget;
}

await run();
`;

  // Standard Apple style script
  const appleScriptCode = `// Variables used by Scriptable.
// icon-color: orange; icon-glyph: wallet;
/**
 * 家計簿 Appleモダンウィジェット (Scriptable 用)
 */

const API_URL = "${widgetApiUrl}";
const APP_URL = "${currentOrigin}";

async function run() {
  const widget = await createWidget();
  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentSmall();
  }
  Script.complete();
}

async function fetchKakeiboData() {
  try {
    const req = new Request(API_URL);
    req.timeoutInterval = 10;
    return await req.loadJSON();
  } catch (err) {
    return {
      title: "家計簿",
      formattedFreeBalance: "¥---,---",
      formattedDailyBudget: "¥---/日",
      daysLeftInMonth: 0,
      healthLabel: "オフライン",
      healthStatus: "warning"
    };
  }
}

async function createWidget() {
  const data = await fetchKakeiboData();
  const widget = new ListWidget();
  widget.url = APP_URL;

  const gradient = new LinearGradient();
  gradient.colors = [new Color("#14171F"), new Color("#1F2432")];
  gradient.locations = [0.0, 1.0];
  widget.backgroundGradient = gradient;
  widget.setPadding(16, 16, 16, 16);

  const topRow = widget.addStack();
  topRow.layoutHorizontally();
  const title = topRow.addText("家計簿 残高");
  title.textColor = new Color("#D4A15C");
  title.font = Font.boldSystemFont(11);

  widget.addSpacer(10);
  const lbl = widget.addText("自由資金");
  lbl.textColor = new Color("#A0AEC0");
  lbl.font = Font.systemFont(11);

  const amount = widget.addText(data.formattedFreeBalance);
  amount.textColor = new Color("#FFFFFF");
  amount.font = Font.heavySystemFont(22);

  return widget;
}

await run();
`;

  const activeScript = styleMode === 'gamaguchi' ? gamaguchiScriptCode : appleScriptCode;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(activeScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyApiUrl = () => {
    navigator.clipboard.writeText(widgetApiUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const downloadScriptFile = () => {
    const blob = new Blob([activeScript], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = styleMode === 'gamaguchi' ? 'kakeibo-gamaguchi-small.js' : 'kakeibo-widget.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayFreeAmount = privacyMode ? 888888 : totals.free;

  return (
    <div className="space-y-6">
      {/* Featured Header */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900/60 via-[#1D212C] to-[#14171F] border-2 border-blue-500/40 p-5 shadow-2xl">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-2xl bg-blue-600/30 text-yellow-300 border border-yellow-400/30 mt-0.5 shadow-md flex-shrink-0">
            <GamaguchiIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-white">
                小サイズ(2x2)対応 ＆ 文字切れ修正完了！
              </h2>
              <span className="text-[10px] bg-yellow-400 text-black font-black px-2 py-0.5 rounded-full shadow-sm">
                小サイズ最適化
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              ご要望にお応えして、<strong>iPhoneホーム画面の小サイズ（2x2 正方形）</strong>にジャストフィットする専用レイアウトを作成しました！また、斜体文字の端や「円」の文字が切れないよう<strong>十分な余白と動的フォントサイズ調整</strong>を適用しました。
            </p>
          </div>
        </div>

        {/* Style Selector Buttons */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-2">
          <button
            onClick={() => setStyleMode('gamaguchi')}
            className={`flex items-center space-x-2 text-xs font-bold py-2 px-3.5 rounded-xl transition ${
              styleMode === 'gamaguchi'
                ? 'bg-blue-600 text-yellow-300 border border-yellow-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Gamepad2 className="w-4 h-4 text-yellow-300" />
            <span>がま口ゲームHUD風 (小サイズ・中サイズ)</span>
          </button>

          <button
            onClick={() => setStyleMode('apple')}
            className={`flex items-center space-x-2 text-xs font-semibold py-2 px-3.5 rounded-xl transition ${
              styleMode === 'apple'
                ? 'bg-[#D4A15C] text-black font-bold shadow-md'
                : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Appleモダンカード風</span>
          </button>
        </div>
      </div>

      {/* Live Preview Container */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>
                {styleMode === 'gamaguchi'
                  ? 'がま口 コインバー リアルタイム プレビュー'
                  : 'Appleモダンウィジェット プレビュー'}
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              iPhoneホーム画面で文字欠けなく綺麗に収まる様子を確認できます
            </p>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {styleMode === 'gamaguchi' && (
              <>
                {/* Size toggle: Small vs Medium */}
                <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setGamaguchiSize('small')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition flex items-center space-x-1 ${
                      gamaguchiSize === 'small'
                        ? 'bg-blue-600 text-yellow-300 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-3 h-3" />
                    <span>小 (2x2 正方形)</span>
                  </button>
                  <button
                    onClick={() => setGamaguchiSize('medium')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-bold transition flex items-center space-x-1 ${
                      gamaguchiSize === 'medium'
                        ? 'bg-blue-600 text-yellow-300 shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>中 (2x4 横長)</span>
                  </button>
                </div>

                <button
                  onClick={() => setUseComma(!useComma)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border transition ${
                    useComma
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                  title="数字のカンマ区切りの切り替え"
                >
                  {useComma ? 'カンマあり' : 'カンマなし'}
                </button>
              </>
            )}

            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              className={`p-1.5 rounded-xl border text-xs flex items-center space-x-1 transition ${
                privacyMode
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
              title="プライバシーモード"
            >
              {privacyMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{privacyMode ? '伏せ字' : '表示'}</span>
            </button>
          </div>
        </div>

        {/* Live Canvas Mockup */}
        <div className="bg-[#0B0D13] p-5 sm:p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center min-h-[220px]">
          {styleMode === 'gamaguchi' ? (
            gamaguchiSize === 'small' ? (
              /* SMALL WIDGET (2x2 SQUARE) - PERFECT FIT */
              <div className="flex flex-col items-center space-y-3">
                <div className="text-[10px] text-gray-400 text-center font-medium">
                  ▼ iPhoneホーム画面 小サイズ（2x2 正方形）ウィジェット
                </div>

                <div className="transform hover:scale-105 transition-transform cursor-pointer">
                  <GamaguchiBar
                    amount={displayFreeAmount}
                    unit="円"
                    variant="square"
                    showBg={true}
                    useComma={useComma}
                    dailyBudget={dailyBudget}
                    daysLeft={daysLeft}
                  />
                </div>

                <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>数字と「円」の文字欠けなし・右端余白バッチリです</span>
                </div>
              </div>
            ) : (
              /* MEDIUM WIDGET (2x4 HORIZONTAL BAR) */
              <div className="w-full max-w-[390px] space-y-3">
                <div className="text-[10px] text-gray-400 text-center font-medium">
                  ▼ iPhoneホーム画面 中サイズ（2x4 横長）ウィジェット
                </div>

                <div className="transform hover:scale-[1.02] transition-transform cursor-pointer">
                  <GamaguchiBar
                    amount={displayFreeAmount}
                    unit="円"
                    size="lg"
                    variant="bar"
                    showBg={true}
                    useComma={useComma}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 px-1">
                  <span>残高: {formatYen(totals.free)}</span>
                  <a
                    href={`${gamaguchiSvgUrl}?size=medium`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <span>SVGを開く</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )
          ) : (
            /* Modern Apple Style */
            <div className="w-[160px] h-[160px] rounded-[26px] p-4 border border-white/10 bg-gradient-to-br from-[#14171F] to-[#1E2330] shadow-2xl flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D4A15C]">家計簿 残高</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">自由に使える金額</p>
                <div className="text-xl font-black font-mono tracking-tight text-white my-0.5">
                  {privacyMode ? '¥***,***' : formatYen(totals.free)}
                </div>
              </div>
              <div className="text-[9px] text-gray-500 pt-1 border-t border-white/5">
                目安: {formatYen(dailyBudget)}/日
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3 Step Setup Guide */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>iPhoneへの小サイズウィジェット設定手順 (約1分)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs">
                  1
                </span>
                <h4 className="text-xs font-bold text-white">Scriptableをインストール</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                App Storeから公式無料アプリ「<strong>Scriptable</strong>」をiPhoneにダウンロードします。
              </p>
            </div>
            <a
              href="https://apps.apple.com/jp/app/scriptable/id1405459188"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center justify-center space-x-1 text-xs text-blue-400 bg-white/5 hover:bg-white/10 py-1.5 px-3 rounded-xl border border-blue-400/20 transition"
            >
              <span>App Storeを開く</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs">
                  2
                </span>
                <h4 className="text-xs font-bold text-white">コードをコピー＆保存</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                下の「コードをコピー」をタップ。Scriptableアプリを開いて右上の「＋」を押し、貼り付けて右上の「Done」で保存（名前：「がま口残高」）。
              </p>
            </div>
            <button
              onClick={copyScriptCode}
              className={`mt-3 flex items-center justify-center space-x-1.5 text-xs font-bold py-1.5 px-3 rounded-xl transition ${
                copiedCode
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-blue-600 hover:bg-blue-500 text-yellow-300'
              }`}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'コピー完了！' : 'コードをコピー'}</span>
            </button>
          </div>

          {/* Step 3 */}
          <div className="rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white font-black text-xs">
                  3
                </span>
                <h4 className="text-xs font-bold text-white">小サイズで配置！</h4>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                iPhoneホーム画面を長押しして左上「＋」＞「Scriptable」の<strong>小サイズ（Small 2x2 正方形）</strong>を選択。配置後、ウィジェットを長押し「編集」＞ Scriptで「がま口残高」を選べば完了！
              </p>
            </div>
            <div className="mt-3 text-[10px] text-yellow-300 bg-blue-500/20 border border-blue-400/30 py-1.5 px-2.5 rounded-xl text-center font-bold">
              ★ 小サイズでも文字欠けなく常駐！
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer & Download */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {styleMode === 'gamaguchi'
                  ? 'がま口HUD用 Scriptableスクリプト (JavaScript)'
                  : 'Appleモダン用 Scriptableスクリプト'}
              </span>
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              ウィジェットの小・中サイズに自動適応する最新コードです
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={downloadScriptFile}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs flex items-center space-x-1"
              title="JSファイルをダウンロード"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">ダウンロード</span>
            </button>
            <button
              onClick={copyScriptCode}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                copiedCode
                  ? 'bg-emerald-500 text-black'
                  : 'bg-blue-600 hover:bg-blue-500 text-yellow-300'
              }`}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'コピー完了' : 'スクリプトをコピー'}</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-[#0D1017] p-3 rounded-2xl text-[11px] text-gray-300 font-mono overflow-x-auto max-h-48 border border-white/5 leading-relaxed">
            {activeScript}
          </pre>
        </div>
      </div>

      {/* Direct SVG Link for Small & Medium */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-3">
        <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>ダイレクト画像 (SVG) プレビューリンク</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            href={`${gamaguchiSvgUrl}?size=small`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between bg-[#0D1017] p-2.5 rounded-xl border border-white/5 text-xs text-blue-400 hover:border-blue-400/50 transition"
          >
            <span>小サイズ (160×160 正方形) SVG</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={`${gamaguchiSvgUrl}?size=medium`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between bg-[#0D1017] p-2.5 rounded-xl border border-white/5 text-xs text-blue-400 hover:border-blue-400/50 transition"
          >
            <span>中サイズ (370×88 横長) SVG</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
