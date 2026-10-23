import { supabase } from '../../lib/supabase';
import { Review, UserProfile } from '../../types';

export const loadReviews = async (): Promise<Review[]> => {
  const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Review[];
};

export const mapReviewMutationError = (error: any): string => {
  if (error?.code === '23505') return 'You already reviewed this book. Edit your existing review instead.';
  if (error?.code === '23503') return 'The selected book is no longer available. Search the catalog again.';
  if (error?.code === '42501') return 'Permission denied. Please sign in and try again.';
  return error?.message || 'Unexpected database error.';
};

export const createReview = async (userId: string, review: Pick<Review, 'book_id' | 'content' | 'rating' | 'quote'> & { title?: string | null }) => {
  const { data, error } = await supabase.from('reviews').insert({ user_id: userId, ...review }).select('*').single();
  if (error) throw error;
  return data as Review;
};

export const updateReview = async (id: string, userId: string, updated: Partial<Review>) => {
  const patch = {
    ...(updated.title !== undefined ? { title: updated.title } : {}),
    ...(updated.content !== undefined ? { content: updated.content } : {}),
    ...(updated.rating !== undefined ? { rating: updated.rating } : {}),
    ...(updated.quote !== undefined ? { quote: updated.quote } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('reviews').update(patch).eq('id', id).eq('user_id', userId).select('*').single();
  if (error) throw error;
  return data as Review;
};

export const deleteReview = async (id: string, userId: string) => {
  const { error } = await supabase.from('reviews').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
};

export const getReviewerProfile = async (userId: string): Promise<Pick<UserProfile, 'id' | 'name' | 'avatar' | 'title'> | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name ?? '',
    avatar: data.avatar_url ?? '',
    title: '',
  };
};
