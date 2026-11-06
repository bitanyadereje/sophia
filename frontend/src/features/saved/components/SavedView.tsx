import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, ReadingStatus, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { NotesView } from '../../notes/components/NotesView';
import { loadNotes } from '../../notes/notes.service';
import { loadUserLibrary, removeBookFromLibrary, updateBookStatus } from '../../library/library.service';
import { useBookmarks, useSavedItems } from '../useBookmarks';

interface SavedViewProps {
  userId: string | null;
  books?: Book[];
  initialTab?: 'bookmarks' | 'notes' | 'library';
  onSelectBook?: (bookId: string) => void;
  onSelectDiscussion?: (postId: string) => void;
  onSelectReview?: (reviewId: string) => void;
  onSelectPath?: (pathId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  userId,
  books = [],
  initialTab = 'bookmarks',
  onSelectBook,
  onSelectDiscussion,
  onSelectReview,
  onSelectPath,
  onNavigate,
  onShowToast
}) => {
  const { t, isAmharic } = useLanguage();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes' | 'library'>(initialTab);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'reading' | 'want' | 'read'>('all');

  const { data: savedItems = [] } = useSavedItems(userId);
  const reviewBookmarks = useBookmarks(userId, 'review', onShowToast);
  const postBookmarks = useBookmarks(userId, 'post', onShowToast);
  const pathBookmarks = useBookmarks(userId, 'path', onShowToast);
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', 'all', userId],
    queryFn: () => loadNotes(userId!),
    enabled: Boolean(userId),
  });
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // Library Management Block Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [selectedBookForLibrary, setSelectedBookForLibrary] = useState<string>(books[0]?.id || '');
  const [targetStatusForLibrary, setTargetStatusForLibrary] = useState<ReadingStatus>('to_be_read');

  const filteredBookmarks = savedItems.filter(({ kind, item }) => {
    const matchesType = selectedTag === 'All' || selectedTag === kind;
    const searchText = [item.title, item.content, item.body, item.author, item.author_name, item.username]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();
    return matchesType && searchText.includes(searchQuery.toLowerCase());
  });



  const libraryStatuses = new Map(userLibrary.map((entry) => [entry.book_id, entry.status]));
  const shelfBooks = books.filter((book) => {
    const status = libraryStatuses.get(book.id);
    if (!status) return false;
    if (libraryFilter === 'reading') return status === 'reading';
    if (libraryFilter === 'want') return status === 'to_be_read';
    if (libraryFilter === 'read') return status === 'finished';
    return true;
  });
  const filteredBooks = shelfBooks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div
      id="saved-pages-screen"
      className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200 selection:bg-theme-accent-light selection:text-theme-accent font-serif antialiased"
    >
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col justify-start gap-5">
        <header id="saved-header" className="select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
            <div>
              <span className="text-[10px] lg:text-xs font-serif font-medium uppercase tracking-[0.25em] text-theme-muted block mb-0.5">
                {isAmharic ? 'የግል መዝገብ' : 'PERSONAL REPOSITORY'}
              </span>
              <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
                {t('saved.title', 'Saved Archive')}
              </h1>
              <p className="text-xs sm:text-sm text-theme-muted font-serif italic mt-0.5">
                {t('saved.subtitle', 'Your private bookmarks, book citations, and reading notes')}
              </p>
            </div>

          </div>
        </header>

        {/* TABS & SEARCH */}
        <div className="space-y-3 mb-2">
          <div className="flex items-center justify-between border-b border-theme">
            <nav role="tablist" aria-label="Saved Collections" className="flex items-center gap-6 sm:gap-8 lg:gap-10">
              <button
                id="toggle-bookmarks-tab"
                role="tab"
                aria-selected={activeTab === 'bookmarks'}
                onClick={() => {
                  setActiveTab('bookmarks');
                  setSelectedTag('All');
                }}
                className={`pb-3 pt-1 font-serif text-sm sm:text-base lg:text-lg cursor-pointer transition-colors relative flex items-center gap-2 ${
                  activeTab === 'bookmarks'
                    ? 'text-theme-main font-semibold'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{t('saved.tabBookmarks', 'Bookmarks')}</span>
                <span
                  className={`text-[11px] lg:text-xs font-serif px-2 lg:px-2.5 py-0.5 rounded-full ${
                    activeTab === 'bookmarks'
                      ? 'bg-theme-main text-theme-surface font-medium'
                      : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  {savedItems.length}
                </span>
                {activeTab === 'bookmarks' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>

              <button
                id="toggle-notes-tab"
                role="tab"
                aria-selected={activeTab === 'notes'}
                onClick={() => {
                  setActiveTab('notes');
                  setSelectedTag('All');
                }}
                className={`pb-3 pt-1 font-serif text-sm sm:text-base lg:text-lg cursor-pointer transition-colors relative flex items-center gap-2 ${
                  activeTab === 'notes'
                    ? 'text-theme-main font-semibold'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{t('saved.tabNotes', 'Notes')}</span>
                <span
                  className={`text-[11px] lg:text-xs font-serif px-2 lg:px-2.5 py-0.5 rounded-full ${
                    activeTab === 'notes'
                      ? 'bg-theme-main text-theme-surface font-medium'
                      : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  {notes.length}
                </span>
                {activeTab === 'notes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>

              <button
                id="toggle-library-tab"
                role="tab"
                aria-selected={activeTab === 'library'}
                onClick={() => {
                  setActiveTab('library');
                  setSelectedTag('All');
                }}
                className={`pb-3 pt-1 font-serif text-sm sm:text-base lg:text-lg cursor-pointer transition-colors relative flex items-center gap-2 ${
                  activeTab === 'library'
                    ? 'text-theme-main font-semibold'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{t('saved.tabLibrary', 'Library')}</span>
                <span
                  className={`text-[11px] lg:text-xs font-serif px-2 lg:px-2.5 py-0.5 rounded-full ${
                    activeTab === 'library'
                      ? 'bg-theme-main text-theme-surface font-medium'
                      : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  {books.length}
                </span>
                {activeTab === 'library' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>
            </nav>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] lg:text-[20px] text-theme-muted pointer-events-none">
              search
            </span>
            <input
              type="text"
              id="saved-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'bookmarks'
                  ? (isAmharic ? 'የተቀመጡ ውይይቶችን፣ ዳሰሳዎችን ወይም የንባብ እቅዶችን ፈልግ...' : 'Search saved discussions, reviews, or reading paths...')
                  : activeTab === 'notes'
                  ? (isAmharic ? 'ማስታወሻዎችን ፈልግ...' : 'Search notes...')
                  : (isAmharic ? 'መጻሕፍትን ወይም ደራሲያንን ፈልግ...' : 'Search library by book title or author...')
              }
              className="w-full bg-theme-surface border border-theme rounded-xl py-2.5 lg:py-3 pl-10 lg:pl-11 pr-9 text-xs sm:text-sm lg:text-base font-serif text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main text-xs cursor-pointer p-1 font-serif"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* VIEW A: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <section id="bookmarks-view-content" aria-label="Saved Bookmarks" className="space-y-6">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {[
                { id: 'All', label: isAmharic ? 'ሁሉም' : 'All', count: savedItems.length },
                { id: 'post', label: isAmharic ? 'ውይይቶች' : 'Discussions', count: savedItems.filter(({ kind }) => kind === 'post').length },
                { id: 'review', label: isAmharic ? 'ዳሰሳዎች' : 'Reviews', count: savedItems.filter(({ kind }) => kind === 'review').length },
                { id: 'path', label: isAmharic ? 'የንባብ እቅዶች' : 'Paths', count: savedItems.filter(({ kind }) => kind === 'path').length },
              ].map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTag(tag.id)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-serif transition-colors cursor-pointer border ${
                    selectedTag === tag.id
                      ? 'bg-theme-main text-theme-surface border-theme-main font-medium shadow-xs'
                      : 'bg-theme-surface text-theme-muted border-theme hover:text-theme-main hover:bg-theme-subtle'
                  }`}
                >
                  {tag.label} ({tag.count})
                </button>
              ))}
            </div>

            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-theme rounded-2xl p-8 bg-theme-subtle/30">
                <span className="material-symbols-outlined text-4xl text-[#b89e6c] dark:text-[#dfba4f] block mb-2 mx-auto">
                  bookmark
                </span>
                <h3 className="font-serif text-base font-medium text-theme-main">{t('saved.noBookmarksFound', 'No bookmarks found')}</h3>
                <p className="text-xs text-theme-muted font-serif mt-1">{t('saved.noBookmarksDesc', 'Save discussions, reviews, and reading paths to find them here.')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map(({ kind, item }) => {
                  const title = String(item.title || (kind === 'post' ? 'Discussion' : kind === 'review' ? 'Review' : 'Reading path'));
                  const body = String(item.content || item.body || item.description || '');
                  const author = String(item.author || item.author_name || item.username || '');
                  const remove = kind === 'post' ? postBookmarks.toggle : kind === 'review' ? reviewBookmarks.toggle : pathBookmarks.toggle;
                  const open = () => {
                    if (kind === 'post') { onSelectDiscussion?.(String(item.id)); onNavigate('discussions'); }
                    if (kind === 'review') { onSelectReview?.(String(item.id)); onNavigate('review-detail'); }
                    if (kind === 'path') { onSelectPath?.(String(item.id)); onNavigate('path-detail'); }
                  };
                  return (
                  <article
                    key={`${kind}-${item.id}`}
                    onClick={open}
                    className="bg-theme-surface rounded-xl border border-theme-subtle p-3.5 sm:p-4 shadow-2xs hover:border-theme-accent/70 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[18px] lg:text-[22px] text-[#b89e6c] dark:text-[#dfba4f] shrink-0">
                          bookmark
                        </span>
                        <h3 className="font-serif font-bold text-sm sm:text-base lg:text-lg xl:text-xl text-theme-main leading-snug truncate">
                          {title}
                        </h3>
                        <span className="text-xs text-theme-muted/50 shrink-0">•</span>
                        <span className="text-xs sm:text-[13px] lg:text-sm xl:text-[15px] text-theme-body font-serif font-medium truncate">
                          {author}
                        </span>
                      </div>

                      <span className="text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider px-2 lg:px-2.5 py-0.5 rounded bg-theme-subtle border border-theme-subtle text-theme-muted shrink-0">
                        {kind === 'post' ? (isAmharic ? 'ውይይት' : 'Discussion') : kind === 'review' ? (isAmharic ? 'ዳሰሳ' : 'Review') : (isAmharic ? 'እቅድ' : 'Path')}
                      </span>
                    </div>

                    {body && <p className="mt-2.5 pl-[26px] font-serif text-sm text-theme-body leading-relaxed line-clamp-3">{body}</p>}

                    <div className="flex items-center justify-end gap-1 mt-1.5 lg:mt-2 pt-0.5">
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); remove(String(item.id)); }}
                        className="p-1 lg:p-1.5 rounded text-theme-gold hover:text-theme-main transition-colors cursor-pointer"
                        title="Remove Bookmark"
                        aria-label="Remove Bookmark"
                      >
                        <span className="material-symbols-outlined text-[16px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW B: NOTES */}
        {activeTab === 'notes' && <NotesView userId={userId} books={books} onShowToast={onShowToast} compact />}

        {/* VIEW C: LIBRARY */}
        {activeTab === 'library' && (
          <section id="library-view-content" aria-label="Personal Library" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: isAmharic ? 'ሁሉም' : 'All', count: userLibrary.length },
                  { id: 'reading', label: isAmharic ? 'በማንበብ ላይ' : 'Reading', count: userLibrary.filter((entry) => entry.status === 'reading').length },
                  { id: 'want', label: 'TBR', count: userLibrary.filter((entry) => entry.status === 'to_be_read').length },
                  { id: 'read', label: isAmharic ? 'የተነበበ' : 'Read', count: userLibrary.filter((entry) => entry.status === 'finished').length }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setLibraryFilter(filter.id as any)}
                    className={`text-xs font-serif px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                      libraryFilter === filter.id
                        ? 'bg-theme-main text-theme-surface border-theme-main font-semibold shadow-xs'
                        : 'bg-theme-surface text-theme-muted border-theme hover:text-theme-main hover:bg-theme-subtle'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-serif ${
                        libraryFilter === filter.id
                          ? 'bg-black/15 dark:bg-white/15 text-theme-surface'
                          : 'bg-theme-subtle text-theme-muted'
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  id="lib-manage-add-tbr-btn"
                  onClick={() => {
                    setTargetStatusForLibrary('to_be_read');
                    if (books.length > 0) setSelectedBookForLibrary(books[0].id);
                    setIsAddBookModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 text-xs font-serif font-medium inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-theme"
                >
                  <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
                  <span>{isAmharic ? 'ወደ TBR ጨምር' : 'Add to TBR'}</span>
                </button>

                <button
                  type="button"
                  id="lib-manage-mark-read-btn"
                  onClick={() => {
                    setTargetStatusForLibrary('finished');
                    if (books.length > 0) setSelectedBookForLibrary(books[0].id);
                    setIsAddBookModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-theme-surface border border-theme text-theme-main hover:bg-theme-subtle text-xs font-serif font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-theme-accent">check_circle</span>
                  <span>{isAmharic ? 'ወደ ቤተ-መጻሕፍት አስቀምጥ' : 'Save to Library'}</span>
                </button>
              </div>
            </div>

            {userId && isLibraryPending ? (
              <p className="py-12 text-center text-sm text-theme-muted">Loading your library?</p>
            ) : filteredBooks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-theme rounded-2xl p-8 bg-theme-subtle/30">
                <span className="material-symbols-outlined text-4xl text-[#b89e6c] dark:text-[#dfba4f] block mb-2 mx-auto">
                  local_library
                </span>
                <h3 className="font-serif text-base font-medium text-theme-main">{t('saved.noBooksFound', 'No volumes found')}</h3>
                <p className="text-xs text-theme-muted font-serif mt-1">
                  {t('saved.noBooksDesc', 'Add treatises to your Reading Queue or catalog volumes in your personal library.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredBooks.map((book) => (
                  <article
                    key={book.id}
                    onClick={() => {
                      if (onSelectBook) {
                        onSelectBook(book.id);
                      }
                    }}
                    className="bg-theme-surface rounded-xl border border-theme p-3.5 sm:p-4 shadow-2xs hover:border-theme-accent/60 hover:shadow-xs transition-all cursor-pointer flex gap-3.5 group"
                  >
                    <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-md overflow-hidden bg-theme-subtle border border-black/10 shrink-0 shadow-2xs">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-[11px] text-theme-muted p-1 text-center bg-theme-subtle">
                          {book.title.slice(0, 16)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-theme-main truncate group-hover:text-theme-accent transition-colors leading-snug">
                          {book.title}
                        </h4>
                        <p className="text-xs text-theme-muted font-serif truncate mt-0.5 font-medium">{book.author_name}</p>
                        <p className="text-[11px] text-theme-subtle font-serif mt-0.5">
                          {book.language} · {book.page_count ?? 0} {isAmharic ? 'ገጾች' : 'pages'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-1">
                        <span className="text-[11px] text-theme-muted font-serif font-medium">
                          {isAmharic ? 'ሁኔታ:' : 'Status:'}
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={libraryStatuses.get(book.id) ?? 'to_be_read'}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => {
                              event.stopPropagation();
                              if (!userId) return onShowToast('Sign in to update your library');
                              setBookStatusMutation.mutate({ bookId: book.id, status: event.target.value as ReadingStatus });
                            }}
                            className="rounded-md border border-theme bg-theme-surface px-2 py-1 text-xs text-theme-main"
                          >
                            <option value="to_be_read">Want to Read</option>
                            <option value="reading">Reading</option>
                            <option value="finished">Finished</option>
                            <option value="dnf">Did not finish</option>
                          </select>
                          <button type="button" onClick={(event) => { event.stopPropagation(); if (userId) removeBookMutation.mutate(book.id); }} className="text-xs text-red-600 hover:underline">Remove</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* MODAL: LIBRARY MANAGEMENT */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedBookForLibrary && userId) {
                setBookStatusMutation.mutate({ bookId: selectedBookForLibrary, status: targetStatusForLibrary });
                const bookObj = books.find((b) => b.id === selectedBookForLibrary);
                const statusLabel =
                  targetStatusForLibrary === 'to_be_read'
                    ? (isAmharic ? 'ወደ TBR ተጨምሯል' : 'Added to TBR')
                    : targetStatusForLibrary === 'finished'
                    ? (isAmharic ? 'ወደ ቤተ-መጻሕፍት ተቀምጦ እንደተነበበ ተመዝግቧል' : 'Saved to Library & Marked as Read')
                    : (isAmharic ? 'በማንበብ ላይ ተደርጓል' : 'Set as Reading');
                onShowToast(`${statusLabel}: "${bookObj?.title || 'Volume'}"`);
              }
              setIsAddBookModalOpen(false);
            }}
            className="w-full max-w-md bg-theme-surface rounded-2xl border border-theme p-5 sm:p-6 shadow-2xl space-y-4 font-serif"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-accent text-[22px]">
                  {targetStatusForLibrary === 'to_be_read' ? 'bookmark_add' : 'library_books'}
                </span>
                <h3 className="font-serif text-lg font-bold text-theme-main">
                  {targetStatusForLibrary === 'to_be_read'
                    ? (isAmharic ? 'መጽሐፉን ወደ TBR ጨምር' : 'Add Volume to TBR')
                    : (isAmharic ? 'መጽሐፉን ወደ ቤተ-መጻሕፍት አስቀምጥ' : 'Save Volume to Library')}
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

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1.5 font-medium">
                  {isAmharic ? 'ጥራዝ ምረጥ:' : 'Select Volume:'}
                </label>
                <select
                  value={selectedBookForLibrary}
                  onChange={(e) => setSelectedBookForLibrary(e.target.value)}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-sm text-theme-main focus:outline-none focus:border-theme-accent cursor-pointer shadow-2xs font-medium"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {b.author_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1.5 font-medium">
                  {isAmharic ? 'የሁኔታ ግብ:' : 'Shelf Status Target:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatusForLibrary('to_be_read')}
                    className={`py-2 px-3 rounded-lg border text-left font-serif transition-all cursor-pointer flex items-center gap-2 ${
                      targetStatusForLibrary === 'to_be_read'
                        ? 'bg-theme-main text-theme-surface border-theme-main font-semibold shadow-2xs'
                        : 'bg-theme-app text-theme-muted border-theme hover:text-theme-main'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                    <span>TBR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatusForLibrary('finished')}
                    className={`py-2 px-3 rounded-lg border text-left font-serif transition-all cursor-pointer flex items-center gap-2 ${
                      targetStatusForLibrary === 'finished'
                        ? 'bg-theme-main text-theme-surface border-theme-main font-semibold shadow-2xs'
                        : 'bg-theme-app text-theme-muted border-theme hover:text-theme-main'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-theme-accent">check_circle</span>
                    <span>{isAmharic ? 'የተነበረ' : 'Read'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer font-medium shadow-xs"
              >
                {t('common.confirm', 'Confirm Update')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
