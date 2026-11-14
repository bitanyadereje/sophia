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

const LONG_NOTE_CHAR_THRESHOLD = 240;

// Card depth: resting = raised a little, hover = lifted higher with a deeper shadow
const CARD_SHADOW_REST =
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.2),0_6px_14px_-6px_rgba(0,0,0,0.4)]';
const CARD_SHADOW_HOVER =
  'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.25),0_18px_32px_-10px_rgba(0,0,0,0.55)]';

// Filled icon so the book mark reads bolder
const FILLED_ICON = { fontVariationSettings: "'FILL' 1, 'wght' 500" } as React.CSSProperties;

export const NotesView: React.FC<NotesViewProps> = ({
  userId,
  books = [],
  onShowToast,
  initialBookId,
  bookFilterId,
  compact = false,
}) => {
  const queryClient = useQueryClient();

  // Create composer state
  const [composerOpen, setComposerOpen] = useState(false);
  const [bookId, setBookId] = useState(initialBookId ?? books[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [createErrors, setCreateErrors] = useState<{ bookId?: string; content?: string }>({});

  // Inline card edit, expand & delete state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});

  const [noteSearch, setNoteSearch] = useState('');

  useEffect(() => {
    if (!bookId && (initialBookId || books[0]?.id)) {
      setBookId(initialBookId ?? books[0].id);
    }
  }, [bookId, initialBookId, books]);

  const { data: notes = [], isPending } = useQuery({
    queryKey: bookFilterId ? ['notes', 'book', userId, bookFilterId] : ['notes', 'all', userId],
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
      setComposerOpen(false);
      setCreateErrors({});
      onShowToast?.('Note saved');
    },
    onError: () => onShowToast?.('Failed to create note'),
  });

  const updateMutation = useMutation({
    mutationFn: (values: { id: string; title: string; content: string }) =>
      updateNote(values.id, userId!, values.title, values.content),
    onSuccess: async () => {
      await invalidateNotes();
      setEditingNoteId(null);
      setEditError(null);
      onShowToast?.('Note updated');
    },
    onError: () => onShowToast?.('Failed to update note'),
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => deleteNote(noteId, userId!),
    onSuccess: async () => {
      await invalidateNotes();
      setDeleteConfirmId(null);
      onShowToast?.('Note deleted');
    },
    onError: () => onShowToast?.('Failed to delete note'),
  });

  const toggleExpandNote = (noteId: string) => {
    setExpandedNoteIds((prev) => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const openCreateComposer = () => {
    setEditingNoteId(null);
    setDeleteConfirmId(null);
    setCreateErrors({});
    setTitle('');
    setContent('');
    setBookId(bookFilterId ?? initialBookId ?? books[0]?.id ?? '');
    setComposerOpen(true);
  };

  const closeCreateComposer = () => {
    setComposerOpen(false);
    setTitle('');
    setContent('');
    setCreateErrors({});
  };

  const startInlineEdit = (note: Note) => {
    setComposerOpen(false);
    setDeleteConfirmId(null);
    setEditError(null);
    setEditingNoteId(note.id);
    setEditTitle(note.title ?? '');
    setEditContent(note.content);
  };

  const cancelInlineEdit = () => {
    setEditingNoteId(null);
    setEditError(null);
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const targetBookId = bookFilterId ?? bookId;
    const nextErrors: { bookId?: string; content?: string } = {};

    if (!userId) {
      setCreateErrors({ content: 'Sign in to save notes.' });
      return;
    }
    if (!targetBookId) nextErrors.bookId = 'Select a book.';
    if (!content.trim()) nextErrors.content = 'Add a reflection or quotation before saving.';

    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors);
      return;
    }

    createMutation.mutate({ bookId: targetBookId, title: title.trim(), content: content.trim() });
  };

  const handleInlineSave = (noteId: string) => {
    if (!userId) return;
    if (!editContent.trim()) {
      setEditError('Note content cannot be empty.');
      return;
    }
    updateMutation.mutate({
      id: noteId,
      title: editTitle.trim(),
      content: editContent.trim(),
    });
  };

  const visibleNotes = (notes || [])
    .filter((note) => !bookFilterId || note.book_id === bookFilterId)
    .filter((note) => {
      const query = noteSearch.trim().toLowerCase();
      if (!query) return true;
      const book = books.find((item) => item.id === note.book_id);
      const haystack = `${note.title ?? ''} ${note.content} ${book?.title ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });

  return (
    <section className={`space-y-6 ${compact ? '' : 'mx-auto w-full max-w-4xl px-4 py-8'}`}>
      {!compact && <h1 className="font-serif text-2xl font-semibold text-theme-main">Notes</h1>}

      {/* Top Toolbar: Pill Search + Primary Gold CTA */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-theme-muted">
              search
            </span>
            <input
              type="text"
              value={noteSearch}
              onChange={(event) => setNoteSearch(event.target.value)}
              placeholder="Search notes, titles, or books..."
              className="w-full rounded-full border border-theme bg-theme-surface py-2.5 pl-11 pr-4 text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent/60 focus:outline-none focus:ring-2 focus:ring-theme-accent/15"
            />
          </div>

          <button
            type="button"
            onClick={() => (composerOpen ? closeCreateComposer() : openCreateComposer())}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-theme-accent px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-theme-accent/90 focus:outline-none focus:ring-2 focus:ring-theme-accent/40"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">
              {composerOpen ? 'close' : 'add'}
            </span>
            <span>{composerOpen ? 'Close' : 'New Note'}</span>
          </button>
        </div>

        {/* Collapsible Create Composer */}
        {composerOpen && (
          <form
            onSubmit={handleCreateSubmit}
            noValidate
            className={`rounded-2xl border border-theme-accent/30 bg-theme-surface p-5 shadow-md sm:p-6`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-theme-accent" />
                <h2 className="font-serif text-lg font-semibold text-theme-main">New Marginalia</h2>
              </div>
              <button
                type="button"
                onClick={closeCreateComposer}
                aria-label="Close composer"
                className="cursor-pointer rounded-full p-1 text-theme-muted transition-colors hover:text-theme-main"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-theme-muted">
                  Volume
                </span>
                <select
                  value={bookFilterId ?? bookId}
                  onChange={(event) => {
                    setBookId(event.target.value);
                    if (createErrors.bookId) setCreateErrors((prev) => ({ ...prev, bookId: undefined }));
                  }}
                  disabled={Boolean(bookFilterId)}
                  className={`w-full rounded-xl border bg-theme-subtle px-3.5 py-2.5 text-sm text-theme-main focus:border-theme-accent focus:outline-none ${
                    createErrors.bookId ? 'border-rose-500/60' : 'border-theme'
                  }`}
                >
                  <option value="" disabled>
                    Select a book
                  </option>
                  {books.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title}
                    </option>
                  ))}
                </select>
                {createErrors.bookId && <span className="text-xs text-rose-400">{createErrors.bookId}</span>}
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-theme-muted">
                  Heading
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g., On surrendering ourselves..."
                  className="w-full rounded-xl border border-theme bg-theme-subtle px-3.5 py-2.5 font-serif text-sm text-theme-main placeholder:font-sans placeholder:text-theme-muted/70 focus:border-theme-accent focus:outline-none"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-1.5 text-sm">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-theme-muted">
                Passage or Reflection
              </span>
              <textarea
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  if (createErrors.content) setCreateErrors((prev) => ({ ...prev, content: undefined }));
                }}
                rows={4}
                placeholder="Transcribe a passage or record your reflection..."
                className={`w-full resize-y rounded-xl border bg-theme-subtle px-3.5 py-3 text-[15px] leading-relaxed text-theme-main placeholder:text-theme-muted/70 focus:border-theme-accent focus:outline-none ${
                  createErrors.content ? 'border-rose-500/60' : 'border-theme'
                }`}
              />
              {createErrors.content && <span className="text-xs text-rose-400">{createErrors.content}</span>}
            </label>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={closeCreateComposer}
                className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium text-theme-muted transition-colors hover:text-theme-main"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!userId || (!bookFilterId && !bookId) || createMutation.isPending}
                className="cursor-pointer rounded-full bg-theme-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-theme-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving…' : 'Save Note'}
              </button>
            </div>

            {!userId && <p className="mt-2 text-xs text-theme-muted">Sign in to save notes.</p>}
          </form>
        )}
      </div>

      {/* Editorial Notes Feed */}
      {isPending ? (
        <p className="text-sm text-theme-muted">Loading notes…</p>
      ) : visibleNotes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-theme bg-theme-subtle/20 py-12 text-center">
          <span className="material-symbols-outlined mx-auto mb-2 block text-3xl text-theme-muted">
            edit_note
          </span>
          <h3 className="font-serif text-lg font-semibold text-theme-main">
            {noteSearch ? 'No matching notes' : 'Your commonplace book is empty'}
          </h3>
          <p className="mt-1 text-sm text-theme-muted">
            {noteSearch
              ? 'Try searching for another keyword or book title.'
              : 'Click "New Note" above to record your first passage or reflection.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleNotes.map((note) => {
            const book = books.find((item) => item.id === note.book_id);
            const isEditing = editingNoteId === note.id;
            const isDeleteConfirming = deleteConfirmId === note.id;
            const isDeletePending = deleteMutation.isPending && isDeleteConfirming;
            const isLongNote =
              note.content.length > LONG_NOTE_CHAR_THRESHOLD || note.content.split('\n').length > 3;
            const isExpanded = Boolean(expandedNoteIds[note.id]);

            return (
              <article
                key={note.id}
                onClick={() => {
                  if (!isEditing && isLongNote) toggleExpandNote(note.id);
                }}
                className={`group relative w-full rounded-2xl border border-theme-accent/30 bg-theme-surface px-5 py-5 transition-all duration-200 sm:px-7 sm:py-6 ${CARD_SHADOW_REST} ${
                  isEditing
                    ? 'border-theme-accent/50'
                    : `hover:-translate-y-1 hover:border-theme-accent/50 ${CARD_SHADOW_HOVER}`
                } ${!isEditing && isLongNote ? 'cursor-pointer' : ''}`}
              >
                {isEditing ? (
                  /* In-place Inline Card Editor */
                  <div className="w-full space-y-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-theme-accent">
                      <span className="material-symbols-outlined text-[17px] text-[#996515]" style={FILLED_ICON}>
                        menu_book
                      </span>
                      <span>{book?.title || 'Unknown volume'}</span>
                    </div>

                    <input
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      placeholder="Note heading"
                      className="w-full rounded-xl border border-theme bg-theme-subtle px-3.5 py-2 font-serif text-lg font-semibold text-theme-main focus:border-theme-accent focus:outline-none"
                    />

                    <div>
                      <textarea
                        value={editContent}
                        onChange={(event) => {
                          setEditContent(event.target.value);
                          if (editError) setEditError(null);
                        }}
                        rows={5}
                        className="w-full resize-y rounded-xl border border-theme bg-theme-subtle px-3.5 py-3 text-[15px] leading-[1.75] text-theme-main focus:border-theme-accent focus:outline-none"
                      />
                      {editError && <span className="mt-1 block text-xs text-rose-400">{editError}</span>}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelInlineEdit}
                        className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium text-theme-muted transition-colors hover:text-theme-main"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInlineSave(note.id)}
                        disabled={updateMutation.isPending}
                        className="cursor-pointer rounded-full bg-theme-accent px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-theme-accent/90 disabled:opacity-50"
                      >
                        {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Editorial Read Mode */
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-xl font-semibold leading-snug text-theme-main">
                          {note.title || 'Untitled reflection'}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-theme-muted">
                          <span
                            className="material-symbols-outlined text-[17px] text-[#d4af37]"
                            style={FILLED_ICON}
                          >
                            menu_book
                          </span>
                          <span className="truncate">{book?.title || 'Unknown volume'}</span>
                        </div>
                      </div>

                      {/* Subtle Hover-Reveal Icon Actions */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                      >
                        <button
                          type="button"
                          onClick={() => startInlineEdit(note)}
                          aria-label="Edit note"
                          title="Edit note"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-theme-muted transition-colors hover:bg-theme-accent/15 hover:text-theme-accent focus:outline-none focus:ring-2 focus:ring-theme-accent/30"
                        >
                          <span className="material-symbols-outlined text-[17px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(isDeleteConfirming ? null : note.id)}
                          aria-label="Delete note"
                          title="Delete note"
                          disabled={isDeletePending}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-theme-muted transition-colors hover:bg-rose-500/15 hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        >
                          <span className="material-symbols-outlined text-[17px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {isDeleteConfirming && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300"
                      >
                        <span>Permanently delete this note?</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="cursor-pointer font-medium text-rose-300/80 hover:text-rose-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(note.id)}
                            disabled={isDeletePending}
                            className="cursor-pointer rounded-full bg-rose-500/20 px-3 py-1 font-semibold text-rose-200 transition-colors hover:bg-rose-500/30"
                          >
                            {isDeletePending ? 'Deleting…' : 'Confirm'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Full-Width Clamped Note Body */}
                    <div className="mt-4 w-full border-l-2 border-theme-accent/35 pl-4">
                      <p
                        className={`w-full whitespace-pre-wrap text-[15px] leading-[1.78] text-theme-body ${
                          !isExpanded ? 'line-clamp-3' : ''
                        }`}
                      >
                        {note.content}
                      </p>

                      {isLongNote && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpandNote(note.id);
                          }}
                          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs font-medium tracking-wide text-theme-accent transition-colors hover:text-theme-accent/80"
                        >
                          <span>{isExpanded ? 'Show less' : 'Read full note'}</span>
                          <span className="material-symbols-outlined text-[15px]">
                            {isExpanded ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};