import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Review, UserProfile, Book, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { getReviewerProfile } from '../review.service';
import { getReviewLikeData, toggleReviewLike } from '../services/reviewInteraction.service';
import {
  addNestedComment,
  addReviewComment,
  buildCommentTree,
  getCommentLikeData,
  loadReviewComments,
  ReviewCommentTree,
  toggleCommentLike,
  updateReviewComment,
  deleteReviewComment,
} from '../services/reviewComment.service';
import { ReviewLikeData } from '../services/reviewInteraction.service';
import { ReviewCommentItem } from './ReviewCommentItem';

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
  const queryClient = useQueryClient();
  const detailKey = ['review-detail', review.id] as const;
  const feedKey = ['reviews-feed'] as const;
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
      const likeEntries = await Promise.all(dbComments.map(async (comment) => [
        comment.id,
        await getCommentLikeData(comment.id, currentUser?.id),
      ] as const));
      return {
        likeData,
        comments: buildCommentTree(dbComments),
        commentLikes: Object.fromEntries(likeEntries) as Record<string, ReviewLikeData>,
        authorProfile: profile ? { name: profile.name || 'Reader', avatar: profile.avatar || '' } : null,
      };
    },
  });
  const comments = data?.comments ?? [];
  const commentLikes = data?.commentLikes ?? {};
  const isLiked = data?.likeData.isLikedByMe ?? false;
  const likeCount = data?.likeData.totalLikes ?? 0;
  const authorProfile = data?.authorProfile ?? null;

  const likeMutation = useMutation({
    mutationFn: ({ userId, wasLiked }: { userId: string; wasLiked: boolean }) =>
      toggleReviewLike(review.id, userId, wasLiked),
    onMutate: async ({ wasLiked }) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData(detailKey);
      queryClient.setQueryData<any>(detailKey, (old) => old ? {
        ...old,
        likeData: {
          isLikedByMe: !wasLiked,
          totalLikes: Math.max(0, old.likeData.totalLikes + (wasLiked ? -1 : 1)),
        },
      } : old);
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

  const handleLike = async () => {
    if (!currentUser?.id) {
      onShowToast('Sign in to like reviews.');
      return;
    }
    likeMutation.mutate({ userId: currentUser.id, wasLiked: isLiked });
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
      await addCommentMutation.mutateAsync({ userId: currentUser.id, content: text });
      onShowToast('Reflection posted!');
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
      onShowToast(isAmharic ? 'áŠ áˆ›áˆ°áˆ‹áˆ°á‹« áˆˆáˆ›á‹µáˆ¨áŒ áŠ¥á‹á‹« áˆµáˆˆáˆáŒáˆ' : 'Sign in to reply.');
      return;
    }

    setReplyDraft('');
    try {
      await addNestedComment(review.id, currentUser.id, text, parentId);
      await queryClient.invalidateQueries({ queryKey: detailKey });
      await queryClient.invalidateQueries({ queryKey: feedKey });
      setReplyingToCommentId(null);
      onShowToast(isAmharic ? 'áˆ›áˆ°áˆ‹áˆ°á‹« á‰°áˆáŠ³áˆ' : 'Reply posted!');
    } catch (error) {
      console.error('Failed to post review reply:', error);
      onShowToast(error instanceof Error ? error.message : 'Failed to post reply');
      setReplyDraft(text);
    }
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'áŠ áˆ›áˆ°áˆ‹áˆ°á‹« áˆˆáˆ›á‹µáˆ¨áŒ áŠ¥á‹á‹« áˆµáˆˆáˆáŒáˆ' : 'Sign in to like comments.');
      return;
    }
    const previous = commentLikes[commentId] ?? { totalLikes: 0, isLikedByMe: false };
    const optimistic = {
      isLikedByMe: !previous.isLikedByMe,
      totalLikes: Math.max(0, previous.totalLikes + (previous.isLikedByMe ? -1 : 1)),
    };
    queryClient.setQueryData<any>(detailKey, (old) => old ? {
      ...old,
      commentLikes: { ...old.commentLikes, [commentId]: optimistic },
    } : old);
    try {
      await toggleCommentLike(commentId, currentUser.id, previous.isLikedByMe);
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      queryClient.setQueryData<any>(detailKey, (old) => old ? {
        ...old,
        commentLikes: { ...old.commentLikes, [commentId]: previous },
      } : old);
      onShowToast(error instanceof Error ? error.message : 'Failed to update comment like');
    }
  };

  const refreshComments = async () => {
    await queryClient.invalidateQueries({ queryKey: detailKey });
    await queryClient.invalidateQueries({ queryKey: feedKey });
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'áŠ áˆ›áˆ°áˆ‹áˆ°á‹« áˆˆáˆ›áˆµáˆµá‰°áŠ«áŠ­ áˆµáˆˆáˆáŒáˆ' : 'Sign in to edit comments.');
      return;
    }
    try {
      await updateReviewComment(commentId, currentUser.id, newContent);
      await refreshComments();
      onShowToast(isAmharic ? 'áˆ›áˆ°áˆ‹áˆ°á‹« á‰°áˆµáˆµá‰°áŠ«áŠ­á¢' : 'Comment updated.');
    } catch (error) {
      console.error('Failed to edit review comment:', error);
      onShowToast(error instanceof Error ? error.message : 'Unable to edit this comment. Check your permissions.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser?.id) {
      onShowToast(isAmharic ? 'áŠ áˆ›áˆ°áˆ‹áˆ°á‹« áˆˆáˆ›áˆµáˆµáˆ¨á‹ áˆµáˆˆáˆáŒáˆ' : 'Sign in to delete comments.');
      return;
    }
    try {
      await deleteReviewComment(commentId, currentUser.id);
      await refreshComments();
      onShowToast(isAmharic ? 'áˆ›áˆ°áˆ‹áˆ°á‹« á‰°áˆ°áˆ­á‹Ÿáˆ' : 'Comment deleted.');
    } catch (error) {
      console.error('Failed to delete review comment:', error);
      onShowToast(error instanceof Error ? error.message : 'Unable to delete this comment. Check your permissions.');
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
        {isPending && <div className="py-6 text-center text-theme-muted">Loading review details…</div>}

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
                <div key={comment.id} className="p-4 rounded-xl border border-theme/70 bg-theme-subtle/30">
                  <ReviewCommentItem
                    comment={comment}
                    currentUser={currentUser}
                    onReply={(commentId) => {
                      setReplyingToCommentId((prev) => prev === commentId ? null : commentId);
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
