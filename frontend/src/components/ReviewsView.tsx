import React, { useState, useEffect } from 'react';
import { Review, ScreenId, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReviewsViewProps {
  reviews: Review[];
  currentUser?: UserProfile;
  targetReviewId?: string | null;
  onClearTargetReview?: () => void;
  onAddReview: (review: Review) => void;
  onUpdateReview?: (id: string, updated: Partial<Review>) => void;
  onDeleteReview?: (id: string) => void;
  onSelectBook?: (bookId: string) => void;
  onSelectReview?: (reviewId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  reviews,
  currentUser,
  targetReviewId,
  onClearTargetReview,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  onSelectBook,
  onSelectReview,
  onNavigate,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const [selectedTradition, setSelectedTradition] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  // Local state for saved reviews, active comment drawers, and three-dots menu
  const [savedReviews, setSavedReviews] = useState<Record<string, boolean>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [localCommentsList, setLocalCommentsList] = useState<Record<string, { id: string; author: string; text: string; timeAgo: string }[]>>({});

  // Close overflow menu on outside click
  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  // When navigated to with a specific targetReviewId, open comments, set tradition to All, and scroll into view
  useEffect(() => {
    if (targetReviewId) {
      setSelectedTradition('All');
      setSearchQuery('');
      setActiveCommentId(targetReviewId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`review-${targetReviewId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [targetReviewId]);

  // Review form
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newTradition, setNewTradition] = useState<'Patristic' | 'Orthodox' | 'Scholastic' | 'Soteriology'>('Patristic');
  const [newRating, setNewRating] = useState(5.0);
  const [newQuote, setNewQuote] = useState('');
  const [newCitation, setNewCitation] = useState('');
  const [newFullReview, setNewFullReview] = useState('');
  const [newKeyThemes, setNewKeyThemes] = useState('');

  const traditions = ['All', 'Patristic', 'Orthodox', 'Scholastic', 'Soteriology'];

  const isAuthor = (r: Review) => {
    if (!currentUser?.name || !r.reviewerName) return false;
    return r.reviewerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
  };

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const rev = reviews.find(r => r.id === id);
    if (!rev) return;

    const isCurrentlyLiked = rev.userLiked ?? false;
    const nextState = !isCurrentlyLiked;
    const currentCount = rev.likesCount ?? (rev.id === 'rev-2' ? 68 : rev.id === 'rev-1' ? 42 : 25);

    onUpdateReview?.(id, {
      userLiked: nextState,
      likesCount: nextState ? currentCount + 1 : Math.max(0, currentCount - 1)
    });

    onShowToast(nextState ? 'Liked review' : 'Removed like');
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlySaved = savedReviews[id] ?? false;
    const nextState = !isCurrentlySaved;
    setSavedReviews(prev => ({ ...prev, [id]: nextState }));
    if (onUpdateReview) {
      onUpdateReview(id, { userSaved: nextState });
    }
    onShowToast(nextState ? 'Saved review to bookmarks' : 'Removed review from bookmarks');
  };

  const handleToggleCommentDrawer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCommentId(prev => (prev === id ? null : id));
  };

  const handleAddComment = (reviewId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = commentInputs[reviewId]?.trim();
    if (!text) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      author: currentUser?.name || 'Beatrice Moreau',
      text,
      timeAgo: 'Just now'
    };

    setLocalCommentsList(prev => ({
      ...prev,
      [reviewId]: [...(prev[reviewId] || []), newComment]
    }));

    setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
    onShowToast('Comment posted to review');
  };

  const handleCardClick = (rev: Review) => {
    if (onSelectReview) {
      onSelectReview(rev.id);
    } else if (rev.bookId && onSelectBook) {
      onSelectBook(rev.bookId);
    } else {
      onNavigate('colloquium');
    }
  };

  const handleOpenNewReview = () => {
    setEditingReview(null);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewTradition('Patristic');
    setNewRating(5.0);
    setNewQuote('');
    setNewCitation('');
    setNewFullReview('');
    setNewKeyThemes('');
    setIsWriteReviewOpen(true);
  };

  const handleOpenEditReview = (r: Review, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthor(r)) {
      onShowToast('You can only edit reviews you have written.');
      return;
    }
    setEditingReview(r);
    setNewBookTitle(r.bookTitle);
    setNewBookAuthor(r.bookAuthor);
setNewTradition(r.tradition as 'Patristic' | 'Orthodox' | 'Scholastic' | 'Soteriology');    setNewRating(r.rating);
    setNewQuote(r.quote.replace(/^[“"]|[”"]$/g, ''));
    setNewCitation(r.citation);
    setNewFullReview(r.fullReview || '');
    setNewKeyThemes(r.keyThemes ? r.keyThemes.join(', ') : '');
    setIsWriteReviewOpen(true);
  };

  const handleDeleteReview = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = reviews.find((item) => item.id === id);
    if (target && !isAuthor(target)) {
      onShowToast('You can only delete reviews you have written.');
      return;
    }
    if (onDeleteReview) {
      onDeleteReview(id);
    }
    onShowToast('Review deleted');
  };

  const filteredReviews = reviews.filter((r) => {
    if (selectedTradition !== 'All' && r.tradition !== selectedTradition) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.bookTitle.toLowerCase().includes(q) ||
        r.bookAuthor.toLowerCase().includes(q) ||
        r.reviewerName.toLowerCase().includes(q) ||
        r.quote.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newQuote.trim()) return;

    const parsedThemes = newKeyThemes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingReview && onUpdateReview) {
      onUpdateReview(editingReview.id, {
        bookTitle: newBookTitle,
        bookAuthor: newBookAuthor || 'Historical Author',
        tradition: newTradition,
        rating: newRating,
        quote: `“${newQuote.replace(/^[“"]|[”"]$/g, '')}”`,
        citation: newCitation || 'Source Reference',
        fullReview: newFullReview.trim() || newQuote.trim(),
        keyThemes: parsedThemes.length > 0 ? parsedThemes : undefined
      });
      onShowToast('Review updated');
    } else {
      const created: Review = {
        id: `rev-${Date.now()}`,
        bookTitle: newBookTitle,
        bookAuthor: newBookAuthor || 'Historical Author',
        tradition: newTradition,
        rating: newRating,
        reviewerName: currentUser?.name || 'Beatrice Moreau',
        reviewerAffiliation: currentUser?.title || (isAmharic ? 'የሶፊያ አንባቢ' : 'Sophia Reader'),
        reviewerAvatar:
          currentUser?.avatar ||
          'https://lh3.googleusercontent.com/aida-public/AB6AXuC6SXLN7BmYMhMaHuQx6dHdGP7WSd8gbDml9nW92fqjiNQk4_iMslB3RGC5D_6BZzOnYcL2Zh66XVylOLICR1N7YwIqLTCg2F4NCIRD5oyIZLvleFHsSP1hcr3UeQJUDsUROeWS2K0TjEy9M_eQJjQFQqw-ru56VlLRKmCvbCMvrAEumn6YT9dS3OXU3k2CpGD3iDmB8eyULvQTX7yMnP-qk8WtEoickeJeA_ZxOWEd0v-sVX7e5e1xgA',
        date: 'Today',
        quote: `“${newQuote.replace(/^[“"]|[”"]$/g, '')}”`,
        citation: newCitation || 'Source Reference',
        discussionCount: 0,
        fullReview: newFullReview.trim() || newQuote.trim(),
        keyThemes: parsedThemes.length > 0 ? parsedThemes : [newTradition]
      };

      onAddReview(created);
      onShowToast('Review published');
    }

    setNewBookTitle('');
    setNewBookAuthor('');
    setNewQuote('');
    setNewCitation('');
    setNewFullReview('');
    setNewKeyThemes('');
    setEditingReview(null);
    setIsWriteReviewOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Header Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div>
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
              {isAmharic ? 'የአንባቢዎች መጽሐፍ ዳሰሳዎች' : 'Reader Reviews & Reflections'}
            </h1>
            <p className="text-xs sm:text-sm text-theme-muted">
              {isAmharic ? 'የማህበረሰብ መጽሐፍ ዳሰሳዎች እና ማስታወሻዎች' : 'Community reviews, reflections, and book notes'}
            </p>
          </div>
          <button
            onClick={handleOpenNewReview}
            className="self-start sm:self-center flex items-center gap-1.5 text-xs font-label-md uppercase font-semibold px-4 py-2.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 cursor-pointer shadow-xs transition-opacity"
          >
            <span className="material-symbols-outlined text-[16px]">rate_review</span>
            <span>{isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write Review'}</span>
          </button>
        </div>

        {/* Target Review Focused Banner */}
        {targetReviewId && (
          <div className="p-3 rounded-xl bg-theme-accent-light border border-theme-accent/30 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-theme-accent text-[20px]">menu_book</span>
              <div>
                <p className="text-xs font-serif font-semibold text-theme-main">
                  {isAmharic ? 'የተመረጠውን መጽሐፍ ዳሰሳ በማየት ላይ' : 'Viewing specific book review'}
                </p>
                <p className="text-[11px] text-theme-muted font-serif">
                  {isAmharic ? 'የተመረጠው መጽሐፍ ዳሰሳ እና ተያያዥ ውይይት ከታች ቀርቧል' : 'Highlighting the requested review and scholarly discussion below'}
                </p>
              </div>
            </div>
            {onClearTargetReview && (
              <button
                onClick={onClearTargetReview}
                className="text-xs font-serif text-theme-accent hover:underline cursor-pointer font-medium px-2.5 py-1 rounded bg-theme-surface border border-theme"
              >
                {isAmharic ? 'ሁሉንም መጽሐፍ ዳሰሳዎች እይ' : 'View All Reviews'}
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-subtle text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAmharic ? 'መጽሐፍ ዳሰሳዎችን በመጽሐፍ፣ ደራሲ ወይም አቅራቢ ፈልግ...' : 'Filter reviews by book, author, or reviewer...'}
            className="w-full bg-theme-surface border border-theme rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-theme-main placeholder:text-theme-subtle focus:outline-none focus:border-theme-accent shadow-2xs"
          />
        </div>

        {/* Tradition Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {traditions.map((trad) => {
            const tradLabel = trad === 'All' 
              ? (isAmharic ? 'ሁሉም ወጎች' : 'All Traditions')
              : trad === 'Patristic' ? (isAmharic ? 'ፓትሪስቲክ' : 'Patristic')
              : trad === 'Orthodox' ? (isAmharic ? 'ኦርቶዶክስ' : 'Orthodox')
              : trad === 'Scholastic' ? (isAmharic ? 'ስኮላስቲክ' : 'Scholastic')
              : trad === 'Soteriology' ? (isAmharic ? 'ሶቴሪዮሎጂ' : 'Soteriology')
              : trad;

            return (
              <button
                key={trad}
                onClick={() => setSelectedTradition(trad)}
                className={`text-xs font-label-md px-3.5 py-1.5 rounded-full cursor-pointer transition-all whitespace-nowrap ${
                  selectedTradition === trad
                    ? 'bg-theme-main text-theme-surface font-semibold shadow-xs'
                    : 'bg-theme-subtle text-theme-muted hover:bg-theme-muted'
                }`}
              >
                {tradLabel}
              </button>
            );
          })}
        </div>

        {/* Reviews Cards: Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const isLiked = rev.userLiked ?? false;
            const likesCount = rev.likesCount ?? (rev.id === 'rev-2' ? 68 : rev.id === 'rev-1' ? 42 : 25);
            const isSaved = savedReviews[rev.id] ?? rev.userSaved ?? false;
            const comments = localCommentsList[rev.id] || [];
            const isCommentDrawerOpen = activeCommentId === rev.id;

            return (
              <article
                key={rev.id}
                id={`review-${rev.id}`}
                onClick={() => handleCardClick(rev)}
                className={`bg-theme-surface rounded-xl p-4 sm:p-5 border transition-all ${
                  targetReviewId === rev.id
                    ? 'border-theme-accent ring-2 ring-theme-accent/50 shadow-md'
                    : 'border-theme shadow-xs hover:border-theme-accent/60 hover:shadow-md'
                } flex flex-col justify-between gap-3 hover:bg-theme-subtle/30 cursor-pointer`}
              >
                <div>
                  {/* Top Header Row: Unified layout with flexible space for institution and strict right alignment */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Reviewer Identity Block */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={rev.reviewerAvatar}
                        alt={rev.reviewerName}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 flex-shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-label-lg text-sm text-theme-main font-semibold truncate">
                            {rev.reviewerName}
                          </span>
                        </div>
                        {/* Institution/Location: Expands into available space before ellipsis */}
                        <span className="text-[11px] text-theme-muted truncate" title={rev.reviewerAffiliation}>
                          {rev.reviewerAffiliation}
                        </span>
                      </div>
                    </div>

                    {/* Top Right Cluster: Strict right-aligned grid for Badge, Overflow Menu, and Date */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 relative">
                      <div className="flex items-center gap-1.5">
                        {isAuthor(rev) && (
                          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-theme-accent bg-theme-accent-light border border-theme-accent/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {isAmharic ? 'የእርስዎ ግምገማ' : 'Your Review'}
                          </span>
                        )}

                        {/* Three-dots overflow menu for user-owned reviews */}
                        {isAuthor(rev) && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === rev.id ? null : rev.id);
                              }}
                              className="w-6 h-6 rounded-md hover:bg-theme-subtle flex items-center justify-center text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
                              title={isAmharic ? 'የግምገማ አማራጮች' : 'Review options'}
                              aria-label={isAmharic ? 'የግምገማ አማራጮች' : 'Review options'}
                            >
                              <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </button>
                            {activeMenuId === rev.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-7 w-32 bg-theme-surface border border-theme rounded-lg shadow-lg py-1 z-30 animate-fade-in"
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setActiveMenuId(null);
                                    handleOpenEditReview(rev, e);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs font-sans text-theme-main hover:bg-theme-subtle flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px]">edit</span>
                                  <span>{isAmharic ? 'አስተካክል' : 'Edit'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setActiveMenuId(null);
                                    handleDeleteReview(rev.id, e);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-xs font-sans text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                  <span>{isAmharic ? 'አጥፋ' : 'Delete'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Standardize Date Alignment: Strict right-aligned grid, Text-Muted for all dates */}
                      <span className="text-[11px] text-theme-muted font-sans text-right tracking-tight tabular-nums whitespace-nowrap">
                        {rev.date}
                      </span>
                    </div>
                  </div>

                  {/* Book Metadata & Rating: Un-nested container with no book cover image */}
                  <div className="my-3 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-serif text-[15px] font-bold text-theme-main truncate leading-tight">
                        {rev.bookTitle}
                      </h4>
                      {/* Category Tag: Demoted to Secondary / Surface-variant color */}
                      <span className="text-[10px] font-sans font-medium uppercase tracking-wider text-theme-muted bg-theme-subtle border border-theme/60 px-2 py-0.5 rounded-full flex-shrink-0">
                        {rev.tradition}
                      </span>
                    </div>
                    <p className="text-xs text-theme-muted font-serif truncate">
                      by {rev.bookAuthor}
                    </p>

                    {/* Star Ratings: Positioned under title and author */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className="material-symbols-outlined text-[14px] text-theme-gold"
                            style={{ fontVariationSettings: i < Math.floor(rev.rating) ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-theme-main">{rev.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Primary Quote & Citation: Clean typographic hierarchy with NO hard divider */}
                  <div className="space-y-1.5 my-2.5">
                    <blockquote className="font-serif text-[14px] sm:text-[15px] text-theme-main italic leading-relaxed pl-3.5 border-l-2 border-theme-accent">
                      &ldquo;{rev.quote}&rdquo;
                    </blockquote>
                    {rev.citation && (
                      <p className="pl-3.5 text-xs font-serif font-light text-theme-muted italic">
                        — {rev.citation}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar: Evenly distributed using flex with space-between across full width */}
                <div className="pt-3 border-t border-theme/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full text-xs text-theme-muted">
                    {/* Left: Like Action */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(rev.id, e)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle transition-colors cursor-pointer ${
                        isLiked ? 'text-red-500 font-semibold' : 'hover:text-theme-main'
                      }`}
                      title={isLiked ? (isAmharic ? 'መውደድ አንሳ' : 'Unlike') : (isAmharic ? 'ውደድ' : 'Like Review')}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        favorite
                      </span>
                      <span className="font-sans tabular-nums">{likesCount}</span>
                    </button>

                    {/* Center: Comment & Discussions Action */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleCommentDrawer(rev.id, e)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle transition-colors cursor-pointer ${
                        isCommentDrawerOpen ? 'text-theme-accent font-semibold' : 'hover:text-theme-main'
                      }`}
                      title={isAmharic ? 'አስተያየቶችን እና ውይይቶችን እይ' : 'View comments and scholarly discussions'}
                    >
                      <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                      <span className="font-sans">
                        {comments.length > 0
                          ? (isAmharic ? `${comments.length} አስተያየቶች` : `${comments.length} Comments`)
                          : rev.discussionCount > 0
                          ? (isAmharic ? `${rev.discussionCount} ውይይቶች` : `${rev.discussionCount} Discussions`)
                          : (isAmharic ? 'አስተያየት' : 'Comment')}
                      </span>
                    </button>

                    {/* Right: Save Review Action */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleSave(rev.id, e)}
                      className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle transition-colors cursor-pointer ${
                        isSaved ? 'text-theme-accent font-semibold' : 'hover:text-theme-main'
                      }`}
                      title={isSaved ? (isAmharic ? 'ከተቀመጡ አስወግድ' : 'Remove from saved') : (isAmharic ? 'አስቀምጥ' : 'Save review')}
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bookmark
                      </span>
                      <span className="font-sans">{isSaved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : (isAmharic ? 'አስቀምጥ' : 'Save')}</span>
                    </button>
                  </div>

                  {/* Expandable Comment Drawer */}
                  {isCommentDrawerOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 pt-2.5 border-t border-theme/70 flex flex-col gap-2.5"
                    >
                      {comments.length > 0 && (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {comments.map((c) => (
                            <div key={c.id} className="bg-theme-subtle/80 rounded-lg p-2 text-xs">
                              <div className="flex items-center justify-between text-[10px] text-theme-muted mb-0.5">
                                <span className="font-semibold text-theme-main">{c.author}</span>
                                <span>{c.timeAgo}</span>
                              </div>
                              <p className="text-theme-body font-serif">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <form onSubmit={(e) => handleAddComment(rev.id, e)} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInputs[rev.id] || ''}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [rev.id]: e.target.value }))
                          }
                          placeholder={isAmharic ? 'በዚህ ግምገማ ላይ አስተያየት ይጻፉ...' : 'Write a comment on this review...'}
                          className="flex-1 bg-theme-subtle border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main placeholder:text-theme-subtle focus:outline-none focus:border-theme-accent"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 text-xs font-semibold cursor-pointer transition-opacity"
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
              <span className="material-symbols-outlined text-3xl text-theme-subtle mb-2">rate_review</span>
              <h3 className="font-serif text-[16px] font-bold text-theme-main">
                {isAmharic ? 'ምንም መጽሐፍ ዳሰሳ አልተገኘም' : 'No reviews found'}
              </h3>
              <p className="text-xs text-theme-muted mt-1 mb-4">
                {isAmharic ? 'በዚህ ፍለጋ የተገኘ መጽሐፍ ዳሰሳ የለም። የመጀመሪያውን መጽሐፍ ዳሰሳ ይጻፉ።' : 'No reviews match your search filter. Write the first review.'}
              </p>
              <button
                onClick={handleOpenNewReview}
                className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface font-label-md text-xs uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Write / Edit Review Modal */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form
            onSubmit={handleSubmitReview}
            className="w-full sm:max-w-lg bg-theme-surface rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border border-theme max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-accent text-[20px]">rate_review</span>
                <h3 className="font-serif text-lg font-bold text-theme-main">
                  {editingReview 
                    ? (isAmharic ? 'መጽሐፍ ዳሰሳ አስተካክል' : 'Edit Review') 
                    : (isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write Review')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer"
                aria-label={isAmharic ? 'ዝጋ' : 'Close'}
                title={isAmharic ? 'ዝጋ' : 'Close'}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                    {isAmharic ? 'የመጽሐፍ ርዕስ' : 'Book Title'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    placeholder="e.g. Confessions, De Trinitate"
                    className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                    {isAmharic ? 'ደራሲ' : 'Author'}
                  </label>
                  <input
                    type="text"
                    value={newBookAuthor}
                    onChange={(e) => setNewBookAuthor(e.target.value)}
                    placeholder="e.g. Augustine of Hippo"
                    className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                    {isAmharic ? 'ትውፊት' : 'Tradition'}
                  </label>
                  <select
                    value={newTradition}
                    onChange={(e) => setNewTradition(e.target.value as any)}
                    className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                  >
                    <option value="Patristic">{isAmharic ? 'ፓትሪስቲክ' : 'Patristic'}</option>
                    <option value="Orthodox">{isAmharic ? 'ኦርቶዶክስ' : 'Orthodox'}</option>
                    <option value="Scholastic">{isAmharic ? 'ስኮላስቲክ' : 'Scholastic'}</option>
                    <option value="Soteriology">{isAmharic ? 'ሶቴሪዮሎጂ' : 'Soteriology'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                    {isAmharic ? 'ደረጃ (1.0 – 5.0)' : 'Rating (1.0 – 5.0)'}
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={newRating}
                    onChange={(e) => setNewRating(parseFloat(e.target.value))}
                    className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'አንኳር ጥቅስ / ማጠቃለያ' : 'Key Takeaway / Highlight Quote'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={newQuote}
                  onChange={(e) => setNewQuote(e.target.value)}
                  placeholder={isAmharic ? 'ከዚህ መጽሐፍ ዋናውን ማጠቃለያ ወይም ጥቅስ ያጋሩ...' : 'Share a key takeaway or quote from this book...'}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-xs text-theme-main focus:outline-none focus:border-theme-accent resize-none font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'ሙሉ ዝርዝር ግምገማ (አማራጭ)' : 'Full Detailed Review & Commentary (Optional)'}
                </label>
                <textarea
                  rows={4}
                  value={newFullReview}
                  onChange={(e) => setNewFullReview(e.target.value)}
                  placeholder={isAmharic ? 'የመጽሐፉን ስነ-መለኮታዊ ክርክሮች፣ ዘዴዎች እና ግንዛቤዎች በዝርዝር ይግለጹ...' : "Elaborate on the book's theological arguments, methods, and insights for the full details page..."}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-xs text-theme-main focus:outline-none focus:border-theme-accent resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                    {isAmharic ? 'ምንጭ / ምዕራፍ (አማራጭ)' : 'Citation (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={newCitation}
                    onChange={(e) => setNewCitation(e.target.value)}
                    placeholder="e.g. Book VIII.12 or CCL 27"
                    className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                    {isAmharic ? 'ዋና ዋና ጭብጦች' : 'Key Themes (comma-separated)'}
                  </label>
                  <input
                    type="text"
                    value={newKeyThemes}
                    onChange={(e) => setNewKeyThemes(e.target.value)}
                    placeholder="e.g. Memory, Christology, Hesychia"
                    className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent font-sans"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5 pt-3 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsWriteReviewOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle text-theme-muted font-label-md text-xs uppercase tracking-wider cursor-pointer hover:bg-theme-muted"
              >
                {isAmharic ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-theme-main text-white font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-theme-main/90"
              >
                {editingReview 
                  ? (isAmharic ? 'ለውጦችን አስቀምጥ' : 'Save Changes') 
                  : (isAmharic ? 'መጽሐፍ ዳሰሳ ለጥፍ' : 'Publish Review')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};