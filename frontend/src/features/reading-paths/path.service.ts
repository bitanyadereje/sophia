import { supabase } from '../../lib/supabase';
import { Book, Difficulty, ReadingPath, ReadingPathBook, SavedPath } from '../../types';

export type ReadingPathBookWithDetails = ReadingPathBook & {
  book: Pick<Book, 'id' | 'title' | 'cover_url' | 'author_name'>
    | Pick<Book, 'id' | 'title' | 'cover_url' | 'author_name'>[]
    | null;
};

export const loadReadingPaths = async (): Promise<ReadingPath[]> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReadingPath[];
};

export const loadPendingPaths = async (): Promise<ReadingPath[]> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReadingPath[];
};

export const approvePath = async (pathId: string, adminId: string): Promise<void> => {
  const { error } = await supabase
    .from('reading_paths')
    .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', pathId)
    .eq('status', 'pending');
  if (error) throw error;
};

export const loadReadingPathBooks = async (pathId: string): Promise<ReadingPathBookWithDetails[]> => {
  const { data, error } = await supabase
    .from('reading_path_books')
    .select('reading_path_id, book_id, position, note, book:books(id, title, cover_url, author_name)')
    .eq('reading_path_id', pathId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReadingPathBookWithDetails[];
};

export const loadSavedPaths = async (userId: string): Promise<SavedPath[]> => {
  const { data, error } = await supabase
    .from('saved_paths')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as SavedPath[];
};

export const toggleSavePath = async (userId: string, pathId: string, isSaved: boolean): Promise<void> => {
  const result = isSaved
    ? await supabase.from('saved_paths').delete().eq('user_id', userId).eq('path_id', pathId)
    : await supabase.from('saved_paths').insert({ user_id: userId, path_id: pathId });
  if (result.error) throw result.error;
};

export const createReadingPath = async (
  userId: string,
  title: string,
  description: string,
  topic: string,
  difficulty: Difficulty,
): Promise<ReadingPath> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .insert({ creator_id: userId, title, description, topic, difficulty, status: 'pending' })
    .select('*')
    .single();
  if (error) throw error;
  return data as ReadingPath;
};

export const addBooksToPath = async (pathId: string, bookIds: string[]): Promise<void> => {
  if (bookIds.length === 0) return;

  const { error } = await supabase.from('reading_path_books').insert(
    bookIds.map((bookId, index) => ({
      reading_path_id: pathId,
      book_id: bookId,
      position: index + 1,
      note: null,
    })),
  );
  if (error) throw error;
};
