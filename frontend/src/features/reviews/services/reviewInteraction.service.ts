import { supabase } from '../../../lib/supabase';
import { ReviewLike } from '../../../types';

export interface ReviewLikeData {
  totalLikes: number;
  isLikedByMe: boolean;
}

export const loadReviewLikesForReviews = async (reviewIds: string[]): Promise<ReviewLike[]> => {
  if (reviewIds.length === 0) return [];

  const { data, error } = await supabase
    .from('review_likes')
    .select('*')
    .in('review_id', reviewIds);
  if (error) throw error;
  return (data ?? []) as ReviewLike[];
};

export const loadCurrentUserReviewLikes = async (reviewIds: string[], userId?: string | null): Promise<Set<string>> => {
  if (!userId || reviewIds.length === 0) return new Set();
  const { data, error } = await supabase.from('review_likes').select('review_id').eq('user_id', userId).in('review_id', reviewIds);
  if (error) throw error;
  return new Set((data ?? []).map((like) => like.review_id));
};

export const getReviewLikeData = async (reviewId: string, userId?: string): Promise<ReviewLikeData> => {
  const { count, error: countError } = await supabase
    .from('review_likes')
    .select('*', { count: 'exact', head: true })
    .eq('review_id', reviewId);
  if (countError) throw countError;

  if (!userId) return { totalLikes: count ?? 0, isLikedByMe: false };

  const { data: userLike, error: userLikeError } = await supabase
    .from('review_likes')
    .select('review_id')
    .eq('review_id', reviewId)
    .eq('user_id', userId)
    .maybeSingle();
  if (userLikeError) throw userLikeError;

  return { totalLikes: count ?? 0, isLikedByMe: userLike !== null };
};

export const toggleReviewLike = async (reviewId: string, userId: string, isLiked: boolean): Promise<void> => {
  if (isLiked) {
    const { error } = await supabase
      .from('review_likes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from('review_likes')
    .insert({ review_id: reviewId, user_id: userId });
  if (error) throw error;
};
