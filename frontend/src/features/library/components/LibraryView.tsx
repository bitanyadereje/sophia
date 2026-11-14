import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, ReadingStatus } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { loadUserLibrary, removeBookFromLibrary, updateBookStatus } from '../library.service';

interface LibraryViewProps {
  userId: string | null;
  books?: Book[];
  onSelectBook?: (bookId: string) => void;
  onShowToast: (msg: string) => void;
}

const STATUS_META: Record<
  ReadingStatus,
  { labelEn: string; labelAm: string; shortEn: string; dotClass: string }
> = {
  reading: {
    labelEn: 'Reading',
    labelAm: 'በማንበብ ላይ',
    shortEn: 'Reading',
    dotClass: 'bg-theme-accent',
  },
  finished: {
    labelEn: 'Finished',
    labelAm: 'የተነበበ',
    shortEn: 'Finished',
    dotClass: 'bg-theme-main',
  },
  to_be_read: {
    labelEn: 'Want to Read',
    labelAm: 'ለማንበብ (TBR)',
    shortEn: 'TBR',
    dotClass: 'border-[1.5px] border-theme-accent bg-transparent',
  },
  dnf: {
    labelEn: 'Did Not Finish',
    labelAm: 'ያልተጠናቀቀ',
    shortEn: 'DNF',
    dotClass: 'border border-dashed border-theme-muted bg-theme-muted/25',
  },
};

interface BookStatusDropdownProps {
  value: ReadingStatus;
  isAmharic: boolean;
  onChange: (status: ReadingStatus) => void;
}

const BookStatusDropdown: React.FC<BookStatusDropdownProps> = ({ value, isAmharic, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const current = STATUS_META[value] ?? STATUS_META.to_be_read;

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
          open
            ? 'bg-theme-subtle border-theme-accent text-theme-main'
            : 'bg-theme-subtle/80 border-theme-subtle text-theme-main hover:border-theme'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${current.dotClass}`} />
        <span>{isAmharic ? current.labelAm : current.shortEn}</span>
        <span
          className={`material-symbols-outlined text-[15px] leading-none text-theme-muted transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 bottom-full mb-1.5 z-30 w-44 rounded-xl border border-theme bg-theme-surface p-1 shadow-lg"
        >
          {(Object.keys(STATUS_META) as ReadingStatus[]).map((statusKey) => {
            const meta = STATUS_META[statusKey];
            const isSelected = statusKey === value;
            return (
              <button
                key={statusKey}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(statusKey);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-theme-subtle text-theme-main font-semibold'
                    : 'text-theme-body hover:bg-theme-subtle/70 hover:text-theme-main'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
                  <span>{isAmharic ? meta.labelAm : meta.labelEn}</span>
                </span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[15px] leading-none text-theme-accent">
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const LibraryView: React.FC<LibraryViewProps> = ({
  userId,
  books = [],
  onSelectBook,
  onShowToast,
}) => {
  const { t, isAmharic } = useLanguage();
  const queryClient = useQueryClient();

  const [libraryFilter, setLibraryFilter] = useState<'all' | 'reading' | 'want' | 'read'>('all');
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [selectedBookForLibrary, setSelectedBookForLibrary] = useState<string>(books[0]?.id || '');
  const [targetStatusForLibrary, setTargetStatusForLibrary] = useState<ReadingStatus>('to_be_read');

  useEffect(() => {
    if (!openCardMenuId) return;
    const closeMenu = () => setOpenCardMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, [openCardMenuId]);

  const { data: userLibrary = [], isPending: isLibraryPending } = useQuery({
    queryKey: ['library', userId],
    queryFn: () => loadUserLibrary(userId!),
    enabled: Boolean(userId),
  });

  const setBookStatusMutation = useMutation({
    mutationFn: ({ bookId, status }: { bookId: string; status: ReadingStatus }) =>
      updateBookStatus(userId!, bookId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library', userId] }),
    onError: () => onShowToast('Could not update your library'),
  });

  const removeBookMutation = useMutation({
    mutationFn: (bookId: string) => removeBookFromLibrary(userId!, bookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['library', userId] }),
    onError: () => onShowToast('Could not remove book from your library'),
  });

  const libraryStatuses = new Map(userLibrary.map((entry) => [entry.book_id, entry.status]));
  const filteredBooks = books.filter((book) => {
    const status = libraryStatuses.get(book.id);
    if (!status) return false;
    if (libraryFilter === 'reading') return status === 'reading';
    if (libraryFilter === 'want') return status === 'to_be_read';
    if (libraryFilter === 'read') return status === 'finished';
    return true;
  });

  return (
    <section
      id="library-view-content"
      aria-label="Personal Library"
      className="font-sans antialiased space-y-5"
    >
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: isAmharic ? 'ሁሉም' : 'All', count: userLibrary.length },
            {
              id: 'reading',
              label: isAmharic ? 'በማንበብ ላይ' : 'Reading',
              count: userLibrary.filter((entry) => entry.status === 'reading').length,
            },
            {
              id: 'want',
              label: 'TBR',
              count: userLibrary.filter((entry) => entry.status === 'to_be_read').length,
            },
            {
              id: 'read',
              label: isAmharic ? 'የተነበበ' : 'Read',
              count: userLibrary.filter((entry) => entry.status === 'finished').length,
            },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setLibraryFilter(filter.id as 'all' | 'reading' | 'want' | 'read')}
              className={`text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap border inline-flex items-center gap-1.5 ${
                libraryFilter === filter.id
                  ? 'bg-theme-main text-theme-surface border-theme-main font-semibold'
                  : 'bg-theme-surface text-theme-muted border-theme-subtle hover:text-theme-main hover:bg-theme-subtle'
              }`}
            >
              <span>{filter.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  libraryFilter === filter.id
                    ? 'bg-theme-surface/20 text-theme-surface'
                    : 'bg-theme-subtle text-theme-muted'
                }`}
              >
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          id="lib-manage-add-book-btn"
          onClick={() => {
            setTargetStatusForLibrary('to_be_read');
            if (books.length > 0) setSelectedBookForLibrary(books[0].id);
            setIsAddBookModalOpen(true);
          }}
          className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-lg bg-theme-accent text-theme-surface hover:opacity-90 text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] leading-none">add</span>
          <span>{isAmharic ? 'መጽሐፍ ጨምር' : 'Add Book'}</span>
        </button>
      </div>

      {/* CONTENT */}
      {userId && isLibraryPending ? (
        <p className="py-12 text-center text-sm text-theme-muted">Loading your library...</p>
      ) : filteredBooks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-theme rounded-2xl p-8 bg-theme-subtle/30">
          <span className="material-symbols-outlined text-4xl text-theme-accent block mb-2 mx-auto">
            local_library
          </span>
          <h3 className="font-serif text-lg font-semibold text-theme-main">
            {t('saved.noBooksFound', 'No volumes found')}
          </h3>
          <p className="text-xs text-theme-muted mt-1">
            {t('saved.noBooksDesc', 'Add treatises to your Reading Queue or catalog volumes in your personal library.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => {
            const currentStatus = libraryStatuses.get(book.id) ?? 'to_be_read';
            const isMenuOpen = openCardMenuId === book.id;

            return (
              <article
                key={book.id}
                onClick={() => onSelectBook?.(book.id)}
                className="relative bg-theme-surface rounded-xl border border-theme-subtle p-4 hover:border-theme transition-all cursor-pointer flex gap-3.5 group"
              >
                {/* COVER */}
                <div className="w-[68px] h-[100px] rounded-md overflow-hidden bg-theme-subtle border border-theme-subtle shrink-0">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-between p-2 bg-theme-subtle text-left border-l-2 border-theme-accent/50">
                      <span className="font-serif text-[11px] font-semibold leading-tight text-theme-main line-clamp-3">
                        {book.title}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-theme-muted truncate">
                        {book.language}
                      </span>
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="pr-6">
                    <h4 className="font-serif font-bold text-[15px] text-theme-main truncate group-hover:text-theme-accent transition-colors leading-snug">
                      {book.title}
                    </h4>
                    <p className="text-xs text-theme-body truncate mt-0.5">{book.author_name}</p>
                    <p className="text-[11px] text-theme-muted mt-1">
                      {book.language} · {book.page_count ?? 0} {isAmharic ? 'ገጾች' : 'pages'}
                    </p>
                  </div>

                  <div className="pt-2.5 mt-1 flex items-center justify-between">
                    <BookStatusDropdown
                      value={currentStatus}
                      isAmharic={isAmharic}
                      onChange={(newStatus) => {
                        if (!userId) return onShowToast('Sign in to update your library');
                        setBookStatusMutation.mutate({ bookId: book.id, status: newStatus });
                      }}
                    />
                  </div>
                </div>

                {/* TOP-RIGHT OVERFLOW MENU */}
                <div
                  className="absolute top-3 right-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label="Book actions"
                    onClick={() => setOpenCardMenuId(isMenuOpen ? null : book.id)}
                    className="p-1 rounded-md text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] leading-none">
                      more_vert
                    </span>
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 mt-1 z-30 w-36 rounded-lg border border-theme bg-theme-surface p-1 shadow-lg">
                      {onSelectBook && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenCardMenuId(null);
                            onSelectBook(book.id);
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-theme-body hover:bg-theme-subtle hover:text-theme-main cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          <span>{isAmharic ? 'ዝርዝር ይመልከቱ' : 'Open Details'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenCardMenuId(null);
                          if (userId) removeBookMutation.mutate(book.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-theme-accent hover:bg-theme-subtle cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>{isAmharic ? 'አስወግድ' : 'Remove'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ADD BOOK MODAL */}
      {isAddBookModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsAddBookModalOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedBookForLibrary && userId) {
                setBookStatusMutation.mutate({
                  bookId: selectedBookForLibrary,
                  status: targetStatusForLibrary,
                });
                const bookObj = books.find((b) => b.id === selectedBookForLibrary);
                const statusLabel =
                  targetStatusForLibrary === 'to_be_read'
                    ? isAmharic
                      ? 'ወደ TBR ተጨምሯል'
                      : 'Added to TBR'
                    : targetStatusForLibrary === 'finished'
                    ? isAmharic
                      ? 'እንደተነበበ ተመዝግቧል'
                      : 'Marked as Finished'
                    : isAmharic
                    ? 'በማንበብ ላይ ተደርጓል'
                    : 'Set as Reading';
                onShowToast(`${statusLabel}: "${bookObj?.title || 'Volume'}"`);
              }
              setIsAddBookModalOpen(false);
            }}
            className="w-full max-w-md bg-theme-surface rounded-2xl border border-theme p-5 sm:p-6 shadow-2xl space-y-4 font-sans"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-accent text-[20px]">
                  library_add
                </span>
                <h3 className="font-serif text-lg font-bold text-theme-main">
                  {isAmharic ? 'መጽሐፍ ወደ ቤተ-መጻሕፍት ጨምር' : 'Add Volume to Library'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="text-theme-muted hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-theme-muted mb-1.5">
                  {isAmharic ? 'ጥራዝ ምረጥ' : 'Select Volume'}
                </label>
                <select
                  value={selectedBookForLibrary}
                  onChange={(e) => setSelectedBookForLibrary(e.target.value)}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 text-sm text-theme-main focus:outline-none focus:border-theme-accent cursor-pointer font-medium"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {b.author_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-theme-muted mb-1.5">
                  {isAmharic ? 'የንባብ ሁኔታ' : 'Shelf Status'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'to_be_read', label: 'TBR', icon: 'bookmark_add' },
                      { value: 'reading', label: isAmharic ? 'በማንበብ ላይ' : 'Reading', icon: 'auto_stories' },
                      { value: 'finished', label: isAmharic ? 'የተነበበ' : 'Finished', icon: 'check_circle' },
                    ] as const
                  ).map((shelf) => (
                    <button
                      key={shelf.value}
                      type="button"
                      onClick={() => setTargetStatusForLibrary(shelf.value)}
                      className={`py-2 px-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-center gap-1.5 font-medium ${
                        targetStatusForLibrary === shelf.value
                          ? 'bg-theme-main text-theme-surface border-theme-main font-semibold'
                          : 'bg-theme-app text-theme-muted border-theme hover:text-theme-main'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">{shelf.icon}</span>
                      <span>{shelf.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="px-4 py-2 text-xs text-theme-muted hover:text-theme-main cursor-pointer font-medium"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-theme-accent text-theme-surface text-xs hover:opacity-90 cursor-pointer font-semibold shadow-xs"
              >
                {t('common.confirm', 'Save to Library')}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};