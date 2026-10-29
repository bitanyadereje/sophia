import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, Review, ScreenId, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { loadUserLibrary, updateBookStatus } from '../features/library/library.service';
import { loadDiscussionsWithAuthors, loadAllReplies, loadDiscussionTopics } from '../features/discussions/services/discussion.service';
import { loadReviews } from '../features/reviews/review.service';
import { loadReviewerProfilesForReviews } from '../features/reviews/reviewerProfiles';

interface ReadingTreatise {
  id: string;
  title: string;
  author: string;
  location: string;
  progress: number;
  discussionPrompt: string;
  discussionReplies: number;
}

interface HomeInsight {
  id: string;
  kind: 'discussion' | 'review';
  title: string;
  meta: string;
  createdAt: string;
}

interface HomeFeedViewProps {
  user?: UserProfile;
  userId?: string | null;
  books?: Book[];
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBook?: (bookId: string) => void;
  onOpenSeminar?: (bookId: string) => void;
  onShowToast?: (msg: string) => void;
  onNavigateToDiscussion?: (questionId: string) => void;
  onNavigateToReview?: (reviewId: string) => void;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  user = {
    id: '',
    name: 'Caleb',
    title: 'Monastic Scholar',
    location: 'Oxford, UK',
    memberSince: '2023',
    avatar: '',
    booksRead: 0,
    notesCount: 0,
    dayStreak: 0,
    goalTarget: 24,
    topics: ['Patristics', 'Early Church']
  },
  userId,
  books = [],
  onUpdateUser,
  onNavigate,
  onSelectBook,
  onOpenSeminar,
  onShowToast,
  onNavigateToDiscussion,
  onNavigateToReview
}) => {
  const { isAmharic } = useLanguage();
  const queryClient = useQueryClient();
  const currentUserId = userId ?? user.id;
  const { data: library = [], isPending: isLibraryPending } = useQuery({
    queryKey: ['library', currentUserId],
    queryFn: () => loadUserLibrary(currentUserId!),
    enabled: Boolean(currentUserId),
  });
  const readingTreatises = useMemo<ReadingTreatise[]>(() => library
    .filter((entry) => entry.status === 'reading')
    .flatMap((entry) => {
      const book = books.find((candidate) => candidate.id === entry.book_id);
      if (!book) return [];
      const progress = book.page_count
        ? Math.min(100, Math.round((entry.pages_read / book.page_count) * 100))
        : 0;
      const location = entry.pages_read ? `Page ${entry.pages_read}` : 'In progress';
      return [{
        id: book.id,
        title: book.title,
        author: book.author_name,
        location,
        progress,
        discussionPrompt: `Discuss ${book.title}`,
        discussionReplies: 0,
      }];
    }), [library, books]);
  const finishedBooksCount = library.filter((entry) => entry.status === 'finished').length;
  const { data: recentInsights = [], isPending: areInsightsPending } = useQuery({
    queryKey: ['home-insights'],
    queryFn: async (): Promise<HomeInsight[]> => {
      const [posts, replies, reviews] = await Promise.all([
        loadDiscussionsWithAuthors(),
        loadAllReplies(),
        loadReviews(),
      ]);
      const [topics, reviewerProfiles] = await Promise.all([
        loadDiscussionTopics(posts.map((post) => post.id)),
        loadReviewerProfilesForReviews(reviews),
      ]);
      const discussionInsights: HomeInsight[] = posts.map((post) => ({
        id: post.id,
        kind: 'discussion',
        title: post.title || post.content,
        meta: `${topics[post.id] || 'Discussion'} · ${replies.filter((reply) => reply.parent_id === post.id).length} replies`,
        createdAt: post.created_at,
      }));
      const reviewInsights: HomeInsight[] = reviews.map((review: Review) => {
        const reviewer = reviewerProfiles[review.user_id];
        const bookTitle = books.find((book) => book.id === review.book_id)?.title;
        return {
          id: review.id,
          kind: 'review',
          title: review.title || (bookTitle ? `Review: ${bookTitle}` : review.content),
          meta: `★ ${review.rating}/5 · ${reviewer?.name || 'Reader'}`,
          createdAt: review.created_at,
        };
      });
      return [...discussionInsights, ...reviewInsights]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    },
  });
  const readingLogMutation = useMutation({
    mutationFn: (values: { bookId: string; pagesRead: number }) => {
      const row = library.find((entry) => entry.book_id === values.bookId);
      if (!currentUserId || !row) throw new Error('Reading book is unavailable');
      return updateBookStatus(currentUserId, values.bookId, 'reading', row.pages_read + values.pagesRead);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', currentUserId] });
      onShowToast?.('Reading progress recorded');
    },
    onError: () => onShowToast?.('Could not save reading progress'),
  });

  // Contemplation state (customizable via reading logger)
  const activeBook = readingTreatises[0]?.title ?? '';
  const activeAuthor = readingTreatises[0]?.author ?? '';
  const activeChapter = readingTreatises[0]?.location ?? '';

  const handleOpenBookDetail = (item: { id: string; title: string }) => {
    if (onSelectBook) {
      onSelectBook(item.id);
    } else {
      onNavigate('colloquium');
    }
  };

  // Reading Logger Modal State ("the user can add how many pages they read and if they are on a chapter")
  const [isLoggerModalOpen, setIsLoggerModalOpen] = useState(false);
  const [loggerBook, setLoggerBook] = useState('');
  const [loggerPagesRead, setLoggerPagesRead] = useState(12);

  // Target Goal Adjustment Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.goalTarget);

  // Write Notes Modal
  const [activeNotesBook, setActiveNotesBook] = useState<{
    title: string;
    location: string;
  } | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Discussion Modal
  const [activeDiscussionBook, setActiveDiscussionBook] = useState<{
    id: string;
    title: string;
    location: string;
    prompt: string;
    repliesCount: number;
  } | null>(null);

  // Handlers
  const handleSaveReadingLog = (e: React.FormEvent) => {
    e.preventDefault();
    const pages = Number(loggerPagesRead) || 0;
    const selected = readingTreatises.find((item) => item.id === loggerBook);
    if (selected && currentUserId && pages > 0) {
      readingLogMutation.mutate({ bookId: selected.id, pagesRead: pages });
    } else if (!currentUserId) {
      onShowToast?.('Sign in to save reading progress');
    } else {
      onShowToast?.('Choose a book from your Currently Reading shelf');
    }
    setIsLoggerModalOpen(false);
  };

  const handleSaveGoal = () => {
    if (onUpdateUser) {
      onUpdateUser({ goalTarget: tempGoal });
    }
    setIsGoalModalOpen(false);
    if (onShowToast) {
      onShowToast(`Annual reading target set to ${tempGoal} volumes`);
    }
  };

  const handleSaveNote = () => {
    if (!newNoteText.trim()) {
      setActiveNotesBook(null);
      return;
    }
    if (onShowToast) {
      onShowToast(`Marginal note saved for ${activeNotesBook?.title}`);
    }
    if (onUpdateUser) {
      onUpdateUser({ notesCount: user.notesCount + 1 });
    }
    setNewNoteText('');
    setActiveNotesBook(null);
  };

  return (
    <div
      id="sanctuary-home-screen"
      className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200 selection:bg-theme-accent-light selection:text-theme-accent font-sans antialiased"
    >
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* 1. THE ARCHIVAL HEADER & READING STREAK                                   */}
        {/* ========================================================================= */}
        <header id="archival-header" className="select-none">
          <div className="flex items-baseline justify-between border-b border-theme/40 pb-3 lg:pb-4">
            <div>
              <h1 className="font-serif font-light text-xl sm:text-2xl lg:text-3xl tracking-[0.24em] text-theme-main uppercase">
                {isAmharic ? 'ሶፊያ' : 'SOPHIA'}
              </h1>
              <p className="text-[10px] lg:text-xs font-sans uppercase tracking-[0.25em] text-theme-muted mt-1">
                {isAmharic ? 'የመንፈስ ማረፊያ • መነሻ' : 'Reading Desk • Home'}
              </p>
            </div>
            <span className="text-[11px] lg:text-xs font-serif italic text-theme-muted hidden sm:inline">
              {isAmharic ? 'እምነት ማስተዋልን ይሻል (Faith seeking understanding)' : 'Faith seeking understanding'}
            </span>
          </div>

          {/* Reading Streak & Annual Volumes (From Library requirements) */}
          <div className="mt-3 lg:mt-4 flex items-center justify-between flex-wrap gap-2 text-xs lg:text-sm font-sans text-theme-muted">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="text-theme-accent font-serif font-semibold">
                {currentUserId && isLibraryPending ? '...' : finishedBooksCount} {isAmharic ? 'የተጠናቀቁ መጻሕፍት' : 'books finished'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTempGoal(user.goalTarget);
                  setIsGoalModalOpen(true);
                }}
                className="px-3 lg:px-3.5 py-1 lg:py-1.5 rounded-full bg-theme-surface border border-theme text-xs lg:text-sm font-serif text-theme-muted hover:text-theme-main hover:bg-theme-subtle inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px] lg:text-[17px] text-theme-accent">flag</span>
                <span>{isAmharic ? 'ግብ:' : 'Goal:'} {user.goalTarget} {isAmharic ? 'መጻሕፍት' : 'books'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoggerBook(readingTreatises[0]?.id ?? '');
                  setIsLoggerModalOpen(true);
                }}
                disabled={!activeBook}
                className="px-3 lg:px-3.5 py-1 lg:py-1.5 rounded-full bg-theme-accent text-white text-xs lg:text-sm font-serif font-medium hover:bg-theme-accent/90 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[15px] lg:text-[17px]">add</span>
                <span>{isAmharic ? 'ንባብ መዝግብ' : 'Log Reading'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. THE "ACTIVE CONTEMPLATION" ANCHOR                                      */}
        {/* ========================================================================= */}
        <section
          id="active-contemplation-anchor"
          aria-label="Active Contemplation"
          className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-7 lg:p-10 shadow-xs text-center relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
            {isAmharic ? 'ገባሪ ንባብ' : 'Active Lectio'}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl xl:text-[32px] text-theme-main font-semibold leading-snug max-w-xl lg:max-w-3xl mx-auto">
            {activeBook ? (isAmharic ? (
              <>
                {user.name}፣ በ<span className="italic font-bold text-theme-accent">{activeBook}</span> {activeChapter} ላይ ነዎት።
              </>
            ) : (
              <>
                {user.name}, you are reading{' '}
                <span className="italic font-bold text-theme-accent">{activeBook}</span>.
              </>
            )) : (isAmharic ? 'ከቤተ-መጻሕፍትዎ መጽሐፍ ይምረጡ' : 'Choose a book to start reading.')}
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-theme-muted font-serif mt-1 lg:mt-2">
            {activeBook ? `${activeAuthor} · ${activeChapter}` : 'Books marked Reading will appear here.'}
          </p>

          <div className="mt-5 lg:mt-7 flex items-center justify-center gap-3 flex-wrap">
            <button
              id="resume-study-btn"
              type="button"
              disabled={!activeBook}
              onClick={() => {
                const currentBook = readingTreatises[0];
                if (currentBook) handleOpenBookDetail(currentBook);
              }}
              className="px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-theme-main text-white font-serif text-xs sm:text-sm lg:text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">auto_stories</span>
              <span>{isAmharic ? 'መጽሐፉን ክፈት' : 'Open Book'}</span>
            </button>

            <button
              id="log-reading-btn"
              type="button"
              disabled={!activeBook}
              onClick={() => {
                setLoggerBook(readingTreatises[0]?.id ?? '');
                setIsLoggerModalOpen(true);
              }}
              className="px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-theme-surface border border-theme text-theme-main font-serif text-xs sm:text-sm lg:text-base font-semibold hover:bg-theme-subtle active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px] lg:text-[20px] text-theme-accent">menu_book</span>
              <span>{isAmharic ? 'ንባብ መዝግብ' : 'Log Reading'}</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CURRENTLY READING SECTION                                              */}
        {/* ========================================================================= */}
        <section
          id="home-currently-reading"
          aria-label="Currently Reading Treatises"
          className="space-y-4 lg:space-y-5"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] lg:text-xs font-sans font-semibold uppercase tracking-[0.25em] text-theme-muted whitespace-nowrap">
              {isAmharic ? 'በማንበብ ላይ ያሉ' : 'CURRENTLY READING'}
            </h2>
            <div className="h-px bg-theme w-full flex-1" />
          </div>

          <div className="space-y-3.5 lg:space-y-4">
            {currentUserId && isLibraryPending ? (
              <p className="py-8 text-center text-sm text-theme-muted">Loading your reading list...</p>
            ) : readingTreatises.length === 0 ? (
              <div className="rounded-xl border border-dashed border-theme p-6 text-center text-sm text-theme-muted">
                <p>You have no books marked as currently reading.</p>
                <button type="button" onClick={() => onNavigate('library')} className="mt-3 text-theme-accent hover:underline">Browse your library</button>
              </div>
            ) : readingTreatises.map((item) => (
              <article
                key={item.id}
                id={`reading-treatise-${item.id}`}
                onClick={() => handleOpenBookDetail(item)}
                className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 lg:p-6 shadow-xs space-y-3 lg:space-y-4 transition-colors hover:border-theme-accent/50 group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBookDetail(item);
                      }}
                      className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-theme-main hover:text-theme-accent cursor-pointer transition-colors inline-block leading-snug"
                      title={`View details for ${item.title}`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-theme-muted font-serif mt-0.5">
                      {item.author} • {item.location}
                    </p>
                  </div>
                  <span className="text-xs lg:text-sm font-serif font-semibold text-theme-accent bg-theme-subtle px-2.5 lg:px-3 py-0.5 lg:py-1 rounded-full border border-theme flex-shrink-0">
                    {item.progress}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 lg:h-2 w-full bg-theme-muted/50 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-theme-accent transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNotesBook({
                        title: item.title,
                        location: item.location
                      });
                      setNewNoteText('');
                    }}
                    className="px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-main text-xs lg:text-sm font-serif font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] lg:text-[17px] text-theme-accent">edit_note</span>
                    <span>Write Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDiscussionBook({
                        id: item.id,
                        title: item.title,
                        location: item.location,
                        prompt: item.discussionPrompt,
                        repliesCount: item.discussionReplies
                      });
                    }}
                    className="px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-muted hover:text-theme-main text-xs lg:text-sm font-serif font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] lg:text-[17px]">forum</span>
                    <span>Discussion Feed</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoggerBook(item.id);
                      setIsLoggerModalOpen(true);
                    }}
                    className="px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs lg:text-sm font-serif font-semibold hover:bg-stone-700 dark:hover:bg-stone-600 inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-auto"
                  >
                    <span className="material-symbols-outlined text-[15px] lg:text-[17px]">menu_book</span>
                    <span>Log Reading</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE JOURNAL COLLOQUIUM FEED (Recent Insights)                          */}
        {/* ========================================================================= */}
        <section
          id="journal-colloquium-feed"
          aria-label="Recent Insights Feed"
          className="pt-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] lg:text-xs font-sans font-medium uppercase tracking-[0.25em] text-theme-muted">
              {isAmharic ? 'የቅርብ ጊዜ ግንዛቤዎች' : 'RECENT INSIGHTS'}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('discussions')}
              className="text-[11px] lg:text-xs font-sans text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሁሉንም ውይይቶች እይ' : 'All Discussions'}
            </button>
          </div>
          <div className="divide-y divide-theme border-t border-b border-theme">
            {areInsightsPending ? (
              <p className="py-6 text-center text-sm text-theme-muted">Loading recent insights...</p>
            ) : recentInsights.length === 0 ? (
              <p className="py-6 text-center text-sm text-theme-muted">No recent discussions or reviews yet.</p>
            ) : recentInsights.map((insight) => (
              <article
                key={`${insight.kind}-${insight.id}`}
                onClick={() => {
                  if (insight.kind === 'review') {
                    if (onNavigateToReview) onNavigateToReview(insight.id);
                    else onNavigate('reviews');
                  } else if (onNavigateToDiscussion) onNavigateToDiscussion(insight.id);
                  else onNavigate('discussions');
                }}
                className="py-4 lg:py-5 px-2 lg:px-3 hover:bg-theme-subtle/70 rounded-lg transition-colors cursor-pointer group flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-[15px] sm:text-base lg:text-lg xl:text-xl text-theme-main group-hover:text-theme-accent leading-snug transition-colors line-clamp-2">
                    {insight.title}
                  </h3>
                  <p className="mt-1.5 text-xs lg:text-sm text-theme-muted font-sans font-normal tracking-tight">
                    {insight.kind === 'review' ? 'Review' : 'Discussion'} - {insight.meta}
                  </p>
                </div>
                <span className="material-symbols-outlined text-theme-subtle group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all text-[18px] sm:text-[20px] flex-shrink-0">
                  arrow_forward
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: LOG READING & UPDATE CHAPTER                                    */}
      {/* ========================================================================= */}
      {isLoggerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsLoggerModalOpen(false)}
        >
          <form
            onSubmit={handleSaveReadingLog}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted block">
                  DAILY STUDY LOG
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  Record Pages Read
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLoggerModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-sans text-theme-muted mb-1">Select Treatise:</label>
                <select
                  value={loggerBook}
                  onChange={(e) => {
                    setLoggerBook(e.target.value);
                  }}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main focus:outline-none focus:border-theme-accent"
                >
                  {readingTreatises.map((item) => (
                    <option key={item.id} value={item.id}>{item.title} ({item.author})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-theme-muted mb-1">
                  Pages Read Today:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={150}
                    value={loggerPagesRead}
                    onChange={(e) => setLoggerPagesRead(Number(e.target.value))}
                    className="w-24 bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main text-center focus:outline-none focus:border-theme-accent"
                    required
                  />
                  <span className="text-xs text-theme-muted font-serif italic">
                    pages read in contemplative silence
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLoggerModalOpen(false)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs font-serif tracking-wide hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-xs cursor-pointer"
              >
                Save Progress
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discussion Modal */}
      {activeDiscussionBook && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setActiveDiscussionBook(null)}
        >
          <div
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted block">
                  COLLOQUIUM DISCUSSION
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  {activeDiscussionBook.title}
                </h3>
                <p className="text-xs text-theme-muted font-serif italic">
                  {activeDiscussionBook.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDiscussionBook(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-theme-subtle p-3.5 rounded-xl border border-theme space-y-2">
              <span className="text-[10px] font-sans uppercase tracking-wider text-theme-accent font-medium block">
                Active Colloquium Question
              </span>
              <p className="text-xs sm:text-sm font-serif text-theme-main leading-relaxed font-normal">
                {activeDiscussionBook.prompt}
              </p>
              <span className="text-[11px] text-theme-muted font-sans block">
                {activeDiscussionBook.repliesCount} scholarly responses in colloquium
              </span>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveDiscussionBook(null)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = activeDiscussionBook.id;
                  setActiveDiscussionBook(null);
                  if (onOpenSeminar) {
                    onOpenSeminar(targetId);
                  } else if (onSelectBook) {
                    onSelectBook(targetId);
                  } else {
                    onNavigate('colloquium');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs font-serif tracking-wide hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-xs cursor-pointer"
              >
                Join Seminar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Goal Modal */}
      {isGoalModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-serif font-bold text-base text-theme-main">
                Annual Reading Target
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 py-4 bg-theme-subtle rounded-xl border border-theme">
              <button
                type="button"
                onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                className="w-9 h-9 rounded-lg bg-theme-surface border border-theme text-base font-serif hover:bg-theme-muted cursor-pointer flex items-center justify-center"
              >
                −
              </button>
              <div className="text-center">
                <span className="font-serif text-2xl font-bold text-theme-main">{tempGoal}</span>
                <span className="block text-[10px] uppercase tracking-wider text-theme-muted mt-0.5">
                  Volumes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTempGoal(tempGoal + 1)}
                className="w-9 h-9 rounded-lg bg-theme-surface border border-theme text-base font-serif hover:bg-theme-muted cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-theme-subtle text-theme-muted text-xs font-serif cursor-pointer hover:text-theme-main"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="flex-1 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
