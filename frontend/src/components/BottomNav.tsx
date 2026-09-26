import React from 'react';
import { ScreenId, ThemeMode } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  theme?: ThemeMode;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, theme = 'light' }) => {
  const { isAmharic } = useLanguage();
  const getActiveTab = (): ScreenId => {
    if (currentScreen === 'home') {
      return 'home';
    }
    if (currentScreen === 'discussions' || currentScreen === 'colloquium' || currentScreen === 'reviews' || currentScreen === 'book-detail' || currentScreen === 'seminar' || currentScreen === 'review-detail') {
      return 'discussions';
    }
    if (currentScreen === 'paths' || currentScreen === 'path-detail') {
      return 'paths';
    }
    if (currentScreen === 'library' || currentScreen === 'notes') {
      return 'library';
    }
    return 'home';
  };

  const activeTab = getActiveTab();

  const tabs: { id: ScreenId; label: string; icon: string }[] = [
    { id: 'home', label: isAmharic ? 'መነሻ' : 'Home', icon: 'temple_buddhist' },
    { id: 'discussions', label: isAmharic ? 'ውይይቶች' : 'Discussions', icon: 'forum' },
    { id: 'paths', label: isAmharic ? 'የሶፊያ መንገዶች' : 'Sophia paths', icon: 'alt_route' },
    { id: 'library', label: isAmharic ? 'የተቀመጡ' : 'Saved', icon: 'bookmarks' }
  ];

  const getNavContainerClasses = () => {
    switch (theme) {
      case 'cream':
        return 'bg-[#faf7f2] border-t border-[#dfd5c6] shadow-[0_-2px_12px_rgba(43,24,16,0.05)] text-[#2b1810]';
      case 'vintage':
        return 'bg-[#faf4e8] border-t border-[#cbb692] shadow-[0_-2px_12px_rgba(50,30,10,0.06)]';
      case 'dark':
        return 'bg-[#181a1f] border-t border-[#353b49] shadow-[0_-2px_12px_rgba(0,0,0,0.3)]';
      case 'navy':
        return 'bg-[#0a1f3d] border-t border-[#b89e6c]/25 shadow-[0_-2px_14px_rgba(10,31,61,0.3)] text-[#b89e6c]';
      case 'burgundy':
        return 'bg-[#3b070c] border-t border-[#b89e6c]/25 shadow-[0_-2px_14px_rgba(59,7,12,0.3)] text-[#b89e6c]';
      case 'gray':
        return 'bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(15,23,42,0.04)]';
      case 'brown':
        return 'bg-[#382112] border-t border-[#c99a6b]/50 shadow-[0_-2px_12px_rgba(56,33,18,0.25)] text-white';
      case 'light':
      default:
        return 'bg-[#eef6ff] border-t border-[#d4af37]/40 shadow-[0_-2px_12px_rgba(2,132,199,0.06)]';
    }
  };

  const getTabClasses = (isActive: boolean) => {
    if (isActive) {
      switch (theme) {
        case 'cream':
          return 'text-[#2b1810] font-serif font-bold';
        case 'vintage':
          return 'text-[#8e1c16] font-serif font-bold';
        case 'dark':
          return 'text-[#dfba4f] font-serif font-semibold';
        case 'navy':
          return 'text-[#fbbf24] font-serif font-bold';
        case 'burgundy':
          return 'text-[#fbbf24] font-serif font-bold';
        case 'gray':
          return 'text-slate-900 font-serif font-bold';
        case 'brown':
          return 'text-[#f5d59f] font-serif font-bold';
        case 'light':
        default:
          return 'text-[#0f2b5c] font-serif font-bold';
      }
    } else {
      switch (theme) {
        case 'cream':
          return 'text-[#8a705c] hover:text-[#2b1810] font-serif font-normal';
        case 'vintage':
          return 'text-[#5f3a23] hover:text-[#8e1c16] font-serif font-normal';
        case 'dark':
          return 'text-slate-400 hover:text-white font-serif font-normal';
        case 'navy':
          return 'text-[#8f7a4e] hover:text-[#fbbf24] font-serif font-normal';
        case 'burgundy':
          return 'text-[#8f7a4e] hover:text-[#fbbf24] font-serif font-normal';
        case 'gray':
          return 'text-slate-500 hover:text-slate-900 font-serif font-normal';
        case 'brown':
          return 'text-[#e2ceb8]/75 hover:text-white font-serif font-normal';
        case 'light':
        default:
          return 'text-[#476585] hover:text-[#0f2b5c] font-serif font-normal';
      }
    }
  };

  return (
    <nav
      id="persistent-monastic-navigation"
      aria-label="Monastic Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe transition-colors duration-200 ${getNavContainerClasses()}`}
    >
      <div className="flex justify-between items-center h-16 px-4 max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center min-w-[44px] min-h-[44px] py-1 transition-all focus:outline-none cursor-pointer relative ${getTabClasses(isActive)}`}
            >
              <span
                className="material-symbols-outlined text-[20px] leading-none mb-1 font-light"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] leading-tight tracking-normal text-center whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
