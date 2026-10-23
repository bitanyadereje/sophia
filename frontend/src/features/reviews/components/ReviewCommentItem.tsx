import React, { useState } from 'react';
import { UserProfile } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { ReviewCommentTree } from '../services/reviewComment.service';
import { ReviewLikeData } from '../services/reviewInteraction.service';

interface ReviewCommentItemProps {
  comment: ReviewCommentTree;
  currentUser: UserProfile;
  onReply: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onEdit: (commentId: string, newContent: string) => void;
  onDelete: (commentId: string) => void;
  commentLikes: Record<string, ReviewLikeData>;
  replyingToCommentId: string | null;
  replyDraft: string;
  onReplyDraftChange: (value: string) => void;
  onSubmitReply: (event: React.FormEvent, parentId: string) => void;
}

export const ReviewCommentItem: React.FC<ReviewCommentItemProps> = ({
  comment,
  currentUser,
  onReply,
  onLike,
  onEdit,
  onDelete,
  commentLikes,
  replyingToCommentId,
  replyDraft,
  onReplyDraftChange,
  onSubmitReply,
}) => {
  const { isAmharic } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const isCurrentUser = comment.user_id === currentUser.id;
  const authorName = comment.author?.name?.trim() || comment.author?.username?.trim() || (isCurrentUser ? currentUser.name : '') || 'Reader';
  const authorAvatar = comment.author?.avatar_url || (isCurrentUser ? currentUser.avatar : '') || '';
  const likeData = commentLikes[comment.id] || { totalLikes: 0, isLikedByMe: false };
  const isReplying = replyingToCommentId === comment.id;

  return (
    <div className="relative group/comment">
      <div className="flex items-center gap-2.5 text-sm">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10 shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-stone-700 dark:bg-stone-600 text-stone-100 font-serif font-semibold text-xs flex items-center justify-center shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-bold text-sm text-theme-main leading-none">{authorName}</span>
          <span className="text-xs text-theme-muted leading-none">
            {new Date(comment.created_at).toLocaleDateString(isAmharic ? 'am-ET' : 'en-ET')}
          </span>
        </div>
      </div>

      {isEditing ? (
        <form className="mt-2 pl-9 flex flex-col gap-2 max-w-xl" onSubmit={(event) => {
          event.preventDefault();
          const content = editDraft.trim();
          if (!content) return;
          onEdit(comment.id, content);
          setIsEditing(false);
        }}>
          <textarea rows={3} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} className="w-full text-sm bg-transparent border border-stone-300 dark:border-stone-700 rounded-lg p-2.5 text-theme-main focus:outline-none focus:border-stone-500 font-serif resize-y shadow-2xs" />
          <div className="flex items-center gap-2">
            <button type="submit" disabled={!editDraft.trim()} className="px-3 py-1 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-40 cursor-pointer">{isAmharic ? 'Save' : 'Save'}</button>
            <button type="button" onClick={() => { setEditDraft(comment.content); setIsEditing(false); }} className="px-3 py-1 rounded-md text-xs font-medium text-theme-muted hover:text-theme-main cursor-pointer">{isAmharic ? 'Cancel' : 'Cancel'}</button>
          </div>
        </form>
      ) : (
        <p className="mt-1.5 pl-9 text-sm text-theme-body leading-relaxed whitespace-pre-line font-serif">{comment.content}</p>
      )}

      <div className="mt-2 pl-9 flex items-center gap-4 text-xs text-theme-muted">
        <button
          type="button"
          onClick={() => onLike(comment.id)}
          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            likeData.isLikedByMe ? 'text-theme-accent font-medium' : 'hover:text-theme-main'
          }`}
          title={isAmharic ? 'á‹á‹°á‹µ' : 'Like comment'}
        >
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: likeData.isLikedByMe ? "'FILL' 1" : "'FILL' 0" }}
          >
            thumb_up
          </span>
          {likeData.totalLikes > 0 && <span className="tabular-nums">{likeData.totalLikes}</span>}
        </button>
        <button
          type="button"
          onClick={() => onReply(comment.id)}
          className="font-medium hover:text-theme-main hover:underline transition-colors cursor-pointer"
        >
          {isReplying ? (isAmharic ? 'áˆ°áˆ­á‹' : 'Cancel') : (isAmharic ? 'áˆ˜áˆáˆµ áˆµáŒ¥' : 'Reply')}
        </button>
        {isCurrentUser && (
          <>
            <button type="button" onClick={() => { setEditDraft(comment.content); setIsEditing(true); }} className="font-medium hover:text-theme-main hover:underline transition-colors cursor-pointer">{isAmharic ? 'አርትዕ' : 'Edit'}</button>
            <button type="button" onClick={() => { if (window.confirm(isAmharic ? 'ይህን አስተያየት ከመልሶቹ ጋር ይሰርዙ?' : 'Delete this comment and its replies?')) onDelete(comment.id); }} className="font-medium text-red-600 hover:text-red-700 hover:underline transition-colors cursor-pointer">{isAmharic ? 'ሰርዝ' : 'Delete'}</button>
          </>
        )}
      </div>

      {isReplying && (
        <form
          onSubmit={(event) => onSubmitReply(event, comment.id)}
          className="mt-2.5 pl-9 flex flex-col gap-2 max-w-xl"
        >
          <textarea
            rows={2}
            value={replyDraft}
            onChange={(event) => onReplyDraftChange(event.target.value)}
            placeholder={isAmharic ? 'áˆ˜áˆáˆµ áˆµáŒ¥...' : `Reply to ${authorName}...`}
            className="w-full text-sm bg-transparent border border-stone-300 dark:border-stone-700 rounded-lg p-2.5 text-theme-main placeholder:text-stone-400 focus:outline-none focus:border-stone-500 font-serif resize-none shadow-2xs"
          />
          <button
            type="submit"
            disabled={!replyDraft.trim()}
            className="self-start px-3 py-1 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-2xs"
          >
            {isAmharic ? 'áˆ˜áˆáˆµ' : 'Reply'}
          </button>
        </form>
      )}

      {comment.replies.length > 0 && (
        <div className="relative mt-3 pl-3.5 sm:pl-5 ml-3 sm:ml-3.5 border-l border-black/12 dark:border-white/12 space-y-4">
          {comment.replies.map((child) => (
            <ReviewCommentItem
              key={child.id}
              comment={child}
              currentUser={currentUser}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              commentLikes={commentLikes}
              replyingToCommentId={replyingToCommentId}
              replyDraft={replyDraft}
              onReplyDraftChange={onReplyDraftChange}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};
