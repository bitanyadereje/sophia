import React, { useState, useEffect } from 'react';
import { Review, ScreenId, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ReviewsViewProps {
  reviews: Review[];
  currentUser?: UserProfile;
  targetReviewId?: string | null;
  onClearTargetReview?: () => void;
  onAddReview: (data: { bookTitle: string; bookAuthor: string; rating: number; quote: string; content: string }) => Promise<void>;
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

  const [savedReviews, setSavedReviews] = useState<Record<string, boolean>>({});
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [localCommentsList, setLocalCommentsList] = useState<Record<string, { id: string; author: string; text: string; timeAgo: string }[]>>({});

  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  useEffect(() => {
    if (targetReviewId) {
      setSelectedTradition('All');
      setSearchQuery('');
      setActiveCommentId(targetReviewId);
      const timer = setTimeout(() => {
        const el = document.getElementById(`review-${targetReviewId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [targetReviewId]);

  // Form state
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newRating, setNewRating] = useState(5.0);
  const [newQuote, setNewQuote] = useState('');
  const [newFullReview, setNewFullReview] = useState('');

  const traditions = ['All', 'Patristic', 'Orthodox', 'Scholastic', 'Soteriology'];
  
  const isAuthor = (r: Review) => Boolean(currentUser?.id && r.user_id === currentUser.id);

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onShowToast('Likes are not available here yet');
  };

  const handleToggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !(savedReviews[id] ?? false);
    setSavedReviews(prev => ({ ...prev, [id]: nextState }));
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
    const newComment = { id: `comm-${Date.now()}`, author: currentUser?.name || 'Reader', text, timeAgo: 'Just now' };
    setLocalCommentsList(prev => ({ ...prev, [reviewId]: [...(prev[reviewId] || []), newComment] }));
    setCommentInputs(prev => ({ ...prev, [reviewId]: '' }));
    onShowToast('Comment posted to review');
  };

  const handleCardClick = (rev: Review) => {
    if (onSelectReview) onSelectReview(rev.id);
    else if (rev.book_id && onSelectBook) onSelectBook(rev.book_id);
    else onNavigate('colloquium');
  };

  const handleOpenNewReview = () => {
    setEditingReview(null);
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewRating(5.0);
    setNewQuote('');
    setNewFullReview('');
    setIsWriteReviewOpen(true);
  };

  const handleOpenEditReview = (r: Review, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthor(r)) {
      onShowToast('You can only edit reviews you have written.');
      return;
    }
    setEditingReview(r);
    setNewBookTitle(r.title || '');
    setNewBookAuthor(''); // We don't store author on the review directly yet
    setNewRating(r.rating);
    setNewQuote(r.quote || '');
    setNewFullReview(r.content);
    setIsWriteReviewOpen(true);
  };

  const handleDeleteReview = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = reviews.find(item => item.id === id);
    if (target && !isAuthor(target)) {
      onShowToast('You can only delete reviews you have written.');
      return;
    }
    onDeleteReview?.(id);
    onShowToast('Review deleted');
  };

  const filteredReviews = reviews.filter(r => {
    if (selectedTradition !== 'All') return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (r.title || '').toLowerCase().includes(q) || (r.content || '').toLowerCase().includes(q) || (r.quote || '').toLowerCase().includes(q);
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle.trim() || !newBookAuthor.trim() || !newQuote.trim()) return;

    if (editingReview && onUpdateReview) {
      const values = { rating: newRating, quote: newQuote, content: newFullReview.trim() || newQuote.trim() };
      onUpdateReview(editingReview.id, values);
      onShowToast('Review updated');
    } else {
      if (!currentUser?.id) {
        onShowToast('You must be logged in to write a review');
        return;
      }
      
      try {
        await onAddReview({
          bookTitle: newBookTitle,
          bookAuthor: newBookAuthor,
          rating: newRating,
          quote: newQuote,
          content: newFullReview.trim() || newQuote.trim()
        });
        onShowToast('Review published');
      } catch (error) {
        onShowToast('Failed to publish review. Check console.');
        return; // Stop here so the modal doesn't close on failure
      }
    }
    
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewQuote('');
    setNewFullReview('');
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
              </div>
            </div>
            {onClearTargetReview && (
              <button onClick={onClearTargetReview} className="text-xs font-serif text-theme-accent hover:underline cursor-pointer font-medium px-2.5 py-1 rounded bg-theme-surface border border-theme">
                {isAmharic ? 'ሁሉንም መጽሐፍ ዳሰሳዎች እይ' : 'View All Reviews'}
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-subtle text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAmharic ? 'መጽሐፍ ዳሰሳዎችን ፈልግ...' : 'Filter reviews...'}
            className="w-full bg-theme-surface border border-theme rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-theme-main placeholder:text-theme-subtle focus:outline-none focus:border-theme-accent shadow-2xs"
          />
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const isLiked = false;
            const likesCount = 0;
            const isSaved = savedReviews[rev.id] ?? false;
            const comments = localCommentsList[rev.id] || [];
            const isCommentDrawerOpen = activeCommentId === rev.id;

            return (
              <article
                key={rev.id}
                id={`review-${rev.id}`}
                onClick={() => handleCardClick(rev)}
                className={`bg-theme-surface rounded-xl p-4 sm:p-5 border transition-all ${
                  targetReviewId === rev.id ? 'border-theme-accent ring-2 ring-theme-accent/50 shadow-md' : 'border-theme shadow-xs hover:border-theme-accent/60 hover:shadow-md'
                } flex flex-col justify-between gap-3 hover:bg-theme-subtle/30 cursor-pointer`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={currentUser?.avatar || ""} alt={rev.user_id} className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10 flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-label-lg text-sm text-theme-main font-semibold truncate">
                          {isAuthor(rev) ? currentUser?.name : 'Reader'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0 relative">
                      <div className="flex items-center gap-1.5">
                        {isAuthor(rev) && (
                          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider text-theme-accent bg-theme-accent-light border border-theme-accent/30 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {isAmharic ? 'የእርስዎ ግምገማ' : 'Your Review'}
                          </span>
                        )}
                        {isAuthor(rev) && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === rev.id ? null : rev.id); }}
                              className="w-6 h-6 rounded-md hover:bg-theme-subtle flex items-center justify-center text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </button>
                            {activeMenuId === rev.id && (
                              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-7 w-32 bg-theme-surface border border-theme rounded-lg shadow-lg py-1 z-30 animate-fade-in">
                                <button type="button" onClick={(e) => { setActiveMenuId(null); handleOpenEditReview(rev, e); }} className="w-full px-3 py-1.5 text-left text-xs font-sans text-theme-main hover:bg-theme-subtle flex items-center gap-2 cursor-pointer">
                                  <span className="material-symbols-outlined text-[15px]">edit</span>
                                  <span>{isAmharic ? 'አስተካክል' : 'Edit'}</span>
                                </button>
                                <button type="button" onClick={(e) => { setActiveMenuId(null); handleDeleteReview(rev.id, e); }} className="w-full px-3 py-1.5 text-left text-xs font-sans text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer">
                                  <span className="material-symbols-outlined text-[15px]">delete</span>
                                  <span>{isAmharic ? 'አጥፋ' : 'Delete'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-theme-muted font-sans text-right tracking-tight tabular-nums whitespace-nowrap">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                  </div>

                  <div className="my-3 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-serif text-[15px] font-bold text-theme-main truncate leading-tight">
                        {rev.title || 'Book Review'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className="material-symbols-outlined text-[14px] text-theme-gold" style={{ fontVariationSettings: i < Math.floor(rev.rating) ? "'FILL' 1" : "'FILL' 0" }}>
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-theme-main">{(rev.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 my-2.5">
                    <blockquote className="font-serif text-[14px] sm:text-[15px] text-theme-main italic leading-relaxed pl-3.5 border-l-2 border-theme-accent">
                      &ldquo;{rev.quote || rev.content}&rdquo;
                    </blockquote>
                  </div>
                </div>

                <div className="pt-3 border-t border-theme/50 flex flex-col gap-2">
                   <div className="flex items-center justify-between w-full text-xs text-theme-muted">
                    <button type="button" onClick={(e) => handleToggleLike(rev.id, e)} className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle transition-colors cursor-pointer hover:text-theme-main">
                      <span className="material-symbols-outlined text-[16px]">favorite</span>
                      <span className="font-sans tabular-nums">0</span>
                    </button>
                    <button type="button" onClick={(e) => handleToggleCommentDrawer(rev.id, e)} className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle transition-colors cursor-pointer ${isCommentDrawerOpen ? 'text-theme-accent font-semibold' : 'hover:text-theme-main'}`}>
                      <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                      <span className="font-sans">{comments.length > 0 ? `${comments.length} Comments` : 'Comment'}</span>
                    </button>
                    <button type="button" onClick={(e) => handleToggleSave(rev.id, e)} className={`flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-theme-subtle transition-colors cursor-pointer ${isSaved ? 'text-theme-accent font-semibold' : 'hover:text-theme-main'}`}>
                      <span className="material-symbols-outlined text-[16px]">bookmark</span>
                      <span className="font-sans">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>

                  {isCommentDrawerOpen && (
                    <div onClick={(e) => e.stopPropagation()} className="mt-2 pt-2.5 border-t border-theme/70 flex flex-col gap-2.5">
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
                          onChange={(e) => setCommentInputs((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                          placeholder={isAmharic ? 'በዚህ ግምገማ ላይ አስተያየት ይጻፉ...' : 'Write a comment on this review...'}
                          className="flex-1 bg-theme-subtle border border-theme rounded-lg px-2.5 py-1.5 text-xs text-theme-main placeholder:text-theme-subtle focus:outline-none focus:border-theme-accent"
                        />
                        <button type="submit" className="px-3 py-1.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 text-xs font-semibold cursor-pointer transition-opacity">
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
              <button onClick={handleOpenNewReview} className="mt-4 px-4 py-2 rounded-lg bg-theme-main text-theme-surface font-label-md text-xs uppercase tracking-wider cursor-pointer hover:opacity-90 transition-opacity">
                {isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write Review'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {isWriteReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form onSubmit={handleSubmitReview} className="w-full sm:max-w-lg bg-theme-surface rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl border border-theme max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <h3 className="font-serif text-lg font-bold text-theme-main">
                {editingReview ? 'Edit Review' : 'Write Review'}
              </h3>
              <button type="button" onClick={() => setIsWriteReviewOpen(false)} className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">Book Title</label>
                  <input type="text" required value={newBookTitle} onChange={(e) => setNewBookTitle(e.target.value)} placeholder="e.g. Confessions" className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent" />
                </div>
                <div>
                  <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">Author</label>
                  <input type="text" required value={newBookAuthor} onChange={(e) => setNewBookAuthor(e.target.value)} placeholder="e.g. Augustine" className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">Rating (1-5)</label>
                <input type="number" min="1" max="5" step="1" required value={newRating} onChange={(e) => setNewRating(parseInt(e.target.value))} className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent" />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">Key Takeaway / Quote</label>
                <textarea rows={2} required value={newQuote} onChange={(e) => setNewQuote(e.target.value)} className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-xs text-theme-main focus:outline-none focus:border-theme-accent resize-none font-sans" />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">Full Review (Optional)</label>
                <textarea rows={4} value={newFullReview} onChange={(e) => setNewFullReview(e.target.value)} className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-xs text-theme-main focus:outline-none focus:border-theme-accent resize-none font-sans" />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5 pt-3 border-t border-theme">
              <button type="button" onClick={() => setIsWriteReviewOpen(false)} className="flex-1 py-2.5 rounded-lg bg-theme-subtle text-theme-muted font-label-md text-xs uppercase tracking-wider cursor-pointer hover:bg-theme-muted">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 rounded-lg bg-theme-main text-white font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-theme-main/90">{editingReview ? 'Save Changes' : 'Publish Review'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
