import { supabase } from '../../lib/supabase';
import { Book, Difficulty, PathStatus, ReadingPath, UserProfile, VerificationStatus } from '../../types';

export type AdminProfile = UserProfile & {
  username: string;
  name?: string | null;
};

export type AdminBookInput = Pick<
  Book,
  'title' | 'author_name' | 'description' | 'cover_url' | 'language' | 'page_count' | 'verification_status'
>;

export type AdminPathInput = Pick<ReadingPath, 'title' | 'description' | 'topic' | 'difficulty'>;

export const loadAdminBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Book[];
};

export const loadAdminPaths = async (): Promise<ReadingPath[]> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReadingPath[];
};

export const saveAdminBook = async (input: Partial<AdminBookInput> & { id?: string }): Promise<Book> => {
  const payload = {
    title: input.title?.trim(),
    author_name: input.author_name?.trim(),
    description: input.description?.trim() || null,
    cover_url: input.cover_url?.trim() || null,
    language: input.language?.trim() || 'en',
    page_count: Number(input.page_count) || 0,
    verification_status: input.verification_status || 'unverified'
  };
  const query = input.id
    ? supabase.from('books').update(payload).eq('id', input.id)
    : supabase.from('books').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as Book;
};

export const deleteAdminBook = async (id: string) => {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
};

export const saveAdminPath = async (
  input: Partial<AdminPathInput> & { id?: string; creator_id?: string }
): Promise<ReadingPath> => {
  const payload = {
    title: input.title?.trim(),
    description: input.description?.trim() || null,
    topic: input.topic?.trim(),
    difficulty: input.difficulty || null
  };
  const query = input.id
    ? supabase.from('reading_paths').update(payload).eq('id', input.id)
    : supabase.from('reading_paths').insert({ ...payload, creator_id: input.creator_id, status: 'pending' });
  const { data, error } = await query.select('*').single();
  if (error) throw error;
  return data as ReadingPath;
};

export const setPathReview = async (
  id: string,
  status: PathStatus,
  adminId: string,
  rejection_note?: string | null
): Promise<ReadingPath> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .update({
      status,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
      rejection_note: status === 'rejected' ? rejection_note?.trim() || null : null
    })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as ReadingPath;
};

export const deleteAdminPath = async (id: string) => {
  const { error } = await supabase.from('reading_paths').delete().eq('id', id);
  if (error) throw error;
};

// --- ADMIN ROLE MANAGEMENT (profiles.role = 'admin' | 'reader') ---

export const loadAdmins = async (): Promise<AdminProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminProfile[];
};

export const grantAdminRoleByUsername = async (usernameInput: string): Promise<AdminProfile> => {
  const cleanUsername = usernameInput.trim().replace(/^@/, '');
  const { data: existing, error: lookupError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', cleanUsername)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!existing) {
    throw new Error(`No Sophia profile found with username “@${cleanUsername}”.`);
  }
  if (existing.role === 'admin') {
    throw new Error(`@${existing.username} already has the administrator role.`);
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', existing.id)
    .select('*')
    .single();

  if (error) throw error;
  return data as AdminProfile;
};

export const revokeAdminRole = async (profileId: string): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'reader' })
    .eq('id', profileId);
  if (error) throw error;
};

export const verificationLabel = (status: VerificationStatus) => status.replace('_', ' ');
export const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];