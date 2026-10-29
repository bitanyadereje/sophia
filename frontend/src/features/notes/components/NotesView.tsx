import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, Note } from '../../../types';
import { loadNotes, createNote, updateNote, deleteNote } from '../notes.service';

interface NotesViewProps {
  userId?: string | null;
  books?: Book[];
  onShowToast?: (message: string) => void;
  initialBookId?: string;
  bookFilterId?: string;
  compact?: boolean;
}

export const NotesView: React.FC<NotesViewProps> = ({
  userId,
  books = [],
  onShowToast,
  initialBookId,
  bookFilterId,
  compact = false,
}) => {
  const queryClient = useQueryClient();
  const [bookId, setBookId] = useState(initialBookId ?? books[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!bookId && (initialBookId || books[0]?.id)) setBookId(initialBookId ?? books[0].id);
  }, [bookId, initialBookId, books]);

  const { data: notes = [], isPending } = useQuery({
    queryKey: bookFilterId
      ? ['notes', 'book', userId, bookFilterId]
      : ['notes', 'all', userId],
    queryFn: () => loadNotes(userId!, bookFilterId),
    enabled: Boolean(userId),
  });

  const invalidateNotes = () => queryClient.invalidateQueries({ queryKey: ['notes'] });
  const createMutation = useMutation({
    mutationFn: (values: { bookId: string; title: string; content: string }) =>
      createNote(userId!, values.bookId, values.title, values.content),
    onSuccess: async () => {
      await invalidateNotes();
      setTitle('');
      setContent('');
      onShowToast?.('Note created');
    },
    onError: () => onShowToast?.('Failed to create note'),
  });
  const updateMutation = useMutation({
    mutationFn: (values: { id: string; title: string; content: string }) =>
      updateNote(values.id, userId!, values.title, values.content),
    onSuccess: async () => {
      await invalidateNotes();
      setEditingNote(null);
      setTitle('');
      setContent('');
      onShowToast?.('Note updated');
    },
    onError: () => onShowToast?.('Failed to update note'),
  });
  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId, userId!),
    onSuccess: async () => {
      await invalidateNotes();
      onShowToast?.('Note deleted');
    },
    onError: () => onShowToast?.('Failed to delete note'),
  });

  const visibleNotes = notes.filter((note) => !bookFilterId || note.book_id === bookFilterId);
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !bookId || !content.trim()) return;
    if (editingNote) updateMutation.mutate({ id: editingNote.id, title, content });
    else createMutation.mutate({ bookId, title, content });
  };

  const beginEdit = (note: Note) => {
    setEditingNote(note);
    setBookId(note.book_id);
    setTitle(note.title ?? '');
    setContent(note.content);
  };

  return (
    <section className={`space-y-4 ${compact ? '' : 'mx-auto w-full max-w-4xl px-4 py-8'}`}>
      {!compact && <h1 className="font-serif text-2xl font-semibold text-theme-main">Notes</h1>}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-theme bg-theme-surface p-4">
        <h2 className="font-serif text-lg font-semibold text-theme-main">{editingNote ? 'Edit note' : 'New note'}</h2>
        <label className="block space-y-1 text-sm text-theme-main">
          <span>Book</span>
          <select
            value={bookId}
            onChange={(event) => setBookId(event.target.value)}
            required
            disabled={Boolean(bookFilterId)}
            className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2"
          >
            <option value="" disabled>Select a book</option>
            {books.map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-sm text-theme-main">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm text-theme-main">
          <span>Content</span>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} required rows={4} className="w-full rounded-lg border border-theme bg-theme-surface px-3 py-2" />
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={!userId || !bookId || createMutation.isPending || updateMutation.isPending} className="rounded-lg bg-theme-main px-4 py-2 text-theme-surface disabled:opacity-50">
            {editingNote ? 'Save changes' : 'Add note'}
          </button>
          {editingNote && <button type="button" onClick={() => { setEditingNote(null); setTitle(''); setContent(''); }} className="rounded-lg border border-theme px-4 py-2">Cancel</button>}
        </div>
        {!userId && <p className="text-sm text-theme-muted">Sign in to save notes.</p>}
      </form>

      {isPending ? <p className="text-sm text-theme-muted">Loading notes…</p> : visibleNotes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-theme p-6 text-center text-sm text-theme-muted">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {visibleNotes.map((note) => {
            const book = books.find((item) => item.id === note.book_id);
            return (
              <article key={note.id} className="rounded-xl border border-theme bg-theme-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-serif font-semibold text-theme-main">{note.title || 'Untitled note'}</h3>
                    <p className="mt-1 text-xs text-theme-muted">{book?.title || 'Book'}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => beginEdit(note)} className="text-sm text-theme-accent">Edit</button>
                    <button type="button" onClick={() => deleteMutation.mutate(note.id)} disabled={deleteMutation.isPending} className="text-sm text-red-600 disabled:opacity-50">Delete</button>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-theme-body">{note.content}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
