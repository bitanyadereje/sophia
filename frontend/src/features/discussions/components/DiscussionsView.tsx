import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Question, QuestionReply, ScreenId, UserProfile } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import {
  createDiscussion,
  createReply,
  deleteDiscussion,
  deleteDiscussionReply,
  loadCurrentUserPostLikes,
  loadDiscussionPage,
  loadDiscussionTopics,
  loadThreadRepliesWithAuthors,
  togglePostLike,
  toggleReplyLike,
  updateDiscussion,
  updateDiscussionReply,
} from '../services/discussion.service';
import { useBookmarks } from '../../saved/useBookmarks';

interface DiscussionsViewProps {
  currentUser?: UserProfile;
  targetQuestionId?: string | null;
  onClearTargetQuestion?: () => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

const countAllReplies = (replies: QuestionReply[] = []): number =>
  replies.reduce((count, reply) => count + 1 + countAllReplies(reply.replies ?? []), 0);

const EMPTY_LIKED_IDS = new Set<string>();

const formatEditorialDate = (iso?: string): string => {
  if (!iso) return '';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

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
        className={`${sizeClass} rounded-full bg-[#362c1b] text-[#dfba69] border border-[#c8a256]/40 font-serif font-semibold text-xs flex items-center justify-center shrink-0 select-none`}
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
      className={`${sizeClass} rounded-full object-cover ring-1 ring-[#c8a256]/30 shrink-0`}
    />
  );
};

interface NestedCommentItemProps {
  comment: QuestionReply;
  postAuthorName: string;
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
  postAuthorName,
  depth,
  likedReplies,
  currentUser,
  onToggleLike,
  onEditReply,
  onDeleteReply,
  inlineReplyingId,
  onSetInlineReplyingId,
  onSubmitReply,
}) => {
  const { isAmharic } = useLanguage();
  const [inlineText, setInlineText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.text);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isReplyingHere = inlineReplyingId === comment.id;
  const isCommentOwner =
    !!currentUser?.name &&
    currentUser.name.trim().toLowerCase() === comment.author.trim().toLowerCase();
  const isThreadAuthor =
    !!postAuthorName &&
    postAuthorName.trim().toLowerCase() === comment.author.trim().toLowerCase();

  useEffect(() => {
    if (isReplyingHere) {
      setTimeout(() => inlineInputRef.current?.focus(), 50);
    } else {
      setInlineText('');
    }
  }, [isReplyingHere]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <AvatarWithFallback
            src={comment.authorAvatar}
            name={comment.author}
            sizeClass="w-7 h-7"
          />
          <span className="font-sans font-semibold text-[13.5px] text-theme-main leading-none">
            {comment.author}
          </span>
          {isThreadAuthor && (
            <span className="text-[10.5px] font-sans px-2 py-0.5 rounded-full bg-[#362c1b] text-[#dfba69] border border-[#c8a256]/35 font-medium leading-none">
              Author
            </span>
          )}
          <span className="text-xs font-sans text-theme-muted leading-none">
            {comment.timeAgo}
          </span>
          {comment.replyToAuthor && (
            <span className="text-xs font-sans text-theme-muted leading-none flex items-center gap-1">
              <span>replied to</span>
              <span className="font-medium text-theme-main">
                @{comment.replyToAuthor.replace(/\s+/g, '')}
              </span>
            </span>
          )}
        </div>

        {isCommentOwner && !isEditing && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setConfirmDelete(false);
              }}
              aria-label="Comment options"
              className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-theme-surface border border-stone-500/25 shadow-2xl py-1.5 text-xs font-sans">
                {!confirmDelete ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft(comment.text);
                        setIsEditing(true);
                        onSetInlineReplyingId(null);
                        setMenuOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-theme-main hover:bg-theme-subtle flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>{isAmharic ? 'አስተካክል' : 'Edit reflection'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full px-3.5 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                      <span>{isAmharic ? 'አጥፋ' : 'Delete reflection'}</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3.5 py-2 space-y-2">
                    <p className="text-[11px] text-theme-muted leading-snug">
                      {isAmharic ? 'ይህን አስተያየት መሰረዝ ይፈልጋሉ?' : 'Delete this reflection?'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDelete(false);
                          void onDeleteReply(comment.id);
                        }}
                        className="flex-1 py-1 px-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 cursor-pointer"
                      >
                        {isAmharic ? 'አዎ' : 'Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 py-1 px-2 rounded bg-theme-subtle text-theme-main hover:opacity-80 cursor-pointer"
                      >
                        {isAmharic ? 'ተው' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mt-2.5 pl-9 flex flex-col gap-2 max-w-2xl">
          <textarea
            rows={3}
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            className="w-full text-sm bg-theme-surface border border-stone-500/30 rounded-xl p-3 text-theme-main focus:outline-none focus:border-[#dfba69] font-serif resize-y"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!editDraft.trim()}
              className="px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold bg-[#dfba69] text-[#171410] disabled:opacity-40 cursor-pointer"
            >
              {isAmharic ? 'አስቀምጥ' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditDraft(comment.text);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 text-xs font-sans text-theme-muted hover:text-theme-main cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-1.5 pl-9 text-[15px] text-theme-body leading-relaxed whitespace-pre-line font-serif">
          {comment.text}
        </div>
      )}

      <div className="mt-2 pl-9 flex items-center gap-5 text-xs font-sans text-theme-muted">
        <button
          type="button"
          onClick={() => onToggleLike(comment.id)}
          className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
            isReplyLiked ? 'text-[#dfba69] font-medium' : 'hover:text-theme-main'
          }`}
          title="Like reply"
        >
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: isReplyLiked ? "'FILL' 1" : "'FILL' 0" }}
          >
            thumb_up
          </span>
          {displayLikes > 0 && <span className="tabular-nums text-xs">{displayLikes}</span>}
        </button>

        <button
          type="button"
          onClick={() => onSetInlineReplyingId(isReplyingHere ? null : comment.id)}
          className="font-medium hover:text-theme-main transition-colors cursor-pointer"
        >
          {isReplyingHere ? (isAmharic ? 'ሰርዝ' : 'Cancel') : isAmharic ? 'መልስ ስጥ' : 'Reply'}
        </button>
      </div>

      {isReplyingHere && (
        <form
          onSubmit={handleInlineSubmit}
          className="mt-3 pl-9 flex flex-col gap-2 max-w-2xl animate-in fade-in duration-150"
        >
          <textarea
            ref={inlineInputRef}
            rows={2}
            value={inlineText}
            onChange={(e) => setInlineText(e.target.value)}
            placeholder={
              isAmharic ? `ለ${comment.author} መልስ ስጥ...` : `Reply to ${comment.author}...`
            }
            className="w-full text-sm bg-theme-surface border border-stone-500/30 rounded-xl p-3 text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-[#dfba69] font-serif resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!inlineText.trim()}
              className="px-3.5 py-1.5 bg-[#dfba69] text-[#171410] rounded-full text-xs font-sans font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
            >
              {isAmharic ? 'መልስ' : 'Post Reply'}
            </button>
            <button
              type="button"
              onClick={() => onSetInlineReplyingId(null)}
              className="px-2.5 py-1.5 text-xs font-sans text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሰርዝ' : 'Cancel'}
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="relative mt-4 pl-4 sm:pl-5 ml-3.5 border-l border-stone-500/25 hover:border-[#dfba69]/50 transition-colors space-y-5">
          {comment.replies.map((child) => (
            <NestedCommentItem
              key={child.id}
              comment={child}
              postAuthorName={postAuthorName}
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
  onShowToast,
}) => {
  const { t, isAmharic } = useLanguage();
  const queryClient = useQueryClient();
  const discussionsKey = ['discussion-feed'] as const;

  const [activeThreadId, setActiveThreadId] = useState<string | null>(targetQuestionId || null);

  // Feed Search & Filter state
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'discussed'>('recent');

  // Thread Detail UI state
  const [threadSort, setThreadSort] = useState<'top' | 'newest'>('top');
  const [composerOpen, setComposerOpen] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [confirmThreadDelete, setConfirmThreadDelete] = useState(false);
  const threadMenuRef = useRef<HTMLDivElement>(null);

  const [likedQuestions, setLikedQuestions] = useState<Record<string, boolean>>({});
  const [likedReplies, setLikedReplies] = useState<Record<string, boolean>>({});
  const { isSaved, toggle: toggleSave } = useBookmarks(currentUser?.id, 'post', onShowToast);

  const toQuestion = React.useCallback(
    (post: any, replies: QuestionReply[] = []): Question => ({
      id: post.id,
      author: post.author?.name || 'Reader',
      authorAvatar: post.author?.avatar_url || '',
      timeAgo: formatEditorialDate(post.created_at),
      createdAt: post.created_at,
      topic: (post.topic || 'Reflections') as Question['topic'],
      title: post.title || 'Discussion',
      body: post.content || '',
      repliesCount: Number(post.reply_count ?? replies.length),
      likesCount: Number(post.like_count ?? post.likesCount ?? 0),
      replies,
    }),
    []
  );

  const {
    data: discussionsData,
    isPending: isFeedPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: discussionsKey,
    staleTime: 60_000,
    initialPageParam: undefined as { created_at: string; id: string } | undefined,
    queryFn: async ({ pageParam }) => {
      const posts = await loadDiscussionPage(pageParam);
      if (!posts.length) return [];
      const postIds = posts.map((post) => post.id);
      const [likedIds, topicsByPost] = await Promise.all([
        currentUser?.id
          ? loadCurrentUserPostLikes(postIds, currentUser.id)
          : Promise.resolve(EMPTY_LIKED_IDS),
        loadDiscussionTopics(postIds),
      ]);
      return posts.map((post) => ({
        ...toQuestion(post),
        topic: (topicsByPost[post.id] || 'Reflections') as Question['topic'],
        userLiked: likedIds.has(post.id),
      }));
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === 20
        ? {
            created_at: lastPage[lastPage.length - 1].createdAt || '',
            id: lastPage[lastPage.length - 1].id,
          }
        : undefined,
  });

  const questions = useMemo<Question[]>(
    () => discussionsData?.pages.flat() ?? [],
    [discussionsData]
  );

  const updateFeed = (update: (question: Question) => Question | null) => {
    queryClient.setQueryData<any>(discussionsKey, (old: any) =>
      old
        ? {
            ...old,
            pages: old.pages.map((page: Question[]) =>
              page.flatMap((question) => {
                const next = update(question);
                return next ? [next] : [];
              })
            ),
          }
        : old
    );
  };

  const { data: threadData = [], isPending: isThreadPending } = useQuery({
    queryKey: ['discussion-thread', activeThreadId],
    queryFn: () => loadThreadRepliesWithAuthors(activeThreadId!),
    enabled: Boolean(activeThreadId),
    staleTime: 30_000,
  });

  const { data: threadLikedIds = EMPTY_LIKED_IDS } = useQuery({
    queryKey: ['discussion-thread-likes', activeThreadId, currentUser?.id],
    queryFn: () =>
      loadCurrentUserPostLikes(
        threadData.map((reply) => reply.id),
        currentUser?.id
      ),
    enabled: Boolean(activeThreadId && currentUser?.id && threadData.length),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!questions.length) return;
    const myLikes: Record<string, boolean> = {};
    questions.forEach((q) => {
      if ((q as any).userLiked) myLikes[q.id] = true;
    });
    setLikedQuestions(myLikes);
  }, [questions]);

  useEffect(() => {
    setLikedReplies(Object.fromEntries([...threadLikedIds].map((id) => [id, true])));
  }, [threadLikedIds]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (threadMenuRef.current && !threadMenuRef.current.contains(event.target as Node)) {
        setThreadMenuOpen(false);
        setConfirmThreadDelete(false);
      }
    };
    if (threadMenuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [threadMenuOpen]);

  const deleteDiscussionMutation = useMutation({
    mutationFn: (id: string) => deleteDiscussion(id, currentUser!.id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: discussionsKey });
      const previous = queryClient.getQueryData(discussionsKey);
      updateFeed((q) => (q.id === id ? null : q));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(discussionsKey, context.previous);
      onShowToast('Failed to delete. Restored.');
    },
  });

  const deleteReplyMutation = useMutation({
    mutationFn: (replyId: string) => deleteDiscussionReply(replyId, currentUser!.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: discussionsKey });
      const previous = queryClient.getQueryData(discussionsKey);
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(discussionsKey, context.previous);
      onShowToast('Failed to delete reply. Restored.');
    },
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['discussion-thread', activeThreadId] }),
  });

  const createDiscussionMutation = useMutation({
    mutationFn: (data: { title: string; body: string; topic: string }) =>
      createDiscussion(currentUser!.id, data.title, data.body, data.topic),
    onSuccess: (created, variables) => {
      queryClient.setQueryData<any>(discussionsKey, (old: any) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page: Question[], index: number) =>
                index === 0 ? [toQuestion({ ...created, topic: variables.topic }), ...page] : page
              ),
            }
          : old
      );
      onShowToast('Question posted!');
      setActiveThreadId(created.id);
      setNewTitle('');
      setNewBody('');
      setEditingQuestion(null);
      setIsNewQuestionModalOpen(false);
    },
    onError: (error: any) => onShowToast(error?.message || 'Could not post question.'),
  });

  const [inlineReplyingId, setInlineReplyingId] = useState<string | null>(null);
  const [threadReplyInput, setThreadReplyInput] = useState('');
  const composerTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isNewQuestionModalOpen, setIsNewQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newTopic, setNewTopic] = useState<'Early Texts' | 'Philosophy' | 'Reflections' | 'History'>(
    'Early Texts'
  );

  const topics = ['All', 'Early Texts', 'Philosophy', 'Reflections', 'History'];

  useEffect(() => {
    if (targetQuestionId) {
      setActiveThreadId(targetQuestionId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [targetQuestionId]);

  const activeQuestion = questions.find((q) => q.id === activeThreadId);

  const threadReplies = useMemo(() => {
    const byParent = new Map<string, typeof threadData>();
    threadData.forEach((reply) =>
      byParent.set(reply.parent_id!, [...(byParent.get(reply.parent_id!) ?? []), reply])
    );

    const build = (parentId: string): QuestionReply[] =>
      (byParent.get(parentId) ?? []).map((reply) => ({
        id: reply.id,
        author: reply.author?.name || 'Reader',
        authorAvatar: reply.author?.avatar_url || '',
        timeAgo: formatEditorialDate(reply.created_at),
        text: reply.content,
        likesCount: reply.like_count,
        userLiked: likedReplies[reply.id] ?? threadLikedIds.has(reply.id),
        replies: build(reply.id),
      }));

    const rootReplies = activeThreadId ? build(activeThreadId) : [];

    if (threadSort === 'top') {
      return [...rootReplies].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }
    return [...rootReplies].reverse();
  }, [activeThreadId, likedReplies, threadData, threadLikedIds, threadSort]);

  const discussionParticipants = useMemo(() => {
    if (!activeQuestion) return [];
    const counts = new Map<string, { name: string; avatar?: string; count: number }>();

    const addParticipant = (name: string, avatar?: string) => {
      const key = name.trim();
      if (!key) return;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { name: key, avatar, count: 1 });
      }
    };

    addParticipant(activeQuestion.author, activeQuestion.authorAvatar);

    const walkReplies = (items: QuestionReply[]) => {
      items.forEach((item) => {
        addParticipant(item.author, item.authorAvatar);
        if (item.replies?.length) walkReplies(item.replies);
      });
    };
    walkReplies(threadReplies);

    return Array.from(counts.values());
  }, [activeQuestion, threadReplies]);

  const keepReadingThreads = useMemo(() => {
    if (!activeQuestion) return [];
    const candidates = questions.filter(
      (q) =>
        q.id !== activeQuestion.id &&
        !q.title.toLowerCase().startsWith('discussion:')
    );
    const sameTopic = candidates.filter((q) => q.topic === activeQuestion.topic);
    const otherTopics = candidates.filter((q) => q.topic !== activeQuestion.topic);
    return [...sameTopic, ...otherTopics].slice(0, 3);
  }, [activeQuestion, questions]);

  const isAuthor = (q: Question) => {
    if (!currentUser?.name || !q.author) return false;
    return q.author.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
  };

  const handleOpenThread = (id: string) => {
    setActiveThreadId(id);
    setInlineReplyingId(null);
    setThreadReplyInput('');
    setComposerOpen(false);
    setThreadMenuOpen(false);
    setConfirmThreadDelete(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFeed = () => {
    setActiveThreadId(null);
    setInlineReplyingId(null);
    setThreadReplyInput('');
    setComposerOpen(false);
    setThreadMenuOpen(false);
    setConfirmThreadDelete(false);
    if (onClearTargetQuestion) onClearTargetQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenComposer = () => {
    setComposerOpen(true);
    setInlineReplyingId(null);
    setTimeout(() => composerTextareaRef.current?.focus(), 40);
  };

  const handleToggleLike = async (id: string) => {
    if (!currentUser?.id) {
      onShowToast('You must be signed in to like a discussion.');
      return;
    }
    const isLiked = !!likedQuestions[id];
    try {
      await togglePostLike(id, currentUser.id, isLiked);
      setLikedQuestions((prev) => ({ ...prev, [id]: !isLiked }));
      updateFeed((question) =>
        question.id === id
          ? { ...question, likesCount: Math.max(0, question.likesCount + (isLiked ? -1 : 1)) }
          : question
      );
      onShowToast(isLiked ? 'Like removed' : 'Liked discussion');
    } catch (error: any) {
      onShowToast(error?.message || 'Could not update like.');
    }
  };

  const handleToggleReplyLike = async (replyId: string) => {
    if (!currentUser?.id) {
      onShowToast('You must be signed in to like a reply.');
      return;
    }
    const isLiked = !!likedReplies[replyId];
    try {
      await toggleReplyLike(replyId, currentUser.id, isLiked);
      setLikedReplies((prev) => ({ ...prev, [replyId]: !isLiked }));
      onShowToast(isLiked ? 'Like removed' : 'Liked reply');
    } catch (error: any) {
      onShowToast(error?.message || 'Could not update reply like.');
    }
  };

  const handleDirectNestedReply = async (
    parentId: string,
    replyToAuthor: string,
    text: string
  ) => {
    if (!currentUser?.id) {
      onShowToast('You must be signed in to reply.');
      return;
    }
    try {
      await createReply(currentUser.id, parentId, text);
      await queryClient.invalidateQueries({ queryKey: ['discussion-thread', activeThreadId] });
      if (activeThreadId) {
        updateFeed((question) =>
          question.id === activeThreadId
            ? { ...question, repliesCount: question.repliesCount + 1 }
            : question
        );
      }
      onShowToast(`Replied to ${replyToAuthor}`);
    } catch (error: any) {
      onShowToast(error?.message || 'Could not post reply.');
    }
  };

  const handleEditNestedReply = async (replyId: string, content: string) => {
    if (!currentUser?.id) {
      onShowToast('You must be signed in to edit a reply.');
      throw new Error('Sign in required');
    }
    try {
      await updateDiscussionReply(replyId, currentUser.id, content);
      await queryClient.invalidateQueries({ queryKey: ['discussion-thread', activeThreadId] });
      onShowToast('Reply updated');
    } catch (error: any) {
      onShowToast(error?.message || 'Could not update reply.');
      throw error;
    }
  };

  const handleDeleteNestedReply = async (replyId: string) => {
    if (!currentUser?.id) {
      onShowToast('You must be signed in to delete a reply.');
      return;
    }
    onShowToast('Reply deleted');
    try {
      await deleteReplyMutation.mutateAsync(replyId);
    } catch {
      // Handled by mutation
    }
  };

  const handleSubmitThreadReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeQuestion) return;
    const text = threadReplyInput.trim();
    if (!text) return;

    if (!currentUser?.id) {
      onShowToast('You must be signed in to reply.');
      return;
    }
    try {
      await createReply(currentUser.id, activeQuestion.id, text);
      await queryClient.invalidateQueries({ queryKey: ['discussion-thread', activeThreadId] });
      updateFeed((question) =>
        question.id === activeQuestion.id
          ? { ...question, repliesCount: question.repliesCount + 1 }
          : question
      );
      onShowToast('Reflection posted to thread');
      setThreadReplyInput('');
      setComposerOpen(false);
    } catch (error: any) {
      onShowToast(error?.message || 'Could not post reply.');
    }
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

  const handleConfirmDeleteQuestion = async (id: string) => {
    const target = questions.find((item) => item.id === id);
    if (target && !isAuthor(target)) {
      onShowToast('You can only delete questions you authored.');
      return;
    }
    if (!currentUser?.id) {
      onShowToast('You must be signed in to delete a discussion.');
      return;
    }

    if (activeThreadId === id) handleBackToFeed();
    try {
      await deleteDiscussionMutation.mutateAsync(id);
      onShowToast('Discussion deleted');
    } catch {
      // Handled by mutation
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
        await updateDiscussion(
          editingQuestion.id,
          currentUser.id,
          newTitle,
          newBody,
          newTopic
        );
        updateFeed((question) =>
          question.id === editingQuestion.id
            ? { ...question, title: newTitle, body: newBody, topic: newTopic }
            : question
        );
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

      await createDiscussionMutation.mutateAsync({
        title: newTitle,
        body: newBody,
        topic: newTopic,
      });
    }

    setNewTitle('');
    setNewBody('');
    setEditingQuestion(null);
    setIsNewQuestionModalOpen(false);
  };

  const sortedAndFilteredQuestions = useMemo(() => {
    const filtered = questions.filter((q) => {
      if (selectedTopic !== 'All' && q.topic !== selectedTopic) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          q.title.toLowerCase().includes(query) ||
          q.body.toLowerCase().includes(query) ||
          q.author.toLowerCase().includes(query)
        );
      }
      return true;
    });

    const createdAtTime = (question: Question) => {
      const timestamp = question.createdAt ? Date.parse(question.createdAt) : 0;
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    return [...filtered].sort((a, b) => {
      const recentFirst = createdAtTime(b) - createdAtTime(a);
      if (sortBy === 'discussed') {
        const replyDifference = countAllReplies(b.replies) - countAllReplies(a.replies);
        return replyDifference || recentFirst;
      }
      return recentFirst;
    });
  }, [questions, selectedTopic, searchQuery, sortBy]);

  const totalDisplayedContributions = Math.max(
    activeQuestion?.repliesCount || 0,
    countAllReplies(threadReplies)
  );

  if (activeThreadId && !activeQuestion && isFeedPending) {
    return (
      <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-20">
        <div className="max-w-5xl xl:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 lg:gap-12 animate-pulse">
            <div className="space-y-5">
              <div className="h-4 w-32 rounded bg-theme-subtle" />
              <div className="h-48 rounded-2xl bg-theme-surface border border-stone-500/20" />
              <div className="h-24 rounded-xl bg-theme-subtle/50" />
            </div>
            <div className="space-y-4 lg:border-l lg:border-stone-500/20 lg:pl-8">
              <div className="h-4 w-32 rounded bg-theme-subtle" />
              <div className="h-6 w-full rounded bg-theme-subtle" />
              <div className="h-6 w-full rounded bg-theme-subtle" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div
        className={`${
          activeQuestion ? 'max-w-5xl xl:max-w-6xl' : 'max-w-4xl xl:max-w-5xl'
        } mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6`}
      >
        {activeQuestion ? (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-10 lg:gap-12 items-start animate-in fade-in duration-150">
            {/* PRIMARY LEFT COLUMN */}
            <div className="flex flex-col gap-6 min-w-0">
              {/* Top Navigation & Passive Actions Bar */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackToFeed}
                  className="inline-flex items-center gap-2 text-xs sm:text-sm font-sans text-theme-muted hover:text-theme-main transition-colors cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
                    arrow_back
                  </span>
                  <span>{isAmharic ? 'ሁሉም ውይይቶች' : 'All discussions'}</span>
                </button>

                <div className="flex items-center gap-1">
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
                    onClick={() => toggleSave(activeQuestion.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isSaved(activeQuestion.id)
                        ? 'text-[#dfba69]'
                        : 'text-theme-muted hover:text-theme-main hover:bg-theme-subtle'
                    }`}
                    title="Bookmark discussion"
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{
                        fontVariationSettings: isSaved(activeQuestion.id) ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      bookmark
                    </span>
                  </button>

                  {isAuthor(activeQuestion) && (
                    <div ref={threadMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setThreadMenuOpen((prev) => !prev);
                          setConfirmThreadDelete(false);
                        }}
                        aria-label="Discussion options"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                      </button>

                      {threadMenuOpen && (
                        <div className="absolute right-0 top-9 z-30 w-48 rounded-xl bg-theme-surface border border-stone-500/25 shadow-2xl py-1.5 text-xs font-sans">
                          {!confirmThreadDelete ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setThreadMenuOpen(false);
                                  handleOpenEditQuestion(activeQuestion);
                                }}
                                className="w-full px-3.5 py-2 text-left text-theme-main hover:bg-theme-subtle flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                <span>{isAmharic ? 'ጥያቄ አስተካክል' : 'Edit discussion'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmThreadDelete(true)}
                                className="w-full px-3.5 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                <span>{isAmharic ? 'ጥያቄ አጥፋ' : 'Delete discussion'}</span>
                              </button>
                            </>
                          ) : (
                            <div className="px-3.5 py-2 space-y-2">
                              <p className="text-[11px] text-theme-muted leading-snug">
                                {isAmharic
                                  ? 'ይህን ውይይት በቋሚነት ማጥፋት ይፈልጋሉ?'
                                  : 'Permanently delete this discussion?'}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setThreadMenuOpen(false);
                                    setConfirmThreadDelete(false);
                                    void handleConfirmDeleteQuestion(activeQuestion.id);
                                  }}
                                  className="flex-1 py-1 px-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 cursor-pointer"
                                >
                                  {isAmharic ? 'አዎ' : 'Delete'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmThreadDelete(false)}
                                  className="flex-1 py-1 px-2 rounded bg-theme-subtle text-theme-main hover:opacity-80 cursor-pointer"
                                >
                                  {isAmharic ? 'ተው' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Anchored Symposium Prompt Card */}
              <article className="bg-theme-surface rounded-2xl p-6 sm:p-8 border border-[#c8a256]/25 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-sans font-semibold tracking-wide text-[#dfba69]">
                    {activeQuestion.topic}
                  </span>

                  {activeQuestion.bookTitle && (
                    <div className="flex items-center gap-1.5 text-xs text-theme-muted font-serif">
                      <span className="material-symbols-outlined text-[14px] text-[#dfba69]">
                        menu_book
                      </span>
                      <span>{activeQuestion.bookTitle}</span>
                    </div>
                  )}
                </div>

                <h1 className="font-serif text-[28px] sm:text-[34px] font-bold text-theme-main leading-[1.16] tracking-tight">
                  {activeQuestion.title}
                </h1>

                {activeQuestion.body && (
                  <div className="font-serif text-[15.5px] sm:text-[16.5px] text-theme-body/90 leading-relaxed whitespace-pre-line space-y-3">
                    {activeQuestion.body}
                  </div>
                )}

                {/* Author Byline */}
                <div className="flex items-center gap-2.5 pt-1">
                  <AvatarWithFallback
                    src={activeQuestion.authorAvatar}
                    name={activeQuestion.author}
                    sizeClass="w-7 h-7"
                  />
                  <span className="font-sans font-semibold text-sm text-theme-main">
                    {activeQuestion.author}
                  </span>
                  {isAuthor(activeQuestion) && (
                    <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#362c1b] text-[#dfba69] border border-[#c8a256]/35 font-medium leading-none">
                      Author
                    </span>
                  )}
                  <span className="text-xs font-sans text-theme-muted">
                    {activeQuestion.timeAgo}
                  </span>
                </div>

                {/* Soft Divider & Balanced Engagement Row */}
                <div className="pt-4 mt-1 border-t border-stone-500/20 flex items-center justify-between gap-4 flex-wrap text-xs sm:text-sm font-sans">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(activeQuestion.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        likedQuestions[activeQuestion.id]
                          ? 'bg-[#362c1b] border-[#c8a256]/55 text-[#dfba69] font-semibold'
                          : 'bg-theme-app/40 border-stone-500/25 text-[#dfba69] hover:border-[#c8a256]/50'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[15px]"
                        style={{
                          fontVariationSettings: likedQuestions[activeQuestion.id]
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        thumb_up
                      </span>
                      <span className="tabular-nums">{activeQuestion.likesCount}</span>
                    </button>

                    <div className="inline-flex items-center gap-1.5 text-theme-muted">
                      <span className="material-symbols-outlined text-[16px]">
                        chat_bubble_outline
                      </span>
                      <span>
                        {totalDisplayedContributions}{' '}
                        {isAmharic
                          ? 'አስተያየቶች'
                          : totalDisplayedContributions === 1
                          ? 'contribution'
                          : 'contributions'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenComposer}
                    className="px-4 py-1.5 rounded-full bg-[#dfba69] text-[#171410] font-semibold text-xs sm:text-[13px] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                  >
                    {isAmharic ? 'አስተያየት ጻፍ' : 'Write a reflection'}
                  </button>
                </div>
              </article>

              {/* Discussion Stream */}
              <section className="flex flex-col gap-5 pt-1">
                <div className="flex items-center justify-between pb-2.5 border-b border-stone-500/20">
                  <h2 className="font-serif font-bold text-xl sm:text-[22px] text-theme-main flex items-baseline gap-2.5">
                    <span>{isAmharic ? 'ውይይት' : 'Discussion'}</span>
                    <span className="text-sm font-sans font-normal text-theme-muted">
                      {totalDisplayedContributions}
                    </span>
                  </h2>

                  {threadReplies.length > 1 && (
                    <div className="flex items-center gap-1 text-xs font-sans">
                      <button
                        type="button"
                        onClick={() => setThreadSort('top')}
                        className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                          threadSort === 'top'
                            ? 'bg-theme-subtle text-theme-main font-medium'
                            : 'text-theme-muted hover:text-theme-main'
                        }`}
                      >
                        {isAmharic ? 'ተወዳጅ' : 'Top'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setThreadSort('newest')}
                        className={`px-2.5 py-1 rounded-full transition-colors cursor-pointer ${
                          threadSort === 'newest'
                            ? 'bg-theme-subtle text-theme-main font-medium'
                            : 'text-theme-muted hover:text-theme-main'
                        }`}
                      >
                        {isAmharic ? 'አዲስ' : 'Newest'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Reflection Composer (Opens cleanly at top of Discussion stream) */}
                {composerOpen && (
                  <form
                    onSubmit={handleSubmitThreadReply}
                    className="rounded-2xl bg-theme-surface border border-[#c8a256]/40 p-4 flex flex-col gap-3 animate-in fade-in duration-150"
                  >
                    <div className="flex items-start gap-3">
                      <AvatarWithFallback
                        src={currentUser?.avatar}
                        name={currentUser?.name || 'User'}
                        sizeClass="w-7 h-7"
                      />
                      <textarea
                        ref={composerTextareaRef}
                        rows={4}
                        maxLength={2500}
                        value={threadReplyInput}
                        onChange={(e) => setThreadReplyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            void handleSubmitThreadReply();
                          }
                        }}
                        placeholder={
                          isAmharic
                            ? 'ታሪካዊ ግንዛቤ፣ ጥቅስ ወይም መልስ ያጋሩ...'
                            : 'Share a dialectical reflection, textual citation, or answer...'
                        }
                        className="w-full text-sm sm:text-[15px] bg-transparent text-theme-main placeholder:text-theme-muted focus:outline-none font-serif resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-stone-500/20 pl-10">
                      <span className="text-[11px] font-sans text-theme-muted">
                        {threadReplyInput.length}/2500
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setComposerOpen(false);
                            setThreadReplyInput('');
                          }}
                          className="px-3 py-1.5 text-xs font-sans text-theme-muted hover:text-theme-main cursor-pointer"
                        >
                          {isAmharic ? 'ሰርዝ' : 'Cancel'}
                        </button>
                        <button
                          type="submit"
                          disabled={!threadReplyInput.trim()}
                          className="px-4 py-1.5 rounded-full text-xs font-sans font-semibold bg-[#dfba69] text-[#171410] hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
                        >
                          {isAmharic ? 'አስተያየት ላክ' : 'Post reflection'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {isThreadPending && threadReplies.length === 0 ? (
                  <div className="space-y-4 animate-pulse pt-2">
                    <div className="h-16 rounded-xl bg-theme-subtle/60" />
                    <div className="h-16 rounded-xl bg-theme-subtle/60" />
                  </div>
                ) : threadReplies.length > 0 ? (
                  <div className="divide-y divide-stone-500/20">
                    {threadReplies.map((reply, index) => (
                      <div key={reply.id} className={index > 0 ? 'pt-6 mt-6' : ''}>
                        <NestedCommentItem
                          comment={reply}
                          postAuthorName={activeQuestion.author}
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
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center rounded-2xl bg-theme-surface/50 border border-stone-500/20">
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
            </div>

            {/* CONTEXTUAL RIGHT RAIL */}
            <aside className="lg:sticky lg:top-24 flex flex-col gap-7 pt-1 lg:border-l lg:border-stone-500/20 lg:pl-8">
              <div className="flex flex-col gap-3.5">
                <h3 className="font-serif text-[15px] font-bold text-theme-main">
                  {isAmharic ? 'በዚህ ውይይት ውስጥ' : 'In this discussion'}
                </h3>
                <div className="space-y-3">
                  {discussionParticipants.map((participant) => (
                    <div
                      key={participant.name}
                      className="flex items-center justify-between gap-2 text-xs font-sans"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarWithFallback
                          src={participant.avatar}
                          name={participant.name}
                          sizeClass="w-6 h-6"
                        />
                        <span className="text-theme-main/90 font-medium truncate">
                          {participant.name}
                        </span>
                      </div>
                      <span className="text-theme-muted tabular-nums">{participant.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {keepReadingThreads.length > 0 && (
                <div className="flex flex-col gap-4 pt-5 border-t border-stone-500/20">
                  <h3 className="font-serif text-[15px] font-bold text-theme-main">
                    {isAmharic ? 'ማንበብዎን ይቀጥሉ' : 'Keep reading'}
                  </h3>
                  <div className="divide-y divide-stone-500/20">
                    {keepReadingThreads.map((related, idx) => (
                      <button
                        key={related.id}
                        type="button"
                        onClick={() => handleOpenThread(related.id)}
                        className={`w-full text-left group cursor-pointer block ${
                          idx > 0 ? 'pt-3.5' : ''
                        } ${idx < keepReadingThreads.length - 1 ? 'pb-3.5' : ''}`}
                      >
                        <p className="font-serif text-sm font-bold text-theme-main group-hover:text-[#dfba69] transition-colors leading-snug">
                          {related.title}
                        </p>
                        <p className="text-[11px] font-sans text-theme-muted mt-1">
                          {related.topic} · {related.repliesCount}{' '}
                          {related.repliesCount === 1 ? 'contribution' : 'contributions'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
              <div>
                <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
                  {isAmharic ? 'የማህበረሰብ ውይይቶች' : 'Community Discussions'}
                </h1>
                <p className="page-subtitle text-xs sm:text-sm text-theme-muted font-sans">
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
                placeholder={
                  isAmharic
                    ? 'ውይይቶችን፣ ደራሲያንን ወይም ጥያቄዎችን ፈልግ...'
                    : 'Search discussions, authors, or textual questions...'
                }
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
                    ? isAmharic
                      ? 'የቅርብ ጊዜ'
                      : 'Recent'
                    : isAmharic
                    ? 'ብዙ የተወያየበት'
                    : 'Most Discussed'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedAndFilteredQuestions.map((q) => {
                const isLiked = !!likedQuestions[q.id];
                const saved = isSaved(q.id);
                const likesCount = q.likesCount;
                const totalReplies = q.repliesCount;

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
                          <span className="truncate">
                            {q.bookTitle} {q.chapter ? `• ${q.chapter}` : ''}
                          </span>
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
                          <span className="material-symbols-outlined text-[16px]">
                            chat_bubble_outline
                          </span>
                          <span>
                            {totalReplies} {isAmharic ? 'መልሶች' : 'Replies'}
                          </span>
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
                          onClick={() => toggleSave(q.id)}
                          className={`cursor-pointer transition-colors p-1 rounded hover:bg-theme-subtle ${
                            saved ? 'text-theme-gold' : 'hover:text-theme-main'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[17px]"
                            style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            bookmark
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {sortedAndFilteredQuestions.length === 0 && (
                <div className="col-span-full bg-theme-subtle rounded-xl p-8 text-center border border-theme mt-2">
                  <span className="material-symbols-outlined text-3xl text-theme-subtle mb-1">
                    search_off
                  </span>
                  <h3 className="font-serif text-[16px] font-bold text-theme-main">
                    {isAmharic ? 'ምንም ውይይቶች አልተገኙም' : 'No discussions found'}
                  </h3>
                  <p className="text-xs text-theme-muted mt-1 font-sans">
                    {isAmharic
                      ? 'የፍለጋ መስፈርትዎን የሚያሟላ ምንም ውይይት አልተገኘም።'
                      : 'No discussions matched your search criteria.'}
                  </p>
                </div>
              )}
            </div>
            {hasNextPage && !searchQuery && selectedTopic === 'All' && (
              <div className="col-span-full flex justify-center pt-3">
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-4 py-2 rounded-lg bg-theme-subtle text-theme-main text-xs font-semibold disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading…' : isAmharic ? 'ተጨማሪ ጫን' : 'Load more'}
                </button>
              </div>
            )}
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
                    ? isAmharic
                      ? 'ጥያቄ አስተካክል'
                      : 'Edit Question'
                    : isAmharic
                    ? 'ጥያቄ ጠይቅ'
                    : 'Ask a Question'}
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
                  ? isAmharic
                    ? 'ለውጦችን አስቀምጥ'
                    : 'Save Changes'
                  : isAmharic
                  ? 'ጥያቄ አስገባ'
                  : 'Post Question'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};