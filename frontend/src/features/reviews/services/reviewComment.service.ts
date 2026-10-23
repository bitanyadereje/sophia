import { supabase } from '../../../lib/supabase';
import { Profile, ReviewComment } from '../../../types';

export type ReviewCommentWithAuthor = ReviewComment & {
  author?: Pick<Profile, 'name' | 'username' | 'avatar_url'> | null;
};

export const loadReviewCommentsForReviews = async (reviewIds: string[]): Promise<ReviewCommentWithAuthor[]> => {
  if (reviewIds.length === 0) return [];

  const { data, error } = await supabase
    .from('review_comments')
    .select('*, author:profiles!review_comments_user_id_fkey(name, username, avatar_url)')
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
): Promise<ReviewComment> => {
  const { data, error } = await supabase
    .from('review_comments')
    .insert({ review_id: reviewId, user_id: userId, content })
    .select('*')
    .single();
  if (error) throw error;
  return data as ReviewComment;
};
