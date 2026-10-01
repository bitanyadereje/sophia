import React, { useState, useRef, useEffect } from 'react';
import { ScreenId, UserProfile, ThemeMode } from '../types';
import { THEMES_LIST, ThemeOption } from '../data/themes';
import { BookOpen, Search, Menu, X, Check, Palette, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  user?: UserProfile;
  onOpenSearch?: () => void;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  titleContext?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenSearch,
  theme,
  onSetTheme,
}) => {
  const { language, setLanguage, toggleLanguage, t, isAmharic } = useLanguage();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on screen change
  const handleNavClick = (screen: ScreenId) => {
    onNavigate(screen);
    setIsMobileMenuOpen(false);
  };

const primaryNavLinks: { id: ScreenId; label: string }[] = [
  { id: 'home', label: t('nav.home', 'Home') },
  { id: 'paths', label: t('nav.paths', 'Paths') },
  { id: 'library', label: t('nav.saved', 'Saved') },
  { id: 'discussions', label: t('nav.discussions', 'Discussions') },
  { id: 'reviews', label: t('nav.reviews', 'Reviews') }
];

  const allMobileNavLinks: { id: ScreenId; label: string; icon: string; desc: string }[] = [
    { id: 'home', label: isAmharic ? 'የማህበረሰብ ዜናዎች' : 'Community Feed', icon: 'temple_buddhist', desc: isAmharic ? 'የውይይቶች እና የመጽሐፍ ዳሰሳዎች ዜና' : 'Discussions & reviews feed' },
    { id: 'paths', label: isAmharic ? 'የንባብ መንገዶች' : 'Reading Paths', icon: 'alt_route', desc: isAmharic ? 'የተዘጋጁ የንባብ መርሃ-ግብሮች' : 'Guided reading plans & topics' },
    { id: 'library', label: isAmharic ? 'የተቀመጡ መጽሐፎች' : 'Saved Books', icon: 'bookmark', desc: isAmharic ? 'የእርስዎ የተቀመጡ መጽሐፎች' : 'Your saved books' },
    { id: 'notes', label: isAmharic ? 'የግል ማስታወሻዎች' : 'Private Notes', icon: 'edit_note', desc: isAmharic ? 'የእርስዎ የግል ማስታወሻዎች' : 'Your private notes and thoughts' },
    { id: 'colloquium', label: isAmharic ? 'የመጽሐፍ ውይይቶች' : 'Book Discussions', icon: 'school', desc: isAmharic ? 'የጥራዞች ማውጫ እና የጽሑፍ ሴሚናሮች' : 'Volume directory & text seminars' },
    { id: 'discussions', label: isAmharic ? 'የማህበረሰብ ጥያቄና መልስ' : 'Community Q&A', icon: 'forum', desc: isAmharic ? 'ጥያቄዎችን ይጠይቁ እና መልሶችን ያንብቡ' : 'Ask questions and read answers' },
    { id: 'reviews', label: isAmharic ? 'መጽሐፍ ዳሰሳ' : 'Book Reviews', icon: 'history_edu', desc: isAmharic ? 'የአባላት መጽሐፍ ዳሰሳዎች እና ደረጃዎች' : 'Member reviews and ratings' },
    { id: 'profile', label: isAmharic ? 'የአንባቢ መገለጫ' : 'Reader Profile', icon: 'account_circle', desc: isAmharic ? 'ዓመታዊ ግብ እና የንባብ ፍላጎቶች' : 'Annual goal & reading interests' }
  ];

  const currentTheme = THEMES_LIST.find((t) => t.id === theme) || THEMES_LIST[0];

  // Theme-aware style helpers
  const getHeaderClasses = () => {
    switch (theme) {
      case 'cream':
        return 'bg-[#faf7f2] border-b border-[#dfd5c6] shadow-[0_1px_6px_rgba(43,24,16,0.04)] text-[#2b1810]';
      case 'vintage':
        return 'bg-[#ebdcc4] border-b border-[#c6af89] shadow-[0_2px_10px_rgba(50,30,10,0.07)] text-[#27120a]';
      case 'dark':
        return 'bg-[#131519] border-b border-[#252830] shadow-md text-white';
      case 'navy':
        return 'bg-[#0a1f3d] border-b border-[#b89e6c]/25 shadow-[0_2px_14px_rgba(10,31,61,0.25)] text-[#f8fafc]';
      case 'burgundy':
        return 'bg-[#3b070c] border-b border-[#b89e6c]/25 shadow-[0_2px_14px_rgba(59,7,12,0.25)] text-[#f8fafc]';
      case 'gray':
        return 'bg-white border-b border-slate-200 shadow-xs text-slate-900';
      case 'brown':
        return 'bg-[#3a2214] border-b border-[#c99a6b]/50 shadow-[0_2px_14px_rgba(58,34,20,0.3)] text-[#fffdf9]';
      case 'light':
      default:
        return 'bg-[#eef6ff] border-b border-[#d4af37]/50 shadow-[0_2px_12px_rgba(2,132,199,0.06)] text-[#0f2b5c]';
    }
  };

  const getLogoBadgeClasses = () => {
    switch (theme) {
      case 'cream':
        return 'bg-[#3e2415] text-[#faf7f2] border border-[#3e2415] shadow-xs';
      case 'vintage':
        return 'bg-[#faf4e8] text-[#8e1c16] border border-[#c6af89]';
      case 'dark':
        return 'bg-[#1e2229] text-[#dfba4f] border border-[#353b49]';
      case 'navy':
        return 'bg-white text-[#0a1f3d] border border-white shadow-xs';
      case 'burgundy':
        return 'bg-white text-[#3b070c] border border-white shadow-xs';
      case 'gray':
        return 'bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs';
      case 'brown':
        return 'bg-[#4e2f1b] text-[#fbf7ee] border border-[#c99a6b]/70 shadow-2xs';
      case 'light':
      default:
        return 'bg-white text-[#b8860b] border border-[#d4af37]/70 shadow-2xs';
    }
  };

  const getBrandTitleColor = () => {
    switch (theme) {
      case 'cream':
        return 'text-[#2b1810]';
      case 'vintage':
        return 'text-[#27120a]';
      case 'dark':
        return 'text-white';
      case 'navy':
        return 'text-white';
      case 'burgundy':
        return 'text-white';
      case 'brown':
        return 'text-white';
      case 'gray':
        return 'text-slate-900';
      case 'light':
      default:
        return 'text-[#0f2b5c]';
    }
  };

  const getBrandSubtitleClasses = () => {
    switch (theme) {
      case 'cream':
        return 'font-sans text-[#735845] font-medium';
      case 'vintage':
        return 'font-serif italic text-[#7d5236]';
      case 'dark':
        return 'font-sans text-slate-400';
      case 'navy':
        return 'font-sans text-[#b89e6c] font-medium';
      case 'burgundy':
        return 'font-sans text-[#b89e6c] font-medium';
      case 'gray':
        return 'font-sans text-slate-500 font-medium';
      case 'brown':
        return 'font-serif italic text-[#e7cfb5]';
      case 'light':
      default:
        return 'font-sans text-[#b8860b] font-medium';
    }
  };

  const getActiveLangClasses = () => {
    switch (theme) {
      case 'cream':
        return 'bg-[#3e2415] text-[#faf7f2] font-bold shadow-xs';
      case 'vintage':
        return 'bg-[#faf4e8] text-[#8e1c16] font-bold border border-[#c6af89] shadow-xs';
      case 'dark':
        return 'bg-[#282c35] text-[#dfba4f] font-bold shadow-xs';
      case 'navy':
        return 'bg-white text-[#0a1f3d] font-bold shadow-xs';
      case 'burgundy':
        return 'bg-white text-[#3b070c] font-bold shadow-xs';
      case 'gray':
        return 'bg-slate-800 text-white font-bold shadow-xs';
      case 'brown':
        return 'bg-[#c99a6b] text-[#2b1810] font-bold shadow-xs border border-[#e5c7a5]';
      case 'light':
      default:
        return 'bg-[#0f2b5c] text-white font-bold shadow-xs';
    }
  };

  const getInactiveLangClasses = () => {
    return 'opacity-65 hover:opacity-100 hover:bg-current/10 text-current font-medium';
  };

  const getNavLinkClasses = (isActive: boolean) => {
    if (isActive) {
      switch (theme) {
        case 'cream':
          return 'bg-[#3e2415] text-white font-medium shadow-xs';
        case 'vintage':
          return 'bg-[#faf4e8] text-[#8e1c16] font-serif font-semibold border border-[#c6af89] shadow-xs';
        case 'dark':
          return 'bg-[#282c35] text-[#dfba4f] font-semibold shadow-xs';
        case 'navy':
          return 'bg-white text-[#0a1f3d] font-bold shadow-xs';
        case 'burgundy':
          return 'bg-white text-[#3b070c] font-bold shadow-xs';
        case 'gray':
          return 'bg-slate-800 text-white font-semibold shadow-xs';
        case 'brown':
          return 'bg-[#c99a6b] text-[#2b1810] font-bold shadow-xs border border-[#e5c7a5]';
        case 'light':
        default:
          return 'bg-[#d4af37] text-[#0f2b5c] font-bold shadow-xs border border-[#b8860b]';
      }
    } else {
      switch (theme) {
        case 'cream':
          return 'text-[#2b1810] font-medium hover:bg-[#efe8dc] hover:text-[#000]';
        case 'vintage':
          return 'text-[#27120a] font-serif font-medium hover:bg-[#dfcdb2]';
        case 'dark':
          return 'text-slate-200 hover:text-white hover:bg-[#20232a]';
        case 'navy':
          return 'text-[#b89e6c] font-medium hover:text-white hover:bg-[#b89e6c]/15';
        case 'burgundy':
          return 'text-[#b89e6c] font-medium hover:text-white hover:bg-[#b89e6c]/15';
        case 'gray':
          return 'text-slate-600 font-medium hover:text-slate-900 hover:bg-slate-100';
        case 'brown':
          return 'text-[#f5ecd9] font-medium hover:text-white hover:bg-white/10';
        case 'light':
        default:
          return 'text-[#1e3a5f] font-medium hover:text-[#b8860b] hover:bg-[#e0efff]';
      }
    }
  };

  const getGhostBtnClasses = () => {
    switch (theme) {
      case 'cream':
        return 'text-[#2b1810]/75 hover:text-[#2b1810] hover:bg-[#2b1810]/10 active:bg-[#2b1810]/15';
      case 'vintage':
        return 'text-[#27120a]/75 hover:text-[#27120a] hover:bg-[#27120a]/10 active:bg-[#27120a]/15';
      case 'dark':
        return 'text-slate-300 hover:text-white hover:bg-white/10 active:bg-white/15';
      case 'navy':
        return 'text-[#b89e6c] hover:text-white hover:bg-[#b89e6c]/15 active:bg-[#b89e6c]/25';
      case 'burgundy':
        return 'text-[#b89e6c] hover:text-white hover:bg-[#b89e6c]/15 active:bg-[#b89e6c]/25';
      case 'gray':
        return 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 active:bg-slate-200';
      case 'brown':
        return 'text-[#f5ecd9]/80 hover:text-white hover:bg-white/10 active:bg-white/15';
      case 'light':
      default:
        return 'text-[#1e3a5f]/80 hover:text-[#0f2b5c] hover:bg-[#0284c7]/10 active:bg-[#0284c7]/15';
    }
  };

  const getActionBtnClasses = () => {
    switch (theme) {
      case 'cream':
        return 'border border-[#dfd5c6] bg-white hover:bg-[#f5eedf] text-[#2b1810] shadow-2xs';
      case 'vintage':
        return 'border border-[#c6af89] bg-[#faf4e8] hover:bg-[#f5ecdd] text-[#27120a]';
      case 'dark':
        return 'border border-[#353b49] bg-[#1e2229] hover:bg-[#282c35] text-white';
      case 'navy':
        return 'border border-[#b89e6c]/40 bg-transparent hover:bg-[#b89e6c]/15 text-[#b89e6c] hover:text-white';
      case 'burgundy':
        return 'border border-[#b89e6c]/40 bg-transparent hover:bg-[#b89e6c]/15 text-[#b89e6c] hover:text-white';
      case 'gray':
        return 'border border-slate-300 bg-white hover:bg-slate-100 text-slate-800';
      case 'brown':
        return 'border border-[#c99a6b]/60 bg-[#4e2f1b] hover:bg-[#613b22] text-[#fffdf9]';
      case 'light':
      default:
        return 'border border-[#d4af37]/60 bg-white hover:bg-[#e0efff] text-[#1e3a5f]';
    }
  };

  const getActionIconClasses = () => {
    switch (theme) {
      case 'cream':
        return 'text-[#2b1810]';
      case 'vintage':
        return 'text-[#8e1c16]';
      case 'dark':
        return 'text-[#dfba4f]';
      case 'navy':
        return 'text-[#b89e6c]';
      case 'burgundy':
        return 'text-[#b89e6c]';
      case 'gray':
        return 'text-slate-600';
      case 'brown':
        return 'text-[#f3dfca]';
      case 'light':
      default:
        return 'text-[#b8860b]';
    }
  };

  const getDropdownClasses = () => {
    switch (theme) {
      case 'cream':
        return 'bg-[#fbf7ee] border-[#dfd5c6] text-[#2b1810] shadow-2xl';
      case 'vintage':
        return 'bg-[#faf4e8] border-[#c6af89] text-[#27120a]';
      case 'dark':
        return 'bg-[#181a1f] border-[#353b49] text-[#f7f6f2]';
      case 'navy':
        return 'bg-[#0a1f3d] border-[#b89e6c]/30 text-[#f8fafc] shadow-2xl';
      case 'burgundy':
        return 'bg-[#3b070c] border-[#b89e6c]/30 text-[#f8fafc] shadow-2xl';
      case 'gray':
        return 'bg-white border-slate-200 text-slate-900 shadow-xl';
      case 'brown':
        return 'bg-[#2e190d] border-[#c99a6b]/50 text-[#fffbf5] shadow-2xl';
      case 'light':
      default:
        return 'bg-white border-[#d1e2f4] shadow-xl text-[#0c1e38]';
    }
  };

  const getDropdownItemHover = (isActive: boolean) => {
    if (isActive) {
      switch (theme) {
        case 'cream':
          return 'bg-[#efe8dc] font-semibold text-[#2b1810]';
        case 'vintage':
          return 'bg-[#f1e6d4] font-semibold text-[#8e1c16]';
        case 'dark':
          return 'bg-[#282c35] font-semibold text-[#dfba4f]';
        case 'navy':
          return 'bg-white font-semibold text-[#0a1f3d]';
        case 'burgundy':
          return 'bg-white font-semibold text-[#3b070c]';
        case 'gray':
          return 'bg-slate-100 font-semibold text-slate-900';
        case 'brown':
          return 'bg-[#52311c] font-semibold text-[#fdedd7]';
        case 'light':
        default:
          return 'bg-[#eff6ff] font-semibold text-[#0f2b5c]';
      }
    } else {
      switch (theme) {
        case 'cream':
          return 'text-[#3e2415] hover:bg-[#f5eedf] hover:text-[#2b1810]';
        case 'vintage':
          return 'text-[#3c2013] hover:bg-[#f1e6d4]';
        case 'dark':
          return 'text-slate-300 hover:bg-[#20232a]';
        case 'navy':
          return 'text-[#b89e6c] hover:bg-[#b89e6c]/15 hover:text-white';
        case 'burgundy':
          return 'text-[#b89e6c] hover:bg-[#b89e6c]/15 hover:text-white';
        case 'gray':
          return 'text-slate-600 hover:bg-slate-50 hover:text-slate-900';
        case 'brown':
          return 'text-[#e9dac7] hover:bg-[#432514] hover:text-white';
        case 'light':
        default:
          return 'text-[#1e3a5f] hover:bg-[#f0f7ff] hover:text-[#0f2b5c]';
      }
    }
  };

  const getMobileDrawerClasses = () => {
    switch (theme) {
      case 'cream':
        return 'border-t border-[#dfd5c6] bg-[#faf7f2] text-[#2b1810]';
      case 'vintage':
        return 'border-t border-[#c6af89] bg-[#faf4e8]';
      case 'dark':
        return 'border-t border-[#353b49] bg-[#181a1f]';
      case 'navy':
        return 'border-t border-[#b89e6c]/25 bg-[#0a1f3d] text-[#f8fafc]';
      case 'burgundy':
        return 'border-t border-[#b89e6c]/25 bg-[#3b070c] text-[#f8fafc]';
      case 'gray':
        return 'border-t border-slate-200 bg-white';
      case 'brown':
        return 'border-t border-[#c99a6b]/50 bg-[#341e11]';
      case 'light':
      default:
        return 'border-t border-[#d4af37]/40 bg-[#f0f7ff]';
    }
  };

  return (
    <header className={`fixed top-0 w-full z-40 pt-safe transition-colors duration-200 ${getHeaderClasses()}`}>
      <div className="h-16 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between max-w-7xl mx-auto w-full gap-2 sm:gap-4">
        {/* Brand Logo & Title */}
        <div
          id="header-brand-logo"
          className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none flex-shrink-0"
        >
          {/* Sophia Logo Icon */}
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 group-hover:scale-105 ${getLogoBadgeClasses()}`}
          >
            <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className={`font-serif text-base sm:text-lg font-bold leading-none tracking-tight ${getBrandTitleColor()}`}>
              {t('brand.title', isAmharic ? 'ሶፊያ' : 'Sophia')}
            </span>
            <span className={`text-[10px] hidden sm:block mt-0.5 tracking-tight ${getBrandSubtitleClasses()}`}>
              {t('brand.subtitle', isAmharic ? 'ታሪካዊ ቤተ-መጻሕፍት' : 'Historical Library')}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 lg:gap-2">
          {primaryNavLinks.map((link) => {
            const isActive = currentScreen === link.id || 
              (link.id === 'paths' && currentScreen === 'path-detail');
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                title={link.id === 'colloquium' ? 'Book Discussion · Chapter Questions & Reading' : undefined}
                className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer whitespace-nowrap ${getNavLinkClasses(isActive)}`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls: Language Toggle, Search, Theme Switcher & Mobile Menu Toggle */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Language Toggle (EN | አማ) */}
          <div
            className="flex items-center rounded-lg border border-current/20 p-0.5 text-xs font-serif shrink-0 bg-current/5"
            role="group"
            aria-label="Language selection"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer font-serif ${
                language === 'en' ? getActiveLangClasses() : getInactiveLangClasses()
              }`}
              title="Switch to English"
              aria-label="English"
              aria-pressed={language === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('am')}
              className={`px-2 py-0.5 rounded-md text-[11px] sm:text-xs transition-all cursor-pointer font-serif ${
                language === 'am' ? getActiveLangClasses() : getInactiveLangClasses()
              }`}
              title="ወደ አማርኛ ቀይር (Amharic)"
              aria-label="አማርኛ"
              aria-pressed={language === 'am'}
            >
              አማ
            </button>
          </div>

          {/* Global Search Trigger (Icon-Only Ghost Button: Magnifying Glass) */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label={t('nav.search', 'Search Catalog and Texts')}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${getGhostBtnClasses()}`}
              title={t('header.searchPlaceholder', 'Search Catalog and Texts (Press / or tap)')}
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>
          )}

          {/* Theme Selector Popover (Icon-Only Ghost Button: Paint Palette) */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              aria-label={t('nav.theme', 'Select Theme')}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${getGhostBtnClasses()}`}
              title={`Manuscript Theme: ${currentTheme.label}`}
            >
              <Palette className="w-[18px] h-[18px]" strokeWidth={2} />
            </button>

            {isThemeMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border shadow-2xl py-2 z-50 animate-fade-in max-h-[82vh] overflow-y-auto ${getDropdownClasses()}`}
              >
                <div className="px-3.5 py-2 border-b border-current/15 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#d4af37]">palette</span>
                    <span className="text-[11px] font-label-md uppercase tracking-wider font-bold">
                      {t('header.themeMenuTitle', 'Manuscript Themes')} ({THEMES_LIST.length})
                    </span>
                  </div>
                  <span className="text-[10px] opacity-70 font-sans font-medium">
                    {t('header.selectStyle', 'Select style')}
                  </span>
                </div>

                <div className="p-1.5 flex flex-col gap-1">
                  {THEMES_LIST.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          onSetTheme(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-lg transition-all cursor-pointer flex items-start gap-2.5 ${getDropdownItemHover(isSelected)} ${
                          isSelected ? 'ring-1 ring-inset ring-current/25' : ''
                        }`}
                      >
                        {/* Theme circle indicator */}
                        <div
                          className="w-4 h-4 rounded-full border border-black/25 mt-0.5 flex-shrink-0 shadow-2xs"
                          style={{ backgroundColor: t.previewColor }}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-serif font-bold truncate">
                              {t.label}
                            </span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full border border-current/20 opacity-80 font-sans uppercase">
                                {t.category}
                              </span>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-[#d4af37]" />
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] block truncate opacity-75 mt-0.5">
                            {t.subtitle}
                          </span>

                          {/* 5-Color Harmonic Swatches */}
                          <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-current/10">
                            {t.palette.map((p) => (
                              <span
                                key={p.name}
                                className="w-3 h-3 rounded-full border border-black/25 shadow-2xs"
                                style={{ backgroundColor: p.color }}
                                title={`${p.name}: ${p.hex}`}
                              />
                            ))}
                            <span className="text-[9px] font-sans font-medium ml-auto opacity-70">
                              5 tones
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            aria-label={t('nav.profile', isAmharic ? 'መገለጫ' : 'Profile')}
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${getGhostBtnClasses()}`}
            title={t('nav.profile', isAmharic ? 'መገለጫ' : 'Profile')}
          >
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>

          {/* Mobile Hamburger Navigation Button (Ghost Button) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            className={`md:hidden w-9 h-9 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${getGhostBtnClasses()}`}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl animate-fade-in ${getMobileDrawerClasses()}`}>
          <div className="p-4 flex flex-col gap-2">
            {/* Mobile Language Switcher Row */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-current/5 border border-current/10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 opacity-75" />
                <span className="text-xs font-serif font-bold">{isAmharic ? 'ቋንቋ ምረጥ' : 'Choose Language'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-serif transition-all cursor-pointer ${
                    language === 'en' ? getActiveLangClasses() : 'opacity-70 hover:opacity-100 bg-current/5'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('am')}
                  className={`px-3 py-1 rounded-lg text-xs font-serif transition-all cursor-pointer ${
                    language === 'am' ? getActiveLangClasses() : 'opacity-70 hover:opacity-100 bg-current/5'
                  }`}
                >
                  አማርኛ
                </button>
              </div>
            </div>

            <div className="px-2 pt-1 text-[10px] font-label-md uppercase tracking-wider font-bold opacity-75">
              {isAmharic ? 'የማውጫ ዝርዝር' : 'Navigation Menu'}
            </div>
            {allMobileNavLinks.map((link) => {
              const isActive = currentScreen === link.id ||
                (link.id === 'paths' && currentScreen === 'path-detail');
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-colors cursor-pointer ${getNavLinkClasses(isActive)}`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-current/10">
                    <span className="material-symbols-outlined text-[20px]">
                      {link.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{link.label}</span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <span className="text-xs block truncate opacity-75">
                      {link.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

