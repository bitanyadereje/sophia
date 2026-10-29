import { supabase } from '../../lib/supabase';
import { Book, ReadingPath, ReadingPathBook } from '../../types';

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

export const loadReadingPathBooks = async (pathId: string): Promise<ReadingPathBookWithDetails[]> => {
  const { data, error } = await supabase
    .from('reading_path_books')
    .select('reading_path_id, book_id, position, note, book:books(id, title, cover_url, author_name)')
    .eq('reading_path_id', pathId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReadingPathBookWithDetails[];
};
