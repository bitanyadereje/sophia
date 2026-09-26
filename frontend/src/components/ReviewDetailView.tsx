import React, { useState } from 'react';
import { Review, UserProfile, Book, ScreenId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReviewDetailViewProps {
  review: Review;
  currentUser: UserProfile;
  book?: Book;
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBook: (bookId: string) => void;
  onToggleLike: (reviewId: string) => void;
  onToggleSave: (reviewId: string) => void;
  onShowToast: (message: string) => void;
}

interface ReviewCommentItem {
  id: string;
  author: string;
  avatar: string;
  affiliation: string;
  timeAgo: string;
  text: string;
}

export const ReviewDetailView: React.FC<ReviewDetailViewProps> = ({
  review,
  currentUser,
  book,
  onBack,
  onNavigate,
  onSelectBook,
  onToggleLike,
  onToggleSave,
  onShowToast,
}) => {
  const { isAmharic } = useLanguage();
  const [commentInput, setCommentInput] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [comments, setComments] = useState<ReviewCommentItem[]>([
    {
      id: 'c1',
      author: 'Dr. Evangeline Cross',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbdfRAKk35BW6gkd_1e7kDdTp2bJQ3UboaWDRXt5sYS4lkEw4Tvo3NkwF2gKWRSxp8nZuUSaqdEGoWvZhbbc7xPuDhQ8z97FeBflbEC3mvfQ5BTse70lPn--rP0oA8i9cvPxH3MYrFUcYWO67zxqwQNVqMSS2GJIJCkFdf24-dW1B5Scpeuv_G0cBBAPP8yb495Cj4b9mOt9791HhybOkqYa_VphpvUIx6Y0r-z_WkK5Mt4Ez6HEWzJw',
      affiliation: 'Louvain Research Fellow',
      timeAgo: '2d ago',
      text: 'Superb analysis of the distentio animi. The contrast between psychological time and God’s immutable eternal present is so frequently flattened in secular treatments.'
    },
    {
      id: 'c2',
      author: 'Beatrice Moreau',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA',
      affiliation: 'Sorbonne / Sophia Fellow',
      timeAgo: '1d ago',
      text: 'One of the most striking aspects here is how closely this anticipates modern phenomenology without conceding the loss of the transcendent source.'
    }
  ]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) {
      onShowToast(isAmharic ? 'እባክዎ ከመለጠፍዎ በፊት ማሰላሰያ ይጻፉ' : 'Please write a reflection before posting');
      return;
    }

    const newComment: ReviewCommentItem = {
      id: `comm-${Date.now()}`,
      author: currentUser.name,
      avatar: currentUser.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA',
      affiliation: currentUser.title || (isAmharic ? 'የሶፊያ አንባቢ' : 'Sophia Reader'),
      timeAgo: isAmharic ? 'አሁን' : 'Just now',
      text: commentInput.trim()
    };

    setComments(prev => [...prev, newComment]);
    setCommentInput('');
    onShowToast(isAmharic ? 'ማሰላሰያው ወደ ግምገማ ውይይት ተለጥፏል' : 'Reflection posted to review discussion');
  };

  const handleCopyCitation = () => {
    const textToCopy = `"${review.quote}" — ${review.citation} (Review by ${review.reviewerName} on ${review.bookTitle})`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(textToCopy);
    }
    onShowToast(isAmharic ? 'ጥቅሱ ተገልብጧል' : 'Citation copied to clipboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Top Navigation & Breadcrumb */}
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
          {/* Like Button */}
          <button
            onClick={() => onToggleLike(review.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
              review.userLiked
                ? 'border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30 text-red-600 font-semibold'
                : 'border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
            }`}
            id="detail-like-btn"
            title={review.userLiked ? (isAmharic ? 'መውደድ አንሳ' : 'Unlike review') : (isAmharic ? 'ውደድ' : 'Like review')}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: review.userLiked ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
            <span>{review.likesCount ?? 0}</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => onToggleSave(review.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
              review.userSaved
                ? 'border-theme-accent bg-theme-accent-light text-theme-accent font-semibold'
                : 'border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
            }`}
            id="detail-save-btn"
            title={review.userSaved ? (isAmharic ? 'ከተቀመጡ አስወግድ' : 'Remove from saved') : (isAmharic ? 'አስቀምጥ' : 'Save review')}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: review.userSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              bookmark
            </span>
            <span>{review.userSaved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : (isAmharic ? 'አስቀምጥ' : 'Save')}</span>
          </button>

          {/* Copy Citation */}
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

      {/* Main Review Article Container */}
      <article className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Reviewer Header Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme/60 pb-5">
          <div className="flex items-center gap-3.5">
            <img
              src={review.reviewerAvatar}
              alt={review.reviewerName}
              className="w-13 h-13 rounded-full object-cover border border-theme shadow-2xs flex-shrink-0"
            />
            <div>
              <h2 className="text-base font-serif font-bold text-theme-main leading-snug">
                {review.reviewerName}
              </h2>
              <p className="text-xs text-theme-muted font-sans mt-0.5">
                {review.reviewerAffiliation}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-theme-subtle font-sans">
                  Published {review.date}
                </span>
                <span className="text-[11px] text-theme-subtle">·</span>
                <span className="text-[11px] text-theme-subtle font-sans">
                  Scholarly Critique
                </span>
              </div>
            </div>
          </div>

          {/* Star Rating & Score */}
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
              Critical Assessment
            </span>
          </div>
        </div>

        {/* Associated Book Banner */}
        <div className="bg-theme-subtle/50 border border-theme/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-theme-muted bg-theme-subtle border border-theme/60 px-2 py-0.5 rounded-full">
                {review.tradition}
              </span>
              {review.chapterFocus && (
                <span className="text-[11px] text-theme-accent font-sans font-medium">
                  {review.chapterFocus}
                </span>
              )}
            </div>
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
              {review.bookTitle}
            </h1>
            <p className="text-sm font-serif italic text-theme-muted">
              by {review.bookAuthor}
            </p>
          </div>

          {review.bookId && (
            <button
              onClick={() => onSelectBook(review.bookId!)}
              className="self-start sm:self-center flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 transition-opacity text-xs font-sans font-semibold cursor-pointer shadow-xs whitespace-nowrap"
              id="view-book-detail-btn"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>{isAmharic ? 'የመጽሐፍ ዝርዝር እይ' : 'Explore Book Codex'}</span>
            </button>
          )}
        </div>

        {/* Featured Quote & Academic Citation */}
        <div className="bg-theme-subtle/30 rounded-xl p-5 sm:p-6 border-l-4 border-theme-accent border-theme space-y-2.5">
          <blockquote className="font-serif text-base sm:text-lg text-theme-main italic leading-relaxed">
            &ldquo;{review.quote}&rdquo;
          </blockquote>
          {review.citation && (
            <p className="text-xs font-serif font-light text-theme-muted italic">
              — {review.citation}
            </p>
          )}
        </div>

        {/* Historical Context Callout if available */}
        {review.historicalContext && (
          <div className="bg-theme-subtle/40 border border-theme rounded-xl p-4 sm:p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-sans font-semibold uppercase tracking-wider text-theme-muted">
              <span className="material-symbols-outlined text-[16px] text-theme-accent">history_edu</span>
              <span>Historical & Compositional Setting</span>
            </div>
            <p className="text-xs sm:text-sm text-theme-body leading-relaxed font-sans">
              {review.historicalContext}
            </p>
          </div>
        )}

        {/* Full Review Text & Thematic Analysis */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-theme-muted border-b border-theme/40 pb-2">
            Theological Exegesis & Commentary
          </h3>
          
          <div className="prose prose-stone dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-theme-body font-serif space-y-4">
            {review.fullReview ? (
              review.fullReview.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="leading-relaxed">
                {review.quote}
              </p>
            )}
          </div>
        </div>

        {/* Thematic Tags / Keywords */}
        {review.keyThemes && review.keyThemes.length > 0 && (
          <div className="pt-4 border-t border-theme/60 space-y-2">
            <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-theme-muted block">
              Core Themes
            </span>
            <div className="flex flex-wrap gap-2">
              {review.keyThemes.map((theme, i) => (
                <span
                  key={i}
                  className="text-xs font-sans px-2.5 py-1 rounded-md bg-theme-subtle text-theme-body border border-theme/60"
                >
                  #{theme}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Discussion & Community Comments Section */}
      <section className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-theme/60 pb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-theme-accent text-[20px]">
              forum
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
              Scholarly Dialectic & Discussions
            </h3>
            <span className="text-xs text-theme-muted font-sans bg-theme-subtle px-2 py-0.5 rounded-full border border-theme/60">
              {comments.length}
            </span>
          </div>

          <button
            onClick={() => onNavigate('colloquium')}
            className="text-xs font-sans font-medium text-theme-accent hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{isAmharic ? 'የመጽሐፍ ውይይት ክፈት' : 'Open Colloquium'}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Comments List */}
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

        {/* Add Reflection Input Form (Placed at the bottom after existing comments) */}
        <div className="pt-4 border-t border-theme/60">
          <form onSubmit={handleAddComment} className="flex items-center gap-3">
            {/* Circular Profile Picture with Fallback */}
            {!avatarFailed ? (
              <img
                src={currentUser.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA'}
                alt={currentUser.name}
                onError={() => setAvatarFailed(true)}
                className="w-10 h-10 rounded-full object-cover border border-theme shadow-xs flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-sm border border-theme shadow-xs flex-shrink-0">
                {currentUser.name ? currentUser.name.charAt(0) : 'B'}
              </div>
            )}

            {/* Input field with integrated minimalistic send icon at the far-right edge */}
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={isAmharic ? 'ማሰላሰያ ወይም አስተያየት እዚህ ይጻፉ...' : 'Contribute a dialectical reflection or textual query...'}
                className="w-full h-11 pl-4 pr-11 text-xs sm:text-sm rounded-xl border border-[#d6d0c4] dark:border-stone-700 bg-theme-surface text-theme-main placeholder:text-stone-800 dark:placeholder:text-stone-200 placeholder:opacity-100 placeholder:font-normal focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 focus:ring-0 transition-colors font-sans shadow-2xs"
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
