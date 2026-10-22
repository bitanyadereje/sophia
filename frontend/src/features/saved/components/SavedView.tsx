import React, { useState } from 'react';
import { Book, Bookmark, Note, ReadingStatus, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';

interface SavedViewProps {
  bookmarks: Bookmark[];
  notes: Note[];
  books?: Book[];
  initialTab?: 'bookmarks' | 'notes' | 'library';
  onAddBookmark?: (bm: Bookmark) => void;
  onUpdateBookmark?: (id: string, updated: Partial<Bookmark>) => void;
  onDeleteBookmark?: (id: string) => void;
  onAddNote?: (note: Note) => void;
  onUpdateNote?: (id: string, updated: Partial<Note>) => void;
  onDeleteNote?: (id: string) => void;
  onUpdateBookStatus?: (bookId: string, status: ReadingStatus) => void;
  onSelectBook?: (bookId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  bookmarks: initialBookmarks,
  notes: initialNotes,
  books = [],
  initialTab = 'bookmarks',
  onAddBookmark,
  onUpdateBookmark,
  onDeleteBookmark,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onUpdateBookStatus,
  onSelectBook,
  onNavigate,
  onShowToast
}) => {
  const { t, isAmharic } = useLanguage();

  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes' | 'library'>(initialTab);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'reading' | 'want' | 'read'>('all');

  const [localBookmarks, setLocalBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [localNotes, setLocalNotes] = useState<Note[]>(initialNotes);

  const bookmarks = initialBookmarks.length > 0 ? initialBookmarks : localBookmarks;
  const notes = initialNotes.length > 0 ? initialNotes : localNotes;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // Bookmark Modal State
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [bmAuthor, setBmAuthor] = useState('St. Augustine of Hippo');
  const [bmSource, setBmSource] = useState('Confessions · Book X.27');
  const [bmQuote, setBmQuote] = useState('');
  const [bmCategory, setBmCategory] = useState('Patristics');

  // Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  // Library Management Block Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [selectedBookForLibrary, setSelectedBookForLibrary] = useState<string>(books[0]?.id || '');
  const [targetStatusForLibrary, setTargetStatusForLibrary] = useState<ReadingStatus>('to_be_read');

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    onShowToast('Passage copied to clipboard');
  };

  // Bookmark Actions
  const handleSaveBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bmQuote.trim()) {
      onShowToast('Please enter a quotation');
      return;
    }

    if (editingBookmark) {
      const updated = {
        author: bmAuthor,
        source: bmSource,
        quote: bmQuote.trim(),
        category: bmCategory
      };
      if (onUpdateBookmark) {
        onUpdateBookmark(editingBookmark.id, updated);
      } else {
        setLocalBookmarks((prev) =>
          prev.map((b) => (b.id === editingBookmark.id ? { ...b, ...updated } : b))
        );
      }
      onShowToast('Bookmark updated');
    } else {
      const newBm: Bookmark = {
        id: `bm-${Date.now()}`,
        author: bmAuthor,
        source: bmSource,
        quote: bmQuote.trim(),
        category: bmCategory,
        initials: bmAuthor.split(' ').map((n) => n[0]).slice(0, 2).join(''),
        isFavorite: true
      };
      if (onAddBookmark) {
        onAddBookmark(newBm);
      } else {
        setLocalBookmarks((prev) => [newBm, ...prev]);
      }
      onShowToast('Passage saved to bookmarks');
    }

    setIsBookmarkModalOpen(false);
    setEditingBookmark(null);
  };

  const handleDeleteBm = (id: string) => {
    if (onDeleteBookmark) {
      onDeleteBookmark(id);
    } else {
      setLocalBookmarks((prev) => prev.filter((b) => b.id !== id));
    }
    onShowToast('Bookmark removed');
  };

  // Note Actions
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) {
      onShowToast('Please enter your reflection');
      return;
    }

    if (editingNote) {
      const updated = {
        title: noteTitle || null,
        content: noteText.trim(),
        updated_at: new Date().toISOString(),
      };
      if (onUpdateNote) {
        onUpdateNote(editingNote.id, updated);
      } else {
        setLocalNotes((prev) =>
          prev.map((n) => (n.id === editingNote.id ? { ...n, ...updated } : n))
        );
      }
      onShowToast('Note updated');
    } else {
      const newN: Note = {
        id: `note-${Date.now()}`,
        user_id: '',
        book_id: '',
        title: noteTitle || null,
        content: noteText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (onAddNote) {
        onAddNote(newN);
      } else {
        setLocalNotes((prev) => [newN, ...prev]);
      }
      onShowToast('Reflection saved');
    }

    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteN = (id: string) => {
    if (onDeleteNote) {
      onDeleteNote(id);
    } else {
      setLocalNotes((prev) => prev.filter((n) => n.id !== id));
    }
    onShowToast('Note deleted');
  };

  // Filtered lists
  const filteredBookmarks = bookmarks.filter((bm) => {
    const matchesTag = selectedTag === 'All' || bm.category === selectedTag;
    const matchesSearch =
      bm.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bm.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.title ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div
      id="saved-pages-screen"
      className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200 selection:bg-theme-accent-light selection:text-theme-accent font-serif antialiased"
    >
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col justify-start gap-5">
        <header id="saved-header" className="select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
            <div>
              <span className="text-[10px] lg:text-xs font-serif font-medium uppercase tracking-[0.25em] text-theme-muted block mb-0.5">
                {isAmharic ? 'የግል መዝገብ' : 'PERSONAL REPOSITORY'}
              </span>
              <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main">
                {t('saved.title', 'Saved Archive')}
              </h1>
              <p className="text-xs sm:text-sm text-theme-muted font-serif italic mt-0.5">
                {t('saved.subtitle', 'Your private bookmarks, book citations, and reading notes')}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto pt-1 sm:pt-0">
              {activeTab === 'bookmarks' ? (
                <button
                  type="button"
                  id="header-new-bookmark-btn"
                  onClick={() => {
                    setEditingBookmark(null);
                    setBmAuthor('St. Augustine of Hippo');
                    setBmSource('Confessions · Book X.27');
                    setBmQuote('');
                    setBmCategory('Patristics');
                    setIsBookmarkModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl bg-theme-main text-theme-surface font-serif text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm border border-theme"
                >
                  <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
                  <span>{isAmharic ? '+ አዲስ ምልክት' : '+ New Bookmark'}</span>
                </button>
              ) : activeTab === 'notes' ? (
                <button
                  type="button"
                  id="header-new-note-btn"
                  onClick={() => {
                    setEditingNote(null);
                    setNoteTitle('');
                    setNoteText('');
                    setIsNoteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 lg:px-5 py-2.5 rounded-xl bg-theme-main text-theme-surface font-serif text-xs sm:text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm border border-theme"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  <span>{isAmharic ? '+ አዲስ ማስታወሻ' : '+ New Note'}</span>
                </button>
              ) : null}
            </div>
          </div>
        </header>

        {/* TABS & SEARCH */}
        <div className="space-y-3 mb-2">
          <div className="flex items-center justify-between border-b border-theme">
            <nav role="tablist" aria-label="Saved Collections" className="flex items-center gap-6 sm:gap-8 lg:gap-10">
              <button
                id="toggle-bookmarks-tab"
                role="tab"
                aria-selected={activeTab === 'bookmarks'}
                onClick={() => {
                  setActiveTab('bookmarks');
                  setSelectedTag('All');
                }}
                className={`pb-3 pt-1 font-serif text-sm sm:text-base lg:text-lg cursor-pointer transition-colors relative flex items-center gap-2 ${
                  activeTab === 'bookmarks'
                    ? 'text-theme-main font-semibold'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{t('saved.tabBookmarks', 'Bookmarks')}</span>
                <span
                  className={`text-[11px] lg:text-xs font-serif px-2 lg:px-2.5 py-0.5 rounded-full ${
                    activeTab === 'bookmarks'
                      ? 'bg-theme-main text-theme-surface font-medium'
                      : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  {bookmarks.length}
                </span>
                {activeTab === 'bookmarks' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>

              <button
                id="toggle-notes-tab"
                role="tab"
                aria-selected={activeTab === 'notes'}
                onClick={() => {
                  setActiveTab('notes');
                  setSelectedTag('All');
                }}
                className={`pb-3 pt-1 font-serif text-sm sm:text-base lg:text-lg cursor-pointer transition-colors relative flex items-center gap-2 ${
                  activeTab === 'notes'
                    ? 'text-theme-main font-semibold'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{t('saved.tabNotes', 'Notes')}</span>
                <span
                  className={`text-[11px] lg:text-xs font-serif px-2 lg:px-2.5 py-0.5 rounded-full ${
                    activeTab === 'notes'
                      ? 'bg-theme-main text-theme-surface font-medium'
                      : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  {notes.length}
                </span>
                {activeTab === 'notes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>

              <button
                id="toggle-library-tab"
                role="tab"
                aria-selected={activeTab === 'library'}
                onClick={() => {
                  setActiveTab('library');
                  setSelectedTag('All');
                }}
                className={`pb-3 pt-1 font-serif text-sm sm:text-base lg:text-lg cursor-pointer transition-colors relative flex items-center gap-2 ${
                  activeTab === 'library'
                    ? 'text-theme-main font-semibold'
                    : 'text-theme-muted hover:text-theme-main'
                }`}
              >
                <span>{t('saved.tabLibrary', 'Library')}</span>
                <span
                  className={`text-[11px] lg:text-xs font-serif px-2 lg:px-2.5 py-0.5 rounded-full ${
                    activeTab === 'library'
                      ? 'bg-theme-main text-theme-surface font-medium'
                      : 'bg-theme-subtle text-theme-muted'
                  }`}
                >
                  {books.length}
                </span>
                {activeTab === 'library' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-accent" />
                )}
              </button>
            </nav>
          </div>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] lg:text-[20px] text-theme-muted pointer-events-none">
              search
            </span>
            <input
              type="text"
              id="saved-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'bookmarks'
                  ? (isAmharic ? 'ጥቅሶችን፣ ደራሲያንን ወይም ማጣቀሻዎችን ፈልግ...' : 'Search bookmarks by quote text, author, or citation...')
                  : activeTab === 'notes'
                  ? (isAmharic ? 'ማስታወሻዎችን ፈልግ...' : 'Search notes...')
                  : (isAmharic ? 'መጻሕፍትን ወይም ደራሲያንን ፈልግ...' : 'Search library by book title or author...')
              }
              className="w-full bg-theme-surface border border-theme rounded-xl py-2.5 lg:py-3 pl-10 lg:pl-11 pr-9 text-xs sm:text-sm lg:text-base font-serif text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-main text-xs cursor-pointer p-1 font-serif"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* VIEW A: BOOKMARKS */}
        {activeTab === 'bookmarks' && (
          <section id="bookmarks-view-content" aria-label="Saved Bookmarks" className="space-y-6">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {['All', 'Patristics', 'Theology', 'Christology', 'Philosophy', 'Ethics'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-serif transition-colors cursor-pointer border ${
                    selectedTag === tag
                      ? 'bg-theme-main text-theme-surface border-theme-main font-medium shadow-xs'
                      : 'bg-theme-surface text-theme-muted border-theme hover:text-theme-main hover:bg-theme-subtle'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-theme rounded-2xl p-8 bg-theme-subtle/30">
                <span className="material-symbols-outlined text-4xl text-[#b89e6c] dark:text-[#dfba4f] block mb-2 mx-auto">
                  bookmark
                </span>
                <h3 className="font-serif text-base font-medium text-theme-main">{t('saved.noBookmarksFound', 'No bookmarks found')}</h3>
                <p className="text-xs text-theme-muted font-serif mt-1">
                  {t('saved.noBookmarksDesc', 'Save meaningful sentences and folios while studying manuscripts.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBookmark(null);
                    setBmQuote('');
                    setIsBookmarkModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-theme-main text-theme-surface text-xs font-serif hover:opacity-90 transition-opacity cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>{isAmharic ? '+ የመጀመሪያውን ምልክት ጨምር' : '+ Add First Bookmark'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map((bm) => (
                  <article
                    key={bm.id}
                    id={`bookmark-${bm.id}`}
                    className="bg-theme-surface rounded-xl border border-theme-subtle p-3.5 sm:p-4 lg:p-6 shadow-2xs hover:border-theme/70 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[18px] lg:text-[22px] text-[#b89e6c] dark:text-[#dfba4f] shrink-0">
                          bookmark
                        </span>
                        <h3 className="font-serif font-bold text-sm sm:text-base lg:text-lg xl:text-xl text-theme-main leading-snug truncate">
                          {bm.source}
                        </h3>
                        <span className="text-xs text-theme-muted/50 shrink-0">•</span>
                        <span className="text-xs sm:text-[13px] lg:text-sm xl:text-[15px] text-theme-body font-serif font-medium truncate">
                          {bm.author}
                        </span>
                      </div>

                      <span className="text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider px-2 lg:px-2.5 py-0.5 rounded bg-theme-subtle border border-theme-subtle text-theme-muted shrink-0">
                        {bm.category}
                      </span>
                    </div>

                    <blockquote className="mt-2.5 lg:mt-3.5 pl-[26px] lg:pl-[30px] font-serif text-sm sm:text-[15px] lg:text-lg xl:text-xl text-theme-body italic leading-relaxed lg:leading-8">
                      &ldquo;{bm.quote.replace(/^[“"]|[”"]$/g, '')}&rdquo;
                    </blockquote>

                    <div className="flex items-center justify-end gap-1 mt-1.5 lg:mt-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(`${bm.quote}\n— ${bm.author}, ${bm.source}`)}
                        className="p-1 lg:p-1.5 rounded text-theme-muted/40 hover:text-theme-main transition-colors cursor-pointer"
                        title="Copy Citation"
                        aria-label="Copy Citation"
                      >
                        <span className="material-symbols-outlined text-[13px] lg:text-[15px] leading-none">content_copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBookmark(bm);
                          setBmAuthor(bm.author);
                          setBmSource(bm.source);
                          setBmQuote(bm.quote.replace(/^[“"]|[”"]$/g, ''));
                          setBmCategory(bm.category);
                          setIsBookmarkModalOpen(true);
                        }}
                        className="p-1 lg:p-1.5 rounded text-theme-muted/40 hover:text-theme-main transition-colors cursor-pointer"
                        title="Edit Bookmark"
                        aria-label="Edit Bookmark"
                      >
                        <span className="material-symbols-outlined text-[13px] lg:text-[15px] leading-none">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBm(bm.id)}
                        className="p-1 lg:p-1.5 rounded text-theme-muted/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title="Remove Bookmark"
                        aria-label="Remove Bookmark"
                      >
                        <span className="material-symbols-outlined text-[13px] lg:text-[15px] leading-none">delete</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* VIEW B: NOTES */}
        {activeTab === 'notes' && (
          <section id="notes-view-content" aria-label="Saved Notes" className="space-y-6">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-theme rounded-2xl p-8 bg-theme-subtle/30">
                <span className="material-symbols-outlined text-4xl text-[#b89e6c] dark:text-[#dfba4f] block mb-2 mx-auto">
                  edit_note
                </span>
                <h3 className="font-serif text-base font-medium text-theme-main">{t('saved.noNotesFound', 'No reflections found')}</h3>
                <p className="text-xs text-theme-muted font-serif mt-1">
                  {t('saved.noNotesDesc', 'Keep personal annotations and reading notes as you read.')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
                    setNoteTitle('');
                    setNoteText('');
                    setIsNoteModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-theme-main text-theme-surface text-xs font-serif hover:opacity-90 transition-opacity cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>{isAmharic ? '+ አዲስ ማሰላሰያ ጻፍ' : '+ Write New Reflection'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => {
                  const noteDate = new Date(note.created_at).toLocaleDateString(
                    isAmharic ? 'am-ET' : 'en',
                    { year: 'numeric', month: 'short', day: 'numeric' }
                  );

                  return (
                    <article
                      key={note.id}
                      id={`note-${note.id}`}
                      className="bg-theme-surface rounded-xl border border-theme-subtle p-3.5 sm:p-4 lg:p-6 shadow-2xs hover:border-theme/70 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="material-symbols-outlined text-[18px] lg:text-[22px] text-[#b89e6c] dark:text-[#dfba4f] shrink-0">
                            edit_note
                          </span>
                          <h3 className="font-serif font-bold text-sm sm:text-base lg:text-lg xl:text-xl text-theme-main leading-snug truncate">
                            {note.title || (isAmharic ? 'ማስታወሻ' : 'Note')}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] lg:text-xs text-theme-muted font-sans hidden sm:inline">
                            {noteDate}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 lg:mt-3.5 pl-[26px] lg:pl-[30px] font-serif text-xs sm:text-sm lg:text-base xl:text-[17px] text-theme-body leading-relaxed lg:leading-8">
                        <p>{note.content}</p>
                      </div>

                      <div className="flex items-center justify-end gap-1 mt-1.5 lg:mt-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(`${note.content}\n— ${note.title ?? 'Note'}`)}
                          className="p-1 lg:p-1.5 rounded text-theme-muted/40 hover:text-theme-main transition-colors cursor-pointer"
                          title="Copy Reflection Citation"
                          aria-label="Copy Reflection Citation"
                        >
                          <span className="material-symbols-outlined text-[13px] lg:text-[15px] leading-none">content_copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNote(note);
                            setNoteTitle(note.title ?? '');
                            setNoteText(note.content);
                            setIsNoteModalOpen(true);
                          }}
                          className="p-1 lg:p-1.5 rounded text-theme-muted/40 hover:text-theme-main transition-colors cursor-pointer"
                          title="Edit Note"
                          aria-label="Edit Note"
                        >
                          <span className="material-symbols-outlined text-[13px] lg:text-[15px] leading-none">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteN(note.id)}
                          className="p-1 lg:p-1.5 rounded text-theme-muted/40 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Note"
                          aria-label="Delete Note"
                        >
                          <span className="material-symbols-outlined text-[13px] lg:text-[15px] leading-none">delete</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* VIEW C: LIBRARY */}
        {activeTab === 'library' && (
          <section id="library-view-content" aria-label="Personal Library" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { id: 'all', label: isAmharic ? 'ሁሉም' : 'All', count: books.length },
                  { id: 'reading', label: isAmharic ? 'በማንበብ ላይ' : 'Reading', count: 0 },
                  { id: 'want', label: 'TBR', count: 0 },
                  { id: 'read', label: isAmharic ? 'የተነበረ' : 'Read', count: 0 }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setLibraryFilter(filter.id as any)}
                    className={`text-xs font-serif px-3 py-1.5 rounded-full cursor-pointer transition-colors whitespace-nowrap border flex items-center gap-1.5 ${
                      libraryFilter === filter.id
                        ? 'bg-theme-main text-theme-surface border-theme-main font-semibold shadow-xs'
                        : 'bg-theme-surface text-theme-muted border-theme hover:text-theme-main hover:bg-theme-subtle'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-serif ${
                        libraryFilter === filter.id
                          ? 'bg-black/15 dark:bg-white/15 text-theme-surface'
                          : 'bg-theme-subtle text-theme-muted'
                      }`}
                    >
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  id="lib-manage-add-tbr-btn"
                  onClick={() => {
                    setTargetStatusForLibrary('to_be_read');
                    if (books.length > 0) setSelectedBookForLibrary(books[0].id);
                    setIsAddBookModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 text-xs font-serif font-medium inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-theme"
                >
                  <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
                  <span>{isAmharic ? 'ወደ TBR ጨምር' : 'Add to TBR'}</span>
                </button>

                <button
                  type="button"
                  id="lib-manage-mark-read-btn"
                  onClick={() => {
                    setTargetStatusForLibrary('finished');
                    if (books.length > 0) setSelectedBookForLibrary(books[0].id);
                    setIsAddBookModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-theme-surface border border-theme text-theme-main hover:bg-theme-subtle text-xs font-serif font-medium inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px] text-theme-accent">check_circle</span>
                  <span>{isAmharic ? 'ወደ ቤተ-መጻሕፍት አስቀምጥ' : 'Save to Library'}</span>
                </button>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-theme rounded-2xl p-8 bg-theme-subtle/30">
                <span className="material-symbols-outlined text-4xl text-[#b89e6c] dark:text-[#dfba4f] block mb-2 mx-auto">
                  local_library
                </span>
                <h3 className="font-serif text-base font-medium text-theme-main">{t('saved.noBooksFound', 'No volumes found')}</h3>
                <p className="text-xs text-theme-muted font-serif mt-1">
                  {t('saved.noBooksDesc', 'Add treatises to your Reading Queue or catalog volumes in your personal library.')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredBooks.map((book) => (
                  <article
                    key={book.id}
                    onClick={() => {
                      if (onSelectBook) {
                        onSelectBook(book.id);
                      }
                    }}
                    className="bg-theme-surface rounded-xl border border-theme p-3.5 sm:p-4 shadow-2xs hover:border-theme-accent/60 hover:shadow-xs transition-all cursor-pointer flex gap-3.5 group"
                  >
                    <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-md overflow-hidden bg-theme-subtle border border-black/10 shrink-0 shadow-2xs">
                      {book.cover_url ? (
                        <img
                          src={book.cover_url}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-serif text-[11px] text-theme-muted p-1 text-center bg-theme-subtle">
                          {book.title.slice(0, 16)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-sm sm:text-base text-theme-main truncate group-hover:text-theme-accent transition-colors leading-snug">
                          {book.title}
                        </h4>
                        <p className="text-xs text-theme-muted font-serif truncate mt-0.5 font-medium">{book.author_name}</p>
                        <p className="text-[11px] text-theme-subtle font-serif mt-0.5">
                          {book.language} · {book.page_count ?? 0} {isAmharic ? 'ገጾች' : 'pages'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-1">
                        <span className="text-[11px] text-theme-muted font-serif font-medium">
                          {isAmharic ? 'ሁኔታ:' : 'Status:'}
                        </span>
                        <span className="text-xs font-serif text-theme-subtle italic">
                          {isAmharic ? 'በቅርቡ' : 'Coming soon'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* MODAL: ADD / EDIT BOOKMARK */}
      {isBookmarkModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 font-serif"
          onClick={() => setIsBookmarkModalOpen(false)}
        >
          <form
            onSubmit={handleSaveBookmark}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-[0.25em] text-theme-muted block">
                  BOOKMARK ENTRY
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  {editingBookmark ? 'Edit Bookmark' : 'New Saved Bookmark'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBookmarkModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1 font-medium">
                  Source / Treatise Location:
                </label>
                <input
                  type="text"
                  value={bmSource}
                  onChange={(e) => setBmSource(e.target.value)}
                  placeholder="e.g. Confessions · Book X.27"
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1 font-medium">Author:</label>
                <input
                  type="text"
                  value={bmAuthor}
                  onChange={(e) => setBmAuthor(e.target.value)}
                  placeholder="e.g. St. Augustine of Hippo"
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1 font-medium">Category / Topic:</label>
                <select
                  value={bmCategory}
                  onChange={(e) => setBmCategory(e.target.value)}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main focus:outline-none focus:border-theme-accent cursor-pointer"
                >
                  <option value="Patristics">Patristics</option>
                  <option value="Theology">Theology</option>
                  <option value="Christology">Christology</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Ethics">Ethics</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1 font-medium">
                  Quotation / Manuscript Excerpt:
                </label>
                <textarea
                  rows={4}
                  value={bmQuote}
                  onChange={(e) => setBmQuote(e.target.value)}
                  placeholder="Enter the passage or quote..."
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif italic text-theme-main placeholder:text-theme-muted leading-relaxed focus:outline-none focus:border-theme-accent resize-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBookmarkModalOpen(false)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer font-medium shadow-xs"
              >
                {editingBookmark ? (isAmharic ? 'ምልክት አስተካክል' : 'Update Bookmark') : (isAmharic ? 'ጥቅስ አስቀምጥ' : 'Save Bookmark')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD / EDIT NOTE */}
      {isNoteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 font-serif"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <form
            onSubmit={handleSaveNote}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-serif uppercase tracking-[0.25em] text-theme-muted block">
                  {isAmharic ? 'የግል ማስታወሻ' : 'PERSONAL READING NOTES'}
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  {editingNote ? (isAmharic ? 'ማስታወሻ አስተካክል' : 'Edit Reflection') : (isAmharic ? 'አዲስ ማስታወሻ' : 'New Study Note')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1 font-medium">
                  {isAmharic ? 'ርዕስ:' : 'Title:'}
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder={isAmharic ? 'የማስታወሻ ርዕስ' : 'Note title'}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main placeholder:text-theme-muted focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1 font-medium">
                  {isAmharic ? 'የማሰላሰያ ማስታወሻ:' : 'Reflection Note:'}
                </label>
                <textarea
                  rows={5}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Write your theological thoughts or contemplative reflection..."
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif italic text-theme-main placeholder:text-theme-muted leading-relaxed focus:outline-none focus:border-theme-accent resize-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer font-medium shadow-xs"
              >
                {editingNote ? (isAmharic ? 'ማስታወሻ አስተካክል' : 'Update Reflection') : (isAmharic ? 'ማስታወሻ አስቀምጥ' : 'Save Reflection')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: LIBRARY MANAGEMENT */}
      {isAddBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedBookForLibrary && onUpdateBookStatus) {
                onUpdateBookStatus(selectedBookForLibrary, targetStatusForLibrary);
                const bookObj = books.find((b) => b.id === selectedBookForLibrary);
                const statusLabel =
                  targetStatusForLibrary === 'to_be_read'
                    ? (isAmharic ? 'ወደ TBR ተጨምሯል' : 'Added to TBR')
                    : targetStatusForLibrary === 'finished'
                    ? (isAmharic ? 'ወደ ቤተ-መጻሕፍት ተቀምጦ እንደተነበበ ተመዝግቧል' : 'Saved to Library & Marked as Read')
                    : (isAmharic ? 'በማንበብ ላይ ተደርጓል' : 'Set as Reading');
                onShowToast(`${statusLabel}: "${bookObj?.title || 'Volume'}"`);
              }
              setIsAddBookModalOpen(false);
            }}
            className="w-full max-w-md bg-theme-surface rounded-2xl border border-theme p-5 sm:p-6 shadow-2xl space-y-4 font-serif"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-theme-accent text-[22px]">
                  {targetStatusForLibrary === 'to_be_read' ? 'bookmark_add' : 'library_books'}
                </span>
                <h3 className="font-serif text-lg font-bold text-theme-main">
                  {targetStatusForLibrary === 'to_be_read'
                    ? (isAmharic ? 'መጽሐፉን ወደ TBR ጨምር' : 'Add Volume to TBR')
                    : (isAmharic ? 'መጽሐፉን ወደ ቤተ-መጻሕፍት አስቀምጥ' : 'Save Volume to Library')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="text-theme-muted hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1.5 font-medium">
                  {isAmharic ? 'ጥራዝ ምረጥ:' : 'Select Volume:'}
                </label>
                <select
                  value={selectedBookForLibrary}
                  onChange={(e) => setSelectedBookForLibrary(e.target.value)}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-sm text-theme-main focus:outline-none focus:border-theme-accent cursor-pointer shadow-2xs font-medium"
                >
                  {books.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} — {b.author_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-serif text-theme-muted mb-1.5 font-medium">
                  {isAmharic ? 'የሁኔታ ግብ:' : 'Shelf Status Target:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetStatusForLibrary('to_be_read')}
                    className={`py-2 px-3 rounded-lg border text-left font-serif transition-all cursor-pointer flex items-center gap-2 ${
                      targetStatusForLibrary === 'to_be_read'
                        ? 'bg-theme-main text-theme-surface border-theme-main font-semibold shadow-2xs'
                        : 'bg-theme-app text-theme-muted border-theme hover:text-theme-main'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                    <span>TBR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetStatusForLibrary('finished')}
                    className={`py-2 px-3 rounded-lg border text-left font-serif transition-all cursor-pointer flex items-center gap-2 ${
                      targetStatusForLibrary === 'finished'
                        ? 'bg-theme-main text-theme-surface border-theme-main font-semibold shadow-2xs'
                        : 'bg-theme-app text-theme-muted border-theme hover:text-theme-main'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px] text-theme-accent">check_circle</span>
                    <span>{isAmharic ? 'የተነበረ' : 'Read'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(false)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer font-medium shadow-xs"
              >
                {t('common.confirm', 'Confirm Update')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};