import { supabase } from '../../lib/supabase';
import { Book } from '../../types';

export type BookInput = {
  book_id?: string;
  title?: string;
  author?: string;
  language?: string;
  page_count?: number;
  coverFile?: File | null;
};

const COVER_BUCKET = 'book-covers';

export const loadBooks = async (): Promise<Book[]> => {
  const { data, error } = await supabase.from('books').select('*');
  if (error) throw error;
  return (data ?? []) as Book[];
};

const normalizeBookText = (value: string | null | undefined) =>
  (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const escapeIlike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const uploadCoverPhoto = async (file: File, userId: string): Promise<{ publicUrl: string; path: string }> => {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  console.debug('[book-debug] uploadCoverPhoto', { fileName: file.name, size: file.size, bucket: COVER_BUCKET });
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, { upsert: false });
  if (error) {
    console.error('[book-debug] uploadCoverPhoto error', { fileName: file.name, size: file.size, bucket: COVER_BUCKET, error });
    throw error;
  }
  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
};

export const createBook = async (input: Required<Pick<BookInput, 'title' | 'author' | 'language' | 'page_count'>> & Pick<BookInput, 'coverFile'>, userId: string): Promise<Book> => {
  let uploadedPath: string | null = null;
  let coverUrl: string | null = null;
  if (input.coverFile) {
    const uploaded = await uploadCoverPhoto(input.coverFile, userId);
    uploadedPath = uploaded.path;
    coverUrl = uploaded.publicUrl;
  }
  const payload = { title: input.title.trim(), author_name: input.author.trim(), language: input.language || 'en', page_count: input.page_count, cover_url: coverUrl, verification_status: 'unverified' as const, created_by: userId };
  console.debug('[book-debug] createBook insert payload', payload);
  const { data: authData, error: authError } = await supabase.auth.getUser();
  console.debug('[book-debug] createBook auth user compared with created_by', { authUserId: authData.user?.id ?? null, userId, matches: authData.user?.id === userId, authError: authError ? { code: authError.code, message: authError.message } : null });
  const { data, error } = await supabase.from('books').insert(payload).select('*').single();
  if (error) {
    console.error('[book-debug] createBook insert error', { code: error.code, message: error.message, details: error.details, hint: error.hint });
    if (uploadedPath) {
      const { error: deleteError } = await supabase.storage.from(COVER_BUCKET).remove([uploadedPath]);
      if (deleteError) console.error('[book-debug] upload cleanup error', { bucket: COVER_BUCKET, path: uploadedPath, error: deleteError });
    }
    throw error;
  }
  return data as Book;
};

/** Resolves a catalog selection or creates a single unverified record. */
export const findOrCreateBook = async (input: BookInput, userId: string): Promise<Book> => {
  if (!userId) throw new Error('You must be signed in to add a new book.');

  if (input.book_id) {
    const { data, error } = await supabase.from('books').select('*').eq('id', input.book_id).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('That book could not be found. Search the catalog again.');
    return data as Book;
  }

  const title = input.title?.trim() ?? '';
  const author = input.author?.trim() ?? '';
  const normalizedTitle = normalizeBookText(title);
  const normalizedAuthor = normalizeBookText(author);
  if (!normalizedTitle || !normalizedAuthor) throw new Error('A book title and author are required.');

  const { data: candidates, error: searchError } = await supabase
    .from('books').select('*')
    .ilike('title', `%${escapeIlike(normalizedTitle).replace(/ /g, '%')}%`)
    .ilike('author_name', `%${escapeIlike(normalizedAuthor).replace(/ /g, '%')}%`);
  if (searchError) throw searchError;
  const match = (candidates ?? []).find((book: Book) =>
    normalizeBookText(book.title) === normalizedTitle && normalizeBookText(book.author_name) === normalizedAuthor,
  ) as Book | undefined;
  if (match) return match;
  if (!Number.isInteger(input.page_count) || (input.page_count ?? 0) < 1) throw new Error('Please enter the number of pages.');
  return createBook({ title, author, language: input.language || 'en', page_count: input.page_count, coverFile: input.coverFile }, userId);
};
