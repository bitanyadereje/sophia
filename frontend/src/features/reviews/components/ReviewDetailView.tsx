import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Review, UserProfile, Book, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { getReviewerProfile } from '../review.service';
import { getReviewLikeData, toggleReviewLike, ReviewLikeData } from '../services/reviewInteraction.service';
import {
  addNestedComment,
  addReviewComment,
  buildCommentTree,
  getCommentLikeData,
  loadReviewComments,
  toggleCommentLike,
  updateReviewComment,
  deleteReviewComment,
} from '../services/reviewComment.service';
import { ReviewCommentItem } from './ReviewCommentItem';
import { useBookmarks } from '../../saved/useBookmarks';
import { BookCover, StarRating, getBookTradition } from './ReviewCard';

interface ReviewDetailViewProps {
  review: Review;
  currentUser: UserProfile;
  book?: Book;
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBook: (bookId: string) => void;
  onOpenSeminar?: (bookId?: string) => void;
  onShowToast: (message: string) => void;
}

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
      parts.push(
        <strong key={`b-${tokenIndex}`} className="font-semibold text-theme-main">
          {token.slice(2, -2)}
        </strong>
      );
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

const renderFormattedBody = (content: string) => {
  const blocks = content
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        if (block.startsWith('## ')) {
          return (
            <h2
              key={`h2-${index}`}
              className="font-serif !text-2xl sm:!text-3xl font-bold text-theme-main pt-3"
            >
              {renderInlineFormatting(block.slice(3))}
            </h2>
          );
        }

        if (block.startsWith('### ')) {
          return (
            <h3
              key={`h3-${index}`}
              className="font-serif !text-xl sm:!text-2xl font-bold text-theme-main pt-2"
            >
              {renderInlineFormatting(block.slice(4))}
            </h3>
          );
        }

        if (block.split('\n').every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={`ul-${index}`} className="list-disc pl-6 space-y-2.5">
              {block.split('\n').map((line, lineIndex) => (
                <li key={lineIndex}>{renderInlineFormatting(line.replace(/^[-*]\s/, ''))}</li>
              ))}
            </ul>
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
              style={{ fontSize: '1.15rem', lineHeight: 1.75 }}
              className="font-serif italic text-theme-main pl-5 border-l-2 border-theme-accent bg-theme-subtle/35 py-3.5 pr-5 rounded-r-xl"
            >
              {renderInlineFormatting(quoteText)}
            </blockquote>
          );
        }

        return (
          <p
            key={`p-${index}`}
            style={{ fontSize: '1.125rem', lineHeight: 1.9 }}
          >
            {renderInlineFormatting(block.replace(/\s*\n\s*/g, ' '))}
          </p>
        );
      })}
    </div>
  );
};

export const ReviewDetailView: React.FC<ReviewDetailViewProps> = ({
  review,
  currentUser,
  book,
  onBack,
  onNavigate,
  onSelectBook,
  onOpenSeminar,
  onShowToast,
}) => {
  const { isAmharic } = useLanguage();
  const queryClient = useQueryClient();
  const detailKey = ['review-detail', review.id] as const;
  const feedKey = ['reviews-feed'] as const;
  const { isSaved, toggle: toggleSave } = useBookmarks(currentUser?.id, 'review', onShowToast);

  const [commentInput, setCommentInput] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  const { data, isPending } = useQuery({
    queryKey: detailKey,
    queryFn: async () => {
      const [likeData, dbComments, profile] = await Promise.all([
        getReviewLikeData(review.id, currentUser?.id),
        loadReviewComments(review.id),
        getReviewerProfile(review.user_id),
      ]);
      const likeEntries = await Promise.all(
        dbComments.map(async (comment) => [
          comment.id,
          await getCommentLikeData(comment.id, currentUser?.id),
        ] as const)
      );
      return {
        likeData,
        comments: buildCommentTree(dbComments),
        commentLikes: Object.fromEntries(likeEntries) as Record<string, ReviewLikeData>,
        authorProfile: profile
          ? { name: profile.name || 'Reader', avatar: profile.avatar || '' }
          : null,
      };
    },
  });

  const comments = data?.comments ?? [];
  const commentLikes = data?.commentLikes ?? {};
  const isLiked = data?.likeData.isLikedByMe ?? false;
  const likeCount = data?.likeData.totalLikes ?? review.like_count ?? 0;
  const authorProfile = data?.authorProfile ?? null;

  const likeMutation = useMutation({
    mutationFn: ({ userId, wasLiked }: { userId: string; wasLiked: boolean }) =>
      toggleReviewLike(review.id, userId, wasLiked),
    onMutate: async ({ wasLiked }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData(detailKey);
      queryClient.setQueryData<any>(detailKey, (old) =>
        old
          ? {
              ...old,
              likeData: {
                isLikedByMe: !wasLiked,
                totalLikes: Math.max(0, old.likeData.totalLikes + (wasLiked ? -1 : 1)),
              },
            }
          : old
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
      onShowToast(error instanceof Error ? error.message : 'Failed to update like');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: feedKey });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      addReviewComment(review.id, userId, content),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: feedKey });
    },
  });

  const handleLike = () => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'ለመውደድ እባክዎ ይግቡ።' : 'Sign in to like reviews.');
      return;
    }
    likeMutation.mutate({ userId: currentUser.id, wasLiked: isLiked });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'አስተያየት ለመስጠት እባክዎ ይግቡ።' : 'Sign in to comment on reviews.');
      return;
    }

    const text = commentInput.trim();
    setCommentInput('');

    try {
      await addCommentMutation.mutateAsync({ userId: currentUser.id, content: text });
      onShowToast(isAmharic ? 'አስተያየትዎ ተለጥፏል!' : 'Reflection posted!');
    } catch (error) {
      console.error('Failed to post review comment:', error);
      onShowToast(error instanceof Error ? error.message : 'Failed to post comment');
      setCommentInput(text);
    }
  };

  const handleAddReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    const text = replyDraft.trim();
    if (!text) return;
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'መልስ ለመስጠት እባክዎ ይግቡ።' : 'Sign in to reply.');
      return;
    }

    setReplyDraft('');
    try {
      await addNestedComment(review.id, currentUser.id, text, parentId);
      await queryClient.invalidateQueries({ queryKey: detailKey });
      await queryClient.invalidateQueries({ queryKey: feedKey });
      setReplyingToCommentId(null);
      onShowToast(isAmharic ? 'መልስዎ ተልኳል!' : 'Reply posted!');
    } catch (error) {
      console.error('Failed to post review reply:', error);
      onShowToast(error instanceof Error ? error.message : 'Failed to post reply');
      setReplyDraft(text);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'አስተያየት ለመውደድ እባክዎ ይግቡ።' : 'Sign in to like comments.');
      return;
    }
    const previous = commentLikes[commentId] ?? { totalLikes: 0, isLikedByMe: false };
    const optimistic = {
      isLikedByMe: !previous.isLikedByMe,
      totalLikes: Math.max(0, previous.totalLikes + (previous.isLikedByMe ? -1 : 1)),
    };
    queryClient.setQueryData<any>(detailKey, (old) =>
      old
        ? {
            ...old,
            commentLikes: { ...old.commentLikes, [commentId]: optimistic },
          }
        : old
    );
    try {
      await toggleCommentLike(commentId, currentUser.id, previous.isLikedByMe);
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      queryClient.setQueryData<any>(detailKey, (old) =>
        old
          ? {
              ...old,
              commentLikes: { ...old.commentLikes, [commentId]: previous },
            }
          : old
      );
      onShowToast(error instanceof Error ? error.message : 'Failed to update comment like');
    }
  };

  const refreshComments = async () => {
    await queryClient.invalidateQueries({ queryKey: detailKey });
    await queryClient.invalidateQueries({ queryKey: feedKey });
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'አስተያየት ለማስተካከል እባክዎ ይግቡ።' : 'Sign in to edit comments.');
      return;
    }
    try {
      await updateReviewComment(commentId, currentUser.id, newContent);
      await refreshComments();
      onShowToast(isAmharic ? 'አስተያየቱ ተሻሽሏል።' : 'Comment updated.');
    } catch (error) {
      console.error('Failed to edit review comment:', error);
      onShowToast(
        error instanceof Error ? error.message : 'Unable to edit this comment. Check your permissions.'
      );
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'አስተያየት ለመሰረዝ እባክዎ ይግቡ።' : 'Sign in to delete comments.');
      return;
    }
    try {
      await deleteReviewComment(commentId, currentUser.id);
      await refreshComments();
      onShowToast(isAmharic ? 'አስተያየቱ ተሰርዟል።' : 'Comment deleted.');
    } catch (error) {
      console.error('Failed to delete review comment:', error);
      onShowToast(
        error instanceof Error ? error.message : 'Unable to delete this comment. Check your permissions.'
      );
    }
  };

  const handleCopyCitation = () => {
    const reviewerLabel = authorProfile?.name || 'Reader';
    const quotePart = review.quote?.trim() ? `“${review.quote.trim()}” — ` : '';
    const volumePart = book?.title
      ? `${book.title}${book.author_name ? `, ${book.author_name}` : ''}`
      : review.title ?? 'Review';
    const textToCopy = `${quotePart}${volumePart} (${isAmharic ? 'ዳሰሳ በ' : 'Review by'} ${reviewerLabel})`;
    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(textToCopy);
    }
    onShowToast(isAmharic ? 'ጥቅሱ ተገልብጧል' : 'Citation copied to clipboard');
  };

  const reviewDate = useMemo(() => {
    const parsed = new Date(review.created_at);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(isAmharic ? 'am-ET' : 'en-ET', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [review.created_at, isAmharic]);

  const readMinutes = useMemo(() => {
    const words = (review.content || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 225));
  }, [review.content]);

  const { quotePassage, quoteReference } = useMemo(() => {
    const raw = (review.quote || '').trim();
    if (!raw) return { quotePassage: '', quoteReference: '' };
    const separatorIndex = raw.lastIndexOf(' — ');
    if (separatorIndex > 0) {
      return {
        quotePassage: raw.slice(0, separatorIndex).trim(),
        quoteReference: raw.slice(separatorIndex + 3).trim(),
      };
    }
    return { quotePassage: raw, quoteReference: '' };
  }, [review.quote]);

  const tradition = getBookTradition(book);
  const bookTitle = book?.title || review.title || (isAmharic ? 'መጽሐፍ' : 'Book');
  const reviewerName = authorProfile?.name || 'Reader';
  const saved = isSaved(review.id);

  return (
    <div className="flex flex-col min-h-screen w-full bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      {/* Unified Width Editorial Container */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-12 flex flex-col gap-7">
        {/* Clean Back Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            id="back-to-reviews-btn"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-theme-muted hover:text-theme-main transition-colors cursor-pointer group"
          >
            <span className="material-symbols-outlined text-[19px] transition-transform group-hover:-translate-x-0.5">
              arrow_back
            </span>
            <span>{isAmharic ? 'ወደ ዳሰሳዎች' : 'Back to Reviews'}</span>
          </button>
        </div>

        {isPending && !data && (
          <div className="py-2 text-center text-xs text-theme-muted">
            {isAmharic ? 'በመጫን ላይ…' : 'Loading review details…'}
          </div>
        )}

        {/* Volume Showcase Card (Golden shadow kept exclusively on the book cover) */}
        <header className="w-full bg-theme-surface border border-theme-accent/45 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-6 min-w-0">
            {/* 3D Tactile Book Cover with Golden Shadow */}
            <div className="relative flex-shrink-0 group" style={{ perspective: '900px' }}>
              <div
                style={{
                  transform: 'rotateY(-9deg)',
                  boxShadow:
                    '10px 16px 30px -8px rgba(212, 168, 79, 0.36), 4px 10px 18px rgba(0, 0, 0, 0.45)',
                }}
                className="relative rounded-md transition-transform duration-300 group-hover:[transform:rotateY(-2deg)_translateY(-2px)]"
              >
                <BookCover book={book} fallbackTitle={bookTitle} className="h-36 w-26 sm:h-40 sm:w-28" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-2 w-px bg-black/40"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-theme-accent/35"
                />
              </div>
            </div>

            {/* Volume Metadata */}
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              {tradition && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-theme-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-accent" />
                  {tradition}
                </span>
              )}

              <h1 className="font-serif !text-2xl sm:!text-4xl font-bold text-theme-main leading-tight capitalize">
                {bookTitle}
              </h1>

              {book?.author_name && (
                <p className="text-sm sm:text-base font-serif italic text-theme-muted">
                  {isAmharic ? `በ${book.author_name}` : `by ${book.author_name}`}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-theme-muted">
                <div className="inline-flex items-center gap-2">
                  <StarRating rating={review.rating} size={16} />
                  <span className="font-semibold text-theme-main">
                    {Number(review.rating).toFixed(1)} / 5
                  </span>
                </div>

                {book?.page_count ? (
                  <>
                    <span>·</span>
                    <span>
                      {book.page_count} {isAmharic ? 'ገጾች' : 'pages'}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Compact Right-Side Volume Actions */}
          {book && (
            <div className="flex flex-row md:flex-col items-stretch gap-2.5 md:min-w-[165px] md:pl-6 md:border-l md:border-theme-accent/30 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (onOpenSeminar) {
                    onOpenSeminar(book.id);
                  } else {
                    onNavigate('colloquium');
                  }
                }}
                id="join-book-seminar-btn"
                style={{
                  background: 'linear-gradient(135deg, #e0b65c 0%, #c69334 100%)',
                  color: '#15120c',
                  boxShadow:
                    '0 8px 22px -6px rgba(212, 168, 79, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.32)',
                }}
                className="flex-1 md:flex-initial inline-flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold hover:brightness-105 transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">forum</span>
                  <span>{isAmharic ? 'ጉባኤ' : 'Seminar'}</span>
                </span>
                <span className="material-symbols-outlined text-[15px] opacity-80">north_east</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectBook(book.id)}
                id="view-book-detail-btn"
                className="flex-1 md:flex-initial inline-flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border border-theme-accent/40 bg-theme-subtle/40 hover:bg-theme-subtle text-theme-main text-xs font-semibold transition-colors cursor-pointer group whitespace-nowrap"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-theme-accent">menu_book</span>
                  <span>{isAmharic ? 'መጽሐፉን እይ' : 'View Book'}</span>
                </span>
                <span className="material-symbols-outlined text-[15px] text-theme-muted group-hover:translate-x-0.5 transition-transform">
                  chevron_right
                </span>
              </button>
            </div>
          )}
        </header>

        {/* Borderless Open Reviewer Byline + Engagement Controls */}
        <div className="w-full py-1 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              {authorProfile?.avatar ? (
                <img
                  src={authorProfile.avatar}
                  alt={reviewerName}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-theme-accent/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-theme-subtle border border-theme-accent/45 text-theme-main flex items-center justify-center font-serif font-bold text-sm">
                  {reviewerName.charAt(0).toLocaleUpperCase()}
                </div>
              )}
              <span
                aria-hidden="true"
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-theme-accent border-2 border-theme-app"
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-theme-main truncate">{reviewerName}</p>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-accent/15 text-theme-accent">
                  {isAmharic ? 'ገምጋሚ' : 'Reviewer'}
                </span>
              </div>
              <p className="text-xs text-theme-muted truncate mt-0.5">
                {[reviewDate, `~${readMinutes} ${isAmharic ? 'ደቂቃ ንባብ' : 'min read'}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLike}
              id="detail-like-btn"
              aria-label={isAmharic ? 'ውደድ' : 'Like review'}
              title={isAmharic ? 'ውደድ' : 'Like review'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-theme-subtle text-xs transition-colors cursor-pointer ${
                isLiked
                  ? 'text-theme-accent border-theme-accent/55 bg-theme-accent/10 font-semibold'
                  : 'border-theme-accent/35 text-theme-muted hover:text-theme-main'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
              <span>{likeCount}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSave(review.id)}
              id="detail-save-btn"
              aria-label={saved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save review'}
              title={saved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save review'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border hover:bg-theme-subtle text-xs transition-colors cursor-pointer ${
                saved
                  ? 'text-theme-accent border-theme-accent/55 bg-theme-accent/10 font-semibold'
                  : 'border-theme-accent/35 text-theme-muted hover:text-theme-main'
              }`}
            >
              <span
                className="material-symbols-outlined text-[16px]"
                style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
              <span className="hidden sm:inline">
                {saved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyCitation}
              id="detail-citation-btn"
              aria-label={isAmharic ? 'ጥቅስ ገልብጥ' : 'Copy citation'}
              title={isAmharic ? 'ጥቅስ ገልብጥ' : 'Copy citation'}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-theme-accent/35 text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
            </button>
          </div>
        </div>

        {/* Flush Editorial Column */}
        <div className="w-full flex flex-col gap-8">
          {/* Review Headline (when separate from book title) */}
          {review.title?.trim() && book?.title && (
            <h2 className="font-serif !text-2xl sm:!text-3xl font-bold text-theme-main leading-snug">
              {review.title.trim()}
            </h2>
          )}

          {/* Large Centered Literary Epigraph Pull-Quote */}
          {quotePassage && (
            <figure className="w-full my-1 py-8 sm:py-10 px-6 sm:px-10 rounded-2xl bg-theme-surface/50 border-y border-theme-accent/35 text-center flex flex-col items-center">
              <span
                aria-hidden="true"
                style={{ fontSize: '4.5rem', lineHeight: 0.8 }}
                className="font-serif text-theme-accent/45 select-none mb-2 block"
              >
                “
              </span>

              <blockquote
                style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.15rem)', lineHeight: 1.55 }}
                className="font-serif italic font-normal text-theme-main tracking-[-0.01em] max-w-3xl mx-auto"
              >
                {quotePassage}
              </blockquote>

              <figcaption className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs sm:text-sm text-theme-muted font-sans">
                <span aria-hidden="true" className="w-8 h-px bg-theme-accent inline-block mr-1" />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-theme-accent">
                  {isAmharic ? 'ከመጽሐፉ' : 'From the Volume'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-serif italic text-theme-main">
                  {quoteReference || book?.title}
                </span>
                <span aria-hidden="true" className="w-8 h-px bg-theme-accent inline-block ml-1" />
              </figcaption>
            </figure>
          )}

          {/* Formatted Essay Body */}
          <article className="w-full text-theme-body font-serif">
            {renderFormattedBody(review.content || '')}
          </article>
        </div>

        {/* Discussion Thread */}
        <section className="w-full pt-8 border-t border-theme-accent/35 space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="font-serif !text-lg sm:!text-xl font-bold text-theme-main">
                {isAmharic ? 'ውይይት' : 'Discussion'}
              </h3>
              <span className="text-xs text-theme-muted bg-theme-subtle px-2.5 py-0.5 rounded-full border border-theme-accent/35">
                {comments.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (book && onOpenSeminar) {
                  onOpenSeminar(book.id);
                } else {
                  onNavigate('colloquium');
                }
              }}
              className="text-xs font-medium text-theme-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{isAmharic ? 'ጉባኤ ክፈት' : 'Open Seminar'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          <form onSubmit={handleAddComment} className="flex items-center gap-3">
            {!avatarFailed && currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                onError={() => setAvatarFailed(true)}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-theme-accent/45 flex-shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-theme-subtle border border-theme-accent/40 text-theme-main flex items-center justify-center font-serif font-bold text-xs flex-shrink-0">
                {(currentUser?.name || 'R').charAt(0).toLocaleUpperCase()}
              </div>
            )}

            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                id="review-comment-input"
                placeholder={
                  isAmharic ? 'ማሰላሰያ ወይም አስተያየት እዚህ ይጻፉ...' : 'Contribute a reflection or question...'
                }
                className="w-full h-11 pl-4 pr-11 text-xs sm:text-sm rounded-xl border border-theme-accent/35 bg-theme-surface text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent transition-colors"
              />
              <button
                type="submit"
                id="submit-review-comment-btn"
                aria-label={isAmharic ? 'ማሰላሰያ ለጥፍ' : 'Post reflection'}
                title={isAmharic ? 'ማሰላሰያ ለጥፍ' : 'Post reflection'}
                className={`absolute right-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                  commentInput.trim()
                    ? 'bg-theme-accent text-stone-950 hover:brightness-105'
                    : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <div className="text-center py-8 bg-theme-subtle/30 rounded-2xl border border-theme-accent/30">
              <span className="material-symbols-outlined text-theme-muted text-2xl">
                chat_bubble_outline
              </span>
              <p className="text-xs text-theme-muted mt-1.5">
                {isAmharic ? 'እስካሁን አስተያየት የለም' : 'No reflections yet. Start the conversation above.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-xl border border-theme-accent/35 bg-theme-surface"
                >
                  <ReviewCommentItem
                    comment={comment}
                    currentUser={currentUser}
                    onReply={(commentId) => {
                      setReplyingToCommentId((prev) => (prev === commentId ? null : commentId));
                      setReplyDraft('');
                    }}
                    onLike={handleToggleCommentLike}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    commentLikes={commentLikes}
                    replyingToCommentId={replyingToCommentId}
                    replyDraft={replyDraft}
                    onReplyDraftChange={setReplyDraft}
                    onSubmitReply={handleAddReply}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};