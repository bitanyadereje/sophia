import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, Review, ReviewLike, ScreenId, UserProfile } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { loadReviewerProfilesForReviews } from '../reviewerProfiles';
import { addReviewComment, loadReviewCommentsForReviews } from '../services/reviewComment.service';
import { loadReviewLikesForReviews, toggleReviewLike } from '../services/reviewInteraction.service';
import { loadReviews } from '../review.service';
import { useBookmarks } from '../../saved/useBookmarks';

interface ReviewerProfile {
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  title?: string | null;
}

export type ComposerTheme = 'obsidian' | 'parchment' | 'daylight';

export interface Marginalium {
  id: string;
  text?: string;
  quote?: string;
  citation?: string | null;
}

const TRADITION_TAGS = ['Patristic', 'Orthodox', 'Philosophy', 'Theology', 'Literature'];

interface ReviewDraft {
  id: string;
  bookId: string;
  bookSearch: string;
  bookTitle: string;
  bookAuthor: string;
  bookLanguage: string;
  pageCount: string;
  rating: number;
  headline: string;
  quote: string;
  quoteCitation: string;
  tags: string[];
  content: string;
  updatedAt: string;
}

interface ReviewsViewProps {
  reviews: Review[];
  books: Book[];
  currentUser?: UserProfile;
  authUserId: string | null;

  // Keyed by profile/user ID. Populate this from Supabase.
  reviewerProfiles?: Record<string, ReviewerProfile>;

  targetReviewId?: string | null;
  onClearTargetReview?: () => void;

  onAddReview: (input: {
    book_id?: string;
    bookTitle?: string;
    bookAuthor?: string;
    language?: string;
    page_count?: number | null;
    coverFile?: File | null;
    title?: string | null;
    content: string;
    rating: number;
    quote?: string | null;
    status?: Review['status'];
  }) => Promise<{ ok: boolean; error?: string }>;

  onUpdateReview?: (
    id: string,
    updated: Partial<Review>
  ) => Promise<{ ok: boolean; error?: string }>;

  onDeleteReview?: (
    id: string
  ) => Promise<{ ok: boolean; error?: string }>;

  onSelectBook?: (bookId: string) => void;
  onSelectReview?: (reviewId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;

  // Optional: composer theme switcher (Obsidian / Parchment / Daylight).
  // The swatches only render when onThemeChange is provided.
  theme?: ComposerTheme;
  onThemeChange?: (theme: ComposerTheme) => void;

  // Optional: passages the reader bookmarked while reading a volume.
  loadMarginalia?: (bookId: string) => Promise<Marginalium[]>;
}

interface LocalComment {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
}

const getReviewerName = (profile: ReviewerProfile | undefined): string => {
  return profile?.name?.trim() || profile?.username?.trim() || 'Reader';
};

const getRelativeDate = (
  value: string | null | undefined,
  isAmharic: boolean
): string => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffSeconds = Math.round((date.getTime() - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const locale = isAmharic ? 'am-ET' : 'en-ET';

  if (absSeconds < 60) {
    return isAmharic ? 'አሁን' : 'Just now';
  }

  if (absSeconds < 3600) {
    const minutes = Math.round(diffSeconds / 60);
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(minutes, 'minute');
  }

  if (absSeconds < 86400) {
    const hours = Math.round(diffSeconds / 3600);
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(hours, 'hour');
  }

  if (absSeconds < 7 * 86400) {
    const days = Math.round(diffSeconds / 86400);
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(days, 'day');
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getShortRelative = (
  value: string | null | undefined,
  isAmharic: boolean
): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  if (isAmharic) return getRelativeDate(value, true);

  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
  return getRelativeDate(value, false);
};

const createDraftId = () =>
  `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  reviews,
  books,
  currentUser,
  authUserId,
  reviewerProfiles = {},
  targetReviewId,
  onClearTargetReview,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  onSelectBook,
  onSelectReview,
  onNavigate,
  onShowToast,
  theme,
  onThemeChange,
  loadMarginalia,
}) => {
  const { isAmharic } = useLanguage();
  const queryClient = useQueryClient();
  const feedKey = ['reviews-feed'] as const;

  const [selectedTradition, setSelectedTradition] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Composer UI state
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [isMarginaliaOpen, setIsMarginaliaOpen] = useState(true);
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(true);
  const [showAllDrafts, setShowAllDrafts] = useState(false);
  const [isAddingNewBook, setIsAddingNewBook] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const headlineRef = useRef<HTMLTextAreaElement | null>(null);

  // Multi-session drafts state (persisted per user in localStorage)
  const draftsStorageKey = authUserId ? `sophia_review_drafts_${authUserId}` : null;
  const [drafts, setDrafts] = useState<ReviewDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [, setLastSavedAt] = useState<string | null>(null);

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const profiles = reviewerProfiles;
  const { isSaved, toggle: toggleSave } = useBookmarks(authUserId, 'review', onShowToast);

  const { data: feedData, isPending } = useQuery({
    queryKey: feedKey,
    queryFn: async () => {
      const loadedReviews = await loadReviews();
      const reviewIds = loadedReviews.map((review) => review.id);
      const [likes, comments, loadedProfiles] = await Promise.all([
        loadReviewLikesForReviews(reviewIds),
        loadReviewCommentsForReviews(reviewIds),
        loadReviewerProfilesForReviews(loadedReviews),
      ]);
      return { reviews: loadedReviews, likes, comments, profiles: loadedProfiles };
    },
  });

  const feedReviews = feedData?.reviews ?? reviews;
  const reviewLikes = feedData?.likes ?? [];
  const commentsByReview = (feedData?.comments ?? []).reduce<Record<string, LocalComment[]>>(
    (result, comment) => {
      const author = comment.author?.name?.trim() || comment.author?.username?.trim() || 'Reader';
      result[comment.review_id] = [
        ...(result[comment.review_id] || []),
        {
          id: comment.id,
          author,
          text: comment.content,
          timeAgo: getRelativeDate(comment.created_at, isAmharic),
        },
      ];
      return result;
    },
    {}
  );
  const loadedProfiles = feedData?.profiles as Record<string, ReviewerProfile> | undefined;
  const feedProfiles = { ...profiles, ...loadedProfiles };

  const toggleLikeMutation = useMutation({
    mutationFn: ({ reviewId, userId, wasLiked }: { reviewId: string; userId: string; wasLiked: boolean }) =>
      toggleReviewLike(reviewId, userId, wasLiked),
    onMutate: async ({ reviewId, userId, wasLiked }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData(feedKey);
      queryClient.setQueryData<any>(feedKey, (old) =>
        old
          ? {
              ...old,
              likes: wasLiked
                ? old.likes.filter(
                    (like: ReviewLike) => like.review_id !== reviewId || like.user_id !== userId
                  )
                : [
                    ...old.likes,
                    { review_id: reviewId, user_id: userId, created_at: new Date().toISOString() },
                  ],
            }
          : old
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(feedKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ reviewId, userId, content }: { reviewId: string; userId: string; content: string }) =>
      addReviewComment(reviewId, userId, content),
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  });

  // Form fields
  const [newBookId, setNewBookId] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookLanguage, setNewBookLanguage] = useState('en');
  const [newPageCount, setNewPageCount] = useState('');
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newQuote, setNewQuote] = useState('');
  const [newFullReview, setNewFullReview] = useState('');
  const [newHeadline, setNewHeadline] = useState('');
  const [newQuoteCitation, setNewQuoteCitation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: marginalia = [] } = useQuery({
    queryKey: ['book-marginalia', authUserId, newBookId],
    queryFn: () => (loadMarginalia ? loadMarginalia(newBookId) : Promise.resolve([] as Marginalium[])),
    enabled: Boolean(loadMarginalia && authUserId && newBookId && isWriteReviewOpen),
  });

  // Load drafts from localStorage when user signs in
  useEffect(() => {
    if (!draftsStorageKey) {
      setDrafts([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(draftsStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setDrafts(
            parsed.map((d: Partial<ReviewDraft>) => ({
              id: d.id || createDraftId(),
              bookId: d.bookId || '',
              bookSearch: d.bookSearch || '',
              bookTitle: d.bookTitle || '',
              bookAuthor: d.bookAuthor || '',
              bookLanguage: d.bookLanguage || 'en',
              pageCount: d.pageCount || '',
              rating: d.rating || 5,
              headline: d.headline || '',
              quote: d.quote || '',
              quoteCitation: d.quoteCitation || '',
              tags: Array.isArray(d.tags) ? d.tags : [],
              content: d.content || '',
              updatedAt: d.updatedAt || new Date().toISOString(),
            }))
          );
        }
      }
    } catch (err) {
      console.warn('Failed to parse saved review drafts:', err);
    }
  }, [draftsStorageKey]);

  const persistDrafts = (nextDrafts: ReviewDraft[]) => {
    setDrafts(nextDrafts);
    if (!draftsStorageKey) return;
    try {
      window.localStorage.setItem(draftsStorageKey, JSON.stringify(nextDrafts));
    } catch (err) {
      console.warn('Failed to persist review drafts:', err);
    }
  };

  // Debounced auto-save for new reviews
  useEffect(() => {
    if (!isWriteReviewOpen || editingReview || !authUserId || !draftsStorageKey) return;

    const hasMeaningfulContent = Boolean(
      newBookId ||
        bookSearch.trim() ||
        newBookTitle.trim() ||
        newBookAuthor.trim() ||
        newHeadline.trim() ||
        newQuote.trim() ||
        newFullReview.trim()
    );

    if (!hasMeaningfulContent) {
      setDraftSaveState('idle');
      return;
    }

    setDraftSaveState('saving');
    const timer = window.setTimeout(() => {
      const draftId = activeDraftId || createDraftId();
      if (!activeDraftId) setActiveDraftId(draftId);

      const nowIso = new Date().toISOString();
      const updatedDraft: ReviewDraft = {
        id: draftId,
        bookId: newBookId,
        bookSearch,
        bookTitle: newBookTitle,
        bookAuthor: newBookAuthor,
        bookLanguage: newBookLanguage,
        pageCount: newPageCount,
        rating: newRating,
        headline: newHeadline,
        quote: newQuote,
        quoteCitation: newQuoteCitation,
        tags: selectedTags,
        content: newFullReview,
        updatedAt: nowIso,
      };

      setDrafts((prev) => {
        const exists = prev.some((d) => d.id === draftId);
        const next = exists
          ? prev.map((d) => (d.id === draftId ? updatedDraft : d))
          : [updatedDraft, ...prev];
        try {
          window.localStorage.setItem(draftsStorageKey, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
        return next;
      });

      setLastSavedAt(nowIso);
      setDraftSaveState('saved');
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [
    isWriteReviewOpen,
    editingReview,
    authUserId,
    draftsStorageKey,
    activeDraftId,
    newBookId,
    bookSearch,
    newBookTitle,
    newBookAuthor,
    newBookLanguage,
    newPageCount,
    newRating,
    newHeadline,
    newQuote,
    newQuoteCitation,
    selectedTags,
    newFullReview,
  ]);

  useEffect(() => {
    if (!newCoverFile) {
      setCoverPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(newCoverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newCoverFile]);

  // Auto-expanding reflection body: no inner scrollbar
  useEffect(() => {
    [bodyTextareaRef.current, headlineRef.current].forEach((el) => {
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    });
  }, [newFullReview, newHeadline, editorMode, isWriteReviewOpen]);

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast(isAmharic ? 'እባክዎ ምስል ይምረጡ።' : 'Please choose an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onShowToast(isAmharic ? 'ምስሉ ከ5MB መብለጥ የለበትም።' : 'Image must be 5 MB or smaller.');
      return;
    }

    setNewCoverFile(file);
  };

  const selectedBookForForm = books.find((book) => book.id === newBookId);

  const visibleBooks = books.filter((book) => {
    const query = bookSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    return `${book.title} ${book.author_name}`.toLocaleLowerCase().includes(query);
  });

  const traditions = ['All', 'Patristic', 'Orthodox', 'Scholastic', 'Soteriology'];

  const isAuthor = (review: Review) => Boolean(authUserId && review.user_id === authUserId);

  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    if (!targetReviewId) return;

    setSelectedTradition('All');
    setSearchQuery('');
    setActiveCommentId(targetReviewId);

    const timer = window.setTimeout(() => {
      document
        .getElementById(`review-${targetReviewId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [targetReviewId]);

  const handleToggleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authUserId) {
      onShowToast(isAmharic ? 'ውደድ ለማስቀረብ መመሪያ ይግቡ' : 'Please sign in to like reviews.');
      return;
    }

    const wasLiked = reviewLikes.some((like) => like.review_id === id && like.user_id === authUserId);
    toggleLikeMutation.mutate({ reviewId: id, userId: authUserId, wasLiked });
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSave(id);
  };

  const handleToggleCommentDrawer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCommentId((prev) => (prev === id ? null : id));
  };

  const handleAddComment = async (reviewId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authUserId) {
      onShowToast(isAmharic ? 'እባክዎ ይግቡ።' : 'Please sign in to comment.');
      return;
    }

    const text = commentInputs[reviewId]?.trim();
    if (!text) return;

    try {
      await addCommentMutation.mutateAsync({ reviewId, userId: authUserId, content: text });
      setCommentInputs((prev) => ({ ...prev, [reviewId]: '' }));
      onShowToast(isAmharic ? 'አስተያየትዎ ተራክቧል' : 'Comment posted.');
    } catch (error) {
      console.error('Failed to add review comment:', error);
      onShowToast(error instanceof Error ? error.message : 'Could not post comment.');
    }
  };

  const handleCardClick = (review: Review) => {
    if (onSelectReview) {
      onSelectReview(review.id);
    } else if (review.book_id && onSelectBook) {
      onSelectBook(review.book_id);
    } else {
      onNavigate('colloquium');
    }
  };

  const resetForm = () => {
    setNewBookId('');
    setBookSearch('');
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookLanguage('en');
    setNewPageCount('');
    setNewCoverFile(null);
    setNewRating(5);
    setNewQuote('');
    setNewFullReview('');
    setNewHeadline('');
    setNewQuoteCitation('');
    setSelectedTags([]);
    setEditingReview(null);
    setActiveDraftId(null);
    setIsAddingNewBook(false);
    setEditorMode('write');
    setDraftSaveState('idle');
    setLastSavedAt(null);
  };

  const loadDraftIntoEditor = (draft: ReviewDraft) => {
    setEditingReview(null);
    setActiveDraftId(draft.id);
    setNewBookId(draft.bookId);
    setBookSearch(draft.bookSearch);
    setNewBookTitle(draft.bookTitle);
    setNewBookAuthor(draft.bookAuthor);
    setNewBookLanguage(draft.bookLanguage || 'en');
    setNewPageCount(draft.pageCount);
    setNewCoverFile(null);
    setNewRating(draft.rating || 5);
    setNewQuote(draft.quote);
    setNewFullReview(draft.content);
    setNewHeadline(draft.headline || '');
    setNewQuoteCitation(draft.quoteCitation || '');
    setSelectedTags(draft.tags || []);
    setIsAddingNewBook(Boolean(!draft.bookId && (draft.bookTitle || draft.bookAuthor)));
    setLastSavedAt(draft.updatedAt);
    setDraftSaveState('saved');
    setEditorMode('write');
    setIsWriteReviewOpen(true);
  };

  const handleDeleteDraft = (draftId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const next = drafts.filter((d) => d.id !== draftId);
    persistDrafts(next);
    if (activeDraftId === draftId) {
      resetForm();
    }
    onShowToast(isAmharic ? 'ረቂቁ ተሰርዟል' : 'Draft deleted.');
  };

  const handleOpenNewReview = () => {
    if (!authUserId) {
      onShowToast(isAmharic ? 'ዳሰሳ ለመጻፍ እባክዎ ይግቡ።' : 'Please sign in to write a review.');
      return;
    }

    resetForm();
    setIsWriteReviewOpen(true);
  };

  const handleOpenEditReview = (review: Review, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!isAuthor(review)) {
      onShowToast('You can only edit your own reviews.');
      return;
    }

    resetForm();
    setEditingReview(review);
    setNewBookId(review.book_id);
    setNewRating(review.rating);
    setNewQuote(review.quote || '');
    setNewHeadline(review.title || '');
    setNewFullReview(review.content);
    setIsWriteReviewOpen(true);
  };

  const handleDeleteReview = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const review = feedReviews.find((item) => item.id === id);

    if (review && !isAuthor(review)) {
      onShowToast('You can only delete your own reviews.');
      return;
    }

    if (!onDeleteReview) {
      onShowToast('Delete is not connected.');
      return;
    }

    const result = await onDeleteReview(id);

    if (!result.ok) {
      onShowToast(result.error || 'Could not delete review.');
      return;
    }

    await queryClient.invalidateQueries({ queryKey: feedKey });
    onShowToast(isAmharic ? 'ዳሰሳው ተሰርዟል' : 'Review deleted.');
  };

  const filteredReviews = feedReviews.filter((review) => {
    if (selectedTradition !== 'All') return false;

    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return true;

    const book = books.find((item) => item.id === review.book_id);
    const profile = feedProfiles[review.user_id];
    const reviewerName = getReviewerName(profile);

    return [
      review.title || '',
      book?.title || '',
      book?.author_name || '',
      reviewerName,
      profile?.username || '',
      review.quote || '',
      review.content || '',
    ].some((value) => value.toLocaleLowerCase().includes(query));
  });

  const handleSubmitReview = async (e?: React.FormEvent, requestedStatus?: Review['status']) => {
    e?.preventDefault();

    if (!authUserId) {
      onShowToast('Please sign in to publish a review.');
      return;
    }

    const selectedBook = books.find((book) => book.id === newBookId);
    const isNewBook = !editingReview && !selectedBook;
    const titleForNewBook = (newBookTitle || bookSearch).trim();

    if (editingReview && !newBookId.trim()) {
      onShowToast('Please choose a book.');
      return;
    }

    if (!editingReview && !selectedBook && (!titleForNewBook || !newBookAuthor.trim())) {
      onShowToast(
        isAmharic
          ? 'የመጽሐፉን ርዕስ እና ደራሲ ያስገቡ ወይም ያለውን መጽሐፍ ይምረጡ።'
          : 'Enter the book title and author, or select an existing book.'
      );
      return;
    }

    const pageCount = Number(newPageCount);

    if (isNewBook) {
      if (!newPageCount.trim() || !Number.isInteger(pageCount) || pageCount < 1) {
        onShowToast(isAmharic ? 'የገጾች ብዛት ያስገቡ።' : 'Please enter the number of pages.');
        return;
      }
    }

    if (!Number.isFinite(newRating) || newRating < 1 || newRating > 5) {
      onShowToast('Rating must be between 1 and 5.');
      return;
    }

    const content = newFullReview.trim();

    if (!content) {
      onShowToast(isAmharic ? 'እባክዎ ዝርዝር ዳሰሳ ይጻፉ።' : 'Please write a detailed review.');
      return;
    }

    if (isSubmitting) return;

    const values = {
      ...(selectedBook ? { book_id: selectedBook.id } : {}),
      ...(isNewBook
        ? {
            bookTitle: titleForNewBook,
            bookAuthor: newBookAuthor.trim(),
            language: newBookLanguage,
            page_count: pageCount,
            coverFile: newCoverFile,
          }
        : {}),
      rating: Math.round(newRating),
      quote: newQuote.trim()
        ? newQuoteCitation.trim()
          ? `${newQuote.trim()} — ${newQuoteCitation.trim()}`
          : newQuote.trim()
        : null,
      content,
      title: newHeadline.trim() || null,
      // Presentation metrics stay derived locally from editor text, never persisted.
      status: requestedStatus ?? editingReview?.status ?? 'published',
      // TODO: add a `tags` column to reviews, then pass `tags: selectedTags` here.
    };

    setIsSubmitting(true);
    try {
      if (editingReview) {
        if (!onUpdateReview) throw new Error('Review editing is not connected.');
        const result = await onUpdateReview(editingReview.id, values);
        if (!result.ok) throw new Error(result.error || 'Could not update review.');
        onShowToast(values.status === 'draft'
          ? (isAmharic ? 'ረቂቁ ተቀምጧል' : 'Draft saved.')
          : (isAmharic ? 'ዳሰሳው ተሻሽሏል' : 'Review updated.'));
      } else {
        const result = await onAddReview(values);
        if (!result.ok) throw new Error(result.error || 'Could not publish review.');
        if (activeDraftId) {
          persistDrafts(drafts.filter((d) => d.id !== activeDraftId));
        }
        onShowToast(values.status === 'draft'
          ? (isAmharic ? 'ረቂቁ ተቀምጧል' : 'Draft saved.')
          : (isAmharic ? 'ዳሰሳው ታትሟል' : 'Review published.'));
      }
      resetForm();
      setIsWriteReviewOpen(false);
      await queryClient.invalidateQueries({ queryKey: feedKey });
    } catch (error) {
      console.error('[book-debug] ReviewsView.handleSubmitReview error', error);
      onShowToast(error instanceof Error ? error.message : 'Could not publish review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeForm = () => {
    setIsWriteReviewOpen(false);
    resetForm();
  };

  const wordStats = useMemo(() => {
    const words = newFullReview
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const readMinutes = Math.max(1, Math.ceil(words / 225));
    return { words, readMinutes };
  }, [newFullReview]);

  const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) {
      setNewFullReview((prev) => `${prev}${prev ? '\n' : ''}${prefix}${placeholder}${suffix}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = newFullReview.slice(start, end) || placeholder;
    const updated =
      newFullReview.slice(0, start) + prefix + selected + suffix + newFullReview.slice(end);
    setNewFullReview(updated);
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    });
  };

  const ratingLabels: Record<number, string> = isAmharic
    ? { 1: 'ዝቅተኛ', 2: 'መካከለኛ', 3: 'ጥሩ', 4: 'በጣም ጥሩ', 5: 'ድንቅ መጽሐፍ' }
    : { 1: 'Not Recommended', 2: 'Mixed', 3: 'Thoughtful', 4: 'Recommended', 5: 'Essential Reading' };

  const renderInlineFormatting = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let tokenIndex = 0;

    for (const match of text.matchAll(pattern)) {
      const token = match[0];
      const start = match.index ?? 0;
      if (start > lastIndex) {
        parts.push(text.slice(lastIndex, start));
      }

      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={`b-${tokenIndex}`}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={`i-${tokenIndex}`}>{token.slice(1, -1)}</em>);
      } else {
        parts.push(token);
      }

      tokenIndex += 1;
      lastIndex = start + token.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderFormattedPreview = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return (
        <span className="italic text-theme-muted">
          {isAmharic ? 'ዝርዝር ዳሰሳዎ እዚህ ይታያል...' : 'Your detailed review will appear here...'}
        </span>
      );
    }

    const blocks = trimmed
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    return (
      <div className="space-y-3">
        {blocks.map((block, index) => {
          if (block.startsWith('## ')) {
            return (
              <h2 key={`h2-${index}`} className="font-serif text-xl font-bold text-theme-main">
                {renderInlineFormatting(block.slice(3))}
              </h2>
            );
          }

          if (block.split('\n').every((line) => /^-\s/.test(line))) {
            return (
              <ul key={`ul-${index}`} className="list-disc pl-5 space-y-1">
                {block.split('\n').map((line, lineIndex) => (
                  <li key={lineIndex}>{renderInlineFormatting(line.replace(/^-\s/, ''))}</li>
                ))}
              </ul>
            );
          }

          if (block.startsWith('### ')) {
            return (
              <h3 key={`h-${index}`} className="font-serif text-lg font-bold text-theme-main">
                {renderInlineFormatting(block.slice(4))}
              </h3>
            );
          }

          if (block.startsWith('>')) {
            const quoteText = block
              .split('\n')
              .map((line) => line.replace(/^>\s?/, ''))
              .join(' ')
              .trim();

            return (
              <blockquote
                key={`q-${index}`}
                className="font-serif text-base text-theme-main italic leading-relaxed pl-4 border-l-2 border-theme-accent"
              >
                {renderInlineFormatting(quoteText)}
              </blockquote>
            );
          }

          return (
            <p key={`p-${index}`} className="leading-relaxed whitespace-pre-wrap">
              {renderInlineFormatting(block)}
            </p>
          );
        })}
      </div>
    );
  };

  // =========================================================================
  // FULL-PAGE EDITORIAL REVIEW COMPOSER
  // =========================================================================
  if (isWriteReviewOpen) {
    const previewBookTitle =
      selectedBookForForm?.title ||
      (newBookTitle || bookSearch).trim() ||
      (isAmharic ? 'ያልተመረጠ መጽሐፍ' : 'Untitled Volume');
    const previewBookAuthor =
      selectedBookForForm?.author_name || newBookAuthor.trim() || '';
    const previewCover = selectedBookForForm?.cover_url || coverPreview || null;
    const activeRating = hoverRating ?? newRating;
    const activeBookTitle = selectedBookForForm?.title || (newBookTitle || bookSearch).trim();

    // Optional catalog metadata; shown only when the book record has it.
    const bookRecord = selectedBookForForm as unknown as Record<string, any> | undefined;
    const bookEra = bookRecord?.era ?? bookRecord?.century ?? bookRecord?.period;
    const bookTradition = bookRecord?.tradition ?? bookRecord?.category;
    const bookPages = bookRecord?.page_count ?? bookRecord?.pages;
    const bookMeta = [bookEra, bookTradition, bookPages ? `${bookPages} ${isAmharic ? 'ገጾች' : 'pages'}` : null]
      .filter(Boolean)
      .join(' · ');

    // UI hint only: handleSubmitReview still performs the real validation.
    const canPublish =
      newFullReview.trim().length > 0 &&
      (Boolean(selectedBookForForm) ||
        (Boolean((newBookTitle || bookSearch).trim()) &&
          Boolean(newBookAuthor.trim()) &&
          Number(newPageCount) >= 1));

    const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

    const toggleTag = (tag: string) =>
      setSelectedTags((prev) =>
        prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
      );

    // Both lists show 2 items until expanded
    const visibleDrafts = showAllDrafts ? drafts : drafts.slice(0, 2);
    const visibleNotes = isNotesExpanded ? marginalia : marginalia.slice(0, 2);
    const noteText = (item: Marginalium) => (item.text ?? item.quote ?? '').trim();

    // "Confessions, Book I, i.1"
    const noteCitation = (item: Marginalium) =>
      [selectedBookForForm?.title, item.citation].filter(Boolean).join(', ');

    const setNoteAsKeyQuote = (item: Marginalium) => {
      setNewQuote(noteText(item).slice(0, 400));
      setNewQuoteCitation(noteCitation(item));
      onShowToast(isAmharic ? 'ዋና ጥቅስ ተዘጋጅቷል' : 'Key quote set.');
    };

    const insertNoteInText = (item: Marginalium) => {
      const citation = noteCitation(item);
      setNewFullReview(
        (prev) => `${prev}${prev.trim() ? '\n\n' : ''}> “${noteText(item)}”${citation ? ` — *${citation}*` : ''}\n\n`
      );
      setEditorMode('write');
    };

    const themeOptions: { id: ComposerTheme; label: string; icon: string }[] = [
      { id: 'obsidian', label: 'Obsidian', icon: 'dark_mode' },
      { id: 'parchment', label: 'Parchment', icon: 'history_edu' },
      { id: 'daylight', label: 'Daylight', icon: 'light_mode' },
    ];

    const metricsStatus =
      draftSaveState === 'saving' ? (
        <span className="inline-flex items-center gap-1.5 text-theme-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
          {isAmharic ? 'በማስቀመጥ ላይ…' : 'Saving…'}
        </span>
      ) : draftSaveState === 'saved' ? (
        <span className="inline-flex items-center gap-1 text-emerald-500">
          <span className="material-symbols-outlined text-[15px]">cloud_done</span>
          {isAmharic ? 'በራስ-ሰር ተቀምጧል' : 'Auto-saved'}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-theme-muted">
          <span className="material-symbols-outlined text-[15px]">cloud_queue</span>
          {isAmharic ? 'ራስ-ሰር ማስቀመጥ በርቷል' : 'Auto-save on'}
        </span>
      );

    const cardClass = 'bg-theme-surface border border-theme rounded-2xl shadow-xs';
    const sectionLabelClass = 'text-xs font-semibold uppercase tracking-wider';

    return (
      <div className="min-h-screen bg-theme-app text-theme-body pt-16 pb-20 transition-colors duration-200">
        {/* STICKY TOP BAR */}
        <div className="sticky top-16 z-30 bg-theme-app/95 backdrop-blur border-b border-theme">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={closeForm}
              aria-label={isAmharic ? 'ወደ ዳሰሳዎች ተመለስ' : 'Back to reviews'}
              className="flex items-center gap-1.5 text-sm text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span>{isAmharic ? 'ዳሰሳዎች' : 'Reviews'}</span>
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              {onThemeChange && (
                <div
                  role="radiogroup"
                  aria-label={isAmharic ? 'ገጽታ' : 'Theme'}
                  className="hidden sm:flex items-center gap-0.5 p-0.5 rounded-lg border border-theme bg-theme-surface"
                >
                  {themeOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={theme === option.id}
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => onThemeChange(option.id)}
                      className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                        theme === option.id
                          ? 'bg-theme-subtle text-theme-accent'
                          : 'text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                    </button>
                  ))}
                </div>
              )}

              {!editingReview && (
                <button
                  type="button"
                  onClick={() => void handleSubmitReview(undefined, 'draft')}
                  disabled={isSubmitting || !canPublish}
                  aria-label="Save draft"
                  className="hidden sm:flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-theme text-theme-main hover:bg-theme-subtle disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{isAmharic ? 'ረቂቅ አስቀምጥ' : 'Save Draft'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleSubmitReview(undefined, 'published')}
                disabled={isSubmitting || !canPublish}
                aria-label={editingReview ? 'Save changes' : 'Publish review'}
                title={
                  !canPublish
                    ? isAmharic
                      ? 'መጽሐፍ ይምረጡ እና ዳሰሳ ይጻፉ'
                      : 'Choose a volume and write your reflection first'
                    : undefined
                }
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-theme-accent text-black/90 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span className="hidden sm:inline">
                  {isSubmitting
                    ? isAmharic ? 'በማተም ላይ...' : 'Publishing...'
                    : editingReview
                      ? isAmharic ? 'ለውጦችን አስቀምጥ' : 'Save Changes'
                      : isAmharic ? 'ዳሰሳ አትም' : 'Publish Review'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
          {/* ===== PRIMARY WRITING CANVAS ===== */}
          <form
            onSubmit={handleSubmitReview}
            className="w-full min-w-0 lg:flex-1 flex flex-col gap-7"
          >
            {/* Section label + Write / Preview toggle */}
            <div className="flex items-center justify-between gap-4 -mb-2">
              <span className={`${sectionLabelClass} text-theme-accent flex items-center gap-2`}>
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                {editingReview
                  ? isAmharic
                    ? 'ዳሰሳ አስተካክል'
                    : 'Edit Reflection'
                  : isAmharic
                    ? 'መጽሐፍ እና ዳሰሳ'
                    : 'Volume & Reflection'}
              </span>

              <div
                role="tablist"
                className="flex items-center p-0.5 rounded-lg border border-theme bg-theme-surface"
              >
                {(
                  [
                    { mode: 'write', icon: 'edit', label: isAmharic ? 'ጻፍ' : 'Write' },
                    { mode: 'preview', icon: 'visibility', label: isAmharic ? 'ቅድመ-እይታ' : 'Preview' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.mode}
                    type="button"
                    role="tab"
                    aria-selected={editorMode === tab.mode}
                    onClick={() => setEditorMode(tab.mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      editorMode === tab.mode
                        ? 'bg-theme-subtle text-theme-main'
                        : 'text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {editorMode === 'write' ? (
              <>
                {/* SUBJECT VOLUME + RATING */}
                <div className={`${cardClass} p-6`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className={`${sectionLabelClass} text-theme-muted`}>
                      {isAmharic ? 'መጽሐፍ ምረጥ *' : 'Subject Volume *'}
                    </h3>

                    {!editingReview && (
                      <div className="flex items-center gap-3">
                        {selectedBookForForm && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewBookId('');
                              setBookSearch('');
                            }}
                            className="text-xs font-semibold text-theme-accent hover:underline cursor-pointer"
                          >
                            {isAmharic ? 'መጽሐፍ ቀይር' : 'Change book'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedBookForForm) {
                              setNewBookId('');
                              setBookSearch('');
                              setNewBookTitle('');
                              setIsAddingNewBook(true);
                            } else {
                              setIsAddingNewBook((prev) => !prev);
                            }
                          }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-theme text-theme-main hover:border-theme-accent/60 hover:bg-theme-subtle transition-colors cursor-pointer"
                        >
                          {isAddingNewBook && !selectedBookForForm
                            ? isAmharic
                              ? 'ካታሎግ ፈልግ'
                              : 'Search catalog'
                            : isAmharic
                              ? '+ አዲስ መጽሐፍ ጨምር'
                              : '+ Add Unlisted Book'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {selectedBookForForm ? (
                      <div className="rounded-xl border border-theme bg-theme-subtle/60 p-4 flex gap-4 items-center">
                        {selectedBookForForm.cover_url ? (
                          <img
                            src={selectedBookForForm.cover_url}
                            alt={`Cover of ${selectedBookForForm.title}`}
                            className="h-[60px] w-11 rounded object-cover flex-shrink-0 border border-theme"
                          />
                        ) : (
                          <div className="h-[60px] w-11 rounded-md border border-theme-accent/50 flex items-center justify-center flex-shrink-0 text-theme-accent">
                            <span className="material-symbols-outlined text-[22px]">menu_book</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-serif text-[22px] font-bold text-theme-main leading-tight">
                            {selectedBookForForm.title}
                          </p>
                          <p className="text-sm text-theme-muted mt-0.5">
                            {isAmharic ? 'ደራሲ፦ ' : 'By '}
                            {selectedBookForForm.author_name}
                          </p>
                          {bookMeta && <p className="text-xs text-theme-accent mt-1">{bookMeta}</p>}
                        </div>
                      </div>
                    ) : (
                      <>
                  {!isAddingNewBook && (
                    <div className="space-y-2">
                      <input
                        type="search"
                        value={bookSearch}
                        onChange={(e) => {
                          setNewBookId('');
                          setBookSearch(e.target.value);
                          setNewBookTitle(e.target.value);
                        }}
                        placeholder={
                          isAmharic
                            ? 'በመጽሐፍ ርዕስ ወይም ደራሲ ፈልግ...'
                            : 'Search library by title or author...'
                        }
                        disabled={Boolean(editingReview)}
                        className="w-full bg-theme-subtle border border-theme rounded-xl px-3.5 py-2.5 text-sm text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent"
                      />

                      {bookSearch.trim() && (
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-theme bg-theme-app divide-y divide-theme/50">
                          {visibleBooks.slice(0, 8).map((bookItem) => (
                            <button
                              key={bookItem.id}
                              type="button"
                              onClick={() => {
                                setNewBookId(bookItem.id);
                                setBookSearch(bookItem.title);
                                setNewBookTitle('');
                                setNewBookAuthor('');
                                setIsAddingNewBook(false);
                              }}
                              className="block w-full px-3.5 py-2.5 text-left text-xs hover:bg-theme-subtle transition-colors cursor-pointer"
                            >
                              <span className="block font-semibold text-theme-main">
                                {bookItem.title}
                              </span>
                              <span className="text-theme-muted">{bookItem.author_name}</span>
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setIsAddingNewBook(true)}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-theme-accent hover:bg-theme-subtle flex items-center gap-1.5 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">add_circle</span>
                            {isAmharic
                              ? `“${bookSearch.trim()}” እንደ አዲስ መጽሐፍ ጨምር`
                              : `Add “${bookSearch.trim()}” as a new volume`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!editingReview && (isAddingNewBook || (bookSearch.trim() && visibleBooks.length === 0)) && (
                    <div className="space-y-3 rounded-xl border border-theme bg-theme-subtle/40 p-3.5">
                      <p className="text-xs font-semibold text-theme-main">
                        {isAmharic ? 'አዲስ የመጽሐፍ ዝርዝር' : 'New Volume Details'}
                      </p>

                      <label className="block text-xs text-theme-muted">
                        {isAmharic ? 'የመጽሐፍ ርዕስ *' : 'Book title *'}
                        <input
                          required
                          value={newBookTitle || bookSearch}
                          onChange={(e) => {
                            setNewBookTitle(e.target.value);
                            setBookSearch(e.target.value);
                          }}
                          className="mt-1 w-full bg-theme-surface border border-theme rounded-lg p-2 text-sm text-theme-main focus:outline-none focus:border-theme-accent"
                        />
                      </label>

                      <label className="block text-xs text-theme-muted">
                        {isAmharic ? 'ደራሲ *' : 'Author *'}
                        <input
                          required
                          value={newBookAuthor}
                          onChange={(e) => setNewBookAuthor(e.target.value)}
                          className="mt-1 w-full bg-theme-surface border border-theme rounded-lg p-2 text-sm text-theme-main focus:outline-none focus:border-theme-accent"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        <label className="block text-xs text-theme-muted">
                          {isAmharic ? 'ቋንቋ' : 'Language'}
                          <select
                            value={newBookLanguage}
                            onChange={(e) => setNewBookLanguage(e.target.value)}
                            className="mt-1 w-full bg-theme-surface border border-theme rounded-lg p-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                          >
                            <option value="en">English</option>
                            <option value="am">Amharic</option>
                            <option value="gez">Geez</option>
                            <option value="other">Other</option>
                          </select>
                        </label>

                        <label className="block text-xs text-theme-muted">
                          {isAmharic ? 'ገጾች *' : 'Pages *'}
                          <input
                            type="number"
                            min={1}
                            step={1}
                            required
                            inputMode="numeric"
                            value={newPageCount}
                            onChange={(e) => setNewPageCount(e.target.value)}
                            placeholder="320"
                            className="mt-1 w-full bg-theme-surface border border-theme rounded-lg p-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                          />
                        </label>
                      </div>

                      <div className="text-xs text-theme-muted">
                        <span className="block">
                          {isAmharic ? 'የሽፋን ፎቶ (አማራጭ)' : 'Cover photo (optional)'}
                        </span>

                        {coverPreview ? (
                          <div className="mt-2 flex items-end gap-3">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="h-24 w-auto rounded object-cover border border-theme"
                            />
                            <button
                              type="button"
                              onClick={() => setNewCoverFile(null)}
                              className="text-theme-accent hover:underline"
                            >
                              {isAmharic ? 'አስወግድ' : 'Remove'}
                            </button>
                          </div>
                        ) : (
                          <label className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-theme bg-theme-surface p-2.5 hover:border-theme-accent">
                            <span className="material-symbols-outlined text-[18px]">
                              add_photo_alternate
                            </span>
                            {isAmharic ? 'ፎቶ ይስቀሉ' : 'Upload cover'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverFileChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <p className="text-[11px] text-theme-muted leading-snug">
                        {isAmharic
                          ? 'መጽሐፉ ለማረጋገጫ በካታሎጉ ውስጥ ይጨመራል።'
                          : 'Submitted to the catalog for verification upon publishing.'}
                      </p>
                    </div>
                  )}
                      </>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mt-6 pt-5 border-t border-theme/40">
                    <h3 className={`${sectionLabelClass} text-theme-muted mb-3`}>
                      {isAmharic ? 'የእርስዎ ደረጃ' : 'Your Rating'}
                    </h3>

                    <div
                      className="flex flex-wrap items-center gap-x-4 gap-y-2"
                      onMouseLeave={() => setHoverRating(null)}
                    >
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setNewRating(star)}
                            aria-label={`Rate ${star} out of 5`}
                            className="p-1 rounded-lg transition-transform active:scale-95 cursor-pointer"
                          >
                            <span
                              className="material-symbols-outlined text-[28px] text-theme-gold"
                              style={{
                                fontVariationSettings: star <= activeRating ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          </button>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-theme-accent">
                        {activeRating}.0 — {ratingLabels[activeRating]}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {TRADITION_TAGS.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            aria-pressed={active}
                            className={`text-xs px-3 py-1 rounded-full border transition-colors cursor-pointer ${
                              active
                                ? 'bg-theme-accent/15 text-theme-accent border-theme-accent/50 font-semibold'
                                : 'bg-theme-subtle/60 border-theme text-theme-muted hover:text-theme-main hover:border-theme-accent/40'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* HEADLINE */}
                <textarea
                  ref={headlineRef}
                  rows={1}
                  value={newHeadline}
                  onChange={(e) => setNewHeadline(e.target.value.replace(/\n/g, ' '))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  maxLength={120}
                  aria-label={isAmharic ? 'የዳሰሳ ርዕስ (አማራጭ)' : 'Reflection headline (optional)'}
                  placeholder={isAmharic ? 'የዳሰሳ ርዕስ (አማራጭ)' : 'Give your reflection a headline (optional)'}
                  className="block w-full resize-none overflow-hidden bg-transparent font-serif text-3xl font-bold leading-tight text-theme-main placeholder:text-theme-muted focus:outline-none"
                />

                {/* KEY QUOTE */}
                <div className="border-l-2 border-theme-accent bg-theme-subtle/40 rounded-r-xl px-5 py-4 space-y-2">
                  <textarea
                    id="review-quote-input"
                    rows={2}
                    maxLength={400}
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    aria-label={isAmharic ? 'ዋና ሐሳብ ወይም ጥቅስ (አማራጭ)' : 'Key takeaway or quote (optional)'}
                    placeholder={
                      isAmharic
                        ? 'ከመጽሐፉ የወደዱትን ጥቅስ ወይም ዋና ጭብጥ እዚህ ያስፍሩ...'
                        : 'Highlight a memorable passage, citation, or central thesis from the book...'
                    }
                    className="w-full bg-transparent font-serif italic text-lg text-theme-main placeholder:text-theme-muted/60 focus:outline-none resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={newQuoteCitation}
                      onChange={(e) => setNewQuoteCitation(e.target.value)}
                      maxLength={120}
                      aria-label={isAmharic ? 'ማጣቀሻ' : 'Citation or page reference'}
                      placeholder={
                        isAmharic
                          ? 'ማጣቀሻ ወይም ገጽ (ለምሳሌ፦ መጽሐፍ 11፣ ገጽ 33)'
                          : 'Citation or page reference (e.g. Book XI, xxvi.33)'
                      }
                      className="flex-1 min-w-0 bg-transparent text-xs text-theme-muted placeholder:text-theme-muted/50 focus:outline-none"
                    />
                    <span className="text-[11px] text-theme-muted flex-shrink-0">
                      {newQuote.length} / 400
                    </span>
                  </div>
                </div>

                {/* FORMATTING BAR + BODY */}
                <div>
                  <label htmlFor="review-body-input" className="sr-only">
                    {isAmharic ? 'ዝርዝር ዳሰሳ እና ነጸብራቅ' : 'Detailed reflection'}
                  </label>

                  <div className="sticky top-[7.5rem] z-20 flex items-center justify-between gap-3 rounded-xl border border-theme bg-theme-surface/95 backdrop-blur px-3 py-2">
                    <div className="flex items-center gap-1">
                      {[
                        { icon: 'format_bold', title: 'Bold', run: () => insertFormatting('**', '**', 'bold text') },
                        { icon: 'format_italic', title: 'Italic', run: () => insertFormatting('*', '*', 'italic text') },
                        { icon: 'format_h2', title: 'Section heading', run: () => insertFormatting('\n\n## ', '\n', 'Section heading') },
                        { icon: 'format_quote', title: 'Blockquote', run: () => insertFormatting('\n> ', '', 'Quoted passage...') },
                        { icon: 'format_list_bulleted', title: 'Bullet list', run: () => insertFormatting('\n- ', '', 'List item') },
                      ].map((tool) => (
                        <button
                          key={tool.icon}
                          type="button"
                          onClick={tool.run}
                          title={tool.title}
                          aria-label={tool.title}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">{tool.icon}</span>
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-theme-muted whitespace-nowrap pr-1">
                      {wordStats.words} {isAmharic ? 'ቃላት' : wordStats.words === 1 ? 'word' : 'words'} · ~
                      {wordStats.readMinutes} {isAmharic ? 'ደቂቃ ንባብ' : 'min read'}
                    </span>
                  </div>

                  <textarea
                    id="review-body-input"
                    ref={bodyTextareaRef}
                    rows={12}
                    required
                    value={newFullReview}
                    onChange={(e) => setNewFullReview(e.target.value)}
                    placeholder={
                      isAmharic
                        ? 'ስለ መጽሐፉ ታሪካዊ ዳራ፣ ሥነ-መለኮታዊ ወይም ፍልስፍናዊ ጥልቀት፣ እና በእርስዎ ላይ ስላሳደረው ተጽዕኖ በሰፊው ይጻፉ...'
                        : 'Take your time. Explore the author’s arguments, historical context, theological or philosophical depth, and how this work spoke to you...'
                    }
                    className="mt-4 block w-full min-h-[380px] overflow-hidden resize-none bg-theme-surface border border-theme rounded-2xl px-5 py-4 text-[17px] leading-[1.9] text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent transition-colors"
                  />
                </div>
              </>
            ) : (
              /* LIVE FEED CARD PREVIEW */
              <div className={`${cardClass} p-6 sm:p-8 space-y-5`}>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-theme-accent border-b border-theme pb-3">
                  {isAmharic ? 'የማህበረሰብ ምግብ ቅድመ-እይታ' : 'Community Feed Preview'}
                </span>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-theme-subtle flex items-center justify-center font-semibold text-theme-main">
                    {(currentUser?.name || 'R').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-theme-main">
                      {currentUser?.name || (isAmharic ? 'አንባቢ' : 'Reader')}
                    </p>
                    <p className="text-xs text-theme-muted">{isAmharic ? 'አሁን' : 'Just now'}</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  {previewCover ? (
                    <img
                      src={previewCover}
                      alt={`Cover of ${previewBookTitle}`}
                      className="h-28 w-20 rounded object-cover flex-shrink-0 border border-theme"
                    />
                  ) : (
                    <div className="h-28 w-20 rounded bg-theme-subtle border border-theme flex items-center justify-center flex-shrink-0 text-theme-muted">
                      <span className="material-symbols-outlined text-[24px]">menu_book</span>
                    </div>
                  )}

                  <div className="space-y-1.5 min-w-0">
                    <h2 className="font-serif text-xl font-bold text-theme-main">{previewBookTitle}</h2>
                    {previewBookAuthor && (
                      <p className="font-serif text-sm text-theme-muted">
                        {isAmharic ? 'ደራሲ፦ ' : 'By '}
                        {previewBookAuthor}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 pt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-[16px] text-theme-gold"
                          style={{ fontVariationSettings: i < newRating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                      <span className="text-xs font-semibold text-theme-main ml-1">
                        {newRating.toFixed(1)} / 5
                      </span>
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedTags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] uppercase tracking-wider text-theme-muted bg-theme-subtle border border-theme/60 px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {newHeadline.trim() && (
                  <h3 className="font-serif text-2xl font-bold text-theme-main">{newHeadline.trim()}</h3>
                )}

                {newQuote.trim() && (
                  <blockquote className="font-serif text-base text-theme-main italic leading-relaxed pl-4 border-l-2 border-theme-accent">
                    “{newQuote.trim()}”
                    {newQuoteCitation.trim() && (
                      <footer className="mt-1 text-xs not-italic text-theme-muted">
                        {newQuoteCitation.trim()}
                      </footer>
                    )}
                  </blockquote>
                )}

                <div className="text-[15px] text-theme-body leading-relaxed">
                  {renderFormattedPreview(newFullReview)}
                </div>
              </div>
            )}
          </form>

          {/* ===== COMPANION SIDEBAR ===== */}
          {/* No sticky / max-height / overflow here, so nothing gets clipped. */}
          <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-5">
            {/* 1. Saved drafts */}
            {!editingReview && (
              <section className={`${cardClass} p-4`}>
                <div className={`flex items-center justify-between gap-2 ${isDraftsOpen ? 'mb-3' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setIsDraftsOpen((prev) => !prev)}
                    aria-expanded={isDraftsOpen}
                    className="flex items-center gap-2 min-w-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-theme-accent">folder_open</span>
                    <h3 className={`${sectionLabelClass} text-theme-main truncate`}>
                      {isAmharic ? `የተቀመጡ ረቂቆች (${drafts.length})` : `Saved Drafts (${drafts.length})`}
                    </h3>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs font-semibold text-theme-accent hover:underline cursor-pointer whitespace-nowrap"
                    >
                      {isAmharic ? '+ አዲስ ረቂቅ' : '+ New Draft'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDraftsOpen((prev) => !prev)}
                      aria-label={isDraftsOpen ? 'Collapse drafts' : 'Expand drafts'}
                      className="text-theme-muted hover:text-theme-main cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isDraftsOpen ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                  </div>
                </div>

                {isDraftsOpen && (drafts.length === 0 ? (
                  <p className="text-xs text-theme-muted leading-relaxed">
                    {isAmharic
                      ? 'መጻፍ ሲጀምሩ ረቂቆችዎ እዚህ ይታያሉ።'
                      : 'Your drafts appear here as you write.'}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {visibleDrafts.map((draft) => {
                      const matchedBook = books.find((b) => b.id === draft.bookId);
                      const title =
                        matchedBook?.title ||
                        draft.bookTitle ||
                        draft.bookSearch ||
                        (isAmharic ? 'ርዕስ ያልተሰጠው ረቂቅ' : 'Untitled draft');
                      const snippet = (draft.headline || draft.content || '').trim();
                      const isCurrent = draft.id === activeDraftId;

                      return (
                        <li key={draft.id} className="relative">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => loadDraftIntoEditor(draft)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                loadDraftIntoEditor(draft);
                              }
                            }}
                            className={`rounded-xl border px-3.5 py-3 transition-colors cursor-pointer ${
                              isCurrent
                                ? 'border-theme-accent bg-theme-subtle/50'
                                : 'border-theme bg-theme-subtle/30 hover:border-theme-accent/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 pr-6">
                              <p className="font-serif text-sm font-bold text-theme-main truncate">{title}</p>
                              {isCurrent && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/15 px-1.5 py-0.5 rounded flex-shrink-0">
                                  {isAmharic ? 'ንቁ' : 'Active'}
                                </span>
                              )}
                            </div>
                            {snippet && (
                              <p className="text-xs text-theme-muted truncate mt-1">{snippet}</p>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-theme-muted mt-2.5 pt-2 border-t border-theme/60">
                              <span>
                                {countWords(draft.content)} {isAmharic ? 'ቃላት' : countWords(draft.content) === 1 ? 'word' : 'words'}
                              </span>
                              <span>{getShortRelative(draft.updatedAt, isAmharic)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                            title={isAmharic ? 'ረቂቅ ሰርዝ' : 'Delete draft'}
                            aria-label={isAmharic ? 'ረቂቅ ሰርዝ' : 'Delete draft'}
                            className="absolute top-2.5 right-2.5 p-0.5 rounded text-theme-muted hover:text-red-500 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ))}

                {isDraftsOpen && drafts.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setShowAllDrafts((prev) => !prev)}
                    className="w-full text-xs font-semibold text-theme-accent hover:underline cursor-pointer pt-3"
                  >
                    {showAllDrafts
                      ? isAmharic
                        ? 'ያነሰ አሳይ'
                        : 'Show fewer'
                      : isAmharic
                        ? `ሁሉንም ${drafts.length} ረቂቆች አሳይ`
                        : `Show all ${drafts.length} drafts`}
                  </button>
                )}
              </section>
            )}

            {/* 2. Saved marginalia (notes on the selected volume) */}
            <section className={`${cardClass} overflow-hidden`}>
              <button
                type="button"
                onClick={() => setIsMarginaliaOpen((prev) => !prev)}
                aria-expanded={isMarginaliaOpen}
                className="w-full flex items-center justify-between gap-2 px-4 py-3.5 cursor-pointer"
              >
                <h3 className={`${sectionLabelClass} text-theme-main flex items-center gap-2`}>
                  <span className="material-symbols-outlined text-[18px] text-theme-accent">bookmark</span>
                  {isAmharic
                    ? `የተቀመጡ ማስታወሻዎች (${marginalia.length})`
                    : `Saved Marginalia (${marginalia.length})`}
                </h3>
                <span className="material-symbols-outlined text-[18px] text-theme-muted">
                  {isMarginaliaOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {isMarginaliaOpen && (
                <div className="px-4 pb-4 pt-3 border-t border-theme/70 space-y-3">
                  {!selectedBookForForm ? (
                    <p className="text-xs text-theme-muted leading-relaxed rounded-xl border border-dashed border-theme px-3 py-3">
                      {isAmharic
                        ? 'የተቀመጡ ማስታወሻዎችዎን ለማየት መጽሐፍ ከካታሎጉ ይምረጡ።'
                        : 'Pick a volume from the catalog to see the passages you saved while reading it.'}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-theme-muted leading-relaxed">
                        {isAmharic ? (
                          <>
                            በ<em>{selectedBookForForm.title}</em> ላይ ካሉ ማስታወሻዎችዎ የተቀመጡ ምንባቦችን ይውሰዱ፦
                          </>
                        ) : (
                          <>
                            Pull saved passages from your notes on <em>{selectedBookForForm.title}</em>:
                          </>
                        )}
                      </p>

                      {marginalia.length === 0 ? (
                        <p className="text-xs text-theme-muted leading-relaxed rounded-xl border border-dashed border-theme px-3 py-3">
                          {isAmharic
                            ? 'ለዚህ መጽሐፍ የተቀመጠ ምንባብ የለም። ሲያነቡ የሚያስቀምጧቸው ምንባቦች እዚህ ይታያሉ።'
                            : 'No saved passages for this volume yet. Passages you save while reading appear here.'}
                        </p>
                      ) : (
                        <>
                          <ul
                            className={`space-y-3 ${
                              isNotesExpanded ? 'max-h-[28rem] overflow-y-auto pr-1' : ''
                            }`}
                          >
                            {visibleNotes.map((item) => (
                              <li
                                key={item.id}
                                className="rounded-xl border border-theme bg-theme-subtle/50 p-3.5"
                              >
                                <p className="font-serif text-[13px] italic text-theme-main leading-relaxed">
                                  “{noteText(item)}”
                                </p>
                                {item.citation && (
                                  <p className="text-[11px] text-theme-muted mt-2">{item.citation}</p>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                  <button
                                    type="button"
                                    onClick={() => setNoteAsKeyQuote(item)}
                                    className="text-[11px] font-bold text-theme-accent px-2 py-1 rounded-md hover:bg-theme-accent/10 transition-colors cursor-pointer"
                                  >
                                    {isAmharic ? 'እንደ ዋና ጥቅስ አድርግ' : 'Set Key Quote'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => insertNoteInText(item)}
                                    className="text-[11px] font-medium text-theme-muted px-2 py-1 rounded-md border border-theme hover:text-theme-main hover:border-theme-accent/50 transition-colors cursor-pointer"
                                  >
                                    {isAmharic ? '+ ወደ ጽሑፍ ጨምር' : '+ Insert in Text'}
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>

                          {marginalia.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setIsNotesExpanded((prev) => !prev)}
                              className="w-full text-xs font-semibold text-theme-accent hover:underline cursor-pointer pt-1"
                            >
                              {isNotesExpanded
                                ? isAmharic
                                  ? 'ያነሰ አሳይ'
                                  : 'Show fewer'
                                : isAmharic
                                  ? `ሁሉንም ${marginalia.length} ምንባቦች አሳይ`
                                  : `Show all ${marginalia.length} passages`}
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>

            {/* 3. Writing metrics (now below marginalia) */}
            <section className={`${cardClass} p-4`}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className={`${sectionLabelClass} text-theme-muted`}>
                  {isAmharic ? 'የጽሑፍ መለኪያዎች' : 'Writing Metrics'}
                </h3>
                {!editingReview && <span className="text-xs font-medium">{metricsStatus}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-theme-subtle/60 px-3.5 py-3">
                  <p className="font-serif text-2xl font-bold text-theme-main leading-none">
                    {wordStats.words}
                  </p>
                  <p className="text-[11px] text-theme-muted mt-2">
                    {isAmharic ? 'የተጻፉ ቃላት' : 'Words Written'}
                  </p>
                </div>
                <div className="rounded-xl bg-theme-subtle/60 px-3.5 py-3">
                  <p className="font-serif text-2xl font-bold text-theme-main leading-none">
                    ~{wordStats.readMinutes} {isAmharic ? 'ደቂቃ' : 'min'}
                  </p>
                  <p className="text-[11px] text-theme-muted mt-2">
                    {isAmharic ? 'የንባብ ጊዜ' : 'Est. Read Time'}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  // =========================================================================
  // COMMUNITY REVIEWS FEED VIEW
  // =========================================================================
  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div>
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
              {isAmharic ? 'የአንባቢዎች መጽሐፍ ዳሰሳዎች' : 'Reader Reviews & Reflections'}
            </h1>
            <p className="text-xs sm:text-sm text-theme-muted">
              {isAmharic ? 'የማህበረሰብ መጽሐፍ ዳሰሳዎች' : 'Community book reviews and reflections'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {authUserId && drafts.length > 0 && (
              <button
                type="button"
                onClick={() => loadDraftIntoEditor(drafts[0])}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2.5 rounded-lg bg-theme-subtle text-theme-main border border-theme hover:border-theme-accent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-theme-accent">
                  edit_note
                </span>
                {isAmharic
                  ? `ረቂቅ ቀጥል (${drafts.length})`
                  : `Continue Draft (${drafts.length})`}
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenNewReview}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
              {isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write Review'}
            </button>
          </div>
        </header>

        {!authUserId && (
          <div className="p-3 rounded-xl bg-theme-subtle border border-theme text-xs text-theme-muted">
            {isAmharic
              ? 'ዳሰሳ ለመጻፍ፣ ለማስተካከል ወይም ለመሰረዝ እባክዎ ይግቡ።'
              : 'Sign in to create, edit, or delete your own reviews.'}
          </div>
        )}

        {targetReviewId && (
          <div className="p-3 rounded-xl bg-theme-accent-light border border-theme-accent/30 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-theme-main">
                {isAmharic ? 'የተመረጠው ዳሰሳ' : 'Viewing a specific review'}
              </p>
              <p className="text-[11px] text-theme-muted">
                {isAmharic ? 'የተመረጠው ዳሰሳ ከታች ይታያል' : 'The selected review is highlighted below.'}
              </p>
            </div>

            {onClearTargetReview && (
              <button
                type="button"
                onClick={onClearTargetReview}
                className="text-xs text-theme-accent hover:underline"
              >
                {isAmharic ? 'ሁሉንም እይ' : 'View all reviews'}
              </button>
            )}
          </div>
        )}

        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isAmharic
              ? 'በመጽሐፍ፣ ደራሲ ወይም ገምጋሚ ፈልግ...'
              : 'Search by book, author, reviewer, or review...'
          }
          className="w-full bg-theme-surface border border-theme rounded-full px-4 py-2.5 text-sm text-theme-main placeholder:text-theme-subtle focus:outline-none focus:border-theme-accent"
        />

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {traditions.map((tradition) => (
            <button
              key={tradition}
              type="button"
              onClick={() => setSelectedTradition(tradition)}
              className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap ${
                selectedTradition === tradition
                  ? 'bg-theme-main text-theme-surface font-semibold'
                  : 'bg-theme-subtle text-theme-muted hover:bg-theme-muted'
              }`}
            >
              {tradition === 'All' ? (isAmharic ? 'ሁሉም' : 'All Reviews') : tradition}
            </button>
          ))}
        </div>

        {isPending ? (
          <div className="py-16 text-center text-theme-muted">Loading reviews…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviews.map((review) => {
              const profile = feedProfiles[review.user_id];
              const reviewerName = getReviewerName(profile);
              const avatarUrl = profile?.avatar_url || profile?.avatar;
              const book = books.find((item) => item.id === review.book_id);
              const comments = commentsByReview[review.id] || [];
              const likes = reviewLikes.filter((like) => like.review_id === review.id);
              const isLiked = likes.some((like) => like.user_id === authUserId);
              const isCommentOpen = activeCommentId === review.id;
              const saved = isSaved(review.id);

              const formattedDate = getRelativeDate(review.created_at, isAmharic);

              return (
                <article
                  key={review.id}
                  id={`review-${review.id}`}
                  onClick={() => handleCardClick(review)}
                  className={`bg-theme-surface rounded-xl p-4 sm:p-5 border flex flex-col justify-between gap-3 cursor-pointer transition-all ${
                    targetReviewId === review.id
                      ? 'border-theme-accent ring-2 ring-theme-accent/50 shadow-md'
                      : 'border-theme shadow-xs hover:border-theme-accent/60 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${reviewerName}'s avatar`}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 flex-shrink-0"
                          />
                        ) : (
                          <div
                            aria-label={`${reviewerName}'s avatar`}
                            className="w-9 h-9 rounded-full bg-theme-subtle flex items-center justify-center flex-shrink-0"
                          >
                            <span className="text-sm font-semibold text-theme-muted">
                              {reviewerName.charAt(0).toLocaleUpperCase()}
                            </span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-theme-main font-semibold truncate">
                            {reviewerName}
                          </p>
                          {profile?.title && (
                            <p className="text-[11px] text-theme-muted truncate">{profile.title}</p>
                          )}
                          {profile?.username && profile?.name && (
                            <p className="text-[11px] text-theme-muted truncate">
                              @{profile.username}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          {isAuthor(review) && (
                            <span className="text-[10px] font-semibold text-theme-accent bg-theme-accent-light border border-theme-accent/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {isAmharic ? 'የእርስዎ ዳሰሳ' : 'Your Review'}
                            </span>
                          )}

                          {isAuthor(review) && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === review.id ? null : review.id);
                                }}
                                className="w-7 h-7 rounded-md hover:bg-theme-subtle flex items-center justify-center text-theme-muted"
                                aria-label="Review options"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  more_vert
                                </span>
                              </button>

                              {activeMenuId === review.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 top-7 w-32 bg-theme-surface border border-theme rounded-lg shadow-lg py-1 z-30"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      setActiveMenuId(null);
                                      handleOpenEditReview(review, e);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-theme-main hover:bg-theme-subtle"
                                  >
                                    {isAmharic ? 'አስተካክል' : 'Edit'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      setActiveMenuId(null);
                                      void handleDeleteReview(review.id, e);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-theme-subtle"
                                  >
                                    {isAmharic ? 'ሰርዝ' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {formattedDate && (
                          <time
                            dateTime={review.created_at}
                            title={
                              review.created_at &&
                              !Number.isNaN(new Date(review.created_at).getTime())
                                ? new Date(review.created_at).toLocaleString(
                                    isAmharic ? 'am-ET' : 'en-ET',
                                    {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    }
                                  )
                                : undefined
                            }
                            className="text-[11px] text-theme-muted text-right whitespace-nowrap"
                          >
                            {formattedDate}
                          </time>
                        )}
                      </div>
                    </div>

                    <div className="my-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-serif text-[15px] font-bold text-theme-main">
                          {book?.title || review.title || (isAmharic ? 'መጽሐፍ' : 'Book')}
                        </h2>
                        <span className="text-[10px] uppercase tracking-wider text-theme-muted bg-theme-subtle border border-theme/60 px-2 py-0.5 rounded-full flex-shrink-0">
                          {isAmharic ? 'ዳሰሳ' : 'Review'}
                        </span>
                      </div>

                      {book?.author_name && (
                        <p className="text-xs text-theme-muted font-serif">
                          {isAmharic ? 'ደራሲ፦ ' : 'By '}
                          {book.author_name}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className="material-symbols-outlined text-[14px] text-theme-gold"
                              style={{
                                fontVariationSettings:
                                  i < Math.round(review.rating) ? "'FILL' 1" : "'FILL' 0",
                              }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-theme-main">
                          {Number(review.rating).toFixed(1)} / 5
                        </span>
                      </div>
                    </div>

                    {review.quote?.trim() && (
                      <blockquote className="font-serif text-sm text-theme-main italic leading-relaxed pl-3.5 border-l-2 border-theme-accent my-3">
                        “{review.quote}”
                      </blockquote>
                    )}

                    <p className="text-sm text-theme-body leading-relaxed whitespace-pre-wrap line-clamp-5">
                      {review.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-theme/50">
                    <div className="flex items-center justify-between gap-2 text-xs text-theme-muted">
                      <button
                        type="button"
                        onClick={(e) => handleToggleLike(review.id, e)}
                        className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle"
                        title={isAmharic ? 'ውደድ' : 'Like review'}
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          favorite
                        </span>
                        <span>{likes.length}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleCommentDrawer(review.id, e)}
                        className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          chat_bubble_outline
                        </span>
                        {comments.length > 0
                          ? `${comments.length} ${isAmharic ? 'አስተያየቶች' : 'comments'}`
                          : isAmharic
                            ? 'አስተያየት'
                            : 'Comment'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(review.id, e)}
                        className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle ${
                          saved ? 'text-theme-accent font-semibold' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">bookmark</span>
                        {saved
                          ? isAmharic
                            ? 'ተቀምጧል'
                            : 'Saved'
                          : isAmharic
                            ? 'አስቀምጥ'
                            : 'Save'}
                      </button>
                    </div>

                    {isCommentOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-3 border-t border-theme/70 flex flex-col gap-2"
                      >
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-theme-subtle rounded-lg p-2 text-xs">
                            <p className="font-semibold text-theme-main">{comment.author}</p>
                            <p className="text-theme-body mt-1 whitespace-pre-wrap">
                              {comment.text}
                            </p>
                            <p className="text-[10px] text-theme-muted mt-1">{comment.timeAgo}</p>
                          </div>
                        ))}

                        <form
                          onSubmit={(e) => handleAddComment(review.id, e)}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={commentInputs[review.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [review.id]: e.target.value,
                              }))
                            }
                            placeholder={isAmharic ? 'አስተያየት ይጻፉ...' : 'Write a comment...'}
                            className="flex-1 bg-theme-subtle border border-theme rounded-lg px-2.5 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                          />
                          <button
                            type="submit"
                            className="px-3 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-semibold"
                          >
                            {isAmharic ? 'ለጥፍ' : 'Post'}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {filteredReviews.length === 0 && (
              <div className="col-span-full bg-theme-subtle rounded-xl p-8 text-center border border-theme">
                <span className="material-symbols-outlined text-3xl text-theme-muted">
                  rate_review
                </span>
                <h3 className="font-serif text-base font-bold text-theme-main mt-2">
                  {isAmharic ? 'ምንም ዳሰሳ አልተገኘም' : 'No reviews found'}
                </h3>
                <p className="text-xs text-theme-muted mt-1 mb-4">
                  {isAmharic
                    ? 'የፍለጋ ቃልዎን ይቀይሩ ወይም የመጀመሪያውን ዳሰሳ ይጻፉ።'
                    : 'Try another search or write the first review.'}
                </p>
                <button
                  type="button"
                  onClick={handleOpenNewReview}
                  className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-semibold"
                >
                  {isAmharic ? 'ዳሰሳ ጻፍ' : 'Write Review'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
