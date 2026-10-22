import { supabase } from '../../lib/supabase';
import { Review } from '../../types';

export type ReviewerProfileMap = Record<
  string,
  { name?: string | null; username?: string | null; avatar_url?: string | null; avatar?: string | null; title?: string | null }
>;

export const loadReviewerProfilesForReviews = async (reviewList: Review[]) => {
  const reviewerIds = [...new Set(reviewList.map((review) => review.user_id).filter(Boolean))];

  if (reviewerIds.length === 0) {
    return {} as ReviewerProfileMap;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url')
    .in('id', reviewerIds);

  if (error) {
    console.error('Failed to load reviewer profiles:', error);
    return {} as ReviewerProfileMap;
  }

  return (data ?? []).reduce<ReviewerProfileMap>((acc, profile) => {
    acc[profile.id] = {
      name: profile.name,
      username: profile.username,
      avatar_url: profile.avatar_url,
      avatar: profile.avatar_url,
    };
    return acc;
  }, {});
};
