import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, ScreenId, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { loadUserLibrary, updateBookStatus } from '../features/library/library.service';
import { loadDiscussionsWithAuthors, loadDiscussionTopics } from '../features/discussions/services/discussion.service';
import { loadReviews } from '../features/reviews/review.service';
import { loadReviewerProfilesForReviews } from '../features/reviews/reviewerProfiles';
import { createNote } from '../features/notes/notes.service';
import { BookCover } from '../features/books/components/BookCover';

interface ReadingTreatise {
  id: string;
  title: string;
  author: string;
  pagesRead: number;
  pageCount: number | null;
  progress: number;
  cover?: string | null;
  discussionPrompt: string;
  discussionReplies: number;
  seminarNew: number;
}

/** Optional: pass the reader's active path to show the "Your path" stepper. */
export interface PathSummary {
  id: string;
  title: string;
  steps: { id: string; title: string; status: 'done' | 'current' | 'upcoming' }[];
}

interface FeedItem {
  key: string;
  kind: 'discussion' | 'review';
  id: string;
  tag: string;
  highlight: boolean;
  title: string;
  meta: string;
  count: string;
  priority: number;
  activityAt: number;
}

interface HomeFeedViewProps {
  user?: UserProfile;
  userId?: string | null;
  books?: Book[];
  activePath?: PathSummary | null;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBook?: (bookId: string) => void;
  onOpenSeminar?: (bookId: string) => void;
  onShowToast?: (msg: string) => void;
  onNavigateToDiscussion?: (questionId: string) => void;
  onNavigateToReview?: (reviewId: string) => void;
}

interface Post {
  id: string;
  title?: string | null;
  content: string;
  created_at?: string | null;
  book_id?: string | null;
  user_id?: string;
  reply_count?: number;
}

const ts = (iso?: string | null) => (iso ? new Date(iso).getTime() : 0);

const timeAgo = (time: number) => {
  const mins = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

const formatReplyCount = (n: number) => `${n} ${n === 1 ? 'reply' : 'replies'}`;

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* Rules: serif = headings/titles only. Sans = buttons, meta, body.    */
/* One primary action per card; all other actions share SECONDARY.     */
/* ------------------------------------------------------------------ */
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-highlight';
const BTN_BASE = `inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 rounded-[9px] font-sans text-[13px] whitespace-nowrap transition-colors cursor-pointer ${FOCUS}`;
const BTN_PRIMARY = `${BTN_BASE} bg-theme-primary text-theme-on-primary font-semibold hover:bg-theme-primary/90 disabled:opacity-50`;
const BTN_SECONDARY = `${BTN_BASE} bg-theme-surface text-theme-main font-medium border border-theme-strong hover:bg-theme-subtle`;
const GHOST_BTN = `${BTN_BASE} text-theme-muted hover:text-theme-main`;
const DARK_BTN = BTN_PRIMARY;
const SECTION_LABEL = 'text-[13px] font-sans font-semibold uppercase tracking-[0.12em] text-theme-muted whitespace-nowrap';

const ModalShell: React.FC<{
  label: string;
  heading: string;
  sub?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  as?: 'div' | 'form';
  onSubmit?: (e: React.FormEvent) => void;
}> = ({ label, heading, sub, onClose, children, footer, as = 'div', onSubmit }) => {
  const Tag = as as React.ElementType;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <Tag
        onSubmit={onSubmit}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start justify-between border-b border-theme pb-3">
          <div>
            <span className="text-[13px] font-sans uppercase tracking-[0.12em] text-theme-muted block">{label}</span>
            <h3 className="font-serif font-semibold text-xl text-theme-main mt-0.5">{heading}</h3>
            {sub && <p className="text-sm text-theme-muted font-sans">{sub}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer ${FOCUS}`}
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        {children}
        <div className="pt-3 border-t border-theme flex items-center justify-end gap-2">{footer}</div>
      </Tag>
    </div>
  );
};

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
  activePath = null,
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

  const seenKey = `sophia-home-seen-${currentUserId || 'guest'}`;
  const [lastSeen] = useState(() => {
    try {
      return Number(localStorage.getItem(seenKey)) || Date.now() - 7 * 86400000;
    } catch {
      return Date.now() - 7 * 86400000;
    }
  });
  useEffect(
    () => () => {
      try {
        localStorage.setItem(seenKey, String(Date.now()));
      } catch {
        /* storage unavailable */
      }
    },
    [seenKey]
  );

  const { data: library = [], isPending: isLibraryPending } = useQuery({
    queryKey: ['library', currentUserId],
    queryFn: () => loadUserLibrary(currentUserId!),
    enabled: Boolean(currentUserId),
  });

  // This is a compact home-feed snapshot, not the paginated Discussions cache.
  // A useQuery cache must never share a key with useInfiniteQuery.
  const { data: discussionsData, isPending: isPostsPending } = useQuery({
    queryKey: ['home-discussions'],
    queryFn: () => loadDiscussionsWithAuthors(),
  });

  // Safely unwrap whether loadDiscussionsWithAuthors returns an array or a paginated page object
  const posts: Post[] = useMemo(() => {
    if (Array.isArray(discussionsData)) return discussionsData;
    if (discussionsData && typeof discussionsData === 'object') {
      const candidate =
        (discussionsData as any).items ??
        (discussionsData as any).posts ??
        (discussionsData as any).data;
      if (Array.isArray(candidate)) return candidate;
    }
    return [];
  }, [discussionsData]);

  const { data: reviewsData, isPending: isReviewsPending } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => loadReviews(),
  });

  const reviews = useMemo(() => {
    if (Array.isArray(reviewsData)) return reviewsData;
    if (reviewsData && typeof reviewsData === 'object') {
      const candidate =
        (reviewsData as any).items ??
        (reviewsData as any).reviews ??
        (reviewsData as any).data;
      if (Array.isArray(candidate)) return candidate;
    }
    return [];
  }, [reviewsData]);

  const isFeedPending = isPostsPending || isReviewsPending;

  const postIds = useMemo(() => posts.map((post) => post.id), [posts]);
  const reviewIds = useMemo(() => reviews.map((review: any) => review.id), [reviews]);

  const { data: metaData } = useQuery({
    queryKey: ['home-meta', postIds, reviewIds],
    enabled: postIds.length > 0 || reviewIds.length > 0,
    queryFn: async () => {
      const [topics, reviewerProfiles] = await Promise.all([
        postIds.length > 0 ? loadDiscussionTopics(postIds) : Promise.resolve({} as Record<string, string>),
        reviewIds.length > 0 ? loadReviewerProfilesForReviews(reviews) : Promise.resolve({} as Record<string, any>),
      ]);
      return { topics, reviewerProfiles };
    },
  });

  const seminarStats = useMemo(() => {
    const stats: Record<string, { fresh: number; total: number }> = {};
    posts.forEach((post) => {
      if (!post.book_id) return;
      const entry = (stats[post.book_id] ??= { fresh: 0, total: 0 });
      entry.total += post.reply_count ?? 0;
      if (post.user_id !== currentUserId && ts(post.created_at) > lastSeen) entry.fresh += 1;
    });
    return stats;
  }, [posts, currentUserId, lastSeen]);

  const readingTreatises = useMemo<ReadingTreatise[]>(() => library
    .filter((entry) => entry.status === 'reading')
    .sort((a, b) => {
      const timeDiff = ts((b as any).updated_at) - ts((a as any).updated_at);
      if (timeDiff !== 0) return timeDiff;
      return (b.pages_read ?? 0) - (a.pages_read ?? 0);
    })
    .flatMap((entry) => {
      const book = books.find((candidate) => candidate.id === entry.book_id);
      if (!book) return [];
      const progress = book.page_count
        ? Math.min(100, Math.round((entry.pages_read / book.page_count) * 100))
        : 0;
      return [{
        id: book.id,
        title: book.title,
        author: book.author_name,
        pagesRead: entry.pages_read ?? 0,
        pageCount: book.page_count ?? null,
        progress,
        cover: (book as Book & { cover_url?: string | null }).cover_url ?? null,
        discussionPrompt: `Discuss ${book.title}`,
        discussionReplies: seminarStats[book.id]?.total ?? 0,
        seminarNew: seminarStats[book.id]?.fresh ?? 0,
      }];
    }), [library, books, seminarStats]);

  const [selectedTreatiseId, setSelectedTreatiseId] = useState<string | null>(null);
  const [isBookPickerOpen, setIsBookPickerOpen] = useState(false);
  const bookPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isBookPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (bookPickerRef.current && !bookPickerRef.current.contains(e.target as Node)) {
        setIsBookPickerOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsBookPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isBookPickerOpen]);

  const activeTreatise = useMemo(() => {
    if (readingTreatises.length === 0) return null;
    return readingTreatises.find((t) => t.id === selectedTreatiseId) ?? readingTreatises[0];
  }, [readingTreatises, selectedTreatiseId]);

  const activeTreatiseIndex = activeTreatise
    ? Math.max(0, readingTreatises.findIndex((t) => t.id === activeTreatise.id))
    : 0;

  // Show at most 4 books with the current book centered in the available window.
  // If current is the last book, show it at the bottom with the 3 books before it (4 total).
  // If current is near the start, show it near the top with the books after it (4 total).
  const visiblePathWindow = useMemo(() => {
    if (!activePath || activePath.steps.length === 0) {
      return { steps: [], hasBefore: false, hasAfter: false };
    }
    const steps = activePath.steps;
    const maxVisible = 4;
    const foundIndex = steps.findIndex((s) => s.status === 'current');
    const centerIndex = foundIndex !== -1 ? foundIndex : 0;

    // Place centerIndex as close to the middle of the 4-item window as possible (slot 1 or 2)
    let start = Math.max(0, centerIndex - 1);
    let end = Math.min(steps.length, start + maxVisible);

    // If we hit the end of the path (e.g. current is the last book), pull start back so 4 books still show
    if (end - start < maxVisible) {
      start = Math.max(0, end - maxVisible);
    }

    return {
      steps: steps.slice(start, end),
      hasBefore: start > 0,
      hasAfter: end < steps.length,
    };
  }, [activePath]);

  const { feedItems, isTrending } = useMemo(() => {
    const topics = metaData?.topics ?? {};
    const reviewerProfiles = metaData?.reviewerProfiles ?? {};
    const normalPosts = posts.filter((post) => !post.book_id);
    const base = (post: Post) => post.title || post.content;

    const personal: FeedItem[] = [];
    if (currentUserId) {
      normalPosts.forEach((post) => {
        if (post.user_id !== currentUserId) return;
        const latest = ts(post.created_at);
        personal.push({
          key: `d-${post.id}`,
          kind: 'discussion',
          id: post.id,
          tag: 'You asked',
          highlight: false,
          title: base(post),
          meta: `${topics[post.id] || 'Discussion'} · ${timeAgo(latest)}`,
          count: formatReplyCount(post.reply_count ?? 0),
          priority: 2,
          activityAt: latest,
        });
      });
    }

    if (personal.length) {
      personal.sort((a, b) => b.activityAt - a.activityAt);
      return { feedItems: personal.slice(0, 4), isTrending: false };
    }

    const trending: FeedItem[] = [...normalPosts]
      .sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0) || ts(b.created_at) - ts(a.created_at))
      .slice(0, 3)
      .map((post) => ({
        key: `d-${post.id}`,
        kind: 'discussion' as const,
        id: post.id,
        tag: topics[post.id] || 'Discussion',
        highlight: false,
        title: base(post),
        meta: timeAgo(ts(post.created_at)),
        count: formatReplyCount(post.reply_count ?? 0),
        priority: 0,
        activityAt: ts(post.created_at),
      }));

    const latestReview = [...reviews].sort((a: any, b: any) => ts(b.created_at) - ts(a.created_at))[0];
    if (latestReview) {
      const reviewer = reviewerProfiles[latestReview.user_id];
      const bookTitle = books.find((book) => book.id === latestReview.book_id)?.title;
      trending.push({
        key: `r-${latestReview.id}`,
        kind: 'review',
        id: latestReview.id,
        tag: `Review · ★ ${latestReview.rating}/5`,
        highlight: false,
        title: latestReview.title || (bookTitle ? `Review: ${bookTitle}` : latestReview.content),
        meta: `${reviewer?.name || 'Reader'} · ${timeAgo(ts(latestReview.created_at))}`,
        count: '',
        priority: 0,
        activityAt: ts(latestReview.created_at),
      });
    }

    return { feedItems: trending, isTrending: true };
  }, [posts, reviews, metaData, books, currentUserId]);

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

  const handleOpenBookDetail = (item: { id: string; title: string }) => {
    if (onSelectBook) {
      onSelectBook(item.id);
    } else {
      onNavigate('colloquium');
    }
  };

  // Reading Logger Modal State
  const [isLoggerModalOpen, setIsLoggerModalOpen] = useState(false);
  const [loggerBook, setLoggerBook] = useState('');
  const [loggerPagesRead, setLoggerPagesRead] = useState(12);

  // Write Notes Modal State
  const [activeNotesBook, setActiveNotesBook] = useState<{ id: string; title: string; location: string } | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  // Discussion Modal State
  const [activeDiscussionBook, setActiveDiscussionBook] = useState<{
    id: string;
    title: string;
    location: string;
    prompt: string;
    repliesCount: number;
  } | null>(null);

  const saveNoteMutation = useMutation({
    mutationFn: (values: { bookId: string; title: string; content: string }) => {
      if (!currentUserId) throw new Error('Not signed in');
      return createNote(currentUserId, values.bookId, values.title, values.content);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notes', currentUserId] });
      onShowToast?.(`Marginal note saved for ${activeNotesBook?.title ?? 'book'}`);
      onUpdateUser?.({ notesCount: user.notesCount + 1 });
      setNewNoteTitle('');
      setNewNoteText('');
      setActiveNotesBook(null);
    },
    onError: () => onShowToast?.('Could not save note'),
  });

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

  const handleSaveNote = () => {
    if (!activeNotesBook || !newNoteText.trim()) return;
    if (!currentUserId) {
      onShowToast?.('Sign in to save notes');
      return;
    }
    saveNoteMutation.mutate({ bookId: activeNotesBook.id, title: newNoteTitle, content: newNoteText });
  };

  const openFeedItem = (item: FeedItem) => {
    if (item.kind === 'review') {
      if (onNavigateToReview) onNavigateToReview(item.id);
      else onNavigate('reviews');
    } else if (onNavigateToDiscussion) onNavigateToDiscussion(item.id);
    else onNavigate('discussions');
  };

  const firstName = user.name?.split(' ')[0] ?? '';
  const hour = new Date().getHours();
  const greeting = isAmharic
    ? `ሰላም, ${firstName}`
    : `${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, ${firstName}`;

  const activeProgressLabel = activeTreatise
    ? activeTreatise.pagesRead > 0
      ? (activeTreatise.pageCount ? `Page ${activeTreatise.pagesRead} of ${activeTreatise.pageCount}` : `Page ${activeTreatise.pagesRead}`)
      : 'Not started'
    : '';
  const activeLocationSub = activeTreatise
    ? (activeTreatise.pagesRead > 0 ? `Page ${activeTreatise.pagesRead}` : 'In progress')
    : '';

  return (
    <div
      id="sanctuary-home-screen"
      className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-24 md:pb-14 transition-colors duration-200 selection:bg-theme-accent-light selection:text-theme-accent font-sans antialiased"
    >
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-10 flex-1 flex flex-col gap-9">
        {/* DESK GREETING HEADER (gold rule) */}
        <header id="archival-header" className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b-2 border-theme-highlight select-none">
          <div>
            <p className="text-[13px] font-sans font-semibold uppercase tracking-[0.12em] text-theme-muted mb-1">
              {isAmharic ? 'የመንፈስ ማረፊያ • መነሻ' : 'Reading Desk • Home'}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-theme-main leading-tight">
              {greeting}
            </h1>
          </div>
          <span className="text-base font-serif italic text-theme-muted">
            {isAmharic ? 'እምነት ማስተዋልን ይሻል (Faith seeking understanding)' : 'Faith seeking understanding'}
          </span>
        </header>

        {/* READING + PATH */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch">
          <section id="home-currently-reading" aria-label="Currently Reading" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 min-h-[26px]">
              <h2 className={SECTION_LABEL}>{isAmharic ? 'በማንበብ ላይ ያሉ' : 'CURRENTLY READING'}</h2>
              {readingTreatises.length > 1 && (
                <div ref={bookPickerRef} className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isBookPickerOpen}
                    onClick={() => setIsBookPickerOpen((prev) => !prev)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-sans font-medium bg-theme-subtle text-theme-main border border-theme hover:border-theme-strong transition-colors cursor-pointer ${FOCUS}`}
                  >
                    <span>
                      {activeTreatiseIndex + 1} of {readingTreatises.length}
                    </span>
                    <span className="material-symbols-outlined text-[15px] text-theme-muted" aria-hidden="true">
                      expand_more
                    </span>
                  </button>

                  {isBookPickerOpen && (
                    <div
                      role="listbox"
                      aria-label="Choose active book"
                      className="absolute right-0 mt-1.5 w-64 bg-theme-surface border border-theme-strong rounded-xl shadow-lg p-1.5 z-30 space-y-0.5"
                    >
                      {readingTreatises.map((t) => {
                        const isSelected = activeTreatise?.id === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedTreatiseId(t.id);
                              setIsBookPickerOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2 text-xs font-sans transition-colors cursor-pointer ${FOCUS} ${
                              isSelected
                                ? 'bg-theme-subtle text-theme-main font-semibold'
                                : 'text-theme-body hover:bg-theme-subtle/60 hover:text-theme-main'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate">{t.title}</p>
                              <p className="text-[11px] text-theme-muted truncate">{t.author} · {t.progress}%</p>
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px] text-theme-highlight flex-none" aria-hidden="true">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {currentUserId && isLibraryPending ? (
              <p className="py-8 text-center text-sm text-theme-muted">Loading your reading list...</p>
            ) : !activeTreatise ? (
              <div className="bg-theme-surface border border-theme rounded-2xl p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-theme-main">Start your first book</h3>
                  <p className="text-sm text-theme-body mt-1 leading-relaxed">Pick any book from the library. It will appear here with your progress, notes and discussions.</p>
                </div>
                <div>
                  <button type="button" onClick={() => onNavigate('library')} className={BTN_PRIMARY}>
                    <span>Browse library</span>
                    <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <article
                id={`reading-treatise-${activeTreatise.id}`}
                onClick={() => handleOpenBookDetail(activeTreatise)}
                className="bg-theme-surface border border-theme rounded-2xl p-5 flex gap-5 transition-colors hover:border-theme-strong cursor-pointer flex-1"
              >
                <BookCover book={{ title: activeTreatise.title, cover_url: activeTreatise.cover ?? null }} className="aspect-[3/4] w-24 sm:w-28 flex-none self-start" />
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold text-theme-main leading-snug truncate">
                      {activeTreatise.title}
                    </h3>
                    <p className="text-sm text-theme-muted font-sans mt-0.5 truncate">{activeTreatise.author}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline text-sm font-sans">
                      <span className="text-theme-body">{activeProgressLabel}</span>
                      <span className="font-semibold text-theme-main">{activeTreatise.progress}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={activeTreatise.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Reading progress for ${activeTreatise.title}`}
                      className="h-2 w-full bg-theme-subtle rounded-full overflow-hidden"
                    >
                      <div className="h-full bg-theme-highlight transition-all duration-300 rounded-full" style={{ width: `${activeTreatise.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLoggerBook(activeTreatise.id);
                        setIsLoggerModalOpen(true);
                      }}
                      className={BTN_PRIMARY}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">menu_book</span>
                      <span>Log reading</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNotesBook({ id: activeTreatise.id, title: activeTreatise.title, location: activeLocationSub });
                        setNewNoteTitle('');
                        setNewNoteText('');
                      }}
                      className={BTN_SECONDARY}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">edit_note</span>
                      <span>Write note</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDiscussionBook({
                          id: activeTreatise.id,
                          title: activeTreatise.title,
                          location: activeLocationSub,
                          prompt: activeTreatise.discussionPrompt,
                          repliesCount: activeTreatise.discussionReplies,
                        });
                      }}
                      className={BTN_SECONDARY}
                    >
                      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">forum</span>
                      <span>Discuss</span>
                      {activeTreatise.seminarNew > 0 && (
                        <span
                          aria-label={`${activeTreatise.seminarNew} new in this seminar`}
                          className="min-w-[18px] h-[18px] px-1 rounded-full bg-theme-primary text-theme-on-primary text-[11px] font-sans font-bold inline-flex items-center justify-center"
                        >
                          {activeTreatise.seminarNew > 99 ? '99+' : activeTreatise.seminarNew}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )}
          </section>

          {/* YOUR PATH (entire card is clickable to open Paths) */}
          <section aria-label="Your path" className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 min-h-[26px]">
              <h2 className={SECTION_LABEL}>{isAmharic ? 'መንገድዎ' : 'YOUR PATH'}</h2>
            </div>
            <div
              role="link"
              tabIndex={0}
              aria-label={activePath ? `Open full path: ${activePath.title}` : 'Browse reading paths'}
              onClick={() => onNavigate('paths' as ScreenId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate('paths' as ScreenId);
                }
              }}
              className={`bg-theme-subtle border border-theme rounded-2xl p-5 flex-1 flex flex-col justify-between gap-3 transition-colors hover:border-theme-strong cursor-pointer group ${FOCUS}`}
            >
              {activePath ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif text-lg sm:text-xl font-semibold text-theme-main group-hover:text-theme-accent transition-colors leading-snug truncate">
                        {activePath.title}
                      </h3>
                      <p className="text-xs text-theme-muted font-sans mt-0.5">
                        {activePath.steps.filter((s) => s.status === 'done').length} of {activePath.steps.length} books complete
                      </p>
                    </div>
                    <span
                      aria-hidden="true"
                      className="inline-flex items-center gap-0.5 text-xs font-sans font-medium text-theme-muted group-hover:text-theme-main transition-colors flex-none pt-1"
                    >
                      <span>Explore</span>
                      <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5">
                        arrow_forward
                      </span>
                    </span>
                  </div>

                  <ol className="relative flex flex-col gap-2 my-auto">
                    <span
                      aria-hidden="true"
                      className={`absolute left-[9px] w-px bg-theme-strong ${
                        visiblePathWindow.hasBefore ? '-top-1.5' : 'top-2.5'
                      } ${visiblePathWindow.hasAfter ? '-bottom-1.5' : 'bottom-2.5'}`}
                    />
                    {visiblePathWindow.steps.map((step) => (
                      <li key={step.id} className="relative flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-5 h-5 rounded-full flex-none flex items-center justify-center border ${
                            step.status === 'done'
                              ? 'bg-theme-highlight border-theme-highlight text-theme-on-primary'
                              : step.status === 'current'
                                ? 'bg-theme-surface border-2 border-theme-highlight'
                                : 'bg-theme-surface border-theme-strong'
                          }`}
                        >
                          {step.status === 'done' && (
                            <span className="material-symbols-outlined text-[13px] font-bold" aria-hidden="true">
                              check
                            </span>
                          )}
                        </span>
                        <span
                          className={`text-[13px] font-sans truncate ${
                            step.status === 'current' ? 'text-theme-main font-semibold' : 'text-theme-body'
                          }`}
                        >
                          {step.title}
                        </span>
                        {step.status === 'current' && (
                          <span className="text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full bg-theme-surface border border-theme text-theme-main flex-none ml-auto">
                            Up next
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <div className="flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-semibold text-theme-main group-hover:text-theme-accent transition-colors">
                      Pick a path
                    </h3>
                    <p className="text-sm text-theme-body mt-1 leading-relaxed">
                      A path orders books by difficulty and tells you what to read next.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-sans font-semibold text-theme-accent">
                    <span>Browse paths</span>
                    <span className="material-symbols-outlined text-[15px] transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                      arrow_forward
                    </span>
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* YOUR FEED */}
        <section id="journal-colloquium-feed" aria-label="Your Feed" className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className={SECTION_LABEL}>
                {isTrending ? (isAmharic ? 'በማህበረሰቡ ውስጥ ተወዳጅ' : 'TRENDING INSIGHTS') : (isAmharic ? 'የእርስዎ ምግብ' : 'YOUR FEED')}
              </h2>
              <p className="text-sm text-theme-muted mt-0.5">
                {isTrending ? 'Most active discussions and reviews right now' : 'Replies, mentions and threads you are part of'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('discussions')}
              className={`text-sm font-sans font-semibold text-theme-accent hover:underline cursor-pointer inline-flex items-center gap-1 min-h-[38px] ${FOCUS}`}
            >
              <span>{isAmharic ? 'ሁሉንም ውይይቶች እይ' : 'All discussions'}</span>
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {isFeedPending ? (
              <p className="py-6 text-center text-sm text-theme-muted">Loading your feed...</p>
            ) : feedItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-theme-muted">No discussions or reviews yet.</p>
            ) : feedItems.map((item) => (
              <article
                key={item.key}
                role="link"
                tabIndex={0}
                onClick={() => openFeedItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') openFeedItem(item);
                }}
                className={`bg-theme-surface border border-theme rounded-[14px] px-5 py-4 hover:border-theme-strong transition-colors cursor-pointer group flex items-center gap-3 ${FOCUS}`}
              >
                {item.highlight && (
                  <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full flex-none bg-theme-highlight" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-semibold text-lg sm:text-xl text-theme-main group-hover:text-theme-accent leading-snug transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-2.5 flex-wrap text-sm text-theme-muted font-sans">
                    <span
                      className={`inline-block text-[13px] font-semibold px-2.5 py-0.5 rounded-full ${
                        item.highlight ? 'bg-theme-primary text-theme-on-primary' : 'bg-theme-subtle text-theme-main border border-theme'
                      }`}
                    >
                      {item.tag}
                    </span>
                    <span>{item.meta}</span>
                  </div>
                </div>
                {item.count && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-theme-body font-sans whitespace-nowrap">
                    <span className="material-symbols-outlined text-[18px] text-theme-muted" aria-hidden="true">forum</span>
                    {item.count}
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* MODAL: LOG READING */}
      {isLoggerModalOpen && (
        <ModalShell
          as="form"
          onSubmit={handleSaveReadingLog}
          label="DAILY STUDY LOG"
          heading="Record Pages Read"
          onClose={() => setIsLoggerModalOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setIsLoggerModalOpen(false)} className={GHOST_BTN}>Cancel</button>
              <button type="submit" className={DARK_BTN}>Save progress</button>
            </>
          }
        >
          <div className="space-y-3 text-sm">
            <div>
              <label htmlFor="logger-book" className="block text-[13px] font-sans text-theme-muted mb-1">Select treatise</label>
              <select
                id="logger-book"
                value={loggerBook}
                onChange={(e) => setLoggerBook(e.target.value)}
                className="w-full min-h-[40px] bg-theme-app border border-theme-strong rounded-[10px] px-3 font-sans text-theme-main focus:outline-none focus:border-theme-highlight focus:ring-2 focus:ring-theme-highlight/40"
              >
                {readingTreatises.map((item) => (
                  <option key={item.id} value={item.id}>{item.title} ({item.author})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="logger-pages" className="block text-[13px] font-sans text-theme-muted mb-1">Pages read today</label>
              <div className="flex items-center gap-3">
                <input
                  id="logger-pages"
                  type="number"
                  min={1}
                  max={150}
                  value={loggerPagesRead}
                  onChange={(e) => setLoggerPagesRead(Number(e.target.value))}
                  className="w-24 min-h-[40px] bg-theme-app border border-theme-strong rounded-[10px] px-3 font-sans text-theme-main text-center focus:outline-none focus:border-theme-highlight focus:ring-2 focus:ring-theme-highlight/40"
                  required
                />
                <span className="text-sm text-theme-muted font-sans">pages read in contemplative silence</span>
              </div>
            </div>
          </div>
        </ModalShell>
      )}

      {/* MODAL: WRITE NOTES */}
      {activeNotesBook && (
        <ModalShell
          label="MARGINAL NOTE"
          heading={activeNotesBook.title}
          sub={activeNotesBook.location}
          onClose={() => setActiveNotesBook(null)}
          footer={
            <>
              <button type="button" onClick={() => setActiveNotesBook(null)} className={GHOST_BTN}>Cancel</button>
              <button type="button" onClick={handleSaveNote} disabled={!newNoteText.trim() || saveNoteMutation.isPending} className={DARK_BTN}>
                {saveNoteMutation.isPending ? 'Saving...' : 'Save note'}
              </button>
            </>
          }
        >
          <input
            type="text"
            aria-label="Note title"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Title (optional)"
            className="w-full min-h-[40px] bg-theme-app border border-theme-strong rounded-[10px] px-3 text-sm font-sans text-theme-main focus:outline-none focus:border-theme-highlight focus:ring-2 focus:ring-theme-highlight/40"
          />
          <textarea
            autoFocus
            aria-label="Note text"
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            rows={6}
            placeholder="Write your reflection or marginal note..."
            className="w-full bg-theme-app border border-theme-strong rounded-[10px] p-3 text-sm font-sans text-theme-main focus:outline-none focus:border-theme-highlight focus:ring-2 focus:ring-theme-highlight/40 resize-none"
          />
        </ModalShell>
      )}

      {/* MODAL: DISCUSSION */}
      {activeDiscussionBook && (
        <ModalShell
          label="COLLOQUIUM DISCUSSION"
          heading={activeDiscussionBook.title}
          sub={activeDiscussionBook.location}
          onClose={() => setActiveDiscussionBook(null)}
          footer={
            <>
              <button type="button" onClick={() => setActiveDiscussionBook(null)} className={GHOST_BTN}>Close</button>
              <button
                type="button"
                onClick={() => {
                  const targetId = activeDiscussionBook.id;
                  setActiveDiscussionBook(null);
                  if (onOpenSeminar) onOpenSeminar(targetId);
                  else if (onSelectBook) onSelectBook(targetId);
                  else onNavigate('colloquium');
                }}
                className={DARK_BTN}
              >
                Join seminar →
              </button>
            </>
          }
        >
          <div className="bg-theme-subtle p-4 rounded-xl border border-theme space-y-2">
            <span className="text-[13px] font-sans uppercase tracking-[0.12em] text-theme-muted font-semibold block">Active colloquium question</span>
            <p className="text-base font-serif text-theme-main leading-relaxed">{activeDiscussionBook.prompt}</p>
            <span className="text-sm text-theme-muted font-sans block">
              {activeDiscussionBook.repliesCount} scholarly responses in colloquium
            </span>
          </div>
        </ModalShell>
      )}
    </div>
  );
};