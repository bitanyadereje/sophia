import React, { useEffect, useState } from 'react';
import { Review, UserProfile, Book, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { getReviewerProfile } from '../review.service';
import { getReviewLikeData, toggleReviewLike } from '../services/reviewInteraction.service';
import { addReviewComment, loadReviewComments } from '../services/reviewComment.service';

interface ReviewDetailViewProps {
  review: Review;
  currentUser: UserProfile;
  book?: Book;
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBook: (bookId: string) => void;
  onShowToast: (message: string) => void;
}

export const ReviewDetailView: React.FC<ReviewDetailViewProps> = ({
  review,
  currentUser,
  book,
  onBack,
  onNavigate,
  onSelectBook,
  onShowToast,
}) => {
  const { isAmharic } = useLanguage();
  const [commentInput, setCommentInput] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadDetailData = async () => {
      try {
        const profile = await getReviewerProfile(review.user_id);
        if (isCurrent && profile) {
          setAuthorProfile({ name: profile.name || 'Reader', avatar: profile.avatar || '' });
        }
      } catch (error) {
        console.error(error);
      }

      try {
        const dbComments = await loadReviewComments(review.id);
        if (isCurrent) {
          setComments(dbComments.map((comment) => ({
            id: comment.id,
            author: comment.author?.name || 'Reader',
            avatar: comment.author?.avatar_url || '',
            affiliation: 'Sophia Reader',
            timeAgo: new Date(comment.created_at).toLocaleDateString(),
            text: comment.content,
          })));
        }
      } catch (error) {
        console.error(error);
      }

      try {
        const likeData = await getReviewLikeData(review.id, currentUser?.id);
        if (isCurrent) {
          setLikeCount(likeData.totalLikes);
          setIsLiked(likeData.isLikedByMe);
        }
      } catch (error) {
        console.error(error);
      }
    };
    void loadDetailData();
    return () => { isCurrent = false; };
  }, [review.id, review.user_id, currentUser?.id]);

  const handleLike = async () => {
    if (!currentUser?.id) {
      onShowToast('Sign in to like reviews.');
      return;
    }
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      await toggleReviewLike(review.id, currentUser.id, prevLiked);
    } catch (error) {
      console.error('Failed to toggle review like:', error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      onShowToast(error instanceof Error ? error.message : 'Failed to update like');
    }
  };

  const reviewDate = new Date(review.created_at).toLocaleDateString(
    isAmharic ? 'am-ET' : 'en',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    if (!currentUser?.id) {
      onShowToast('Sign in to comment on reviews.');
      return;
    }

    const text = commentInput.trim();
    setCommentInput('');

    try {
      const newDbComment = await addReviewComment(review.id, currentUser.id, text);
      setComments((prev) => [...prev, {
        id: newDbComment.id,
        author: currentUser.name || 'Reader',
        avatar: currentUser.avatar || '',
        affiliation: 'Sophia Reader',
        timeAgo: 'Just now',
        text,
      }]);
      onShowToast('Reflection posted!');
    } catch (error) {
      console.error('Failed to post review comment:', error);
      onShowToast(error instanceof Error ? error.message : 'Failed to post comment');
      setCommentInput(text);
    }
  };
  const handleCopyCitation = () => {
    const textToCopy = `"${review.quote ?? ''}" — ${book?.title ?? 'Review'} (Review by ${currentUser.name})`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    onShowToast(isAmharic ? 'ጥቅሱ ተገልብጧል' : 'Citation copied to clipboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">

        {/* Top Navigation & Actions */}
        <div className="flex items-center justify-between gap-4 border-b border-theme pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-theme-muted hover:text-theme-main transition-colors cursor-pointer group"
            id="back-to-reviews-btn"
          >
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">
              arrow_back
            </span>
            <span>{isAmharic ? 'ወደ መጽሐፍ ዳሰሳዎች ተመለስ' : 'Back to Reviews'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle text-xs font-sans transition-colors cursor-pointer"
              id="detail-like-btn"
              title={isAmharic ? 'ውደድ' : 'Like review'}
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => {}}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle text-xs font-sans transition-colors cursor-pointer"
              id="detail-save-btn"
              title={isAmharic ? 'አስቀምጥ' : 'Save review'}
            >
              <span className="material-symbols-outlined text-[16px]">bookmark</span>
              <span>{isAmharic ? 'አስቀምጥ' : 'Save'}</span>
            </button>

            <button
              onClick={handleCopyCitation}
              className="p-1.5 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
              title={isAmharic ? 'ጥቅስ ገልብጥ' : 'Copy academic citation'}
              id="detail-citation-btn"
            >
              <span className="material-symbols-outlined text-[17px]">content_copy</span>
            </button>
          </div>
        </div>

        {/* Main Review Article */}
        <article className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">

          {/* Reviewer Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme/60 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-lg border border-theme shadow-2xs flex-shrink-0">
                {authorProfile?.avatar ? (
                  <img src={authorProfile.avatar} alt={authorProfile.name} className="w-full h-full rounded-full object-cover" />
                ) : (authorProfile?.name || 'Reader').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-base font-serif font-bold text-theme-main leading-snug">
                  {authorProfile?.name || 'Reader'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-theme-subtle font-sans">
                    {isAmharic ? 'የታተመ' : 'Published'} {reviewDate}
                  </span>
                  <span className="text-[11px] text-theme-subtle">·</span>
                  <span className="text-[11px] text-theme-subtle font-sans">
                    {isAmharic ? 'ትችት' : 'Reader Review'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="material-symbols-outlined text-[18px] text-theme-gold"
                    style={{ fontVariationSettings: i < Math.floor(review.rating) ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    star
                  </span>
                ))}
                <span className="text-sm font-bold text-theme-main ml-1.5 font-sans">
                  {review.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-[11px] text-theme-muted font-sans">
                {isAmharic ? 'ደረጃ' : 'Rating'}
              </span>
            </div>
          </div>

          {/* Book Banner */}
          {book && (
            <div className="bg-theme-subtle/50 border border-theme/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
                  {book.title}
                </h1>
                <p className="text-sm font-serif italic text-theme-muted">
                  {isAmharic ? 'ደራሲ' : 'by'} {book.author_name}
                </p>
              </div>

              <button
                onClick={() => onSelectBook(book.id)}
                className="self-start sm:self-center flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 transition-opacity text-xs font-sans font-semibold cursor-pointer shadow-xs whitespace-nowrap"
                id="view-book-detail-btn"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>{isAmharic ? 'የመጽሐፍ ዝርዝር እይ' : 'View Book'}</span>
              </button>
            </div>
          )}

          {/* Review Title */}
          {review.title && (
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-theme-main">
              {review.title}
            </h2>
          )}

          {/* Featured Quote */}
          {review.quote && (
            <div className="bg-theme-subtle/30 rounded-xl p-5 sm:p-6 border-l-4 border-theme-accent border-theme">
              <blockquote className="font-serif text-base sm:text-lg text-theme-main italic leading-relaxed">
                &ldquo;{review.quote}&rdquo;
              </blockquote>
            </div>
          )}

          {/* Review Body */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-theme-muted border-b border-theme/40 pb-2">
              {isAmharic ? 'ግምገማ' : 'Review'}
            </h3>

            <div className="text-sm sm:text-base leading-relaxed text-theme-body font-serif space-y-4">
              {review.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-theme/60 pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-theme-accent text-[20px]">forum</span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
                {isAmharic ? 'አስተያየቶች' : 'Comments'}
              </h3>
              <span className="text-xs text-theme-muted font-sans bg-theme-subtle px-2 py-0.5 rounded-full border border-theme/60">
                {comments.length}
              </span>
            </div>

            <button
              onClick={() => onNavigate('colloquium')}
              className="text-xs font-sans font-medium text-theme-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAmharic ? 'ውይይት ክፈት' : 'Open Discussion'}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

          {comments.length === 0 ? (
            <div className="text-center py-6">
              <span className="material-symbols-outlined text-theme-subtle text-3xl">chat_bubble_outline</span>
              <p className="text-xs text-theme-muted mt-2">
                {isAmharic ? 'እስካሁን አስተያየት የለም' : 'No comments yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-xl border border-theme/70 bg-theme-subtle/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="w-7 h-7 rounded-full object-cover border border-theme flex-shrink-0"
                      />
                      <div>
                        <span className="text-xs font-serif font-bold text-theme-main block">
                          {comment.author}
                        </span>
                        <span className="text-[10px] text-theme-muted font-sans block">
                          {comment.affiliation}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-theme-subtle font-sans">
                      {comment.timeAgo}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-theme-body font-sans leading-relaxed pl-9.5">
                    {comment.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-theme/60">
            <form onSubmit={handleAddComment} className="flex items-center gap-3">
              {!avatarFailed && currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  onError={() => setAvatarFailed(true)}
                  className="w-10 h-10 rounded-full object-cover border border-theme shadow-xs flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-sm border border-theme shadow-xs flex-shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0) : 'B'}
                </div>
              )}

              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder={isAmharic ? 'ማሰላሰያ ወይም አስተያየት እዚህ ይጻፉ...' : 'Contribute a reflection or question...'}
                  className="w-full h-11 pl-4 pr-11 text-xs sm:text-sm rounded-xl border border-[#d6d0c4] dark:border-stone-700 bg-theme-surface text-theme-main placeholder:text-stone-800 dark:placeholder:text-stone-200 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-0 transition-colors font-sans shadow-2xs"
                  id="review-comment-input"
                />
                <button
                  type="submit"
                  aria-label={isAmharic ? 'ማሰላሰያ ለጥፍ' : 'Send reflection'}
                  className={`absolute right-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                    commentInput.trim()
                      ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 hover:opacity-90 active:scale-95 shadow-2xs'
                      : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-700/50'
                  }`}
                  id="submit-review-comment-btn"
                  title={isAmharic ? 'ማሰላሰያ ለጥፍ' : 'Post reflection'}
                >
                  <span className="material-symbols-outlined text-[19px]">send</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
