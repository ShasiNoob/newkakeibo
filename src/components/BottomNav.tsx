import React from 'react';
import { Home, List, PieChart, Wallet, Smartphone, Settings as SettingsIcon } from 'lucide-react';

export type TabType = 'home' | 'transactions' | 'charts' | 'funds' | 'widget' | 'settings';

interface BottomNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const items: Array<{ id: TabType; label: string; icon: React.ReactNode; isSpecial?: boolean }> = [
    { id: 'home', label: 'ホーム', icon: <Home className="w-5 h-5" /> },
    { id: 'transactions', label: '収支', icon: <List className="w-5 h-5" /> },
    { id: 'charts', label: 'グラフ', icon: <PieChart className="w-5 h-5" /> },
    { id: 'funds', label: '資金', icon: <Wallet className="w-5 h-5" /> },
    {
      id: 'widget',
      label: 'ウィジェット',
      icon: <Smartphone className="w-5 h-5" />,
      isSpecial: true,
    },
    { id: 'settings', label: '設定', icon: <SettingsIcon className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#14171F]/90 backdrop-blur-xl border-t border-white/10 pb-[max(env(safe-area-inset-bottom),10px)] pt-2">
      <div className="max-w-md mx-auto px-2 flex items-center justify-between">
        {items.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all duration-200 relative ${
                isActive ? 'text-[#D4A15C]' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {item.isSpecial && (
                <span className="absolute -top-1.5 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4A15C] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4A15C]"></span>
                </span>
              )}
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-[#D4A15C]/15 scale-105' : ''}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-semibold text-[#D4A15C]' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
