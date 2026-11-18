import { supabase } from '../../lib/supabase';
import { Book, Difficulty, ReadingPath, ReadingPathBook } from '../../types';

export type ReadingPathBookWithDetails = ReadingPathBook & {
  book: Pick<Book, 'id' | 'title' | 'cover_url' | 'author_name' | 'page_count'>
    | Pick<Book, 'id' | 'title' | 'cover_url' | 'author_name' | 'page_count'>[]
    | null;
};

export interface NewPathStopInput {
  bookId: string;
  note?: string | null;
}

export const loadReadingPaths = async (): Promise<ReadingPath[]> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReadingPath[];
};

export const loadMyReadingPaths = async (userId: string): Promise<ReadingPath[]> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .select('*')
    .eq('creator_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReadingPath[];
};

export const loadReadingPathBooks = async (pathId: string): Promise<ReadingPathBookWithDetails[]> => {
  const { data, error } = await supabase
    .from('reading_path_books')
    .select('reading_path_id, book_id, position, note, book:books(id, title, cover_url, author_name, page_count)')
    .eq('reading_path_id', pathId)
    .order('position', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReadingPathBookWithDetails[];
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

export const addBooksToPath = async (pathId: string, stops: NewPathStopInput[]): Promise<void> => {
  if (stops.length === 0) return;

  const { error } = await supabase.from('reading_path_books').insert(
    stops.map((stop, index) => ({
      reading_path_id: pathId,
      book_id: stop.bookId,
      position: index + 1,
      note: stop.note?.trim() || null,
    })),
  );
  if (error) throw error;
};

export const updateReadingPath = async (
  pathId: string,
  input: Pick<ReadingPath, 'title' | 'description' | 'topic' | 'difficulty'>,
  stops: NewPathStopInput[],
): Promise<ReadingPath> => {
  const { data, error } = await supabase
    .from('reading_paths')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      topic: input.topic.trim(),
      difficulty: input.difficulty,
      // A corrected rejected submission returns to the moderation queue.
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      rejection_note: null,
    })
    .eq('id', pathId)
    .select('*')
    .single();
  if (error) throw error;

  const { error: removeError } = await supabase
    .from('reading_path_books')
    .delete()
    .eq('reading_path_id', pathId);
  if (removeError) throw removeError;

  await addBooksToPath(pathId, stops);
  return data as ReadingPath;
};

export const deleteReadingPath = async (pathId: string): Promise<void> => {
  const { error } = await supabase.from('reading_paths').delete().eq('id', pathId);
  if (error) throw error;
};
