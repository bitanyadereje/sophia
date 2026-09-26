import React, { useState } from 'react';
import { UserProfile, ScreenId, ThemeMode } from '../types';
import { THEMES_LIST } from '../data/themes';
import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth: () => void;
  onShowToast: (msg: string) => void;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onNavigate,
  onOpenAuth,
  onShowToast,
  theme,
  onSetTheme
}) => {
  const { language, setLanguage, t, isAmharic } = useLanguage();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editTitle, setEditTitle] = useState(user.title);
  const [editLocation, setEditLocation] = useState(user.location);

  // Preference toggles
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [isCloistered, setIsCloistered] = useState(false);
  const [fontSizePref, setFontSizePref] = useState<'Standard' | 'Compact' | 'Magnified'>('Standard');

  // New interest
  const [newTopicInput, setNewTopicInput] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Adjust goal modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.goalTarget);

  const goalPercentage = Math.min(100, Math.round((user.booksRead / user.goalTarget) * 100));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: editName,
      title: editTitle,
      location: editLocation
    });
    setIsEditProfileOpen(false);
    onShowToast('Profile updated');
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim()) return;
    if (!user.topics.includes(newTopicInput.trim())) {
      onUpdateUser({ topics: [...user.topics, newTopicInput.trim()] });
      onShowToast(`Added "${newTopicInput.trim()}" to reading topics`);
    }
    setNewTopicInput('');
    setIsAddingTopic(false);
  };

  const handleSaveGoal = () => {
    onUpdateUser({ goalTarget: tempGoal });
    setIsGoalModalOpen(false);
    onShowToast(`2025 reading goal updated to ${tempGoal} books`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Scholar Header Card */}
        <article className="bg-theme-surface rounded-2xl p-5 sm:p-7 border border-theme shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm ring-2 ring-theme-accent/40"
                />
                <span
                  className="material-symbols-outlined absolute -bottom-1 -right-1 text-sm p-1 rounded-full bg-theme-accent text-white shadow-xs"
                  title="Active Reader"
                >
                  history_edu
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-serif text-[19px] sm:text-[22px] font-bold text-theme-main">{user.name}</h1>
                  <span
                    className="material-symbols-outlined text-[16px] text-theme-accent"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-theme-muted">{user.title}</span>
                <span className="text-[11px] sm:text-xs text-theme-subtle mt-0.5">
                  {user.location} · Joined {user.memberSince}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditName(user.name);
                setEditTitle(user.title);
                setEditLocation(user.location);
                setIsEditProfileOpen(true);
              }}
              className="self-start sm:self-center px-3 py-2 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-subtle border border-theme flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>{isAmharic ? 'መገለጫ አስተካክል' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Tri-stat Bar */}
          <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-theme">
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main block">{user.booksRead}</span>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'የተነበቡ መጻሕፍት' : 'Books Read'}
              </span>
            </div>
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main block">{user.notesCount}</span>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'ማስታወሻዎች እና ጥቅሶች' : 'Notes & Quotes'}
              </span>
            </div>
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <div className="flex items-center justify-center gap-0.5 text-theme-gold">
                <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main">{user.dayStreak}</span>
                <span className="material-symbols-outlined text-[17px]">local_fire_department</span>
              </div>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'የቀናት ተከታታይነት' : 'Day Streak'}
              </span>
            </div>
          </div>
        </article>

        {/* 2-Column Responsive Grid on Tablets & Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 2025 Reading Journey Card */}
          <section className="bg-theme-surface rounded-xl p-5 border border-theme shadow-sm flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-gold text-[22px]">auto_stories</span>
                <h2 className="font-serif text-[16px] font-bold text-theme-main">
                  {isAmharic ? 'የ2025 የንባብ ግብ' : '2025 Reading Goal'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setTempGoal(user.goalTarget);
                  setIsGoalModalOpen(true);
                }}
                className="text-xs text-theme-accent font-semibold hover:underline cursor-pointer"
              >
                {isAmharic ? 'ግብ አስተካክል' : 'Adjust Goal'}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-theme-muted font-medium">
                  {isAmharic ? `${user.booksRead} ከ ${user.goalTarget} መጻሕፍት ተነበቡ` : `${user.booksRead} of ${user.goalTarget} Books Read`}
                </span>
                <span className="font-bold text-theme-main">
                  {goalPercentage}% {isAmharic ? 'ተጠናቋል' : 'Complete'}
                </span>
              </div>
              <div className="h-2 w-full bg-theme-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-theme-accent rounded-full transition-all duration-500"
                  style={{ width: `${goalPercentage}%` }}
                ></div>
              </div>
            </div>
            <p className="text-xs text-theme-subtle leading-relaxed">
              {isAmharic ? 'ዓመታዊ የንባብ ዕቅድዎን ለማጠናቀቅ በትክክለኛው መንገድ ላይ ነዎት።' : 'On track to complete your annual reading plan.'}
            </p>
          </section>

          {/* Scholarly Interests & Focus */}
          <section className="bg-theme-surface rounded-xl p-5 border border-theme shadow-sm flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[16px] font-bold text-theme-main">
                {isAmharic ? 'የንባብ ርዕሶች እና ፍላጎቶች' : 'Reading Topics & Interests'}
              </h2>
              <span className="text-[11px] font-label-md text-theme-subtle uppercase">
                {user.topics.length} {isAmharic ? 'ርዕሶች' : 'Topics'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 my-auto">
              {user.topics.map((t) => (
                <span
                  key={t}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-theme-subtle text-theme-body border border-theme flex items-center"
                >
                  {t}
                </span>
              ))}

              {isAddingTopic ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTopicInput}
                    onChange={(e) => setNewTopicInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    placeholder={isAmharic ? 'ለምሳሌ፡ ፍልስፍና' : 'e.g. Classical Philosophy'}
                    className="text-xs bg-theme-subtle border border-theme-accent rounded-full px-3 py-1 text-theme-main focus:outline-none w-36"
                    autoFocus
                  />
                  <button
                    onClick={handleAddTopic}
                    className="w-6 h-6 rounded-full bg-theme-accent text-white flex items-center justify-center cursor-pointer"
                    title={isAmharic ? 'ርዕስ ጨምር' : 'Add topic'}
                  >
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  </button>
                  <button
                    onClick={() => setIsAddingTopic(false)}
                    className="w-6 h-6 rounded-full bg-theme-subtle text-theme-muted hover:text-theme-main flex items-center justify-center cursor-pointer"
                    title={isAmharic ? 'ሰርዝ' : 'Cancel'}
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingTopic(true)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-theme text-theme-muted hover:border-theme-accent hover:text-theme-main cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>{isAmharic ? 'ርዕስ ጨምር' : 'Add Topic'}</span>
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Settings */}
        <section className="bg-theme-surface rounded-xl p-5 sm:p-6 border border-theme shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-theme gap-2">
            <div>
              <h2 className="font-serif text-[16px] font-bold text-theme-main">
                {isAmharic ? 'የመተግበሪያ ቅንብሮች እና ገጽታ' : 'App Settings & Appearance'}
              </h2>
              <p className="text-xs text-theme-subtle">
                {isAmharic ? 'ከተዘጋጁት የብራና እና የገዳማት ቀለማት ገጽታዎች ይምረጡ' : 'Choose from all curated Ethiopian manuscript & monastic illumination themes'}
              </p>
            </div>
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-theme-subtle border border-theme text-theme-muted self-start sm:self-auto">
              {THEMES_LIST.find((t) => t.id === theme)?.label || 'Custom'}
            </span>
          </div>

          {/* Complete 7-Theme Grid Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">palette</span>
                {isAmharic ? `ያሉ የብራና ገጽታዎች (${THEMES_LIST.length})` : `Available Manuscript Themes (${THEMES_LIST.length})`}
              </span>
              <span className="text-[11px] text-theme-subtle">
                {isAmharic ? 'በቅጽበት ለመተግበር ይጫኑ' : 'Click to apply instantly'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {THEMES_LIST.map((themeOption) => {
                const isActive = theme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      onSetTheme(themeOption.id);
                      onShowToast(isAmharic ? `ወደ ${themeOption.label} ገጽታ ተቀይሯል` : `Switched to ${themeOption.label} theme`);
                    }}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isActive
                        ? 'border-[#d4af37] bg-theme-subtle shadow-sm ring-1 ring-[#d4af37]/50'
                        : 'border-theme bg-theme-surface hover:bg-theme-subtle/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: themeOption.previewColor }}
                        />
                        <span className="font-serif font-bold text-xs text-theme-main">
                          {themeOption.label}
                        </span>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#b8860b] bg-[#d4af37]/15 px-1.5 py-0.5 rounded-full border border-[#d4af37]/30">
                          <Check className="w-3 h-3" />
                          <span>{isAmharic ? 'ገባሪ' : 'Active'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-theme-subtle line-clamp-1 mb-2">
                      {themeOption.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-1 border-t border-theme/40">
                      <span className="text-[9px] font-sans font-medium uppercase tracking-wider text-theme-muted">
                        {themeOption.category}
                      </span>
                      {/* Swatches dots */}
                      <div className="flex items-center gap-1">
                        {themeOption.palette.map((item, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-black/15"
                            style={{ backgroundColor: item.color }}
                            title={`${item.name} (${item.hex})`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Theme Detailed Palette Showcase */}
          {(() => {
            const current = THEMES_LIST.find((t) => t.id === theme) || THEMES_LIST[0];
            return (
              <div className="bg-theme-subtle rounded-xl p-4 border border-theme mt-1 text-xs flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: current.previewColor }}
                    />
                    <span className="font-serif font-bold text-theme-main text-[13px]">
                      {current.label} — {isAmharic ? 'የቀለማት ስብስብ' : 'Harmonic Palette & Provenance'}
                    </span>
                  </div>
                  <span className="text-[10px] font-sans text-[#b8860b] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#d4af37]/15 border border-[#d4af37]/30">
                    {current.category} Mode
                  </span>
                </div>
                <p className="text-[11px] text-theme-subtle">
                  {current.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                  {current.palette.map((item, idx) => (
                    <div key={idx} className="bg-theme-surface p-2 rounded-lg border border-theme flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-sans font-medium text-[10px] text-theme-muted uppercase tracking-wider">{item.hex}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[11px] text-theme-main truncate">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Reading Preferences */}
          <div className="flex items-center justify-between py-2.5 border-b border-theme">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-theme-subtle text-[20px]">translate</span>
              <div>
                <span className="text-xs font-semibold text-theme-main block">
                  {isAmharic ? 'የመተግበሪያ ቋንቋ' : 'Interface Language'}
                </span>
                <span className="text-[11px] text-theme-subtle">
                  {language === 'am' ? 'አማርኛ (Amharic)' : 'English (English)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  onShowToast('Language set to English');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-medium border transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-theme-main text-theme-surface border-theme-main shadow-xs'
                    : 'bg-theme-subtle hover:bg-theme-muted text-theme-main border-theme'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('am');
                  onShowToast('ቋንቋ ወደ አማርኛ ተቀይሯል');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-medium border transition-all cursor-pointer ${
                  language === 'am'
                    ? 'bg-theme-main text-theme-surface border-theme-main shadow-xs'
                    : 'bg-theme-subtle hover:bg-theme-muted text-theme-main border-theme'
                }`}
              >
                አማርኛ
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-theme">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-theme-subtle text-[20px]">format_size</span>
              <div>
                <span className="text-xs font-semibold text-theme-main block">{isAmharic ? 'የፊደል መጠን' : 'Reader Font Size'}</span>
                <span className="text-[11px] text-theme-subtle">EB Garamond · {fontSizePref}</span>
              </div>
            </div>
            <button
              onClick={() => {
                const next = fontSizePref === 'Standard' ? 'Magnified' : fontSizePref === 'Magnified' ? 'Compact' : 'Standard';
                setFontSizePref(next);
                onShowToast(isAmharic ? `የፊደል መጠን ወደ ${next} ተቀይሯል` : `Font size set to ${next}`);
              }}
              className="px-3 py-1 rounded-lg bg-theme-subtle hover:bg-theme-muted text-xs font-medium text-theme-main border border-theme cursor-pointer transition-colors"
            >
              {isAmharic ? 'መጠን ቀይር' : 'Change Size'}
            </button>
          </div>

          {/* Quiet Hours */}
          <div className="flex items-center justify-between py-2.5 border-b border-theme">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-theme-subtle text-[20px]">notifications_paused</span>
              <div>
                <span className="text-xs font-semibold text-theme-main block">
                  {isAmharic ? 'አትረብሽ ሰዓታት' : 'Do Not Disturb Hours'}
                </span>
                <span className="text-[11px] text-theme-subtle">
                  {isAmharic ? 'በማታ ሰዓታት ማሳወቂያዎችን አጥፋ' : 'Mute notifications during evening hours'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setQuietHoursEnabled(!quietHoursEnabled);
                onShowToast(quietHoursEnabled ? (isAmharic ? 'አትረብሽ ጠፍቷል' : 'Do Not Disturb turned off') : (isAmharic ? 'አትረብሽ ነቅቷል' : 'Do Not Disturb activated'));
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                quietHoursEnabled ? 'bg-theme-accent' : 'bg-theme-subtle'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                  quietHoursEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Private Reading Mode */}
          <div className="flex items-center justify-between py-2.5 border-b border-theme">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-theme-subtle text-[20px]">lock</span>
              <div>
                <span className="text-xs font-semibold text-theme-main block">
                  {isAmharic ? 'የግል የንባብ ሁነታ' : 'Private Reading Mode'}
                </span>
                <span className="text-[11px] text-theme-subtle">
                  {isAmharic ? 'የንባብ ሁኔታዎን ከሌሎች ይደብቁ' : 'Hide your active reading status from others'}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                setIsCloistered(!isCloistered);
                onShowToast(isCloistered ? (isAmharic ? 'የንባብ ሁኔታ ይታያል' : 'Reading status visible to friends') : (isAmharic ? 'የንባብ ሁኔታ ሚስጥራዊ ተደርጓል' : 'Reading status set to private'));
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isCloistered ? 'bg-theme-accent' : 'bg-theme-subtle'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 shadow-xs ${
                  isCloistered ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Commonplace Export */}
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-theme-subtle text-[20px]">file_download</span>
              <div>
                <span className="text-xs font-semibold text-theme-main block">
                  {isAmharic ? 'ማስታወሻዎችን እና ጥቅሶችን አውርድ' : 'Export Notes & Highlights'}
                </span>
                <span className="text-[11px] text-theme-subtle">
                  {isAmharic ? 'ሁሉንም ማስታወሻዎች በማርክዳውን ቅርጸት ያውርዱ' : 'Download all notes and quotes as Markdown'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onShowToast(isAmharic ? 'ማስታወሻዎች እየተዘጋጁ ነው (.md)...' : 'Exporting notes file (.md)...')}
              className="px-3 py-1 rounded-lg bg-theme-subtle hover:bg-theme-muted text-xs font-medium text-theme-main border border-theme cursor-pointer transition-colors"
            >
              {isAmharic ? 'አውርድ' : 'Export'}
            </button>
          </div>
        </section>

        {/* Portal Sign-in */}
        <button
          onClick={onOpenAuth}
          className="w-full py-3 rounded-xl border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-main text-xs font-label-md uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">account_circle</span>
          <span>{isAmharic ? 'መለያ ቀይር / ውጣ' : 'Switch Account / Sign Out'}</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md bg-theme-surface rounded-2xl p-6 shadow-2xl border border-theme"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <h3 className="font-serif text-lg font-bold text-theme-main">
                {isAmharic ? 'መገለጫ አስተካክል' : 'Edit Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'ማዕረግ / ሚና' : 'Headline / Role'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'አድራሻ' : 'Location'}
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-3 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle hover:bg-theme-muted text-theme-main font-label-md text-xs uppercase tracking-wider cursor-pointer border border-theme transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-theme-main text-white font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-theme-main/90 transition-opacity"
              >
                {isAmharic ? 'መገለጫ አስቀምጥ' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Adjust Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-theme-surface rounded-2xl p-6 shadow-2xl border border-theme">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif text-lg font-bold text-theme-main">
                {isAmharic ? 'የ2025 የንባብ ግብ አስተካክል' : 'Adjust 2025 Reading Goal'}
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-theme-muted mb-5">
              {isAmharic ? 'በዚህ ዓመት ለማንበብ ያሰቡትን የመጻሕፍት ብዛት ይወስኑ።' : 'Set your target number of books to read this year.'}
            </p>

            <div className="flex items-center justify-center gap-6 py-5 bg-theme-subtle rounded-xl border border-theme mb-5">
              <button
                onClick={() => setTempGoal(Math.max(user.booksRead, tempGoal - 1))}
                className="w-10 h-10 rounded-full bg-theme-surface border border-theme text-xl font-bold text-theme-main hover:bg-theme-muted cursor-pointer flex items-center justify-center transition-colors"
              >
                −
              </button>
              <div className="text-center">
                <span className="font-serif text-3xl font-bold text-theme-main">{tempGoal}</span>
                <span className="block text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                  {isAmharic ? 'መጻሕፍት' : 'Books'}
                </span>
              </div>
              <button
                onClick={() => setTempGoal(tempGoal + 1)}
                className="w-10 h-10 rounded-full bg-theme-surface border border-theme text-xl font-bold text-theme-main hover:bg-theme-muted cursor-pointer flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle hover:bg-theme-muted text-theme-main font-label-md text-xs uppercase tracking-wider cursor-pointer border border-theme transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-2.5 rounded-lg bg-theme-main text-white font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-theme-main/90 transition-opacity"
              >
                {isAmharic ? 'ግብ አስቀምጥ' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
