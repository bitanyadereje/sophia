import React, { useState, useEffect } from 'react';
import { ScreenId, UserProfile, Book, DialecticComment, Question, Review, Bookmark, ThemeMode } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeFeedView } from './components/HomeFeedView';
import { AuthModal } from './components/AuthModal';
import { SearchModal } from './components/SearchModal';
import { BookDetailView, BookDiscussionsDirectory, findOrCreateBook, loadBooks } from './features/books';
import { ColloquiumView, DiscussionsView } from './features/discussions';
import { PathsView } from './features/reading-paths';
import { ReviewsView, createReview, deleteReview, loadReviews, mapReviewMutationError, ReviewDetailView, updateReview } from './features/reviews';
import { loadProfile, ProfileView, updateProfile, uploadAvatar } from './features/profile';
import { SavedView } from './features/saved';
import { NotesView } from './features/notes/components/NotesView';
import { supabase } from './lib/supabase';

// ============================================================
// Temporary empty defaults
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
const INITIAL_REVIEWS: Review[] = [];
const INITIAL_BOOKMARKS: Bookmark[] = [];

export const App: React.FC = () => {
  // --- GLOBAL STATE (Routing, Auth, Theme) ---
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [theme, setTheme] = useState<ThemeMode>(INITIAL_USER.themePreference || 'dark');
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  
  // --- GLOBAL UI STATE ---
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // --- ROUTING TARGETS ---
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [targetQuestionId, setTargetQuestionId] = useState<string | null>(null);
  const [targetReviewId, setTargetReviewId] = useState<string | null>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('colloquium');

  // --- GLOBAL DATA LISTS (Passed down to screens) ---
  const [books, setBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  
  // --- FEATURE STATE (Will be moved to components later) ---
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [colloquiumComments, setColloquiumComments] = useState<DialecticComment[]>(INITIAL_COLLOQUIUM_COMMENTS);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);

  const showToast = (msg: string) => setToastMessage(msg);

  // --- AUTH & INITIAL FETCH ---
  const refreshProfile = async (userId: string) => {
    try {
      const profile = await loadProfile(userId);
      setUser(prev => ({ ...prev, ...profile }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

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

    // Load global lists
    loadBooks()
      .then(setBooks)
      .catch((error) => console.error('Failed to load books:', error));

    loadReviews()
      .then(setReviews)
      .catch((error) => console.error('Failed to load reviews:', error));

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- THEME ---
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setUser((prev) => ({ ...prev, themePreference: newTheme }));
  };

  // --- TOAST TIMEOUT ---
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- NAVIGATION HANDLERS ---
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

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setCurrentScreen('book-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSeminar = (targetBookId?: string) => {
    if (targetBookId) setSelectedBookId(targetBookId);
    setPreviousScreen(currentScreen === 'seminar' ? 'colloquium' : currentScreen);
    setCurrentScreen('seminar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- PROFILE HANDLERS ---
  const handleUpdateUser = async (updated: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updated }));
    if (authUserId) {
      try {
        await updateProfile(authUserId, updated);
      } catch (error) {
        console.error('Failed to save profile update:', error);
        showToast('Failed to save to database');
      }
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!authUserId) return showToast('You must be logged in');
    try {
      const publicUrl = await uploadAvatar(authUserId, file);
      setUser(prev => ({ ...prev, avatar: publicUrl }));
      showToast('Profile picture updated!');
    } catch (error: any) {
      console.error('Upload failed:', error);
      showToast('Failed to upload image');
    }
  };

  const handleAuthenticated = async () => {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error) return console.error('Failed to get authenticated user:', error);
    if (authUser) {
      setAuthUserId(authUser.id);
      await refreshProfile(authUser.id);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return showToast('Could not sign out');
    setAuthUserId(null);
    setUser(INITIAL_USER);
    setCurrentScreen('home');
    showToast('Signed out');
  };

  // --- BOOK HANDLERS ---
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

  // --- REVIEW HANDLERS (Data logic stays here, UI logic moves to component) ---
  const handleAddReview = async (data: any): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to publish a review.' };
    
    try {
      const book = await findOrCreateBook({
        book_id: data.book_id, bookTitle: data.bookTitle, bookAuthor: data.bookAuthor,
        title: data.title, author_name: data.author_name, language: data.language,
        cover_url: data.cover_url, page_count: data.page_count,
      }, authUserId, books, (resolved) =>
        setBooks((previous) => previous.some((item) => item.id === resolved.id) ? previous : [resolved, ...previous]),
      );

      const newReview = await createReview(authUserId, {
        book_id: book.id, 
        title: data.reviewTitle ?? (data.book_id ? data.title ?? null : null),
        content: data.content, rating: data.rating, quote: data.quote || null,
      });
      
      setReviews((previous) => [newReview, ...previous]);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : mapReviewMutationError(error) };
    }
  };

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

  // --- BOOKMARKS HANDLERS ---
  const handleAddBookmark = (b: Bookmark) => setBookmarks(prev => [b, ...prev]);
  const handleUpdateBookmark = (id: string, updated: Partial<Bookmark>) => setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b));
  const handleDeleteBookmark = (id: string) => setBookmarks(prev => prev.filter(b => b.id !== id));


  return (
    <div className="min-h-screen bg-theme-app text-theme-body relative flex flex-col font-sans antialiased selection:bg-theme-accent-light selection:text-theme-accent transition-colors duration-200">
      
      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-theme-main text-theme-surface text-xs font-label-md rounded-full shadow-lg border border-theme-subtle/40 flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <Header
        currentScreen={currentScreen}
        onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        user={user}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        theme={theme}
        onSetTheme={handleSetTheme}
      />

      <main className="flex-1 flex flex-col">
        
        {currentScreen === 'home' && (
          <HomeFeedView
            user={user}
            userId={authUserId}
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
            bookmarks={bookmarks} books={books} initialTab="library" userId={authUserId}
            onAddBookmark={handleAddBookmark} onUpdateBookmark={handleUpdateBookmark} onDeleteBookmark={handleDeleteBookmark}
            onSelectBook={handleSelectBook}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'discussions' && (
          <DiscussionsView
            currentUser={user}
            targetQuestionId={targetQuestionId}
            onClearTargetQuestion={() => setTargetQuestionId(null)}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'colloquium' && (
          <BookDiscussionsDirectory
            books={books}
            onSelectBook={handleSelectBook}
            onOpenSeminar={handleOpenSeminar}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'book-detail' && books.length > 0 && (
          <BookDetailView
            book={books.find((b) => b.id === selectedBookId) || books[0]}
            questions={questions} reviews={reviews} currentUser={user}
            onAddReview={handleAddReview}
            onAddReply={() => {}}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onOpenSeminar={handleOpenSeminar}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'seminar' && books.length > 0 && (
          <ColloquiumView
            book={books.find((b) => b.id === selectedBookId) || books[0]}
            comments={colloquiumComments}
            onAddComment={(c) => setColloquiumComments(prev => [...prev, c])}
            onBack={() => { setCurrentScreen(previousScreen === 'seminar' ? 'colloquium' : previousScreen); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'paths' && (
          <PathsView
            isDetailView={false}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'path-detail' && (
          <PathsView
            isDetailView={true}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'reviews' && (
          <ReviewsView
            reviews={reviews}
            books={books}
            currentUser={user}
            authUserId={authUserId}
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
            onBack={() => { setCurrentScreen('reviews'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onSelectBook={handleSelectBook}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'notes' && (
          <NotesView userId={authUserId} books={books} onShowToast={showToast} />
        )}

        {currentScreen === 'bookmarks' && (
          <SavedView
            bookmarks={bookmarks} books={books} initialTab="bookmarks" userId={authUserId}
            onAddBookmark={handleAddBookmark} onUpdateBookmark={handleUpdateBookmark} onDeleteBookmark={handleDeleteBookmark}
            onSelectBook={handleSelectBook}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileView
            user={user}
            onUpdateUser={handleUpdateUser}
            onAvatarUpload={handleAvatarUpload}
            onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
        onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        theme={theme}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        books={books} questions={questions} authUserId={authUserId}
        onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
