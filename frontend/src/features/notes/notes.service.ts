import { supabase } from '../../lib/supabase';
import { Note } from '../../types';

export const loadNotes = async (userId: string, bookId?: string): Promise<Note[]> => {
  let query = supabase.from('notes').select('*').eq('user_id', userId);
  if (bookId) query = query.eq('book_id', bookId);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Note[];
};

export const createNote = async (
  userId: string,
  bookId: string,
  title: string,
  content: string,
): Promise<Note> => {
  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: userId, book_id: bookId, title: title.trim() || null, content: content.trim() })
    .select('*')
    .single();
  if (error) throw error;
  return data as Note;
};

export const updateNote = async (
  noteId: string,
  userId: string,
  title: string,
  content: string,
): Promise<Note> => {
  const { data, error } = await supabase
    .from('notes')
    .update({ title: title.trim() || null, content: content.trim(), updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Note;
};

export const deleteNote = async (noteId: string, userId: string): Promise<void> => {
  const { error } = await supabase.from('notes').delete().eq('id', noteId).eq('user_id', userId);
  if (error) throw error;
};
