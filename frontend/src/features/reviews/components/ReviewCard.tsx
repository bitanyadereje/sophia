import React from 'react';
import { Book, Review } from '../../../types';
import { BookCover as SharedBookCover } from '../../books/components/BookCover';

interface ReviewerProfile {
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  title?: string | null;
}

interface LocalComment {
  id: string;
  author: string;
  text: string;
  timeAgo: string;
}

export const getBookTradition = (book?: Book): string => {
  if (!book) return '';
  const record = book as unknown as Record<string, unknown>;
  const raw = record.tradition ?? record.category ?? record.genre;
  return typeof raw === 'string' ? raw.trim() : '';
};

const stripMarkdown = (text: string): string =>
  text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

interface BookCoverProps {
  book?: Book;
  fallbackTitle?: string;
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  fallbackTitle = 'Book',
  className = 'h-32 w-24',
}) => {
  return <SharedBookCover book={book} title={fallbackTitle} className={className} />;
};

interface StarRatingProps {
  rating: number;
  size?: number;
  filledClass?: string;
  emptyClass?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 14,
  filledClass = 'text-theme-gold',
  emptyClass = 'text-theme-gold/30',
}) => {
  const filledCount = Math.round(Number(rating) || 0);

  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${Number(rating).toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < filledCount;
        return (
          <span
            key={index}
            className={`material-symbols-outlined leading-none ${isFilled ? filledClass : emptyClass}`}
            style={{
              fontSize: `${size}px`,
              fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            star
          </span>
        );
      })}
    </span>
  );
};

export interface ReviewCardProps {
  review: Review;
  book?: Book;
  profile?: ReviewerProfile;
  reviewerName: string;
  formattedDate: string;
  isAmharic: boolean;
  isAuthor: boolean;
  isLiked: boolean;
  isSaved: boolean;
  isHighlighted: boolean;
  isMenuOpen: boolean;
  isCommentOpen: boolean;
  comments: LocalComment[];
  commentValue: string;
  onOpen: () => void;
  onLike: (e: React.MouseEvent) => void;
  onSave: (e: React.MouseEvent) => void;
  onToggleComments: (e: React.MouseEvent) => void;
  onToggleMenu: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onCommentChange: (value: string) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  book,
  profile,
  reviewerName,
  formattedDate,
  isAmharic,
  isAuthor,
  isLiked,
  isSaved,
  isHighlighted,
  isMenuOpen,
  isCommentOpen,
  comments,
  commentValue,
  onOpen,
  onLike,
  onSave,
  onToggleComments,
  onToggleMenu,
  onEdit,
  onDelete,
  onCommentChange,
  onCommentSubmit,
}) => {
  const avatarUrl = profile?.avatar_url || profile?.avatar;
  const tradition = getBookTradition(book);
  const categoryLabel = tradition || (isAmharic ? 'ዳሰሳ' : 'Review');
  const bookTitle = book?.title || review.title || (isAmharic ? 'መጽሐፍ' : 'Book');
  const pullQuote = (review.quote?.trim() || (book?.title && review.title?.trim()) || '').trim();
  const excerpt = stripMarkdown(review.content || '');

  return (
    <article
      id={`review-${review.id}`}
      onClick={onOpen}
      className={`bg-theme-surface rounded-2xl p-5 border flex flex-col justify-between gap-4 cursor-pointer transition-all ${
        isHighlighted
          ? 'border-theme-accent ring-2 ring-theme-accent/50 shadow-md'
          : 'border-theme shadow-xs hover:border-theme-accent/60 hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        <BookCover
          book={book}
          fallbackTitle={bookTitle}
          className="h-32 w-[88px] sm:h-36 sm:w-24"
        />

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-theme-accent truncate">
              {categoryLabel}
            </span>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div
                title={profile?.username ? `@${profile.username}` : reviewerName}
                className="flex items-center gap-1.5 min-w-0"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={`${reviewerName}'s avatar`}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-theme flex-shrink-0"
                  />
                ) : (
                  <div
                    aria-label={`${reviewerName}'s avatar`}
                    className="w-6 h-6 rounded-full bg-theme-main text-theme-surface flex items-center justify-center flex-shrink-0"
                  >
                    <span className="text-[11px] font-bold leading-none">
                      {reviewerName.charAt(0).toLocaleUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs font-semibold text-theme-main truncate max-w-[110px] sm:max-w-[130px]">
                  {reviewerName}
                </span>
              </div>

              {isAuthor && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={onToggleMenu}
                    aria-label="Review options"
                    className="w-6 h-6 rounded-md hover:bg-theme-subtle flex items-center justify-center text-theme-muted hover:text-theme-main cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">more_vert</span>
                  </button>

                  {isMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-7 w-32 bg-theme-surface border border-theme rounded-lg shadow-lg py-1 z-30"
                    >
                      <button
                        type="button"
                        onClick={onEdit}
                        className="w-full px-3 py-1.5 text-left text-xs text-theme-main hover:bg-theme-subtle cursor-pointer"
                      >
                        {isAmharic ? 'አስተካክል' : 'Edit'}
                      </button>
                      <button
                        type="button"
                        onClick={onDelete}
                        className="w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-theme-subtle cursor-pointer"
                      >
                        {isAmharic ? 'ሰርዝ' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <h2 className="font-serif text-lg sm:text-xl font-bold text-theme-main leading-snug line-clamp-2">
            {bookTitle}
          </h2>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-theme-muted">
            {book?.author_name && (
              <span className="font-serif truncate max-w-[180px]">
                {isAmharic ? `በ${book.author_name}` : `by ${book.author_name}`}
              </span>
            )}
            <div className="flex items-center gap-1">
              <StarRating rating={review.rating} size={13} />
              <span className="font-semibold text-theme-main">
                {Number(review.rating).toFixed(1)}
              </span>
            </div>
          </div>

          {pullQuote && (
            <p className="font-serif italic text-[13px] text-theme-main line-clamp-1 pt-0.5">
              “{pullQuote}”
            </p>
          )}

          {excerpt && (
            <p className="text-xs text-theme-body leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="pt-2.5 border-t border-theme/60">
        <div className="flex items-center justify-between gap-2 text-[11px] text-theme-muted">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onLike}
              aria-label={isAmharic ? 'ውደድ' : 'Like review'}
              title={isAmharic ? 'ውደድ' : 'Like review'}
              className={`flex items-center gap-1 rounded hover:text-theme-main transition-colors cursor-pointer ${
                isLiked ? 'text-theme-accent font-semibold' : ''
              }`}
            >
              <span
                className="material-symbols-outlined text-[15px] leading-none"
                style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
              >
                favorite
              </span>
              {review.like_count > 0 && <span>{review.like_count}</span>}
            </button>

            <button
              type="button"
              onClick={onToggleComments}
              aria-label={isAmharic ? 'አስተያየት' : 'Comments'}
              title={isAmharic ? 'አስተያየት' : 'Comments'}
              className={`flex items-center gap-1 rounded hover:text-theme-main transition-colors cursor-pointer ${
                isCommentOpen ? 'text-theme-main' : ''
              }`}
            >
              <span className="material-symbols-outlined text-[15px] leading-none">
                chat_bubble_outline
              </span>
              {review.comment_count > 0 && <span>{review.comment_count}</span>}
            </button>

            <button
              type="button"
              onClick={onSave}
              aria-label={isSaved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save review'}
              title={isSaved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save review'}
              className={`flex items-center rounded hover:text-theme-main transition-colors cursor-pointer ${
                isSaved ? 'text-theme-accent' : ''
              }`}
            >
              <span
                className="material-symbols-outlined text-[15px] leading-none"
                style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
          </div>

          {formattedDate && (
            <time
              dateTime={review.created_at}
              title={
                review.created_at && !Number.isNaN(new Date(review.created_at).getTime())
                  ? new Date(review.created_at).toLocaleString(isAmharic ? 'am-ET' : 'en-ET', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : undefined
              }
              className="text-[11px] text-theme-muted whitespace-nowrap"
            >
              {formattedDate}
            </time>
          )}
        </div>

        {isCommentOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 pt-3 border-t border-theme/70 flex flex-col gap-2"
          >
            {comments.map((comment) => (
              <div key={comment.id} className="bg-theme-subtle rounded-lg p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-theme-main">{comment.author}</p>
                  <span className="text-[10px] text-theme-muted">{comment.timeAgo}</span>
                </div>
                <p className="text-theme-body mt-1 whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))}

            <form onSubmit={onCommentSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={commentValue}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder={isAmharic ? 'አስተያየት ይጻፉ...' : 'Write a comment...'}
                className="flex-1 bg-theme-subtle border border-theme rounded-lg px-2.5 py-2 text-xs text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-semibold cursor-pointer"
              >
                {isAmharic ? 'ለጥፍ' : 'Post'}
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};