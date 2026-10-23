import { supabase } from '../../../lib/supabase';
import { Profile, ReviewComment } from '../../../types';
import type { ReviewLikeData } from './reviewInteraction.service';

export type ReviewCommentWithAuthor = ReviewComment & {
  parent_id?: string | null;
  author?: Pick<Profile, 'name' | 'username' | 'avatar_url'> | null;
  replies?: ReviewCommentTree[];
};

export type ReviewCommentTree = ReviewCommentWithAuthor & {
  parent_id: string | null;
  replies: ReviewCommentTree[];
};

export const loadReviewCommentsForReviews = async (reviewIds: string[]): Promise<ReviewCommentWithAuthor[]> => {
  if (reviewIds.length === 0) return [];

  const { data, error } = await supabase
    .from('review_comments')
    .select('*, parent_id, author:profiles!review_comments_user_id_fkey(name, username, avatar_url)')
    .in('review_id', reviewIds)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReviewCommentWithAuthor[];
};

export const loadReviewComments = async (reviewId: string): Promise<ReviewCommentWithAuthor[]> =>
  loadReviewCommentsForReviews([reviewId]);

export const addReviewComment = async (
  reviewId: string,
  userId: string,
  content: string,
): Promise<ReviewCommentWithAuthor> => {
  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: userId, content, parent_id: null })
    .select('*, parent_id, author:profiles!review_comments_user_id_fkey(name, username, avatar_url)')
    .single();
  if (error) throw error;
  return data as ReviewCommentWithAuthor;
};

export const addNestedComment = async (
  reviewId: string,
  userId: string,
  content: string,
  parentId: string,
): Promise<ReviewCommentWithAuthor> => {
  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: userId, content, parent_id: parentId })
    .select('*, parent_id, author:profiles!review_comments_user_id_fkey(name, username, avatar_url)')
    .single();
  if (error) throw error;
  return data as ReviewCommentWithAuthor;
};

export const updateReviewComment = async (
  commentId: string,
  userId: string,
  newContent: string,
): Promise<void> => {
  const { data, error } = await supabase
    .from('review_comments')
    .update({ content: newContent })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You do not have permission to edit this comment.');
};

export const deleteReviewComment = async (commentId: string, userId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('review_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('You do not have permission to delete this comment.');
};

export const buildCommentTree = (flatComments: ReviewCommentWithAuthor[]): ReviewCommentTree[] => {
  const commentsById = new Map<string, ReviewCommentTree>();
  flatComments.forEach((comment) => {
    commentsById.set(comment.id, { ...comment, parent_id: comment.parent_id ?? null, replies: [] });
  });

  const roots: ReviewCommentTree[] = [];
  commentsById.forEach((comment) => {
    const parent = comment.parent_id ? commentsById.get(comment.parent_id) : undefined;
    if (parent) parent.replies.push(comment);
    else roots.push(comment);
  });
  return roots;
};

export const getCommentLikeData = async (
  commentId: string,
  userId?: string,
): Promise<ReviewLikeData> => {
  const { count, error: countError } = await supabase
    .from('review_comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId);
  if (countError) throw countError;

  if (!userId) return { totalLikes: count ?? 0, isLikedByMe: false };

  const { data, error } = await supabase
    .from('review_comment_likes')
    .select('comment_id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  return { totalLikes: count ?? 0, isLikedByMe: data !== null };
};

export const toggleCommentLike = async (
  commentId: string,
  userId: string,
  isLiked: boolean,
): Promise<void> => {
  const result = isLiked
    ? await supabase.from('review_comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId)
    : await supabase.from('review_comment_likes').insert({ comment_id: commentId, user_id: userId });
  if (result.error) throw result.error;
};
