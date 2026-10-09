import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ClipboardPaste,
  FileText,
  X,
} from 'lucide-react';
import { Api, formatYen } from '../api/client.ts';
import type { Settings, Expense } from '../types.ts';

interface SettingsViewProps {
  settings: Settings;
  expenses: Expense[];
  onRefresh: () => void;
  onToast: (msg: string, isError?: boolean) => void;
}

const DEFAULT_CATEGORIES = [
  '食費',
  '交通費',
  '車',
  'DJ・音楽',
  'PC・ゲーム',
  'ファッション',
  '趣味',
  '日用品',
  '娯楽',
  'その他',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  expenses,
  onRefresh,
  onToast,
}) => {
  const safeCategories = Array.isArray(settings?.categories) && settings.categories.length > 0
    ? settings.categories
    : DEFAULT_CATEGORIES;

  const [savingsDefault, setSavingsDefault] = useState(
    typeof settings?.normalSavingsDefault === 'number' ? settings.normalSavingsDefault : 10000
  );
  const [carDefault, setCarDefault] = useState(
    typeof settings?.carMaintenanceDefault === 'number' ? settings.carMaintenanceDefault : 10000
  );
  const [categories, setCategories] = useState<string[]>(safeCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // JSON Paste Modal state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteJsonText, setPasteJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (settings) {
      if (typeof settings.normalSavingsDefault === 'number') {
        setSavingsDefault(settings.normalSavingsDefault);
      }
      if (typeof settings.carMaintenanceDefault === 'number') {
        setCarDefault(settings.carMaintenanceDefault);
      }
      if (Array.isArray(settings.categories) && settings.categories.length > 0) {
        setCategories(settings.categories);
      }
    }
  }, [settings]);

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await Api.updateSettings({
        normalSavingsDefault: Number(savingsDefault),
        carMaintenanceDefault: Number(carDefault),
        categories,
      });
      onToast('設定を保存しました');
      onRefresh();
    } catch (err: any) {
      onToast(err.message || '保存に失敗しました', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      onToast('すでに同じカテゴリが存在します', true);
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    setNewCategoryName('');
    Api.updateSettings({ categories: updated }).then(() => {
      onToast(`カテゴリ「${trimmed}」を追加しました`);
      onRefresh();
    });
  };

  const handleDeleteCategory = (cat: string) => {
    if (categories.length <= 1) {
      onToast('最低1つのカテゴリが必要です', true);
      return;
    }
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    Api.updateSettings({ categories: updated }).then(() => {
      onToast(`カテゴリ「${cat}」を削除しました`);
      onRefresh();
    });
  };

  const handleExportJSON = async () => {
    try {
      const data = await Api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kakeibo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onToast('JSONバックアップをダウンロードしました');
    } catch (err: any) {
      onToast('エクスポートに失敗しました', true);
    }
  };

  const handleImportJSONFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await Api.importData(text);
        onToast('データを正常に復元しました！');
        onRefresh();
      } catch (err: any) {
        onToast('JSON読み込み失敗: ' + (err.message || 'フォーマットが無効です'), true);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handlePasteImportSubmit = async () => {
    if (!pasteJsonText.trim()) {
      onToast('JSONテキストを入力してください', true);
      return;
    }
    setIsImporting(true);
    try {
      await Api.importData(pasteJsonText);
      onToast('データを正常に復元しました！');
      setShowPasteModal(false);
      setPasteJsonText('');
      onRefresh();
    } catch (err: any) {
      onToast('JSON読み込み失敗: ' + (err.message || 'JSON形式を確認してください'), true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const rows = [['日付', '項目名', '金額', 'カテゴリ', 'メモ', '支払い元割り当て']];
      expenses.forEach((e) => {
        const allocStr = (e.allocations || [])
          .map((a) => `${a.sourceMonth}(${a.type}): ${a.amount}`)
          .join(' / ');
        rows.push([e.date, e.name, String(e.amount), e.category, e.memo || '', allocStr]);
      });

      const csvContent =
        '\uFEFF' +
        rows
          .map((row) =>
            row
              .map((val) => `"${String(val).replace(/"/g, '""')}"`)
              .join(',')
          )
          .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kakeibo-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      onToast('支出データをCSVエクスポートしました');
    } catch (err: any) {
      onToast('CSV出力に失敗しました', true);
    }
  };

  const handleResetData = async () => {
    try {
      await Api.resetData();
      onToast('サンプル初期データにリセットしました');
      setConfirmReset(false);
      onRefresh();
    } catch (err: any) {
      onToast('リセットに失敗しました', true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white">設定</h2>
        <p className="text-[11px] text-gray-400">毎月の自動振分ルールとデータ管理</p>
      </div>

      {/* Default Allocation Rules */}
      <form onSubmit={handleSaveDefaults} className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-1.5">
          <SettingsIcon className="w-3.5 h-3.5 text-[#D4A15C]" />
          <span>収入登録時のデフォルト振分設定</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">
              普通貯金の初期値
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">¥</span>
              <input
                type="number"
                value={savingsDefault}
                onChange={(e) => setSavingsDefault(Number(e.target.value))}
                min="0"
                step="1000"
                className="w-full bg-[#14171F] text-xs text-white rounded-xl pl-7 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C] font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-400 block mb-1">
              車維持費の初期値
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-mono">¥</span>
              <input
                type="number"
                value={carDefault}
                onChange={(e) => setCarDefault(Number(e.target.value))}
                min="0"
                step="1000"
                className="w-full bg-[#14171F] text-xs text-white rounded-xl pl-7 pr-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C] font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center space-x-1.5 text-xs font-bold bg-[#D4A15C] hover:bg-[#c2914c] text-black py-2 rounded-xl transition"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? '保存中...' : 'デフォルト金額を保存'}</span>
        </button>
      </form>

      {/* Category Management */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-4">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
          支出カテゴリ管理
        </h3>

        {/* Add Category */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="新しいカテゴリ名..."
            className="flex-1 bg-[#14171F] text-xs text-white rounded-xl px-3 py-2 border border-white/10 focus:outline-none focus:border-[#D4A15C]"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="flex items-center space-x-1 text-xs bg-white/10 hover:bg-white/15 text-white font-medium px-3 py-2 rounded-xl border border-white/10 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>追加</span>
          </button>
        </div>

        {/* Category Tags */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center space-x-1.5 bg-[#14171F] border border-white/10 px-2.5 py-1 rounded-xl text-xs text-gray-200"
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat)}
                className="text-gray-500 hover:text-rose-400 transition"
                title="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Backup & Export / Import */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
          データバックアップ & 復元
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center space-x-1.5 text-xs bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl border border-white/10 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV出力</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center space-x-1.5 text-xs bg-white/5 hover:bg-white/10 text-white p-2.5 rounded-xl border border-white/10 transition"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>JSON保存</span>
          </button>
        </div>

        {/* Import Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="w-full flex items-center justify-center space-x-1.5 text-xs bg-[#D4A15C]/20 hover:bg-[#D4A15C]/30 text-[#D4A15C] p-2.5 rounded-xl border border-[#D4A15C]/40 transition font-bold"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>JSONテキストを貼り付けて復元</span>
          </button>

          <label className="flex items-center justify-center space-x-1.5 text-xs bg-white/5 hover:bg-white/10 text-gray-300 p-2.5 rounded-xl border border-white/10 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-gray-400" />
            <span>JSONファイルを選択して復元</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSONFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset Section */}
      <div className="rounded-3xl bg-[#1D212C] border border-white/10 p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          データ初期化
        </h3>

        {confirmReset ? (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-2">
            <p className="text-xs text-rose-300">
              現在のデータをサンプル初期データに復元しますか？
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleResetData}
                className="flex-1 text-xs bg-rose-500 text-white font-bold py-1.5 rounded-xl"
              >
                はい、リセットします
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 text-xs bg-white/10 text-gray-300 py-1.5 rounded-xl"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full flex items-center justify-center space-x-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 py-2 rounded-xl border border-white/10 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>サンプル初期データに戻す</span>
          </button>
        )}
      </div>

      {/* Direct JSON Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#1D212C] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#D4A15C]" />
                <h3 className="text-sm font-bold text-white">JSONテキストを貼り付けて復元</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              元の家計簿アプリからエクスポートしたJSONデータをそのまま貼り付けてください。
            </p>

            <textarea
              value={pasteJsonText}
              onChange={(e) => setPasteJsonText(e.target.value)}
              placeholder='{"version": 1, "incomes": [...], "funds": [...], "expenses": [...]}'
              className="w-full flex-1 min-h-[220px] bg-[#14171F] text-xs font-mono text-gray-200 p-3 rounded-2xl border border-white/10 focus:outline-none focus:border-[#D4A15C] resize-none"
            />

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={handlePasteImportSubmit}
                disabled={isImporting}
                className="flex-1 py-2.5 rounded-xl bg-[#D4A15C] hover:bg-[#c2914c] text-black font-bold text-xs transition disabled:opacity-50"
              >
                {isImporting ? 'インポート中...' : 'このJSONでデータを復元する'}
              </button>
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/10 text-gray-300 text-xs hover:bg-white/15 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
