
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, Review, ReviewLike, ScreenId, UserProfile } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { loadReviewerProfilesForReviews } from '../reviewerProfiles';
import { addReviewComment, loadReviewCommentsForReviews } from '../services/reviewComment.service';
import { loadReviewLikesForReviews, toggleReviewLike } from '../services/reviewInteraction.service';
import { loadReviews } from '../review.service';

interface ReviewerProfile {
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  title?: string | null;
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
    cover_url?: string | null;
    page_count?: number | null;
    title?: string | null;
    content: string;
    rating: number;
    quote?: string | null;
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
}

interface LocalComment {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
}

const getReviewerName = (
  profile: ReviewerProfile | undefined
): string => {
  return (
    profile?.name?.trim() ||
    profile?.username?.trim() ||
    'Reader'
  );
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

  // Use a relative date for recent reviews.
  if (absSeconds < 60) {
    return isAmharic ? 'አሁን' : 'Just now';
  }

  if (absSeconds < 3600) {
    const minutes = Math.round(diffSeconds / 60);
    return new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
    }).format(minutes, 'minute');
  }

  if (absSeconds < 86400) {
    const hours = Math.round(diffSeconds / 3600);
    return new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
    }).format(hours, 'hour');
  }

  if (absSeconds < 7 * 86400) {
    const days = Math.round(diffSeconds / 86400);
    return new Intl.RelativeTimeFormat(locale, {
      numeric: 'auto',
    }).format(days, 'day');
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

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
}) => {
  const { isAmharic } = useLanguage();
  const queryClient = useQueryClient();
  const feedKey = ['reviews-feed'] as const;

  const [selectedTradition, setSelectedTradition] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const [savedReviews, setSavedReviews] = useState<Record<string, boolean>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const profiles = reviewerProfiles;

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
  const commentsByReview = (feedData?.comments ?? []).reduce<Record<string, LocalComment[]>>((result, comment) => {
    const author = comment.author?.name?.trim() || comment.author?.username?.trim() || 'Reader';
    result[comment.review_id] = [
      ...(result[comment.review_id] || []),
      { id: comment.id, author, text: comment.content, timeAgo: getRelativeDate(comment.created_at, isAmharic) },
    ];
    return result;
  }, {});
  const loadedProfiles = feedData?.profiles as Record<string, ReviewerProfile> | undefined;
  const feedProfiles = { ...profiles, ...loadedProfiles };

  const toggleLikeMutation = useMutation({
    mutationFn: ({ reviewId, userId, wasLiked }: { reviewId: string; userId: string; wasLiked: boolean }) =>
      toggleReviewLike(reviewId, userId, wasLiked),
    onMutate: async ({ reviewId, userId, wasLiked }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData(feedKey);
      queryClient.setQueryData<any>(feedKey, (old) => old ? {
        ...old,
        likes: wasLiked
          ? old.likes.filter((like: ReviewLike) => like.review_id !== reviewId || like.user_id !== userId)
          : [...old.likes, { review_id: reviewId, user_id: userId, created_at: new Date().toISOString() }],
      } : old);
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

  const [newBookId, setNewBookId] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookLanguage, setNewBookLanguage] = useState('en');
  const [newRating, setNewRating] = useState(5);
  const [newQuote, setNewQuote] = useState('');
  const [newFullReview, setNewFullReview] = useState('');

  const selectedBookForForm = books.find(
    (book) => book.id === newBookId
  );

  const visibleBooks = books.filter((book) => {
    const query = bookSearch.trim().toLocaleLowerCase();

    if (!query) return true;

    return `${book.title} ${book.author_name}`
      .toLocaleLowerCase()
      .includes(query);
  });

  const traditions = [
    'All',
    'Patristic',
    'Orthodox',
    'Scholastic',
    'Soteriology',
  ];

  const isAuthor = (review: Review) =>
    Boolean(authUserId && review.user_id === authUserId);

  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuId(null);

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
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

  const handleToggleLike = async (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!authUserId) {
      onShowToast(isAmharic ? '\u12cd\u12f0\u12f5 \u1208\u121b\u1235\u1240\u1228\u1265 \u1218\u1218\u122a\u12eb \u12ed\u130d\u1261' : 'Please sign in to like reviews.');
      return;
    }

    const wasLiked = reviewLikes.some((like) => like.review_id === id && like.user_id === authUserId);
    toggleLikeMutation.mutate({ reviewId: id, userId: authUserId, wasLiked });
  };
  const handleToggleSave = (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const nextState = !(savedReviews[id] ?? false);

    setSavedReviews((prev) => ({
      ...prev,
      [id]: nextState,
    }));

    onShowToast(
      nextState
        ? (isAmharic ? 'ተቀምጧል' : 'Saved review')
        : (isAmharic ? 'ከተቀመጡ ተወግዷል' : 'Removed saved review')
    );
  };

  const handleToggleCommentDrawer = (
    id: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setActiveCommentId((prev) => (prev === id ? null : id));
  };

  const handleAddComment = async (
    reviewId: string,
    e: React.FormEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authUserId) {
      onShowToast(isAmharic ? '\u12a5\u1263\u12ad\u12ce \u12ed\u130d\u1261\u1362' : 'Please sign in to comment.');
      return;
    }

    const text = commentInputs[reviewId]?.trim();
    if (!text) return;

    try {
      await addCommentMutation.mutateAsync({ reviewId, userId: authUserId, content: text });
      setCommentInputs((prev) => ({ ...prev, [reviewId]: '' }));
      onShowToast(isAmharic ? '\u12a0\u1235\u1270\u12eb\u12e8\u1275\u12ce \u1270\u122b\u12ad\u12cc\u120d' : 'Comment posted.');
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
    setNewRating(5);
    setNewQuote('');
    setNewFullReview('');
    setEditingReview(null);
  };

  const handleOpenNewReview = () => {
    if (!authUserId) {
      onShowToast(
        isAmharic
          ? 'ዳሰሳ ለመጻፍ እባክዎ ይግቡ።'
          : 'Please sign in to write a review.'
      );
      return;
    }

    resetForm();
    setIsWriteReviewOpen(true);
  };

  const handleOpenEditReview = (
    review: Review,
    e?: React.MouseEvent
  ) => {
    e?.stopPropagation();

    if (!isAuthor(review)) {
      onShowToast('You can only edit your own reviews.');
      return;
    }

    setEditingReview(review);
    setNewBookId(review.book_id);
    setBookSearch('');
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewRating(review.rating);
    setNewQuote(review.quote || '');
    setNewFullReview(review.content);
    setIsWriteReviewOpen(true);
  };

  const handleDeleteReview = async (
    id: string,
    e: React.MouseEvent
  ) => {
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
    // Tradition filtering is disabled until reviews have tradition metadata.
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

  const handleSubmitReview = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!authUserId) {
      onShowToast('Please sign in to publish a review.');
      return;
    }

    const selectedBook = books.find(
      (book) => book.id === newBookId
    );

    const isNewBook = !editingReview && !selectedBook;
    const titleForNewBook = (newBookTitle || bookSearch).trim();

    if (editingReview && !newBookId.trim()) {
      onShowToast('Please choose a book.');
      return;
    }

    if (
      !editingReview &&
      !selectedBook &&
      (!titleForNewBook || !newBookAuthor.trim())
    ) {
      onShowToast(
        'Enter the book title and author, or select an existing book.'
      );
      return;
    }

    if (
      !Number.isFinite(newRating) ||
      newRating < 1 ||
      newRating > 5
    ) {
      onShowToast('Rating must be between 1 and 5.');
      return;
    }

    const content = newFullReview.trim();

    if (!content) {
      onShowToast('Please write a detailed review.');
      return;
    }

    const values = {
      ...(selectedBook ? { book_id: selectedBook.id } : {}),
      ...(isNewBook
        ? {
            bookTitle: titleForNewBook,
            bookAuthor: newBookAuthor.trim(),
            language: newBookLanguage,
          }
        : {}),
      rating: Math.round(newRating),
      quote: newQuote.trim() || null,
      content,
      title: null,
    };

    if (editingReview) {
      if (!onUpdateReview) {
        onShowToast('Review editing is not connected.');
        return;
      }

      const result = await onUpdateReview(editingReview.id, values);

      if (!result.ok) {
        onShowToast(result.error || 'Could not update review.');
        return;
      }

      onShowToast(isAmharic ? 'ዳሰሳው ተሻሽሏል' : 'Review updated.');
    } else {
      const result = await onAddReview(values);

      if (!result.ok) {
        onShowToast(result.error || 'Could not publish review.');
        return;
      }

      onShowToast(isAmharic ? 'ዳሰሳው ታትሟል' : 'Review published.');
    }

    resetForm();
    setIsWriteReviewOpen(false);
    await queryClient.invalidateQueries({ queryKey: feedKey });
  };

  const closeForm = () => {
    setIsWriteReviewOpen(false);
    resetForm();
  };

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

          <button
            type="button"
            onClick={handleOpenNewReview}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            {isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write Review'}
          </button>
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
              {tradition === 'All'
                ? (isAmharic ? 'ሁሉም' : 'All Reviews')
                : tradition}
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
            const isSaved = savedReviews[review.id] ?? false;

            const formattedDate = getRelativeDate(
              review.created_at,
              isAmharic
            );

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
                          <p className="text-[11px] text-theme-muted truncate">
                            {profile.title}
                          </p>
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
                                setActiveMenuId(
                                  activeMenuId === review.id ? null : review.id
                                );
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
                        {isAmharic ? 'ደራሲ፦ ' : 'By '}{book.author_name}
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
                                i < Math.round(review.rating)
                                  ? "'FILL' 1"
                                  : "'FILL' 0",
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
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>
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
                        : (isAmharic ? 'አስተያየት' : 'Comment')}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(review.id, e)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle ${
                        isSaved ? 'text-theme-accent font-semibold' : ''
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        bookmark
                      </span>
                      {isSaved
                        ? (isAmharic ? 'ተቀምጧል' : 'Saved')
                        : (isAmharic ? 'አስቀምጥ' : 'Save')}
                    </button>
                  </div>

                  {isCommentOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-3 border-t border-theme/70 flex flex-col gap-2"
                    >
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-theme-subtle rounded-lg p-2 text-xs"
                        >
                          <p className="font-semibold text-theme-main">
                            {comment.author}
                          </p>
                          <p className="text-theme-body mt-1 whitespace-pre-wrap">
                            {comment.text}
                          </p>
                          <p className="text-[10px] text-theme-muted mt-1">
                            {comment.timeAgo}
                          </p>
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
                          placeholder={
                            isAmharic
                              ? 'አስተያየት ይጻፉ...'
                              : 'Write a comment...'
                          }
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

      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form onSubmit={handleSubmitReview} className="w-full sm:max-w-lg bg-theme-surface rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border border-theme max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <h3 className="font-serif text-lg font-bold text-theme-main">
                {editingReview
                  ? (isAmharic ? 'ዳሰሳ አስተካክል' : 'Edit Review')
                  : (isAmharic ? 'ዳሰሳ ጻፍ' : 'Write Review')}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-theme-muted hover:text-theme-main p-1"
                aria-label={isAmharic ? 'ዝጋ' : 'Close'}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  {isAmharic ? 'መጽሐፍ' : 'Book'} *
                </label>

                <input
                  type="search"
                  value={
                    selectedBookForForm
                      ? `${selectedBookForForm.title} — ${selectedBookForForm.author_name}`
                      : bookSearch
                  }
                  onChange={(e) => {
                    setNewBookId('');
                    setBookSearch(e.target.value);
                    setNewBookTitle(e.target.value);
                    setNewBookAuthor('');
                  }}
                  placeholder={
                    isAmharic
                      ? 'በመጽሐፍ ርዕስ ወይም ደራሲ ፈልግ...'
                      : 'Search by book title or author...'
                  }
                  disabled={Boolean(editingReview)}
                  required={!editingReview && !selectedBookForForm}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-sm text-theme-main focus:outline-none focus:border-theme-accent disabled:opacity-60"
                />

                {!editingReview && !selectedBookForForm && bookSearch.trim() && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-theme bg-theme-surface">
                    {visibleBooks.slice(0, 8).map((bookItem) => (
                      <button
                        key={bookItem.id}
                        type="button"
                        onClick={() => {
                          setNewBookId(bookItem.id);
                          setBookSearch(bookItem.title);
                          setNewBookTitle('');
                          setNewBookAuthor('');
                        }}
                        className="block w-full px-3 py-2 text-left text-xs hover:bg-theme-subtle"
                      >
                        <span className="block font-semibold text-theme-main">
                          {bookItem.title}
                        </span>
                        <span className="text-theme-muted">
                          {bookItem.author_name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedBookForForm && (
                  <div className="mt-2 rounded-lg border border-theme bg-theme-subtle p-3 text-xs">
                    <p className="font-semibold text-theme-main">
                      {selectedBookForForm.title}
                    </p>
                    <p className="text-theme-muted">
                      {selectedBookForForm.author_name}
                    </p>
                    {selectedBookForForm.cover_url && (
                      <img
                        src={selectedBookForForm.cover_url}
                        alt={`Cover of ${selectedBookForForm.title}`}
                        className="mt-2 h-24 w-auto rounded object-cover"
                      />
                    )}
                    {!editingReview && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewBookId('');
                          setBookSearch('');
                        }}
                        className="mt-2 text-theme-accent hover:underline"
                      >
                        {isAmharic ? 'መጽሐፍ ቀይር' : 'Change book'}
                      </button>
                    )}
                  </div>
                )}

                {!editingReview && !selectedBookForForm && bookSearch.trim() && (
                  <div className="mt-3 space-y-3 rounded-lg border border-theme p-3">
                    <p className="text-xs font-semibold text-theme-main">
                      {visibleBooks.length === 0
                        ? (isAmharic ? 'መጽሐፉ አልተገኘም። ዝርዝሩን ያስገቡ።' : 'No matching book. Enter its details.')
                        : (isAmharic ? 'መጽሐፉን አልተገኘም? ዝርዝሩን ያስገቡ።' : 'Can’t find the right book? Enter its details.')}
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
                        className="mt-1 w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-sm text-theme-main"
                      />
                    </label>

                    <label className="block text-xs text-theme-muted">
                      {isAmharic ? 'ደራሲ *' : 'Author *'}
                      <input
                        required
                        value={newBookAuthor}
                        onChange={(e) => setNewBookAuthor(e.target.value)}
                        className="mt-1 w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-sm text-theme-main"
                      />
                    </label>

                    <label className="block text-xs text-theme-muted">
                      {isAmharic ? 'ቋንቋ' : 'Language'}
                      <select
                        value={newBookLanguage}
                        onChange={(e) => setNewBookLanguage(e.target.value)}
                        className="mt-1 w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-sm text-theme-main"
                      >
                        <option value="en">English</option>
                        <option value="am">Amharic</option>
                        <option value="gez">Geez</option>
                        <option value="other">Other</option>
                      </select>
                    </label>

                    <p className="text-[11px] text-theme-muted">
                      {isAmharic
                        ? 'መጽሐፉ ለማረጋገጫ በካታሎጉ ውስጥ ይጨመራል።'
                        : 'The book will be submitted to the catalog for verification when you publish.'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  {isAmharic ? 'ደረጃ (1–5)' : 'Rating (1–5)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  step={1}
                  required
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-sm text-theme-main"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  {isAmharic ? 'ዋና ሐሳብ ወይም ጥቅስ' : 'Key takeaway or quote'}
                </label>
                <textarea
                  rows={2}
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder={
                    isAmharic
                      ? 'ዋና ሐሳብ ወይም ጥቅስ ያጋሩ...'
                      : 'Share a key takeaway or quote...'
                  }
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-sm text-theme-main resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-theme-muted mb-1">
                  {isAmharic ? 'ዝርዝር ዳሰሳ' : 'Detailed review'} *
                </label>
                <textarea
                  rows={5}
                  required
                  value={newFullReview}
                  onChange={(e) => setNewFullReview(e.target.value)}
                  placeholder={
                    isAmharic
                      ? 'ስለ መጽሐፉ ያለዎትን ሐሳብ ይግለጹ...'
                      : 'Write your detailed thoughts about the book...'
                  }
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-sm text-theme-main resize-y"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5 pt-3 border-t border-theme">
              <button
                type="button"
                onClick={closeForm}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle text-theme-muted text-xs font-semibold"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-theme-main text-white text-xs font-semibold hover:opacity-90"
              >
                {editingReview
                  ? (isAmharic ? 'ለውጦችን አስቀምጥ' : 'Save Changes')
                  : (isAmharic ? 'ዳሰሳ አትም' : 'Publish Review')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
