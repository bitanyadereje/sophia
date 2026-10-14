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
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const handleEnterSeminar = (bookId: string) => {
    if (onOpenSeminar) {
      onOpenSeminar(bookId);
    } else {
      if (onSelectBook) onSelectBook(bookId);
      onNavigate('seminar');
    }
  };

  // Filter options map to the `language` field for now
  // (real tradition filter will come when we join the traditions table)
  const filterOptions = ['All', 'en', 'am', 'gez'];

  const filterLabel = (key: string) => {
    if (key === 'All') return isAmharic ? 'ሁሉም' : 'All';
    if (key === 'en') return isAmharic ? 'እንግሊዝኛ' : 'English';
    if (key === 'am') return isAmharic ? 'አማርኛ' : 'Amharic';
    if (key === 'gez') return isAmharic ? 'ግዕዝ' : "Ge'ez";
    return key;
  };

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesFilter = selectedFilter === 'All' || book.language === selectedFilter;
      if (!matchesFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(q) ||
        book.author_name.toLowerCase().includes(q) ||
        (book.description && book.description.toLowerCase().includes(q))
      );
    });
  }, [books, selectedFilter, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFilter('All');
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-md text-[11px] uppercase tracking-widest text-theme-accent font-semibold">
                {isAmharic ? 'የመጽሐፍ ሴሚናሮች ማውጫ' : 'Text Seminar Directory'}
              </span>
              <span className="text-theme-subtle">·</span>
              <span className="text-xs text-theme-muted">
                {books.length} {isAmharic ? 'ጥራዞች' : 'Volumes'}
              </span>
            </div>
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
              {isAmharic ? 'የመጽሐፍ ውይይቶች' : 'Book Discussions'}
            </h1>
            <p className="text-xs sm:text-sm text-theme-muted mt-1 max-w-2xl leading-relaxed">
              {isAmharic
                ? 'የጥራዝ ሴሚናር ክፍል ለመግባት እና ከምሁራን ጋር ለመወያየት ማንኛውንም መጽሐፍ ይምረጡ።'
                : 'Select any volume to step into its dedicated text seminar and join the discussion with fellow readers.'}
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

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {filterOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedFilter(option)}
                className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === option
                    ? 'bg-theme-main text-theme-surface font-semibold shadow-2xs'
                    : 'bg-theme-surface border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                {filterLabel(option)}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-subtle text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder={isAmharic ? 'መጻሕፍትን፣ ደራሲያንን ወይም ርዕሶችን ፈልግ...' : 'Search titles, authors, or descriptions...'}
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

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16 bg-theme-surface rounded-xl border border-theme p-6">
            <span className="material-symbols-outlined text-4xl text-theme-subtle mb-2">auto_stories</span>
            <p className="text-sm font-serif font-bold text-theme-main">
              {isAmharic ? 'እስካሁን ምንም መጽሐፍ የለም' : 'No books yet'}
            </p>
            <p className="text-xs text-theme-muted mt-1">
              {isAmharic ? 'ወደ መጽሐፍ ቤት በመሄድ መጀመሪያውን ጥራዝ ይጨምሩ።' : 'Add the first volume to get started.'}
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-theme-surface rounded-xl border border-theme p-6">
            <span className="material-symbols-outlined text-4xl text-theme-subtle mb-2">auto_stories</span>
            <p className="text-sm font-serif font-bold text-theme-main">
              {isAmharic ? 'በዚህ ማጣሪያ የተገኘ መጽሐፍ የለም' : 'No texts found matching your filter'}
            </p>
            <p className="text-xs text-theme-muted mt-1">
              {isAmharic ? 'እባክዎ ፍለጋዎን ይቀይሩ ወይም "ሁሉም" የሚለውን ይምረጡ።' : 'Try clearing your search or selecting "All".'}
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 text-xs font-semibold text-theme-accent hover:underline cursor-pointer"
            >
              {isAmharic ? 'ማጣሪያዎችን ዳግም አስጀምር' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => handleEnterSeminar(book.id)}
                className="group bg-theme-surface rounded-xl border border-theme p-4 sm:p-5 flex flex-col justify-between hover:border-theme-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                <div className="flex gap-3.5 items-start">
                  <div className="w-16 h-22 sm:w-18 sm:h-24 rounded-md overflow-hidden flex-shrink-0 bg-theme-subtle border border-theme shadow-2xs relative">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-theme-subtle">
                        <span className="material-symbols-outlined text-2xl">menu_book</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-1.5 py-0.5 rounded border border-theme whitespace-nowrap">
                        {book.language}
                      </span>
                      {book.page_count != null && (
                        <span className="text-[10px] text-theme-muted whitespace-nowrap">
                          {book.page_count} {isAmharic ? 'ገጾች' : 'pages'}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-[15px] sm:text-base font-bold text-theme-main leading-snug group-hover:text-theme-accent transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    <p className="text-xs text-theme-muted mt-0.5 truncate">
                      {book.author_name}
                    </p>

                    {book.description && (
                      <p className="text-[11px] text-theme-body line-clamp-2 mt-1.5 leading-relaxed">
                        {book.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-theme flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-theme-muted">
                    {book.verification_status === 'verified' && (
                      <span className="flex items-center gap-0.5 text-theme-accent">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>{isAmharic ? 'የተረጋገጠ' : 'Verified'}</span>
                      </span>
                    )}
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
      </div>
    </div>
  );
};