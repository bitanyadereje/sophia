import React, { useState, useEffect } from 'react';
import { ScreenId, UserProfile, Book, DialecticComment, Question, QuestionReply, ReadingPath, Review, Note, Bookmark, ThemeMode } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeFeedView } from './components/HomeFeedView';
import { AuthModal } from './components/AuthModal';
import { SearchModal } from './components/SearchModal';
import { BookDetailView, BookDiscussionsDirectory, findOrCreateBook, loadBooks } from './features/books';
import { ColloquiumView, DiscussionsView } from './features/discussions';
import { PathsView } from './features/reading-paths';
import { ReviewsView, createReview, deleteReview, loadReviewerProfilesForReviews, loadReviews, mapReviewMutationError, ReviewDetailView, updateReview } from './features/reviews';
import { loadProfile, ProfileView, updateProfile, uploadAvatar } from './features/profile';
import { SavedView } from './features/saved';
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

  const refreshProfile = async (userId: string) => {
    try {
      const profile = await loadProfile(userId);
      setUser(prev => ({ ...prev, ...profile }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  // Fetch books, reviews, and the signed-in user's profile on mount.
  useEffect(() => {
    let isMounted = true;
    const loadCurrentProfile = async (userId: string) => {
      if (isMounted) await refreshProfile(userId);
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

    loadBooks()
      .then(setBooks)
      .catch((error) => console.error('Failed to load books:', error));


    loadReviews()
      .then(async (reviewList) => {
        setReviews(reviewList);
        const nextReviewerProfiles = await loadReviewerProfilesForReviews(reviewList);
        setReviewerProfiles(nextReviewerProfiles);
      })
      .catch((error) => console.error('Failed to load reviews:', error));

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
        await updateProfile(targetUserId, updated);
      } catch (error) {
        console.error('Failed to save profile update:', error);
        showToast('Failed to save to database');
      }
    }
  };

  const handleAddBook = async (newBookData: { title: string; author_name: string }) => {
    try {
      const book = await findOrCreateBook(newBookData, authUserId, books, (resolved) =>
        setBooks((previous) => previous.some((item) => item.id === resolved.id) ? previous : [resolved, ...previous]),
      );
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
      }, authUserId, books, (resolved) =>
        setBooks((previous) => previous.some((item) => item.id === resolved.id) ? previous : [resolved, ...previous]),
      );
      const newReview = await createReview(authUserId, {
        book_id: book.id, title: data.reviewTitle ?? (data.book_id ? data.title ?? null : null),
        content: data.content, rating: data.rating, quote: data.quote || null,
      });
      setReviews((previous) => [newReview, ...previous]);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : mapReviewMutationError(error);
      return { ok: false, error: message };
    }
  };

  /** Persist edits; RLS and the user_id filter both enforce ownership. */
  const handleUpdateReview = async (id: string, updated: Partial<Review>): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to edit a review.' };

    try {
      const review = await updateReview(id, authUserId, updated);
      setReviews((previous) => previous.map((item) => item.id === id ? review : item));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapReviewMutationError(error) };
    }
  };

  const handleDeleteReview = async (id: string): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to delete a review.' };

    try {
      await deleteReview(id, authUserId);
      setReviews((previous) => previous.filter((review) => review.id !== id));
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapReviewMutationError(error) };
    }
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
      await refreshProfile(authUser.id);
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
      const publicUrl = await uploadAvatar(authUserId, file);

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
