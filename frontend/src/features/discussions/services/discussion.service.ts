import { supabase } from '../../../lib/supabase';
import { DiscussionPost, PostLike, Profile, QuestionReply } from '../../../types';

export type DiscussionPostWithAuthor = DiscussionPost & {
  author?: Pick<Profile, 'name' | 'username' | 'avatar_url'> | null;
};

export interface PostLikeData {
  totalLikes: number;
  isLikedByMe: boolean;
}

export const loadAllRepliesForThread = async (threadId: string): Promise<QuestionReply[]> => {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select(discussionWithAuthor)
    .not('parent_id', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;

  const allReplies = (data ?? []) as DiscussionPostWithAuthor[];
  const buildTree = (parentId: string): QuestionReply[] => allReplies
    .filter((reply) => reply.parent_id === parentId)
    .map((child) => ({
      id: child.id,
      author: child.author?.name || 'Reader',
      authorAvatar: child.author?.avatar_url || '',
      timeAgo: new Date(child.created_at).toLocaleDateString(),
      text: child.content,
      replies: buildTree(child.id),
    }));

  return buildTree(threadId);
};

export const getReplyLikeData = async (replyId: string, userId?: string): Promise<PostLikeData> => {
  const { count, error: countError } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', replyId);
  if (countError) throw countError;
  if (!userId) return { totalLikes: count ?? 0, isLikedByMe: false };

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', replyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { totalLikes: count ?? 0, isLikedByMe: data !== null };
};

export const toggleReplyLike = async (replyId: string, userId: string, isLiked: boolean): Promise<void> => {
  const result = isLiked
    ? await supabase.from('post_likes').delete().eq('post_id', replyId).eq('user_id', userId)
    : await supabase.from('post_likes').insert({ post_id: replyId, user_id: userId });
  if (result.error) throw result.error;
};

const discussionWithAuthor = '*, author:profiles!discussion_posts_author_id_fkey(name, username, avatar_url)';

export const loadDiscussionsWithAuthors = async (): Promise<DiscussionPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select(discussionWithAuthor)
    .is('parent_id', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DiscussionPostWithAuthor[];
};

export const loadDiscussionReplies = async (threadId: string): Promise<DiscussionPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select(discussionWithAuthor)
    .eq('parent_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DiscussionPostWithAuthor[];
};

export const getPostLikeData = async (postId: string, userId?: string): Promise<PostLikeData> => {
  const { count, error: countError } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);
  if (countError) throw countError;
  if (!userId) return { totalLikes: count ?? 0, isLikedByMe: false };

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return { totalLikes: count ?? 0, isLikedByMe: data !== null };
};

export const loadPostLikes = async (postIds: string[]): Promise<PostLike[]> => {
  if (postIds.length === 0) return [];
  const { data, error } = await supabase.from('post_likes').select('*').in('post_id', postIds);
  if (error) throw error;
  return (data ?? []) as PostLike[];
};

export const togglePostLike = async (postId: string, userId: string, isLiked: boolean): Promise<void> => {
  const result = isLiked
    ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    : await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
  if (result.error) throw result.error;
};

export const createDiscussion = async (userId: string, title: string, content: string): Promise<DiscussionPost> => {
  const { data, error } = await supabase
    .from('discussion_posts')
    .insert({ author_id: userId, parent_id: null, title, content })
    .select('*')
    .single();
  if (error) throw error;
  return data as DiscussionPost;
};

export const createReply = async (userId: string, parentId: string, content: string): Promise<DiscussionPostWithAuthor> => {
  const { data, error } = await supabase
    .from('discussion_posts')
    .insert({ author_id: userId, parent_id: parentId, content })
    .select(discussionWithAuthor)
    .single();
  if (error) throw error;
  return data as DiscussionPostWithAuthor;
};
