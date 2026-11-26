import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

export interface ProfileContributionStats {
  email: string;
  booksCompleted: number;
  reviewsPublished: number;
  discussionsCount: number;
  pathsCurated: number;
  privateNotesCount: number;
}

export const loadProfile = async (
  userId: string
): Promise<Pick<UserProfile, 'id' | 'role' | 'name' | 'avatar'>> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url, role')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) {
    return {
      id: data.id,
      role: data.role || undefined,
      name: data.name || data.username || 'Reader',
      avatar: data.avatar_url || '',
    };
  }

  const { data: authData } = await supabase.auth.getUser();
  return {
    id: userId,
    name: authData.user?.user_metadata?.name || authData.user?.email || 'Reader',
    avatar: '',
  };
};

export const updateProfile = async (
  userId: string,
  updated: Partial<UserProfile>
): Promise<void> => {
  const payload: Record<string, unknown> = {};
  if (updated.name !== undefined) payload.name = updated.name.trim();
  if (updated.avatar !== undefined) payload.avatar_url = updated.avatar;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) throw error;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  const extension = file.name.split('.').pop();
  const path = `${userId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;
  return publicUrl;
};

/**
 * Lightweight exact counts (head: true — zero row payloads)
 * derived from existing tables for the Profile contribution strip.
 */
export const loadProfileContributions = async (
  userId: string
): Promise<ProfileContributionStats> => {
  const [
    authRes,
    completedRes,
    reviewsRes,
    discussionsRes,
    pathsRes,
    notesRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('library_books')
      .select('book_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed'),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'published'),
    supabase
      .from('discussion_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('reading_paths')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', userId),
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  if (completedRes.error) throw completedRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  if (discussionsRes.error) throw discussionsRes.error;
  if (pathsRes.error) throw pathsRes.error;
  if (notesRes.error) throw notesRes.error;

  return {
    email: authRes.data?.user?.email ?? '',
    booksCompleted: completedRes.count ?? 0,
    reviewsPublished: reviewsRes.count ?? 0,
    discussionsCount: discussionsRes.count ?? 0,
    pathsCurated: pathsRes.count ?? 0,
    privateNotesCount: notesRes.count ?? 0,
  };
};

export const exportUserMarginaliaMarkdown = async (
  userId: string,
  readerName: string
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('notes')
    .select('id, title, content, created_at, book:books(title, author_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const lines = [
    `# Sophia Marginalia & Reading Notes`,
    `Reader: ${readerName || 'Scholar'}`,
    `Exported: ${new Date().toLocaleDateString()}`,
    ``,
    ...data.map((note: any) => {
      const bookObj = Array.isArray(note.book) ? note.book[0] : note.book;
      const heading = note.title || bookObj?.title || 'Untitled Note';
      const sub = bookObj?.title
        ? `*${bookObj.title}${bookObj.author_name ? ` — ${bookObj.author_name}` : ''}* · `
        : '';
      return `## ${heading}\n${sub}${new Date(note.created_at).toLocaleDateString()}\n\n${note.content}\n\n---`;
    }),
  ];

  return lines.join('\n');
};

export const updateAccountEmail = async (newEmail: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
  if (error) throw error;
};

export const updateAccountPassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
};

export const deleteOwnAccount = async (): Promise<void> => {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
};