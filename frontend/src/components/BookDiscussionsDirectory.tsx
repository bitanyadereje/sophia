import React, { useState, useMemo } from 'react';
import { Book, ScreenId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BookDiscussionsDirectoryProps {
  books: Book[];
  onSelectBook?: (bookId: string) => void;
  onOpenSeminar?: (bookId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const BookDiscussionsDirectory: React.FC<BookDiscussionsDirectoryProps> = ({
  books,
  onSelectBook,
  onOpenSeminar,
  onNavigate,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradition, setSelectedTradition] = useState<string>('All');

  const handleEnterSeminar = (bookId: string) => {
    if (onOpenSeminar) {
      onOpenSeminar(bookId);
    } else {
      if (onSelectBook) onSelectBook(bookId);
      onNavigate('seminar');
    }
  };

  // Prioritize actively reading books at the top
  const activelyReadingBooks = useMemo(() => {
    return books.filter((b) => b.readingStatus === 'currently-reading');
  }, [books]);

  // Trending / other classical texts
  const trendingBooks = useMemo(() => {
    return books.filter((b) => b.readingStatus !== 'currently-reading');
  }, [books]);

  // Filtered trending texts
  const filteredTrending = useMemo(() => {
    return trendingBooks.filter((book) => {
      const matchesTradition =
        selectedTradition === 'All' ||
        book.categoryTag?.toLowerCase().includes(selectedTradition.toLowerCase()) ||
        book.category?.toLowerCase().includes(selectedTradition.toLowerCase());

      if (!matchesTradition) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        (book.originalTitle && book.originalTitle.toLowerCase().includes(q)) ||
        (book.era && book.era.toLowerCase().includes(q))
      );
    });
  }, [trendingBooks, selectedTradition, searchQuery]);

  const traditionOptions = ['All', 'Patristic', 'Eastern Orthodox', 'Monastic', 'Scholastic'];

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Top Header & Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-md text-[11px] uppercase tracking-widest text-theme-accent font-semibold">
                {isAmharic ? 'የመጽሐፍ ሴሚናሮች ማውጫ' : 'Text Seminar Directory'}
              </span>
              <span className="text-theme-subtle">·</span>
              <span className="text-xs text-theme-muted">
                {books.length} {isAmharic ? 'ጥንታዊ ጥራዞች' : 'Classical Volumes'}
              </span>
            </div>
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
              {isAmharic ? 'የመጽሐፍ ውይይቶች' : 'Book Discussions'}
            </h1>
            <p className="text-xs sm:text-sm text-theme-muted mt-1 max-w-2xl leading-relaxed">
              {isAmharic 
                ? 'የጥራዝ ሴሚናር ክፍል ለመግባት፣ የምዕራፍ ክርክሮችን ለመመርመር እና ከምሁራን ጋር ለመወያየት ማንኛውንም መጽሐፍ ይምረጡ።' 
                : 'Select any volume to step into its dedicated text seminar, study chapter arguments, and join verse-by-verse discussions with fellow scholars.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigate('discussions')}
              className="flex items-center gap-2 text-xs font-serif text-theme-muted hover:text-theme-main transition-colors cursor-pointer px-3 py-2 rounded-lg bg-theme-surface border border-theme hover:bg-theme-subtle group shadow-2xs leading-none"
            >
              <span className="material-symbols-outlined text-[16px] text-theme-accent group-hover:scale-105 transition-transform leading-none flex items-center">
                forum
              </span>
              <span className="leading-none">{isAmharic ? 'የማህበረሰብ ጥያቄዎች' : 'Community Q&A'}</span>
              <span className="material-symbols-outlined text-[14px] text-theme-subtle group-hover:text-theme-main transition-colors leading-none flex items-center">
                arrow_forward
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 1: Actively Reading (Prioritized at the Top) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-theme-main">
                {isAmharic ? 'በማንበብ ላይ ያሉ' : 'Actively Reading'}
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                {activelyReadingBooks.length} {isAmharic ? 'በሂደት ላይ' : 'in progress'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 pl-4.5">
              {isAmharic ? 'ገባሪ የሆኑ የምዕራፍ ውይይቶችዎን ይቀጥላል' : 'Resumes your active chapter conversations'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {activelyReadingBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => handleEnterSeminar(book.id)}
                className="group relative bg-theme-surface rounded-xl border border-theme p-4 sm:p-5 flex flex-col justify-between hover:border-theme-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                {/* Book header & Cover snippet */}
                <div className="flex gap-3.5 items-start">
                  <div className="w-16 h-22 sm:w-18 sm:h-24 rounded-md overflow-hidden flex-shrink-0 bg-theme-subtle border border-theme shadow-2xs relative">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    {book.codexLabel && (
                      <span className="absolute bottom-0 inset-x-0 text-white text-[9px] text-center font-serif py-0.5 tracking-wider truncate px-1 z-10">
                        {book.codexLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-1.5 py-0.5 rounded border border-theme whitespace-nowrap">
                        {book.categoryTag || 'Patristic'}
                      </span>
                      <span className="text-[10px] text-theme-muted whitespace-nowrap">{book.era}</span>
                    </div>

                    <h3 className="font-serif text-[15px] sm:text-base font-bold text-theme-main leading-snug group-hover:text-theme-accent transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-theme-muted mt-0.5 truncate">{book.author}</p>

                    {book.currentLocation && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-theme-accent font-medium">
                        <span className="material-symbols-outlined text-[13px] shrink-0">location_on</span>
                        <span className="line-clamp-1">{book.currentLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Footer */}
                <div className="mt-4 pt-3 border-t border-theme flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-theme-muted">
                    <span>Reading Progress</span>
                    <span className="font-bold text-theme-main">{book.progress || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-theme-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-theme-accent rounded-full transition-all duration-300"
                      style={{ width: `${book.progress || 0}%` }}
                    />
                  </div>

                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-theme-muted flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-theme-accent">
                        chat_bubble
                      </span>
                      <span>{book.circleCount ? `${book.circleCount * 2}+ notes` : 'Active thread'}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {onSelectBook && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBook(book.id);
                          }}
                          className="text-[11px] text-theme-muted hover:text-theme-main hover:underline cursor-pointer transition-colors"
                          title={isAmharic ? 'የጥራዝ ዝርዝር እይ' : 'View volume details'}
                        >
                          {isAmharic ? 'ዝርዝር' : 'Details'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnterSeminar(book.id);
                        }}
                        className="text-[11px] font-semibold text-theme-accent flex items-center gap-0.5 hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>{isAmharic ? 'የሴሚናር ክፍል' : 'Seminar Room'}</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: Trending Texts & Classical Library */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-theme-main">
                {isAmharic ? 'ታዋቂ መጻሕፍት እና ቤተ-መጻሕፍት' : 'Trending Texts & Library'}
              </h2>
              <p className="text-xs text-theme-muted mt-0.5">
                {isAmharic 
                  ? 'በጥንታዊ ስነ-መለኮት እና ገዳማዊ መጻሕፍት ውስጥ ያሉ ውይይቶችን እና ጥያቄዎችን ያስሱ' 
                  : 'Explore discussions and scholarly questions across classical theological and monastic treatises'}
              </p>
            </div>

            {/* Tradition Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {traditionOptions.map((tradition) => {
                const label = tradition === 'All'
                  ? (isAmharic ? 'ሁሉም' : 'All')
                  : tradition === 'Patristic' ? (isAmharic ? 'ፓትሪስቲክ' : 'Patristic')
                  : tradition === 'Eastern Orthodox' ? (isAmharic ? 'ምስራቅ ኦርቶዶክስ' : 'Eastern Orthodox')
                  : tradition === 'Monastic' ? (isAmharic ? 'ገዳማዊ' : 'Monastic')
                  : tradition === 'Scholastic' ? (isAmharic ? 'ስኮላስቲክ' : 'Scholastic')
                  : tradition;

                return (
                  <button
                    key={tradition}
                    onClick={() => setSelectedTradition(tradition)}
                    className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                      selectedTradition === tradition
                        ? 'bg-theme-main text-theme-surface font-semibold shadow-2xs'
                        : 'bg-theme-surface border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Bar for Trending Texts */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-subtle text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder={isAmharic ? 'ጥንታዊ መጻሕፍትን፣ ደራሲያንን ወይም ዘመናትን ፈልግ...' : 'Search classical texts, authors, or eras (e.g. City of God, Desert Fathers)...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-theme-surface border border-theme rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-theme-main placeholder:text-theme-subtle focus:outline-hidden focus:border-theme-accent transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-subtle hover:text-theme-main text-xs p-1"
                aria-label={isAmharic ? 'ፍለጋ አጽዳ' : 'Clear search'}
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Trending Books Grid */}
          {filteredTrending.length === 0 ? (
            <div className="text-center py-12 bg-theme-surface rounded-xl border border-theme p-6">
              <span className="material-symbols-outlined text-4xl text-theme-subtle mb-2">auto_stories</span>
              <p className="text-sm font-serif font-bold text-theme-main">
                {isAmharic ? 'በዚህ ማጣሪያ የተገኘ መጽሐፍ የለም' : 'No texts found matching your filter'}
              </p>
              <p className="text-xs text-theme-muted mt-1">
                {isAmharic ? 'እባክዎ ፍለጋዎን ይቀይሩ ወይም "ሁሉም" የሚለውን ይምረጡ።' : 'Try clearing your search query or selecting "All" traditions.'}
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTradition('All');
                }}
                className="mt-4 text-xs font-semibold text-theme-accent hover:underline cursor-pointer"
              >
                {isAmharic ? 'ማጣሪያዎችን ዳግም አስጀምር' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {filteredTrending.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleEnterSeminar(book.id)}
                  className="group bg-theme-surface rounded-xl border border-theme p-4 sm:p-5 flex flex-col justify-between hover:border-theme-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
                >
                  <div className="flex gap-3.5 items-start">
                    <div className="w-16 h-22 sm:w-18 sm:h-24 rounded-md overflow-hidden flex-shrink-0 bg-theme-subtle border border-theme shadow-2xs relative">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                      {book.codexLabel && (
                        <span className="absolute bottom-0 inset-x-0 text-white text-[9px] text-center font-serif py-0.5 tracking-wider truncate px-1 z-10">
                          {book.codexLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-1.5 py-0.5 rounded border border-theme whitespace-nowrap">
                          {book.categoryTag || 'Theology'}
                        </span>
                        <span className="text-[10px] text-theme-muted whitespace-nowrap">{book.era}</span>
                      </div>

                      <h3 className="font-serif text-[15px] sm:text-base font-bold text-theme-main leading-snug group-hover:text-theme-accent transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-xs text-theme-muted mt-0.5 truncate">{book.author}</p>

                      <p className="text-[11px] text-theme-body line-clamp-2 mt-1.5 leading-relaxed">
                        {book.summary}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[11px] text-theme-muted">
                      <span className="flex items-center gap-0.5 text-theme-gold">
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="font-semibold text-theme-main">{book.rating || 4.8}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-theme-accent">
                          chat_bubble
                        </span>
                        <span>{book.circleCount || 12} topics</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectBook && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBook(book.id);
                          }}
                          className="text-[11px] text-theme-muted hover:text-theme-main hover:underline cursor-pointer transition-colors"
                          title={isAmharic ? 'የጥራዝ ዝርዝር እይ' : 'View volume details'}
                        >
                          {isAmharic ? 'ዝርዝር' : 'Details'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnterSeminar(book.id);
                        }}
                        className="text-[11px] font-semibold text-theme-accent flex items-center gap-0.5 hover:underline cursor-pointer group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>{isAmharic ? 'የሴሚናር ክፍል' : 'Seminar Room'}</span>
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
