import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Book, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { NotesView } from '../../notes/components/NotesView';
import { loadNotes } from '../../notes/notes.service';
import { LibraryView } from '../../library';
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

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes' | 'library'>(initialTab);
  const { data: savedItems = [] } = useSavedItems(userId);
  const reviewBookmarks = useBookmarks(userId, 'review', onShowToast);
  const postBookmarks = useBookmarks(userId, 'post', onShowToast);
  const pathBookmarks = useBookmarks(userId, 'path', onShowToast);
  const { data: notes = [] } = useQuery({
    queryKey: ['notes', 'all', userId],
    queryFn: () => loadNotes(userId!),
    enabled: Boolean(userId),
  });

  const [selectedTag, setSelectedTag] = useState('All');

  const filteredBookmarks = savedItems.filter(({ kind }) => selectedTag === 'All' || selectedTag === kind);

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

        {/* TABS */}
        <div className="mb-2">
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
          <LibraryView userId={userId} books={books} onSelectBook={onSelectBook} onShowToast={onShowToast} />
        )}
      </div>
    </div>
  );
};