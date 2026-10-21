import React, { useState, useEffect } from 'react';
import { ScreenId, UserProfile, Book, DialecticComment, Question, QuestionReply, ReadingPath, Review, Note, Bookmark, ThemeMode } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { SavedView } from './components/SavedView';
import { DiscussionsView } from './components/DiscussionsView';
import { ColloquiumView } from './components/ColloquiumView';
import { BookDiscussionsDirectory } from './components/BookDiscussionsDirectory';
import { BookDetailView } from './components/BookDetailView';
import { PathsView } from './components/PathsView';
import { ReviewsView } from './components/ReviewsView';
import { ReviewDetailView } from './components/ReviewDetailView';
import { ProfileView } from './components/ProfileView';
import { HomeFeedView } from './components/HomeFeedView';
import { AuthModal } from './components/AuthModal';
import { SearchModal } from './components/SearchModal';
import { supabase } from './lib/supabase';

type MutationResult = {
  ok: boolean;
  error?: string;
};

// ============================================================
// Temporary empty defaults (mock data files were deleted)
// These will be replaced by Supabase fetches as features are built.
// ============================================================
const INITIAL_USER: UserProfile = {
  id: '',
  name: '',
  title: '',
  location: '',
  memberSince: '',
  avatar: '',
  booksRead: 0,
  notesCount: 0,
  dayStreak: 0,
  goalTarget: 0,
  topics: []
};
const INITIAL_COLLOQUIUM_COMMENTS: DialecticComment[] = [];
const INITIAL_QUESTIONS: Question[] = [];
const INITIAL_PATHS: ReadingPath[] = [];
const INITIAL_REVIEWS: Review[] = [];
const INITIAL_NOTES: Note[] = [];
const INITIAL_BOOKMARKS: Bookmark[] = [];

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [theme, setTheme] = useState<ThemeMode>(INITIAL_USER.themePreference || 'light');
  const [books, setBooks] = useState<Book[]>([]);
  const [colloquiumComments, setColloquiumComments] = useState<DialecticComment[]>(INITIAL_COLLOQUIUM_COMMENTS);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [paths, setPaths] = useState<ReadingPath[]>(INITIAL_PATHS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [reviewerProfiles, setReviewerProfiles] = useState<Record<string, { name?: string | null; username?: string | null; avatar_url?: string | null; avatar?: string | null; title?: string | null }>>({});

  const loadReviewerProfilesForReviews = async (reviewList: Review[]) => {
    const reviewerIds = [...new Set(reviewList.map((review) => review.user_id).filter(Boolean))];

    if (reviewerIds.length === 0) {
      setReviewerProfiles({});
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .in('id', reviewerIds);

    if (error) {
      console.error('Failed to load reviewer profiles:', error);
      return;
    }

    const nextProfiles = (data ?? []).reduce<Record<string, { name?: string | null; username?: string | null; avatar_url?: string | null; avatar?: string | null; title?: string | null }>>((acc, profile) => {
      acc[profile.id] = {
        name: profile.name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        avatar: profile.avatar_url,
      };
      return acc;
    }, {});

    setReviewerProfiles(nextProfiles);
  };

  const loadProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, username, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error);
      return;
    }

    if (!data) {
      const { data: authData } = await supabase.auth.getUser();
      const fallbackName = authData.user?.user_metadata?.name || authData.user?.email || 'Reader';
      setUser(prev => ({
        ...prev,
        name: fallbackName,
        avatar: '',
      }));
      return;
    }

    setUser(prev => ({
      ...prev,
      name: data.name || data.username || 'Reader',
      avatar: data.avatar_url || '',
    }));
  };

  // Fetch books, reviews, and the signed-in user's profile on mount.
  useEffect(() => {
    let isMounted = true;
    const loadCurrentProfile = async (userId: string) => {
      if (isMounted) await loadProfile(userId);
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Failed to load auth session:', error);
      setAuthUserId(session?.user?.id ?? null);
      if (session?.user) void loadCurrentProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      setAuthUserId(userId);
      if (userId) {
        void loadCurrentProfile(userId);
      } else if (isMounted) {
        setUser(INITIAL_USER);
      }
    });

    supabase
      .from('books')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error('Failed to load books:', error);
        else setBooks((data ?? []) as Book[]);
      });


      supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load reviews:', error);
        else setReviews((data ?? []) as Review[]);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sync theme with DOM data-theme attribute
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setUser((prev) => ({ ...prev, themePreference: newTheme }));
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [readerContext, setReaderContext] = useState<{ title: string; chapter?: string }>({
    title: "The Confessions",
    chapter: "Book VIII, Chapter 12"
  });

  const [selectedBookId, setSelectedBookId] = useState<string>('');

  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);
  const [targetReviewId, setTargetReviewId] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

  const handleNavigateToDiscussion = (questionId: string) => {
    setTargetQuestionId(questionId);
    setCurrentScreen('discussions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToReview = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setTargetReviewId(reviewId);
    setCurrentScreen('review-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setCurrentScreen('review-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // TODO: wire to review_likes table
  const handleToggleReviewLike = (_reviewId: string) => {
    // Stub — will be replaced when review likes feature is built
  };

  // TODO: wire to saved_reviews table
  const handleToggleReviewSave = (_reviewId: string) => {
    // Stub — will be replaced when review save feature is built
  };

  const [previousScreen, setPreviousScreen] = useState<ScreenId>('colloquium');

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentScreen('book-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSeminar = (targetBookId?: string) => {
    if (targetBookId) {
      setSelectedBookId(targetBookId);
    }
    setPreviousScreen(currentScreen === 'seminar' ? 'colloquium' : currentScreen);
    setCurrentScreen('seminar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

     const handleUpdateUser = async (updated: Partial<UserProfile>) => {
    // 1. Update the UI instantly
    setUser(prev => ({ ...prev, ...updated }));

    // 2. If logged in, save to Supabase
    const targetUserId = authUserId;
    if (targetUserId) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: updated.name,
            avatar_url: updated.avatar,
          })
          .eq('id', targetUserId);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to save profile update:', error);
        showToast('Failed to save to database');
      }
    }
  };

  /**
   * Resolve a book to one canonical row. Both review creation and any future
   * reading-path book picker should use this function rather than inserting
   * books independently. This currently matches normalized title + author;
   * a bibliographic search/selection UI should supply verified metadata before
   * creation where available.
   */
  type BookInput = {
    book_id?: string;
    bookTitle?: string;
    bookAuthor?: string;
    title?: string;
    author_name?: string;
    language?: string;
    cover_url?: string | null;
    page_count?: number | null;
  };

  const normalizeBookText = (value: string | null | undefined) =>
    (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase();

  const findOrCreateBook = async (input: BookInput): Promise<Book> => {
    if (!authUserId) throw new Error('You must be signed in to add a new book.');

    // If the UI selected a canonical book, validate that it still exists.
    if (input.book_id) {
      const existing = books.find((book) => book.id === input.book_id);
      if (existing) return existing;

      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', input.book_id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('That book could not be found. Search the catalog again.');
      const found = data as Book;
      setBooks((previous) => previous.some((book) => book.id === found.id) ? previous : [found, ...previous]);
      return found;
    }

    const title = (input.bookTitle ?? input.title ?? '').trim();
    const author = (input.bookAuthor ?? input.author_name ?? '').trim();
    if (!title || !author) throw new Error('A book title and author are required.');

    // Query the database, not just React state, so a stale local list is less
    // likely to cause a duplicate when another user has already added the book.
    const { data: existingBooks, error: searchError } = await supabase
      .from('books')
      .select('*');
    if (searchError) throw searchError;

    const match = (existingBooks ?? []).find((book: Book) =>
      normalizeBookText(book.title) === normalizeBookText(title) &&
      normalizeBookText(book.author_name) === normalizeBookText(author)
    ) as Book | undefined;

    if (match) {
      setBooks((previous) => previous.some((book) => book.id === match.id) ? previous : [match, ...previous]);
      return match;
    }

    // New user-submitted records remain unverified. Do not mark a book verified
    // just because a user entered its title and author.
    const { data: created, error: createError } = await supabase
      .from('books')
      .insert({
        title,
        author_name: author,
        language: input.language ?? 'en',
        cover_url: input.cover_url ?? null,
        page_count: input.page_count ?? null,
        verification_status: 'unverified',
        created_by: authUserId,
      })
      .select('*')
      .single();

    if (createError) throw createError;
    const createdBook = created as Book;
    setBooks((previous) => previous.some((book) => book.id === createdBook.id) ? previous : [createdBook, ...previous]);
    return createdBook;
  };

  const handleAddBook = async (newBookData: { title: string; author_name: string }) => {
    try {
      const book = await findOrCreateBook(newBookData);
      showToast(book.verification_status === 'verified' ? 'Book found in catalog.' : 'Book found or submitted for verification.');
      return book;
    } catch (error) {
      console.error('Failed to find or add book:', error);
      showToast(error instanceof Error ? error.message : 'Could not add book.');
      return null;
    }
  };

  const handleUpdateBookStatus = (
    _bookId: string,
    _status: any,
    _userRating?: number,
    _currentPage?: number,
    _currentLocation?: string
  ) => {
    // Stub — will be replaced when library feature is built
  };

  const handleAddBookmarkFromQuote = (quoteText: string, source: string, author: string) => {
    const initials = author
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'SP';

    const newBm: Bookmark = {
      id: `bm-${Date.now()}`,
      category: 'Patristic Quote',
      source,
      quote: quoteText,
      author,
      initials,
      isFavorite: true
    };
    setBookmarks((prev) => [newBm, ...prev]);
  };

  const handleAddQuestion = (q: Question) => {
    setQuestions(prev => [q, ...prev]);
  };

  const handleUpdateQuestion = (id: string, updated: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleAddReply = (questionId: string, replyText: string, parentReplyId?: string, replyToAuthor?: string) => {
    const newRep: QuestionReply = {
      id: `rep-${Date.now()}`,
      author: user.name,
      authorAvatar: user.avatar,
      timeAgo: 'Just now',
      text: replyText,
      likesCount: 0,
      userLiked: false,
      replyToAuthor: replyToAuthor
    };

    const insertReplyRecursively = (list: QuestionReply[], targetId: string): { updated: QuestionReply[]; found: boolean } => {
      let found = false;
      const updated = list.map(item => {
        if (item.id === targetId) {
          found = true;
          return { ...item, replies: [...(item.replies || []), newRep] };
        }
        if (item.replies && item.replies.length > 0) {
          const res = insertReplyRecursively(item.replies, targetId);
          if (res.found) {
            found = true;
            return { ...item, replies: res.updated };
          }
        }
        return item;
      });
      return { updated, found };
    };

    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== questionId) return q;
        if (parentReplyId) {
          const currentReplies = q.replies || [];
          const { updated } = insertReplyRecursively(currentReplies, parentReplyId);
          return { ...q, repliesCount: q.repliesCount + 1, replies: updated };
        }
        return { ...q, repliesCount: q.repliesCount + 1, replies: [...(q.replies || []), newRep] };
      })
    );
  };

  const handleAddComment = (c: DialecticComment) => {
    setColloquiumComments(prev => [...prev, c]);
  };
  const mapReviewMutationError = (error: any): string => {
    if (error?.code === '23505') return 'You already reviewed this book. Edit your existing review instead.';
    if (error?.code === '23503') return 'The selected book is no longer available. Search the catalog again.';
    if (error?.code === '42501') return 'Permission denied. Please sign in and try again.';
    return error?.message || 'Unexpected database error.';
  };

  /** Resolves the selected or manually entered book, then persists its review. */
  const handleAddReview = async (data: any): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to publish a review.' };
    if (typeof data.content !== 'string' || !data.content.trim()) {
      return { ok: false, error: 'Please write a detailed review.' };
    }
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      return { ok: false, error: 'Rating must be between 1 and 5.' };
    }

    try {
      const book = await findOrCreateBook({
        book_id: data.book_id,
        bookTitle: data.bookTitle,
        bookAuthor: data.bookAuthor,
        title: data.title,
        author_name: data.author_name,
        language: data.language,
        cover_url: data.cover_url,
        page_count: data.page_count,
      });

      const { data: newReview, error } = await supabase
        .from('reviews')
        .insert({
          user_id: authUserId,
          book_id: book.id,
          title: data.reviewTitle ?? (data.book_id ? data.title ?? null : null),
          content: data.content,
          rating: data.rating,
          quote: data.quote || null,
        })
        .select('*')
        .single();

      if (error) return { ok: false, error: mapReviewMutationError(error) };
      setReviews((previous) => [newReview as Review, ...previous]);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : mapReviewMutationError(error);
      return { ok: false, error: message };
    }
  };

  /** Persist edits; RLS and the user_id filter both enforce ownership. */
  const handleUpdateReview = async (id: string, updated: Partial<Review>): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to edit a review.' };

    // Only allow review fields to be changed from this handler.
    const patch: Partial<Review> & { updated_at: string } = {
      ...(updated.title !== undefined ? { title: updated.title } : {}),
      ...(updated.content !== undefined ? { content: updated.content } : {}),
      ...(updated.rating !== undefined ? { rating: updated.rating } : {}),
      ...(updated.quote !== undefined ? { quote: updated.quote } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('reviews')
      .update(patch)
      .eq('id', id)
      .eq('user_id', authUserId)
      .select('*')
      .single();

    if (error) return { ok: false, error: mapReviewMutationError(error) };
    setReviews((previous) => previous.map((review) => review.id === id ? data as Review : review));
    return { ok: true };
  };

  const handleDeleteReview = async (id: string): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to delete a review.' };

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .eq('user_id', authUserId);

    if (error) return { ok: false, error: mapReviewMutationError(error) };
    setReviews((previous) => previous.filter((review) => review.id !== id));
    return { ok: true };
  };

  const handleAddNote = (n: Note) => {
    setNotes(prev => [n, ...prev]);
    setUser(prev => ({ ...prev, notesCount: prev.notesCount + 1 }));
  };

  const handleUpdateNote = (id: string, updated: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setUser(prev => ({ ...prev, notesCount: Math.max(0, prev.notesCount - 1) }));
  };

  const handleAddBookmark = (b: Bookmark) => {
    setBookmarks(prev => [b, ...prev]);
  };

  const handleUpdateBookmark = (id: string, updated: Partial<Bookmark>) => {
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarks(prev =>
      prev.map(b => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))
    );
  };

  const handleAuthenticated = async () => {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Failed to get authenticated user:', error);
      return;
    }
    if (authUser) {
      setAuthUserId(authUser.id);
      await loadProfile(authUser.id);
    }
  };

    const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error);
      showToast('Could not sign out');
      return;
    }
    setAuthUserId(null);
    setUser(INITIAL_USER);
    setCurrentScreen('home');
    showToast('Signed out');
  };

  // --- ADD THIS NEW FUNCTION HERE ---
  const handleAvatarUpload = async (file: File) => {
    if (!authUserId) {
      showToast('You must be logged in');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${authUserId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', authUserId);

      if (updateError) throw updateError;

      setUser(prev => ({ ...prev, avatar: publicUrl }));
      showToast('Profile picture updated!');

    } catch (error: any) {
      console.error('Upload failed:', error);
      showToast('Failed to upload image');
    }
  };
  // ----------------------------------

  return (
    <div className="min-h-screen bg-theme-app text-theme-body relative flex flex-col font-sans antialiased selection:bg-theme-accent-light selection:text-theme-accent transition-colors duration-200">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-theme-main text-theme-surface text-xs font-label-md rounded-full shadow-lg border border-theme-subtle/40 flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
          <span>{toastMessage}</span>
        </div>
      )}

           <Header
        currentScreen={currentScreen}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut = {handleSignOut}
        theme={theme}
        onSetTheme={handleSetTheme}
      />

      <main className="flex-1 flex flex-col">
        {currentScreen === 'home' && (
          <HomeFeedView
            user={user}
            books={books}
            onUpdateUser={handleUpdateUser}
            onNavigate={(s) => {
              if (s === 'discussions') setTargetQuestionId(null);
              if (s === 'reviews') setTargetReviewId(null);
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectBook={handleSelectBook}
            onOpenSeminar={handleOpenSeminar}
            onShowToast={showToast}
            onNavigateToDiscussion={handleNavigateToDiscussion}
            onNavigateToReview={handleNavigateToReview}
          />
        )}

        {currentScreen === 'library' && (
          <SavedView
            bookmarks={bookmarks}
            notes={notes}
            books={books}
            initialTab="library"
            onAddBookmark={handleAddBookmark}
            onUpdateBookmark={handleUpdateBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onUpdateBookStatus={(bId, status) => handleUpdateBookStatus(bId, status)}
            onSelectBook={handleSelectBook}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'discussions' && (
          <DiscussionsView
            questions={questions}
            currentUser={user}
            targetQuestionId={targetQuestionId}
            onClearTargetQuestion={() => setTargetQuestionId(null)}
            onAddQuestion={handleAddQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onAddReply={handleAddReply}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'colloquium' && (
          <BookDiscussionsDirectory
            books={books}
            onSelectBook={handleSelectBook}
            onOpenSeminar={handleOpenSeminar}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'book-detail' && books.length > 0 && (
          <BookDetailView
            book={books.find((b) => b.id === selectedBookId) || books[0]}
            questions={questions}
            notes={notes}
            reviews={reviews}
            currentUser={user}
            onAddNote={handleAddNote}
            onAddReview={handleAddReview}
            onUpdateBookStatus={handleUpdateBookStatus}
            onAddQuestion={handleAddQuestion}
            onAddReply={handleAddReply}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSeminar={handleOpenSeminar}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'seminar' && books.length > 0 && (
          <ColloquiumView
            book={books.find((b) => b.id === selectedBookId) || books[0]}
            comments={colloquiumComments}
            onAddComment={handleAddComment}
            onBack={() => {
              setCurrentScreen(previousScreen === 'seminar' ? 'colloquium' : previousScreen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'paths' && (
          <PathsView
            paths={paths}
            isDetailView={false}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'path-detail' && (
          <PathsView
            paths={paths}
            isDetailView={true}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'reviews' && (
          <ReviewsView
            reviews={reviews}
            books={books}
            currentUser={user}
            authUserId={authUserId}
            reviewerProfiles={reviewerProfiles}
            targetReviewId={targetReviewId}
            onClearTargetReview={() => setTargetReviewId(null)}
            onAddReview={handleAddReview}
            onUpdateReview={handleUpdateReview}
            onDeleteReview={handleDeleteReview}
            onSelectBook={handleSelectBook}
            onSelectReview={handleSelectReview}
            onNavigate={(s) => {
              if (s === 'reviews') setTargetReviewId(null);
              if (s === 'discussions') setTargetQuestionId(null);
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'review-detail' && reviews.length > 0 && (
          <ReviewDetailView
            review={reviews.find((r) => r.id === (selectedReviewId || targetReviewId)) || reviews[0]}
            currentUser={user}
            book={books.find((b) => b.id === (reviews.find((r) => r.id === (selectedReviewId || targetReviewId))?.book_id))}
            onBack={() => {
              setCurrentScreen('reviews');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectBook={handleSelectBook}
            onToggleLike={handleToggleReviewLike}
            onToggleSave={handleToggleReviewSave}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'notes' && (
          <SavedView
            bookmarks={bookmarks}
            notes={notes}
            books={books}
            initialTab="notes"
            onAddBookmark={handleAddBookmark}
            onUpdateBookmark={handleUpdateBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onUpdateBookStatus={(bId, status) => handleUpdateBookStatus(bId, status)}
            onSelectBook={handleSelectBook}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'bookmarks' && (
          <SavedView
            bookmarks={bookmarks}
            notes={notes}
            books={books}
            initialTab="bookmarks"
            onAddBookmark={handleAddBookmark}
            onUpdateBookmark={handleUpdateBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onUpdateBookStatus={(bId, status) => handleUpdateBookStatus(bId, status)}
            onSelectBook={handleSelectBook}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'profile' && (
            <ProfileView
            user={user}
            onUpdateUser={handleUpdateUser}
            onAvatarUpload={handleAvatarUpload}
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSignOut={handleSignOut}
            onShowToast={showToast}
            theme={theme}
            onSetTheme={handleSetTheme}
          />
        )}
      </main>

      <BottomNav
        currentScreen={currentScreen}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        books={books}
        questions={questions}
        paths={paths}
        notes={notes}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
        onShowToast={showToast}
      />
    </div>
  );
};

export default App;
