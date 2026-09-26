import React, { useState } from 'react';
import { ReadingPath, ReadingStation, ScreenId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface PathsViewProps {
  paths: ReadingPath[];
  isDetailView: boolean;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const PathsView: React.FC<PathsViewProps> = ({
  paths,
  isDetailView,
  onNavigate,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const [activePath, setActivePath] = useState<ReadingPath>(paths[0]);
  const [isFollowing, setIsFollowing] = useState(true);
  const [stations, setStations] = useState<ReadingStation[]>(paths[0]?.stations || []);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Patristic' | 'Monastic' | 'Historical'>('All');

  const handleToggleStationCompletion = (id: number) => {
    setStations((prev) =>
      prev.map((st) => {
        if (st.id === id) {
          const updatedCompleted = !st.completed;
          onShowToast(
            updatedCompleted
              ? `Station ${st.numeral} marked completed`
              : `Station ${st.numeral} returned to active reading`
          );
          return { ...st, completed: updatedCompleted };
        }
        return st;
      })
    );
  };

  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
    onShowToast(isFollowing ? 'Left reading plan' : 'Enrolled in reading plan');
  };

  const filteredPaths = paths.filter((path) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Patristic') {
      return path.category.toLowerCase().includes('patristic') || path.title.toLowerCase().includes('father');
    }
    if (selectedFilter === 'Monastic') {
      return path.category.toLowerCase().includes('monastic') || path.title.toLowerCase().includes('monastic');
    }
    if (selectedFilter === 'Historical') {
      return path.category.toLowerCase().includes('theology') || path.category.toLowerCase().includes('civic') || path.title.toLowerCase().includes('augustine');
    }
    return true;
  });

  const enrolledPath = paths[0];

  // =========================================================================
  // DETAIL VIEW: REFINED SYLLABUS & STATIONS
  // =========================================================================
  if (isDetailView) {
    const completedCount = stations.filter((s) => s.completed).length;

    return (
      <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
        <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between border-b border-theme pb-4">
            <button
              onClick={() => onNavigate('paths')}
              className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-xs sm:text-sm font-serif font-medium text-theme-main transition-colors cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] lg:text-[18px]">arrow_back</span>
              <span>{isAmharic ? 'ሁሉም የንባብ መንገዶች' : 'All Reading Paths'}</span>
            </button>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleToggleFollow}
                className={`inline-flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs sm:text-sm font-serif font-semibold transition-all cursor-pointer shadow-2xs ${
                  isFollowing
                    ? 'bg-theme-accent-light text-theme-accent border border-theme-accent/40'
                    : 'bg-theme-main text-white hover:opacity-90'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] lg:text-[18px]">
                  {isFollowing ? 'check' : 'add'}
                </span>
                <span>{isFollowing ? (isAmharic ? 'ተመዝግቧል' : 'Enrolled') : (isAmharic ? 'በመንገዱ ተመዝገብ' : 'Enroll in Plan')}</span>
              </button>
              <button
                onClick={() => onShowToast(isAmharic ? 'የንባብ መርሃ-ግብር ተገልብጧል' : 'Reading plan itinerary copied')}
                className="p-1.5 lg:p-2 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-muted hover:text-theme-main transition-colors cursor-pointer shadow-2xs"
                aria-label={isAmharic ? 'የንባብ እቅዱን አጋራ' : 'Share Reading Plan'}
                title={isAmharic ? 'የንባብ እቅዱን አጋራ' : 'Share Reading Plan'}
              >
                <span className="material-symbols-outlined text-[18px] lg:text-[20px]">share</span>
              </button>
            </div>
          </div>

          {/* Path Header Hero Panel */}
          <header className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-7 lg:p-9 shadow-xs flex flex-col gap-3 lg:gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 lg:px-3 py-0.5 rounded-full text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme">
                  {activePath.category}
                </span>
                <span className="text-xs sm:text-sm text-theme-muted font-serif">
                  {activePath.timeLeft}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-serif font-medium text-theme-accent bg-theme-subtle px-2.5 lg:px-3 py-0.5 rounded-full border border-theme">
                {activePath.percentage}% Completed
              </span>
            </div>

            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-snug">
              {activePath.title}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-theme-body font-serif leading-relaxed">
              {activePath.description}
            </p>

            {/* Metadata & Progress Details */}
            <div className="pt-3 lg:pt-4 border-t border-theme/60 mt-1 flex flex-col gap-2.5 lg:gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-theme-muted font-serif">
                <span>
                  Curator:{' '}
                  <strong className="text-theme-main font-semibold">
                    {activePath.curator?.name || 'Prof. Marcus Aurelius Sterling'}
                  </strong>
                </span>
                <span>
                  Progress:{' '}
                  <strong className="text-theme-main font-semibold">
                    {completedCount} of {stations.length} stations completed
                  </strong>
                </span>
              </div>
              <div className="w-full bg-theme-muted h-2 lg:h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-theme-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${(completedCount / Math.max(stations.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          </header>

          {/* Sequential Reading Itinerary / Stations */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-theme-muted whitespace-nowrap">
                READING ITINERARY
              </h2>
              <div className="h-px bg-theme w-full flex-1" />
            </div>

            <div className="space-y-3.5">
              {stations.map((station) => (
                <article
                  key={station.id}
                  className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-3 transition-colors hover:border-theme-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-theme-subtle border border-theme flex items-center justify-center font-serif text-xs font-bold text-theme-accent flex-shrink-0 mt-0.5">
                        {station.numeral}
                      </div>
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-semibold text-theme-main leading-snug">
                          {station.title}
                        </h3>
                        <p className="text-xs text-theme-muted font-serif mt-0.5">
                          {station.authorEra} {station.weeksLabel ? `· ${station.weeksLabel}` : ''} {station.pages ? `· ${station.pages}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Completion Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleStationCompletion(station.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-serif font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs flex-shrink-0 ${
                        station.completed
                          ? 'bg-theme-accent-light text-theme-accent border-theme-accent/50 font-semibold'
                          : 'bg-theme-surface text-theme-muted hover:text-theme-main border-theme hover:bg-theme-subtle'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {station.completed ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      <span>{station.completed ? (isAmharic ? 'ተጠናቋል' : 'Completed') : (isAmharic ? 'ተጠናቀቀ በል' : 'Mark Done')}</span>
                    </button>
                  </div>

                  {station.quote && (
                    <blockquote className="text-xs sm:text-sm text-theme-body font-serif italic pl-3.5 border-l-2 border-theme-accent/60 my-0.5 leading-relaxed bg-theme-subtle/40 py-1.5 pr-2 rounded-r">
                      {station.quote}
                    </blockquote>
                  )}

                  {/* Station Action Buttons */}
                  <div className="flex items-center gap-2.5 pt-1 text-xs font-serif">
                    <button
                      type="button"
                      onClick={() => onNavigate('colloquium')}
                      className="px-3 py-1.5 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-main inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px] text-theme-accent">forum</span>
                      <span>{isAmharic ? 'በውይይት ተሳተፍ' : 'Discuss in Colloquium'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('library')}
                      className="px-3 py-1.5 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-muted hover:text-theme-main inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit_note</span>
                      <span>{isAmharic ? 'ማስታወሻ መዝግብ' : 'Log Note'}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LIST VIEW: BALANCED, TACTILE & BEAUTIFUL
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">

        {/* Section Title Header */}
        <header className="flex flex-col gap-1.5 border-b border-theme pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
              {isAmharic ? 'የንባብ መንገዶች' : 'Reading Paths'}
            </h1>
            <span className="text-xs sm:text-sm font-serif text-theme-muted bg-theme-surface px-2.5 lg:px-3 py-0.5 rounded-full border border-theme">
              {paths.length} {isAmharic ? 'የንባብ እቅዶች' : 'Reading Plans'}
            </span>
          </div>
          <p className="text-xs sm:text-sm lg:text-base text-theme-muted font-serif leading-relaxed">
            Curated historical itineraries through early monasticism, patristics, and classical philosophy.
          </p>
        </header>

        {/* SECTION 1: CURRENTLY ENROLLED PATH (Featured Panel) */}
        {enrolledPath && (
          <section id="enrolled-paths-section" className="flex flex-col gap-2.5 lg:gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] lg:text-xs font-sans font-semibold uppercase tracking-[0.25em] text-theme-muted whitespace-nowrap">
                CURRENTLY ENROLLED
              </h2>
              <div className="h-px bg-theme w-full flex-1" />
            </div>

            <div className="bg-theme-surface border border-theme rounded-2xl p-5 sm:p-6 lg:p-8 shadow-xs relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-0.5 rounded-full text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                  Active Track
                </span>
                <span className="text-xs sm:text-sm font-serif font-semibold text-theme-accent bg-theme-subtle px-2.5 lg:px-3 py-0.5 rounded-full border border-theme">
                  {enrolledPath.percentage}% Completed
                </span>
              </div>

              <h3
                onClick={() => {
                  setActivePath(enrolledPath);
                  onNavigate('path-detail');
                }}
                className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-theme-main hover:text-theme-accent cursor-pointer transition-colors"
              >
                {enrolledPath.title}
              </h3>

              {/* Progress Metadata Line */}
              <p className="text-xs sm:text-sm lg:text-base text-theme-muted font-serif mt-1">
                Current station: <strong className="text-theme-main font-semibold">{enrolledPath.currentStepLabel}</strong> • Step {enrolledPath.completedSteps} of {enrolledPath.totalSteps} • {enrolledPath.timeLeft}
              </p>

              {/* Linear Progress Meter */}
              <div className="w-full bg-theme-muted h-2 lg:h-2.5 rounded-full overflow-hidden mt-3.5 lg:mt-4">
                <div
                  className="bg-theme-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${enrolledPath.percentage}%` }}
                />
              </div>

              <div className="mt-4 lg:mt-5 pt-3 lg:pt-4 border-t border-theme/60 flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm text-theme-muted font-serif italic">
                  {enrolledPath.category}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePath(enrolledPath);
                    onNavigate('path-detail');
                  }}
                  className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl bg-theme-main text-white font-serif text-xs sm:text-sm lg:text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{isAmharic ? 'የንባብ እቅዱን ቀጥል' : 'Continue Reading Plan'}</span>
                  <span className="material-symbols-outlined text-[17px] lg:text-[19px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: ALL READING PLANS */}
        <section className="flex flex-col gap-3 lg:gap-4 pt-1">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-theme pb-3 lg:pb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] lg:text-xs font-sans font-semibold uppercase tracking-[0.25em] text-theme-muted whitespace-nowrap">
                {isAmharic ? 'ሁሉም የንባብ እቅዶች' : 'ALL READING PLANS'}
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-serif overflow-x-auto pb-1 sm:pb-0">
              {(['All', 'Patristic', 'Monastic', 'Historical'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 lg:px-4 py-1 lg:py-1.5 rounded-full text-xs sm:text-sm font-serif transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                    selectedFilter === filter
                      ? 'bg-theme-main text-white font-semibold shadow-xs'
                      : 'bg-theme-surface border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                  }`}
                >
                  {filter === 'All'
                    ? (isAmharic ? 'ሁሉም' : 'All')
                    : filter === 'Patristic'
                    ? (isAmharic ? 'የአበው' : 'Patristic')
                    : filter === 'Monastic'
                    ? (isAmharic ? 'የገዳማውያን' : 'Monastic')
                    : (isAmharic ? 'ታሪካዊ' : 'Historical')}
                </button>
              ))}
            </div>
          </div>

          {/* Curricula Cards */}
          <div className="space-y-3 lg:space-y-4">
            {filteredPaths.map((path) => (
              <article
                key={path.id}
                className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 lg:p-6 shadow-xs hover:border-theme-accent/60 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5 lg:gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider px-2 lg:px-2.5 py-0.5 rounded bg-theme-subtle border border-theme text-theme-accent">
                      {path.category}
                    </span>
                    <span className="text-xs sm:text-sm font-serif text-theme-muted">
                      {path.timeLeft}
                    </span>
                  </div>

                  <h3
                    onClick={() => {
                      setActivePath(path);
                      onNavigate('path-detail');
                    }}
                    className="font-serif text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-theme-main hover:text-theme-accent cursor-pointer transition-colors"
                  >
                    {path.title}
                  </h3>

                  <p className="text-xs sm:text-sm lg:text-base text-theme-body font-serif leading-relaxed line-clamp-2">
                    {path.description}
                  </p>

                  {/* Metadata & Progress */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-theme-muted font-serif pt-1">
                    <span>
                      {isAmharic ? 'አሁን፡ ' : 'Current: '}
                      <strong className="text-theme-main font-semibold">{path.currentStepLabel}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {isAmharic
                        ? `ደረጃ ${path.completedSteps} ከ ${path.totalSteps} (${path.percentage}%)`
                        : `Step ${path.completedSteps} of ${path.totalSteps} (${path.percentage}%)`}
                    </span>
                  </div>

                  <div className="w-48 lg:w-60 bg-theme-muted h-1.5 lg:h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-theme-accent h-full rounded-full transition-all duration-500"
                      style={{ width: `${path.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex-shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePath(path);
                      onNavigate('path-detail');
                    }}
                    className="px-3.5 lg:px-4 py-2 lg:py-2.5 rounded-xl border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-main font-serif text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-2xs hover:border-theme-accent cursor-pointer whitespace-nowrap"
                  >
                    <span>{isAmharic ? 'የንባብ እቅዱን ተመልከት' : 'View Reading Plan'}</span>
                    <span className="material-symbols-outlined text-[16px] lg:text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredPaths.length === 0 && (
            <div className="py-12 text-center text-xs font-serif italic text-theme-muted bg-theme-surface border border-theme rounded-xl">
              {isAmharic ? 'ለዚህ ማጣሪያ ምንም የንባብ እቅድ አልተገኘም።' : 'No reading plans found for this filter.'}
            </div>
          )}

          {/* Footnote */}
          <footer className="pt-4 text-center">
            <p className="text-xs font-serif italic text-theme-muted">
              {isAmharic
                ? 'ለእያንዳንዱ የጾምና የበዓላት ዑደት አዳዲስ የንባብ እቅዶች እና የተመረጡ ምዕራፎች ይዘጋጃሉ።'
                : 'New reading plans and curated stations are compiled for each liturgical and contemplative cycle.'}
            </p>
          </footer>
        </section>

      </div>
    </div>
  );
};
