import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { loadReadingPathBooks, loadReadingPaths } from '../path.service';

interface PathsViewProps {
  isDetailView: boolean;
  selectedPathId?: string | null;
  onSelectPath: (pathId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const PathsView: React.FC<PathsViewProps> = ({
  isDetailView,
  selectedPathId,
  onSelectPath,
  onNavigate,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const { data: paths = [], isPending: isPathsPending } = useQuery({
    queryKey: ['reading-paths'],
    queryFn: loadReadingPaths,
  });
  const activePath = paths.find((path) => path.id === selectedPathId) ?? paths[0] ?? null;
  const { data: pathBooks = [], isPending: arePathBooksPending } = useQuery({
    queryKey: ['reading-path-books', activePath?.id],
    queryFn: () => loadReadingPathBooks(activePath!.id),
    enabled: isDetailView && Boolean(activePath?.id),
  });
  const [isFollowing, setIsFollowing] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Patristic' | 'Monastic' | 'Historical'>('All');


  const handleToggleFollow = () => {
    setIsFollowing(!isFollowing);
    onShowToast(isFollowing ? 'Left reading plan' : 'Enrolled in reading plan');
  };

  const filteredPaths = paths.filter((path) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Patristic') {
      return path.topic.toLowerCase().includes('patristic') || path.title.toLowerCase().includes('father');
    }
    if (selectedFilter === 'Monastic') {
      return path.topic.toLowerCase().includes('monastic') || path.title.toLowerCase().includes('monastic');
    }
    if (selectedFilter === 'Historical') {
      return path.topic.toLowerCase().includes('theology') || path.topic.toLowerCase().includes('civic') || path.title.toLowerCase().includes('augustine');
    }
    return true;
  });

  const enrolledPath = paths[0];

  // =========================================================================
  // DETAIL VIEW: REFINED SYLLABUS & STATIONS
  // =========================================================================
  if (isDetailView) {
    if (!activePath) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-theme-app pt-16 text-sm text-theme-muted">
          {isPathsPending ? 'Loading reading path...' : 'Reading path not found.'}
        </div>
      );
    }

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
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-snug">
              {activePath.title}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-theme-body font-serif leading-relaxed">
              {activePath.description}
            </p>

            <div className="pt-3 lg:pt-4 border-t border-theme/60 mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-theme-muted font-serif">
              {isAmharic ? '???' : 'Difficulty'}: <strong className="text-theme-main font-semibold">{activePath.difficulty || (isAmharic ? '??????' : 'Not specified')}</strong>
            </div>
          </header>

          {/* Sequential Reading Itinerary / Stations */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-theme-muted whitespace-nowrap">READING ITINERARY</h2>
              <div className="h-px bg-theme w-full flex-1" />
            </div>
            {arePathBooksPending ? (
              <p className="py-8 text-center text-sm text-theme-muted">Loading books...</p>
            ) : pathBooks.length === 0 ? (
              <article className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 shadow-xs">
                <p className="text-xs sm:text-sm text-theme-body font-serif leading-relaxed">No books have been added to this reading path yet.</p>
              </article>
            ) : pathBooks.map((pathBook) => {
              const book = Array.isArray(pathBook.book) ? pathBook.book[0] : pathBook.book;
              return (
                <article key={pathBook.book_id} className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
                  {book?.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="h-20 w-14 rounded object-cover" />
                  ) : (
                    <div className="flex h-20 w-14 items-center justify-center rounded bg-theme-subtle text-center text-[9px] text-theme-muted">{book?.title || `Book ${pathBook.position}`}</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-theme-accent">Station {pathBook.position}</p>
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-theme-main">{book?.title || 'Untitled book'}</h3>
                    {book?.author_name && <p className="text-xs text-theme-muted">{book.author_name}</p>}
                    {pathBook.note && <p className="mt-1 text-xs text-theme-body font-serif leading-relaxed">{pathBook.note}</p>}
                  </div>
                </article>
              );
            })}
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
              </div>

              <h3
                onClick={() => {
                  onSelectPath(enrolledPath.id);
                  onNavigate('path-detail');
                }}
                className="font-serif text-xl sm:text-2xl lg:text-3xl font-semibold text-theme-main hover:text-theme-accent cursor-pointer transition-colors"
              >
                {enrolledPath.title}
              </h3>

              {/* Progress Metadata Line */}
              <p className="text-xs sm:text-sm lg:text-base text-theme-muted font-serif mt-1">
                {isAmharic ? '???' : 'Topic'}: <strong className="text-theme-main font-semibold">{enrolledPath.topic}</strong>
              </p>


              <div className="mt-4 lg:mt-5 pt-3 lg:pt-4 border-t border-theme/60 flex items-center justify-between gap-3">
                <span className="text-xs sm:text-sm text-theme-muted font-serif italic">
                  {enrolledPath.topic}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPath(enrolledPath.id);
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
            {isPathsPending ? (
              <p className="py-8 text-center text-sm text-theme-muted">Loading reading paths...</p>
            ) : filteredPaths.map((path) => (
              <article
                key={path.id}
                className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 lg:p-6 shadow-xs hover:border-theme-accent/60 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex flex-col gap-1.5 lg:gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider px-2 lg:px-2.5 py-0.5 rounded bg-theme-subtle border border-theme text-theme-accent">
                      {path.topic}
                    </span>
                  </div>

                  <h3
                    onClick={() => {
                      onSelectPath(path.id);
                      onNavigate('path-detail');
                    }}
                    className="font-serif text-base sm:text-lg lg:text-xl xl:text-2xl font-semibold text-theme-main hover:text-theme-accent cursor-pointer transition-colors"
                  >
                    {path.title}
                  </h3>

                  <p className="text-xs sm:text-sm lg:text-base text-theme-body font-serif leading-relaxed line-clamp-2">
                    {path.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-sm text-theme-muted font-serif pt-1">
                    {isAmharic ? '???' : 'Difficulty'}: {path.difficulty || (isAmharic ? '??????' : 'Not specified')}
                  </div>                </div>

                <div className="flex-shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPath(path.id);
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

          {!isPathsPending && filteredPaths.length === 0 && (
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
