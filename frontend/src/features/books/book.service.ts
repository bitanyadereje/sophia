import { supabase } from '../../lib/supabase';
import { Book } from '../../types';

export type BookInput = {
  book_id?: string;
  bookTitle?: string;
  bookAuthor?: string;
  title?: string;
  author_name?: string;
  language?: string;
  cover_url?: string | null;
  page_count?: number | null;
};

export const loadBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase.from('books').select('*');
  if (error) throw error;
  return (data ?? []) as Book[];
};

const normalizeBookText = (value: string | null | undefined) =>
  (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

/** Resolves a catalog selection or creates the same unverified record as the prior inline flow. */
export const findOrCreateBook = async (
  input: BookInput,
  userId: string | null,
  knownBooks: Book[],
  onBookResolved?: (book: Book) => void,
): Promise<Book> => {
  if (!userId) throw new Error('You must be signed in to add a new book.');

  if (input.book_id) {
    const existing = knownBooks.find((book) => book.id === input.book_id);
    if (existing) return existing;
    const { data, error } = await supabase.from('books').select('*').eq('id', input.book_id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('That book could not be found. Search the catalog again.');
    const found = data as Book;
    onBookResolved?.(found);
    return found;
  }

  const title = (input.bookTitle ?? input.title ?? '').trim();
  const author = (input.bookAuthor ?? input.author_name ?? '').trim();
  if (!title || !author) throw new Error('A book title and author are required.');

  const { data: existingBooks, error: searchError } = await supabase.from('books').select('*');
  if (searchError) throw searchError;
  const match = (existingBooks ?? []).find((book: Book) =>
    normalizeBookText(book.title) === normalizeBookText(title) &&
    normalizeBookText(book.author_name) === normalizeBookText(author),
  ) as Book | undefined;
  if (match) {
    onBookResolved?.(match);
    return match;
  }

  const { data: created, error: createError } = await supabase
    .from('books')
    .insert({ title, author_name: author, language: input.language ?? 'en', cover_url: input.cover_url ?? null,
      page_count: input.page_count ?? null, verification_status: 'unverified', created_by: userId })
    .select('*').single();
  if (createError) throw createError;
  const createdBook = created as Book;
  onBookResolved?.(createdBook);
  return createdBook;
};
