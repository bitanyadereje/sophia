import { supabase } from '../../lib/supabase';
import { LibraryBook, ReadingStatus } from '../../types';

export const loadUserLibrary = async (userId: string): Promise<LibraryBook[]> => {
  const { data, error } = await supabase
    .from('library_books')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as LibraryBook[];
};

export const loadUserLibraryBook = async (
  userId: string,
  bookId: string,
): Promise<LibraryBook | null> => {
  const { data, error } = await supabase
    .from('library_books')
    .select('*')
    .eq('user_id', userId)
    .eq('book_id', bookId)
    .maybeSingle();
  if (error) throw error;
  return data as LibraryBook | null;
};

export const updateBookStatus = async (
  userId: string,
  bookId: string,
  status: ReadingStatus,
  pagesRead?: number,
): Promise<LibraryBook> => {
  const values = {
    user_id: userId,
    book_id: bookId,
    status,
    ...(pagesRead === undefined ? {} : { pages_read: Math.max(0, pagesRead) }),
  };
  const { data, error } = await supabase
    .from('library_books')
    .upsert(values, { onConflict: 'user_id,book_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data as LibraryBook;
};

export const removeBookFromLibrary = async (userId: string, bookId: string): Promise<void> => {
  const { error } = await supabase
    .from('library_books')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (error) throw error;
};
