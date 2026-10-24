import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, QuestionReply, ScreenId, UserProfile } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { createDiscussion, createReply, deleteDiscussion, deleteDiscussionReply, loadDiscussionsWithAuthors, loadAllRepliesForThread, loadPostLikes, togglePostLike, toggleReplyLike, updateDiscussion, updateDiscussionReply } from '../services/discussion.service';

interface DiscussionsViewProps {
  currentUser?: UserProfile;
  targetQuestionId?: string | null;
  onClearTargetQuestion?: () => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

// Fallback avatar helper that handles image loading errors gracefully with a monogram
const AvatarWithFallback: React.FC<{
  src?: string;
  name: string;
  sizeClass?: string;
}> = ({ src, name, sizeClass = 'w-7 h-7' }) => {
  const [failed, setFailed] = useState(false);
  const initial = (name || 'U').charAt(0).toUpperCase();

  if (!src || failed) {
    return (
      <div
        className={`${sizeClass} rounded-full bg-stone-700 dark:bg-stone-600 text-stone-100 font-serif font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs select-none`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`${sizeClass} rounded-full object-cover ring-1 ring-black/10 shrink-0 shadow-2xs`}
    />
  );
};

// ---------------------------------------------------------------------------
// Flat, Airy Nested Comment Component with Continuous Vertical Guide Lines
// ---------------------------------------------------------------------------
interface NestedCommentItemProps {
  comment: QuestionReply;
  depth: number;
  likedReplies: Record<string, boolean>;
  currentUser?: UserProfile;
  onToggleLike: (replyId: string) => void;
  onEditReply: (replyId: string, content: string) => Promise<void>;
  onDeleteReply: (replyId: string) => Promise<void>;
  inlineReplyingId: string | null;
  onSetInlineReplyingId: (id: string | null) => void;
  onSubmitReply: (parentId: string, replyToAuthor: string, text: string) => void;
}

const NestedCommentItem: React.FC<NestedCommentItemProps> = ({
  comment,
  depth,
  likedReplies,
  currentUser,
  onToggleLike,
  onEditReply,
  onDeleteReply,
  inlineReplyingId,
  onSetInlineReplyingId,
  onSubmitReply
}) => {
  const { isAmharic } = useLanguage();
  const [inlineText, setInlineText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.text);
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);

  const isReplyingHere = inlineReplyingId === comment.id;
  const isAuthor = !!currentUser?.name && currentUser.name.trim().toLowerCase() === comment.author.trim().toLowerCase();

  useEffect(() => {
    if (isReplyingHere) {
      setTimeout(() => {
        inlineInputRef.current?.focus();
      }, 50);
    } else {
      setInlineText('');
    }
  }, [isReplyingHere]);

  const isReplyLiked =
    !!likedReplies[comment.id] ||
    (likedReplies[comment.id] === undefined && !!comment.userLiked);
  const baseLikes = comment.likesCount || 0;
  const displayLikes = isReplyLiked
    ? comment.userLiked
      ? baseLikes
      : baseLikes + 1
    : comment.userLiked
    ? Math.max(0, baseLikes - 1)
    : baseLikes;

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineText.trim()) return;
    onSubmitReply(comment.id, comment.author, inlineText.trim());
    setInlineText('');
    onSetInlineReplyingId(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = editDraft.trim();
    if (!content) return;
    await onEditReply(comment.id, content);
    setIsEditing(false);
  };

  return (
    <div id={`comment-${comment.id}`} className="relative group/comment">
      {/* Top row: small circular avatar next to bolded username and muted timestamp */}
      <div className="flex items-center gap-2.5 text-sm">
        <AvatarWithFallback
          src={comment.authorAvatar}
          name={comment.author}
          sizeClass="w-6 h-6 sm:w-7 sm:h-7"
        />
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-bold text-sm text-theme-main leading-none">
            {comment.author}
          </span>
          <span className="text-xs text-theme-muted leading-none">
            {comment.timeAgo}
          </span>
          {comment.replyToAuthor && (
            <span className="text-xs text-theme-muted leading-none flex items-center gap-1">
              <span>replied to</span>
              <span className="font-medium text-theme-main">
                @{comment.replyToAuthor.replace(/\s+/g, '')}
              </span>
            </span>
          )}
          {comment.thesisTag && (
            <span className="text-[11px] text-theme-accent font-medium leading-none">
              · {comment.thesisTag}
            </span>
          )}
        </div>
      </div>

      {/* Main text body: balanced font size */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mt-2 pl-8 sm:pl-9 flex flex-col gap-2 max-w-xl">
          <textarea rows={3} value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="w-full text-sm bg-transparent border border-stone-300 dark:border-stone-700 rounded-lg p-2.5 text-theme-main focus:outline-none focus:border-stone-500 font-serif resize-y" />
          <div className="flex gap-2">
            <button type="submit" disabled={!editDraft.trim()} className="px-3 py-1 rounded-md text-xs font-semibold bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 disabled:opacity-40">Save</button>
            <button type="button" onClick={() => { setEditDraft(comment.text); setIsEditing(false); }} className="px-2.5 py-1 text-xs text-theme-muted">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="mt-1.5 pl-8 sm:pl-9 text-sm text-theme-body leading-relaxed whitespace-pre-line font-serif">{comment.text}</div>
      )}

      {/* Compact, inline action row */}
      <div className="mt-2 pl-8 sm:pl-9 flex items-center gap-4 text-xs text-theme-muted">
        <button
          type="button"
          onClick={() => onToggleLike(comment.id)}
          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isReplyLiked ? 'text-theme-accent font-medium' : 'hover:text-theme-main'
          }`}
          title="Like reply"
        >
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: isReplyLiked ? "'FILL' 1" : "'FILL' 0" }}
          >
            thumb_up
          </span>
          {displayLikes > 0 && (
            <span className="tabular-nums text-xs">{displayLikes}</span>
          )}
        </button>

        {isAuthor && !isEditing && (
          <>
            <button type="button" onClick={() => { setEditDraft(comment.text); setIsEditing(true); onSetInlineReplyingId(null); }} className="font-medium hover:text-theme-main hover:underline transition-colors cursor-pointer">Edit</button>
            <button type="button" onClick={() => { if (window.confirm('Delete this reply and its nested replies?')) void onDeleteReply(comment.id); }} className="font-medium text-red-600 hover:underline transition-colors cursor-pointer">Delete</button>
          </>
        )}

        <button
          type="button"
          onClick={() => {
            if (isReplyingHere) {
              onSetInlineReplyingId(null);
            } else {
              onSetInlineReplyingId(comment.id);
            }
          }}
          className="font-medium hover:text-theme-main hover:underline transition-colors cursor-pointer"
        >
          {isReplyingHere ? (isAmharic ? 'ሰርዝ' : 'Cancel') : (isAmharic ? 'መልስ ስጥ' : 'Reply')}
        </button>
      </div>

      {/* Inline Quick Reply Box directly under this comment */}
      {isReplyingHere && (
        <form
          onSubmit={handleInlineSubmit}
          className="mt-2.5 pl-8 sm:pl-9 flex flex-col gap-2 max-w-xl animate-in fade-in duration-150"
        >
          <textarea
            ref={inlineInputRef}
            rows={2}
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
            placeholder={isAmharic ? `ለ${comment.author} መልስ ስጥ...` : `Reply to ${comment.author}...`}
            className="w-full text-sm bg-transparent border border-stone-300 dark:border-stone-700 rounded-lg p-2.5 text-theme-main placeholder:text-stone-400 focus:outline-none focus:border-stone-500 font-serif resize-none shadow-2xs"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!inlineText.trim()}
              className="px-3 py-1 bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-2xs"
            >
              {isAmharic ? 'መልስ' : 'Reply'}
            </button>
            <button
              type="button"
              onClick={() => onSetInlineReplyingId(null)}
              className="px-2.5 py-1 text-xs text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {/* Deep, Nested Comment Guide Line & Indentation Architecture */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="relative mt-3 pl-3.5 sm:pl-5 ml-3 sm:ml-3.5 border-l border-black/12 dark:border-white/12 hover:border-black/25 dark:hover:border-white/25 transition-colors space-y-4">
          {comment.replies.map((child) => (
            <NestedCommentItem
              key={child.id}
              comment={child}
              depth={depth + 1}
              likedReplies={likedReplies}
              currentUser={currentUser}
              onToggleLike={onToggleLike}
              onEditReply={onEditReply}
              onDeleteReply={onDeleteReply}
              inlineReplyingId={inlineReplyingId}
              onSetInlineReplyingId={onSetInlineReplyingId}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const DiscussionsView: React.FC<DiscussionsViewProps> = ({
  currentUser,
  targetQuestionId,
  onClearTargetQuestion,
  onNavigate,
  onShowToast
}) => {
  const { t, isAmharic } = useLanguage();
  
  // 1. Initialize from sessionStorage to load instantly
  const [questions, setQuestions] = useState<Question[]>(() => {
    const cached = sessionStorage.getItem('cached-discussions');
    return cached ? JSON.parse(cached) : [];
  });
  const [postLikes, setPostLikes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(() => {
    return !sessionStorage.getItem('cached-discussions');
  });

  // Navigation & View Mode
  const [activeThreadId, setActiveThreadId] = useState<string | null>(targetQuestionId || null);

  // Search & Filter state
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'discussed'>('recent');

  // Interactive local states
  const [likedQuestions, setLikedQuestions] = useState<Record<string, boolean>>({});
  const [savedQuestions, setSavedQuestions] = useState<Record<string, boolean>>({});
  const [likedReplies, setLikedReplies] = useState<Record<string, boolean>>({});

  // Inline replying
  const [inlineReplyingId, setInlineReplyingId] = useState<string | null>(null);

  // Thread Reply dock state
  const [threadReplyInput, setThreadReplyInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ replyId: string; author: string } | null>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Modal for question create & edit
  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTopic, setNewTopic] = useState<'Early Texts' | 'Philosophy' | 'Reflections' | 'History'>('Early Texts');

  const topics = ['All', 'Early Texts', 'Philosophy', 'Reflections', 'History'];

  useEffect(() => {
    if (targetQuestionId) {
      setActiveThreadId(targetQuestionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [targetQuestionId]);

  const toQuestion = useCallback((post: any, replies: QuestionReply[] = []): Question => ({
    id: post.id,
    author: post.author?.name || 'Reader',
    authorAvatar: post.author?.avatar_url || '',
    timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString() : '',
    topic: 'Reflections',
    title: post.title || 'Discussion',
    body: post.content || '',
    repliesCount: replies.length,
    likesCount: Number(post.likesCount ?? 0),
    replies,
  }), []);

  const refreshDiscussions = useCallback(async (showLoading = false) => {
    // Only show the loading state if explicitly requested.
    if (showLoading) setIsLoading(true);
    
    try {
      const posts = await loadDiscussionsWithAuthors();
      const [likes, postsWithReplies] = await Promise.all([
        loadPostLikes(posts.map((post) => post.id)),
        Promise.all(posts.map(async (post) => {
          const replies = await loadAllRepliesForThread(post.id);
          return toQuestion(post, replies);
        })),
      ]);

      const collectReplyIds = (replies: QuestionReply[] = []): string[] => replies.flatMap((reply) => [
        reply.id,
        ...collectReplyIds(reply.replies),
      ]);
      const replyLikeRows = await loadPostLikes(collectReplyIds(postsWithReplies.flatMap((question) => question.replies ?? [])));

      const applyReplyLikes = (replies: QuestionReply[] = []): QuestionReply[] => replies.map((reply) => {
        const replyLikes = replyLikeRows.filter((like) => like.post_id === reply.id);
        return {
          ...reply,
          likesCount: replyLikes.length,
          userLiked: replyLikes.some((like) => like.user_id === currentUser?.id),
          replies: applyReplyLikes(reply.replies),
        };
      });
      
      setPostLikes(likes);
      const mappedQuestions = postsWithReplies.map((question) => ({
        ...question,
        likesCount: likes.filter((like) => like.post_id === question.id).length,
        replies: applyReplyLikes(question.replies),
      }));
      
      setQuestions(mappedQuestions);
      // Save to cache for instant loading next time
      sessionStorage.setItem('cached-discussions', JSON.stringify(mappedQuestions));

      const myLikes: Record<string, boolean> = {};
      likes.forEach((like) => { if (like.user_id === currentUser?.id) myLikes[like.post_id] = true; });
      setLikedQuestions(myLikes);
      const myReplyLikes: Record<string, boolean> = {};
      replyLikeRows.forEach((like) => { if (like.user_id === currentUser?.id) myReplyLikes[like.post_id] = true; });
      setLikedReplies(myReplyLikes);
      
    } catch (error: any) {
      onShowToast(error?.message || 'Could not load discussions.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, onShowToast, toQuestion]);

  // Fixed dependency array to prevent infinite loops
  useEffect(() => {
    void refreshDiscussions(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeQuestion = questions.find((q) => q.id === activeThreadId);

  const isAuthor = (q: Question) => {
    if (!currentUser?.name || !q.author) return false;
    return q.author.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
  };

  const handleOpenThread = (id: string) => {
    setActiveThreadId(id);
    setReplyingTo(null);
    setInlineReplyingId(null);
    setThreadReplyInput('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    setActiveThreadId(null);
    setReplyingTo(null);
    setInlineReplyingId(null);
    setThreadReplyInput('');
    if (onClearTargetQuestion) {
      onClearTargetQuestion();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleLike = async (id: string) => {
    if (!currentUser?.id) { onShowToast('You must be signed in to like a discussion.'); return; }
    const isLiked = !!likedQuestions[id];
    try {
      await togglePostLike(id, currentUser.id, isLiked);
      setLikedQuestions((prev) => ({ ...prev, [id]: !isLiked }));
      setQuestions((prev) => prev.map((question) => question.id === id
        ? { ...question, likesCount: Math.max(0, question.likesCount + (isLiked ? -1 : 1)) }
        : question));
      setPostLikes((prev) => isLiked
        ? prev.filter((like) => !(like.post_id === id && like.user_id === currentUser.id))
        : [...prev, { post_id: id, user_id: currentUser.id }]);
      onShowToast(isLiked ? 'Like removed' : 'Liked discussion');
    } catch (error: any) { onShowToast(error?.message || 'Could not update like.'); }
  };

  const handleToggleSave = (id: string) => {
    const isSaved = !!savedQuestions[id];
    setSavedQuestions((prev) => ({ ...prev, [id]: !isSaved }));
    onShowToast(isSaved ? 'Removed from bookmarks' : 'Bookmarked discussion');
  };

  const updateReplyTree = (replies: QuestionReply[] = [], replyId: string, liked: boolean): QuestionReply[] => replies.map((reply) => {
    if (reply.id === replyId) {
      return { ...reply, userLiked: liked, likesCount: Math.max(0, (reply.likesCount ?? 0) + (liked ? 1 : -1)) };
    }
    return { ...reply, replies: updateReplyTree(reply.replies, replyId, liked) };
  });

  const handleToggleReplyLike = async (replyId: string) => {
    if (!currentUser?.id) { onShowToast('You must be signed in to like a reply.'); return; }
    const isLiked = !!likedReplies[replyId];
    try {
      await toggleReplyLike(replyId, currentUser.id, isLiked);
      const nextLiked = !isLiked;
      setLikedReplies((prev) => ({ ...prev, [replyId]: nextLiked }));
      setQuestions((prev) => prev.map((question) => ({
        ...question,
        replies: updateReplyTree(question.replies, replyId, nextLiked),
      })));
      onShowToast(isLiked ? 'Like removed' : 'Liked reply');
    } catch (error: any) { onShowToast(error?.message || 'Could not update reply like.'); }
  };

  const handleDirectNestedReply = async (parentId: string, replyToAuthor: string, text: string) => {
    if (!currentUser?.id) { onShowToast('You must be signed in to reply.'); return; }
    try {
      await createReply(currentUser.id, parentId, text);
      sessionStorage.removeItem('cached-discussions'); // Clear cache so fresh replies load
      await refreshDiscussions();
      onShowToast(`Replied to ${replyToAuthor}`);
    } catch (error: any) { onShowToast(error?.message || 'Could not post reply.'); }
  };

  const handleEditNestedReply = async (replyId: string, content: string) => {
    if (!currentUser?.id) { onShowToast('You must be signed in to edit a reply.'); throw new Error('Sign in required'); }
    try {
      await updateDiscussionReply(replyId, currentUser.id, content);
      sessionStorage.removeItem('cached-discussions');
      await refreshDiscussions();
      onShowToast('Reply updated');
    } catch (error: any) {
      onShowToast(error?.message || 'Could not update reply.');
      throw error;
    }
  };

  const handleDeleteNestedReply = async (replyId: string) => {
    if (!currentUser?.id) { onShowToast('You must be signed in to delete a reply.'); return; }
    try {
      await deleteDiscussionReply(replyId, currentUser.id);
      sessionStorage.removeItem('cached-discussions');
      await refreshDiscussions();
      onShowToast('Reply deleted');
    } catch (error: any) { onShowToast(error?.message || 'Could not delete reply.'); }
  };

  const handleCancelReplyingTo = () => {
    setReplyingTo(null);
    setThreadReplyInput('');
  };

  const handleSubmitThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestion) return;
    const text = threadReplyInput.trim();
    if (!text) return;

    if (!currentUser?.id) { onShowToast('You must be signed in to reply.'); return; }
    try {
      await createReply(currentUser.id, replyingTo?.replyId || activeQuestion.id, text);
      sessionStorage.removeItem('cached-discussions');
      await refreshDiscussions();
      onShowToast(replyingTo ? `Replied to ${replyingTo.author}` : 'Reflection posted to thread');
      setThreadReplyInput('');
      setReplyingTo(null);
    } catch (error: any) { onShowToast(error?.message || 'Could not post reply.'); }
  };

  const handleOpenNewQuestion = () => {
    setEditingQuestion(null);
    setNewTitle('');
    setNewBody('');
    setNewTopic('Early Texts');
    setIsNewQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: Question) => {
    if (!isAuthor(q)) {
      onShowToast('You can only edit questions you authored.');
      return;
    }
    setEditingQuestion(q);
    setNewTitle(q.title);
    setNewBody(q.body);
    setNewTopic(q.topic);
    setIsNewQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = questions.find((item) => item.id === id);
    if (target && !isAuthor(target)) {
      onShowToast('You can only delete questions you authored.');
      return;
    }
    if (!currentUser?.id) {
      onShowToast('You must be signed in to delete a discussion.');
      return;
    }
    if (!window.confirm('Are you sure you wish to delete this discussion?')) return;

    try {
      await deleteDiscussion(id, currentUser.id);
      sessionStorage.removeItem('cached-discussions');
      await refreshDiscussions();
      if (activeThreadId === id) handleBackToFeed();
      onShowToast('Discussion deleted');
    } catch (error: any) {
      onShowToast(error?.message || 'Could not delete discussion.');
    }
  };

  const handleSubmitQuestionModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (editingQuestion) {
      if (!currentUser?.id) {
        onShowToast('You must be signed in to edit a discussion.');
        return;
      }
      try {
        await updateDiscussion(editingQuestion.id, currentUser.id, newTitle, newBody);
        sessionStorage.removeItem('cached-discussions');
        await refreshDiscussions();
        onShowToast('Discussion updated');
      } catch (error: any) {
        onShowToast(error?.message || 'Could not update discussion.');
        return;
      }
    } else {
      if (!currentUser?.id) {
        onShowToast('You must be signed in to post a question.');
        return;
      }

      let data;
      try { data = await createDiscussion(currentUser.id, newTitle, newBody); }
      catch (error: any) { onShowToast(error?.message || 'Could not post question.'); return; }

      const created: Question = {
        id: data.id,
        author: currentUser.name || 'Reader',
        authorAvatar: currentUser.avatar || '',
        timeAgo: 'Just now',
        topic: newTopic,
        title: data.title || newTitle,
        body: data.content || newBody,
        repliesCount: 0,
        likesCount: 0,
        saved: false,
        replies: []
      };

      sessionStorage.removeItem('cached-discussions');
      await refreshDiscussions();
      onShowToast('New question posted to community');
      setActiveThreadId(created.id);
    }

    setNewTitle('');
    setNewBody('');
    setEditingQuestion(null);
    setIsNewQuestionModalOpen(false);
  };

  const filteredQuestions = questions
    .filter((q) => {
      if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) ||
          q.body.toLowerCase().includes(query) ||
          q.author.toLowerCase().includes(query) ||
          (q.bookTitle && q.bookTitle.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'discussed') {
        return b.repliesCount - a.repliesCount;
      }
      return 0;
    });

  const countAllReplies = (reps?: QuestionReply[]): number => {
    if (!reps) return 0;
    let count = reps.length;
    for (const r of reps) {
      if (r.replies && r.replies.length > 0) {
        count += countAllReplies(r.replies);
      }
    }
    return count;
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        
        {isLoading ? (
          <div className="py-16 text-center text-theme-muted">Loading discussions…</div>
        ) : activeQuestion ? (
          <div className="flex flex-col gap-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-theme/60">
              <button
                type="button"
                onClick={handleBackToFeed}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-serif font-semibold text-theme-main hover:text-theme-accent transition-colors cursor-pointer group py-1"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
                  arrow_back
                </span>
                <span>{isAmharic ? 'ሁሉም ውይይቶች' : 'All Discussions'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-theme-muted font-sans font-medium">
                  {activeQuestion.topic}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    onShowToast('Thread link copied to clipboard');
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                  title="Share thread"
                >
                  <span className="material-symbols-outlined text-[17px]">share</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSave(activeQuestion.id)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                    savedQuestions[activeQuestion.id]
                      ? 'text-theme-gold'
                      : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[19px]"
                    style={{ fontVariationSettings: savedQuestions[activeQuestion.id] ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    bookmark
                  </span>
                </button>

                {isAuthor(activeQuestion) && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleOpenEditQuestion(activeQuestion)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteQuestion(activeQuestion.id, e)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <article className="bg-theme-surface rounded-xl sm:rounded-2xl p-5 sm:p-7 border border-theme/60 shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm">
                  <AvatarWithFallback
                    src={activeQuestion.authorAvatar}
                    name={activeQuestion.author}
                    sizeClass="w-8 h-8"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm sm:text-base text-theme-main">
                      {activeQuestion.author}
                    </span>
                    <span className="text-xs text-theme-muted">
                      {activeQuestion.timeAgo}
                    </span>
                    {isAuthor(activeQuestion) && (
                      <span className="text-[10px] uppercase font-sans tracking-wider px-1.5 py-0.5 rounded bg-theme-accent-light text-theme-accent font-semibold">
                        Author
                      </span>
                    )}
                  </div>
                </div>

                {activeQuestion.bookTitle && (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-theme-muted font-serif">
                    <span className="material-symbols-outlined text-[15px] text-theme-accent">menu_book</span>
                    <span>{activeQuestion.bookTitle}</span>
                  </div>
                )}
              </div>

              <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-snug">
                {activeQuestion.title}
              </h1>

              <div className="font-serif text-sm sm:text-base text-theme-body leading-relaxed whitespace-pre-line space-y-3">
                {activeQuestion.body}
              </div>

              <div className="pt-3 border-t border-theme/50 flex items-center justify-between text-xs sm:text-sm text-theme-muted">
                <div className="flex items-center gap-4 sm:gap-6">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(activeQuestion.id)}
                    className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      likedQuestions[activeQuestion.id]
                        ? 'text-theme-accent font-medium'
                        : 'hover:text-theme-main'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: likedQuestions[activeQuestion.id] ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      thumb_up
                    </span>
                    <span className="tabular-nums">
                      {activeQuestion.likesCount}{' '}
                      {isAmharic ? 'መውደዶች' : 'Likes'}
                    </span>
                  </button>

                  <div className="inline-flex items-center gap-1.5 text-theme-muted">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                    <span>{countAllReplies(activeQuestion.replies)} {isAmharic ? 'አስተያየቶች' : 'Contributions'}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setInlineReplyingId(null);
                    replyInputRef.current?.focus();
                  }}
                  className="font-medium text-xs sm:text-sm text-theme-accent hover:underline cursor-pointer"
                >
                  {isAmharic ? 'አስተያየት ጻፍ' : 'Write Reflection'}
                </button>
              </div>
            </article>

            <section className="flex flex-col gap-4 mt-2">
              <div className="flex items-center justify-between px-1 pb-1 border-b border-theme/40">
                <h2 className="font-serif font-bold text-base sm:text-lg text-theme-main flex items-center gap-2">
                  <span>{isAmharic ? 'የውይይት ፍሰት' : 'Discussion Stream'}</span>
                  <span className="text-xs font-sans font-normal text-theme-muted">
                    ({countAllReplies(activeQuestion.replies)})
                  </span>
                </h2>
              </div>

              {activeQuestion.replies && activeQuestion.replies.length > 0 ? (
                <div className="space-y-6 sm:space-y-7 pt-2">
                  {activeQuestion.replies.map((reply) => (
                    <NestedCommentItem
                      key={reply.id}
                      comment={reply}
                      depth={0}
                      likedReplies={likedReplies}
                      currentUser={currentUser}
                      onToggleLike={handleToggleReplyLike}
                      onEditReply={handleEditNestedReply}
                      onDeleteReply={handleDeleteNestedReply}
                      inlineReplyingId={inlineReplyingId}
                      onSetInlineReplyingId={setInlineReplyingId}
                      onSubmitReply={handleDirectNestedReply}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-3xl text-theme-muted/50 mb-2">
                    forum
                  </span>
                  <h3 className="font-serif text-base font-bold text-theme-main">
                    {isAmharic ? 'እስካሁን ምንም አስተያየት የለም' : 'No reflections yet'}
                  </h3>
                  <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto font-sans">
                    {isAmharic
                      ? 'መልስ፣ ታሪካዊ ግንዛቤ ወይም ማሰላሰያ በማጋራት የመጀመሪያው አንባቢ ይሁኑ።'
                      : 'Be the first reader to contribute an answer, historical insight, or dialectical reflection.'}
                  </p>
                </div>
              )}
            </section>

            <div className="sticky bottom-16 md:bottom-6 z-20 pt-2">
              <form
                onSubmit={handleSubmitThreadReply}
                className="bg-theme-surface/95 backdrop-blur-md border border-stone-300 dark:border-stone-700 rounded-2xl p-2.5 sm:p-3 shadow-xl transition-all"
              >
                {replyingTo && (
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme text-xs font-sans text-theme-accent">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[15px]">reply</span>
                      <span>Replying to @{replyingTo.author}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCancelReplyingTo}
                      className="text-theme-muted hover:text-theme-main p-0.5 rounded cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2.5">
                  <AvatarWithFallback
                    src={currentUser?.avatar}
                    name={currentUser?.name || 'User'}
                    sizeClass="w-8 h-8"
                  />

                  <div className="flex-1 relative flex items-center">
                    <input
                      ref={replyInputRef}
                      type="text"
                      value={threadReplyInput}
                      onChange={(e) => setThreadReplyInput(e.target.value)}
                      placeholder={
                        replyingTo
                          ? `Contribute reflection to @${replyingTo.author}...`
                          : 'Contribute a dialectical reflection or answer...'
                      }
                      className="w-full h-10 pl-3.5 pr-10 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent text-theme-main placeholder:text-stone-500 dark:placeholder:text-stone-400 focus:outline-none focus:border-stone-500 font-serif"
                    />

                    <button
                      type="submit"
                      disabled={!threadReplyInput.trim()}
                      className={`absolute right-1 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        threadReplyInput.trim()
                          ? 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 hover:opacity-90 active:scale-95 shadow-2xs'
                          : 'text-stone-400 dark:text-stone-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
              <div>
                <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
                  {isAmharic ? 'የማህበረሰብ ውይይቶች' : 'Community Discussions'}
                </h1>
                <p className="text-xs sm:text-sm text-theme-muted font-sans">
                  {isAmharic
                    ? 'ጥልቅ የውይይት ርዕሶች፣ የጽሑፍ ጥያቄዎች እና ምሁራዊ ውይይቶች'
                    : 'Deep-dive dialectical threads, textual inquiries, and scholarly discourse'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('colloquium')}
                  className="text-xs font-serif text-theme-muted hover:text-theme-main transition-colors flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-theme-subtle group border border-theme"
                >
                  <span className="material-symbols-outlined text-[15px] text-theme-accent group-hover:scale-105 transition-transform">
                    forum
                  </span>
                  <span>{isAmharic ? 'የመጽሐፍ ሴሚናሮች' : 'Book Seminars'}</span>
                  <span className="material-symbols-outlined text-[13px] text-theme-subtle group-hover:text-theme-main transition-colors">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-subtle text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAmharic ? 'ውይይቶችን፣ ደራሲያንን ወይም ጥያቄዎችን ፈልግ...' : 'Search discussions, authors, or textual questions...'}
                className="w-full bg-theme-surface border border-[#d6d0c4] dark:border-stone-700 rounded-full pl-10 pr-4 py-2.5 text-xs sm:text-sm text-theme-main placeholder:text-stone-600 dark:placeholder:text-stone-300 focus:outline-none focus:border-stone-400 dark:focus:border-stone-500 shadow-2xs font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-subtle hover:text-theme-main cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-1.5">
                {topics.map((topic) => {
                  let label = topic;
                  if (isAmharic) {
                    if (topic === 'All') label = 'ሁሉም';
                    else if (topic === 'Early Texts') label = 'ቀደምት ጽሑፎች';
                    else if (topic === 'Philosophy') label = 'ፍልስፍና';
                    else if (topic === 'Reflections') label = 'ማሰላሰያዎች';
                    else if (topic === 'History') label = 'ታሪክ';
                  }
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setSelectedTopic(topic)}
                      className={`text-[11px] font-label-md px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                        selectedTopic === topic
                          ? 'bg-theme-main text-white font-semibold shadow-xs'
                          : 'bg-theme-subtle text-theme-muted hover:bg-theme-muted'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setSortBy(sortBy === 'recent' ? 'discussed' : 'recent')}
                className="text-[11px] font-label-md text-theme-muted hover:text-theme-main flex items-center gap-1 whitespace-nowrap pl-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">swap_vert</span>
                <span>
                  {sortBy === 'recent'
                    ? (isAmharic ? 'የቅርብ ጊዜ' : 'Recent')
                    : (isAmharic ? 'ብዙ የተወያየበት' : 'Most Discussed')}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.map((q) => {
                const isLiked = !!likedQuestions[q.id];
                const isSaved = !!savedQuestions[q.id];
                const likesCount = q.likesCount;
                const totalReplies = countAllReplies(q.replies);

                return (
                  <article
                    key={q.id}
                    onClick={() => handleOpenThread(q.id)}
                    className="bg-theme-surface rounded-xl p-4 sm:p-5 border border-theme shadow-xs hover:border-theme-accent/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AvatarWithFallback
                            src={q.authorAvatar}
                            name={q.author}
                            sizeClass="w-7 h-7"
                          />
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-theme-main font-serif">
                              {q.author}
                            </span>
                            <span className="text-theme-subtle">·</span>
                            <span className="text-theme-subtle text-[11px] font-sans">
                              {q.timeAgo}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-label-md uppercase font-semibold px-2 py-0.5 rounded-full bg-theme-subtle text-theme-accent border border-theme">
                          {q.topic}
                        </span>
                      </div>

                      <h3 className="font-serif text-[15px] sm:text-[16px] font-bold text-theme-main leading-snug group-hover:text-theme-accent transition-colors">
                        {q.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-theme-muted leading-relaxed line-clamp-3 font-serif">
                        {q.body}
                      </p>

                      {q.bookTitle && (
                        <div className="flex items-center gap-1 text-[11px] text-theme-accent font-serif pt-0.5">
                          <span className="material-symbols-outlined text-[13px]">menu_book</span>
                          <span className="truncate">{q.bookTitle} {q.chapter ? `• ${q.chapter}` : ''}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className="pt-2.5 border-t border-theme-subtle flex items-center justify-between text-xs text-theme-muted"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <button
                          type="button"
                          onClick={() => handleOpenThread(q.id)}
                          className="flex items-center gap-1 hover:text-theme-accent cursor-pointer font-sans"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                          <span>{totalReplies} {isAmharic ? 'መልሶች' : 'Replies'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleLike(q.id)}
                          className={`flex items-center gap-1 cursor-pointer transition-colors font-sans ${
                            isLiked ? 'text-theme-accent font-semibold' : 'hover:text-theme-main'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[16px]"
                            style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            thumb_up
                          </span>
                          <span>{likesCount}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenThread(q.id)}
                          className="text-[11px] font-label-md text-theme-accent hover:underline flex items-center gap-0.5 cursor-pointer font-semibold"
                        >
                          <span>{isAmharic ? 'ውይይቱን ክፈት' : 'Open Thread'}</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleSave(q.id)}
                          className={`cursor-pointer transition-colors p-1 rounded hover:bg-theme-subtle ${
                            isSaved ? 'text-theme-gold' : 'hover:text-theme-main'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[17px]"
                            style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            bookmark
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredQuestions.length === 0 && (
                <div className="col-span-full bg-theme-subtle rounded-xl p-8 text-center border border-theme mt-2">
                  <span className="material-symbols-outlined text-3xl text-theme-subtle mb-1">
                    search_off
                  </span>
                  <h3 className="font-serif text-[16px] font-bold text-theme-main">
                    {isAmharic ? 'ምንም ውይይቶች አልተገኙም' : 'No discussions found'}
                  </h3>
                  <p className="text-xs text-theme-muted mt-1 font-sans">
                    {isAmharic ? 'የፍለጋ መስፈርትዎን የሚያሟላ ምንም ውይይት አልተገኘም።' : 'No discussions matched your search criteria.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!activeThreadId && (
        <button
          type="button"
          onClick={handleOpenNewQuestion}
          className="fixed bottom-20 right-5 sm:bottom-8 sm:right-8 lg:bottom-10 lg:right-10 z-30 inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-theme-main hover:opacity-95 text-white font-serif text-xs sm:text-sm font-semibold tracking-wide shadow-xl active:scale-[0.98] transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>{isAmharic ? 'ጥያቄ ጠይቅ' : 'Ask Question'}</span>
        </button>
      )}

      {isNewQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <form
            onSubmit={handleSubmitQuestionModal}
            className="w-full sm:max-w-lg bg-theme-surface rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl border border-theme max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-accent text-[20px]">
                  psychology_alt
                </span>
                <h3 className="font-serif text-lg font-bold text-theme-main">
                  {editingQuestion
                    ? (isAmharic ? 'ጥያቄ አስተካክል' : 'Edit Question')
                    : (isAmharic ? 'ጥያቄ ጠይቅ' : 'Ask a Question')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewQuestionModalOpen(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1.5">
                  {isAmharic ? 'የክፍል ዓይነት' : 'Topic Category'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Early Texts', 'Philosophy', 'Reflections', 'History'] as const).map((cat) => {
                    let catLabel = cat as string;
                    if (isAmharic) {
                      if (cat === 'Early Texts') catLabel = 'ቀደምት ጽሑፎች';
                      else if (cat === 'Philosophy') catLabel = 'ፍልስፍና';
                      else if (cat === 'Reflections') catLabel = 'ማሰላሰያዎች';
                      else if (cat === 'History') catLabel = 'ታሪክ';
                    }
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewTopic(cat)}
                        className={`py-2 px-2.5 text-xs rounded-lg border text-center transition-all cursor-pointer ${
                          newTopic === cat
                            ? 'border-theme-accent bg-theme-accent-light text-theme-accent font-semibold'
                            : 'border-theme bg-theme-subtle text-theme-muted'
                        }`}
                      >
                        {catLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1.5">
                  {isAmharic ? 'የጥያቄው ርዕስ' : 'Question Title'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. How does ontological corruption differ from moral guilt?"
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-sm text-theme-main focus:outline-none focus:border-theme-accent font-serif"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1.5">
                  {isAmharic ? 'ዝርዝር እና አውድ' : 'Details & Context'}
                </label>
                <textarea
                  rows={4}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Provide chapter citations, textual excerpts, or context..."
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-3 text-xs sm:text-sm text-theme-main focus:outline-none focus:border-theme-accent resize-none font-serif"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5 pt-3 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsNewQuestionModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle hover:bg-theme-muted text-theme-main font-label-md text-xs uppercase tracking-wider cursor-pointer border border-theme transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-theme-main text-white font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer hover:bg-theme-main/90 transition-opacity"
              >
                {editingQuestion
                  ? (isAmharic ? 'ለውጦችን አስቀምጥ' : 'Save Changes')
                  : (isAmharic ? 'ጥያቄ አስገባ' : 'Post Question')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
