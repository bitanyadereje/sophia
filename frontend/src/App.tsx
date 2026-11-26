import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenId, UserProfile, DialecticComment, Question, Review, ThemeMode } from './types';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeFeedView } from './components/HomeFeedView';
import { LandingView } from './components/LandingView';
import { AuthModal } from './components/AuthModal';
import { SearchModal } from './components/SearchModal';
import { BookDetailView, BookDiscussionsDirectory, findOrCreateBook, loadBooks } from './features/books';
import { ColloquiumView, DiscussionsView } from './features/discussions';
import { PathsView } from './features/reading-paths';
import { ReviewsView, createReview, deleteReview, mapReviewMutationError, ReviewDetailView, updateReview } from './features/reviews';
import { loadProfile, ProfileView, updateProfile, uploadAvatar } from './features/profile';
import { SavedView } from './features/saved';
import { NotesView } from './features/notes/components/NotesView';
import { loadNotes } from './features/notes/notes.service';
import { supabase } from './lib/supabase';
import { AdminDashboard } from './features/admin';

// ============================================================
// Empty defaults
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
const EMPTY_REVIEWS: Review[] = [];

export const App: React.FC = () => {
  const queryClient = useQueryClient();

  // --- GLOBAL STATE (Routing, Auth, Theme) ---
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [isAdminRoute, setIsAdminRoute] = useState(() => window.location.pathname === '/admin');
  const [theme, setTheme] = useState<ThemeMode>(INITIAL_USER.themePreference || 'dark');
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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

  // --- SERVER DATA VIA TANSTACK QUERY (Deduplicated & Cached) ---
  const { data: books = [] } = useQuery({
    queryKey: ['books'],
    queryFn: loadBooks,
  });

  const { data: loadedProfile } = useQuery({
    queryKey: ['profile', authUserId],
    queryFn: () => loadProfile(authUserId!),
    enabled: Boolean(authUserId),
  });

  const detailReviewId = selectedReviewId || targetReviewId;

  const { data: selectedReview } = useQuery({
    queryKey: ['review', detailReviewId],
    queryFn: async () => {
      const cachedFeed = queryClient.getQueryData<{ pages: Array<{ reviews: Review[] }> }>(['reviews-feed']);
      const fromCache = cachedFeed?.pages
        .flatMap((page) => page.reviews)
        .find((r) => r.id === detailReviewId);
      if (fromCache) return fromCache;

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', detailReviewId!)
        .single();
      if (error) throw error;
      return data as Review;
    },
    enabled: currentScreen === 'review-detail' && Boolean(detailReviewId),
  });

  const user: UserProfile = loadedProfile
    ? { ...INITIAL_USER, ...loadedProfile, themePreference: theme }
    : { ...INITIAL_USER, themePreference: theme };

  const isAdmin = user.role === 'admin';
  const canCreateReadingPaths = Boolean(authUserId);
  const isGuestLanding = !isAdminRoute && !isAuthLoading && !authUserId && currentScreen === 'home';

  // --- FEATURE STATE ---
  const [questions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [colloquiumComments, setColloquiumComments] = useState<DialecticComment[]>(INITIAL_COLLOQUIUM_COMMENTS);

  const showToast = (msg: string) => setToastMessage(msg);

  // --- BROWSER SIDE EFFECTS (Auth listener, URL popstate, Theme DOM, Toast timer) ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Failed to load auth session:', error);
      setAuthUserId(session?.user?.id ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      setAuthUserId(userId);
      setIsAuthLoading(false);
      if (!userId) {
        queryClient.removeQueries({ queryKey: ['profile'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  useEffect(() => {
    const onPopState = () => setIsAdminRoute(window.location.pathname === '/admin');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const leaveAdmin = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    if (authUserId) {
      queryClient.setQueryData(['profile', authUserId], (prev: UserProfile | undefined) =>
        prev ? { ...prev, themePreference: newTheme } : prev
      );
    }
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // --- NAVIGATION HANDLERS ---
  const handleNavigate = (screen: ScreenId) => {
    if (screen === 'discussions') setTargetQuestionId(null);
    if (screen === 'reviews') {
      setTargetReviewId(null);
      setSelectedReviewId(null);
    }
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    if (!authUserId) return;
    queryClient.setQueryData(['profile', authUserId], (prev: UserProfile | undefined) =>
      prev ? { ...prev, ...updated } : prev
    );
    try {
      await updateProfile(authUserId, updated);
      await queryClient.invalidateQueries({ queryKey: ['profile', authUserId] });
    } catch (error) {
      console.error('Failed to save profile update:', error);
      showToast('Failed to save to database');
      await queryClient.invalidateQueries({ queryKey: ['profile', authUserId] });
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!authUserId) return showToast('You must be logged in');
    try {
      const publicUrl = await uploadAvatar(authUserId, file);
      queryClient.setQueryData(['profile', authUserId], (prev: UserProfile | undefined) =>
        prev ? { ...prev, avatar: publicUrl } : prev
      );
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
      await queryClient.invalidateQueries({ queryKey: ['profile', authUser.id] });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return showToast('Could not sign out');
    setAuthUserId(null);
    queryClient.removeQueries({ queryKey: ['profile'] });
    setCurrentScreen('home');
    showToast('Signed out');
  };

  // --- BOOK HANDLERS ---
  const handleCreateBook = async (input: { title: string; author: string; language: string; page_count: number; coverFile?: File | null }): Promise<{ ok: boolean; bookId?: string; error?: string }> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to add a new book.' };
    try {
      const book = await findOrCreateBook(input, authUserId);
      await queryClient.invalidateQueries({ queryKey: ['books'] });
      return { ok: true, bookId: book.id };
    } catch (error) {
      console.error('[book-debug] handleCreateBook error', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Could not add book.' };
    }
  };

  // --- REVIEW HANDLERS ---
  const handleAddReview = async (data: any): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to publish a review.' };

    try {
      let bookId = data.book_id as string | undefined;
      if (!bookId) {
        const created = await handleCreateBook({
          title: data.bookTitle,
          author: data.bookAuthor,
          language: data.language,
          page_count: data.page_count,
          coverFile: data.coverFile,
        });
        if (!created.ok || !created.bookId) throw new Error(created.error || 'Could not create the book.');
        bookId = created.bookId;
      }

      await createReview(authUserId, {
        book_id: bookId,
        title: data.reviewTitle ?? data.title ?? null,
        content: data.content,
        rating: data.rating,
        quote: data.quote || null,
        status: data.status ?? 'published',
      });

      await queryClient.invalidateQueries({ queryKey: ['reviews-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : mapReviewMutationError(error) };
    }
  };

  const handleUpdateReview = async (id: string, updated: Partial<Review>): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to edit a review.' };
    try {
      await updateReview(id, authUserId, updated);
      await queryClient.invalidateQueries({ queryKey: ['reviews-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['review', id] });
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapReviewMutationError(error) };
    }
  };

  const handleDeleteReview = async (id: string): Promise<any> => {
    if (!authUserId) return { ok: false, error: 'You must be signed in to delete a review.' };
    try {
      await deleteReview(id, authUserId);
      await queryClient.invalidateQueries({ queryKey: ['reviews-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['review', id] });
      await queryClient.invalidateQueries({ queryKey: ['reviews'] });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: mapReviewMutationError(error) };
    }
  };

  return (
    <div className="min-h-screen bg-theme-app text-theme-body relative flex flex-col font-sans antialiased selection:bg-theme-accent-light selection:text-theme-accent transition-colors duration-200">

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-theme-main text-theme-surface text-xs font-label-md rounded-full shadow-lg border border-theme-subtle/40 flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {!isAdminRoute && !isGuestLanding && (
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          user={user}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={handleSignOut}
          theme={theme}
          onSetTheme={handleSetTheme}
        />
      )}

      <main className={`flex-1 flex flex-col ${currentScreen === 'home' ? '' : 'page-typography'}`}>

        {isAdminRoute ? (
          <AdminDashboard userId={authUserId} profile={user} onExit={leaveAdmin} onShowToast={showToast} />
        ) : <>
        {currentScreen === 'home' && !isAuthLoading && (
          isGuestLanding ? (
            <LandingView
              books={books}
              onNavigate={handleNavigate}
              onOpenAuth={() => setIsAuthOpen(true)}
              onNavigateToDiscussion={handleNavigateToDiscussion}
              onNavigateToReview={handleNavigateToReview}
              onSelectBook={handleSelectBook}
            />
          ) : (
            <HomeFeedView
              user={user}
              userId={authUserId}
              books={books}
              onUpdateUser={handleUpdateUser}
              onNavigate={handleNavigate}
              onSelectBook={handleSelectBook}
              onOpenSeminar={handleOpenSeminar}
              onShowToast={showToast}
              onNavigateToDiscussion={handleNavigateToDiscussion}
              onNavigateToReview={handleNavigateToReview}
            />
          )
        )}

        {currentScreen === 'library' && (
          <SavedView
            books={books} initialTab="library" userId={authUserId}
            onSelectBook={handleSelectBook}
            onSelectDiscussion={setTargetQuestionId}
            onSelectReview={handleSelectReview}
            onSelectPath={setSelectedPathId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'discussions' && (
          <DiscussionsView
            currentUser={user}
            targetQuestionId={targetQuestionId}
            onClearTargetQuestion={() => setTargetQuestionId(null)}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'colloquium' && (
          <BookDiscussionsDirectory
            books={books}
            onSelectBook={handleSelectBook}
            onOpenSeminar={handleOpenSeminar}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'book-detail' && books.length > 0 && (
          <BookDetailView
            book={books.find((b) => b.id === selectedBookId) || books[0]}
            questions={questions} reviews={EMPTY_REVIEWS} currentUser={user}
            onAddReview={handleAddReview}
            onAddReply={() => {}}
            onNavigate={handleNavigate}
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
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'paths' && (
          <PathsView
            isDetailView={false}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
            userId={authUserId || ''}
            canCreatePaths={canCreateReadingPaths || false}
            onSelectBook={handleSelectBook}
            books={books}
            isAdmin={isAdmin}
            onCreateBook={handleCreateBook}
          />
        )}

        {currentScreen === 'path-detail' && (
          <PathsView
            isDetailView={true}
            selectedPathId={selectedPathId}
            onSelectPath={setSelectedPathId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
            userId={authUserId || ''}
            canCreatePaths={canCreateReadingPaths || false}
            onSelectBook={handleSelectBook}
            books={books}
            isAdmin={isAdmin}
            onCreateBook={handleCreateBook}
          />
        )}

        {currentScreen === 'reviews' && (
          <ReviewsView
            reviews={EMPTY_REVIEWS}
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
            onNavigate={handleNavigate}
            onShowToast={showToast}
            loadMarginalia={async (bookId) => {
              if (!authUserId || !bookId) return [];
              try {
                const notes = await loadNotes(authUserId, bookId);
                return notes
                  .filter((note) => note.content?.trim())
                  .map((note) => ({
                    id: note.id,
                    text: note.content,
                    quote: note.content,
                    citation: note.title || undefined,
                  }));
              } catch (error) {
                console.error('Failed to load marginalia for review composer:', error);
                return [];
              }
            }}
          />
        )}

        {currentScreen === 'review-detail' && selectedReview && (
          <ReviewDetailView
            review={selectedReview}
            currentUser={user}
            book={books.find((b) => b.id === selectedReview.book_id)}
            onBack={() => {
              setSelectedReviewId(null);
              setCurrentScreen('reviews');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={handleNavigate}
            onSelectBook={handleSelectBook}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'notes' && (
          <NotesView userId={authUserId} books={books} onShowToast={showToast} />
        )}

        {currentScreen === 'bookmarks' && (
          <SavedView
            books={books} initialTab="bookmarks" userId={authUserId}
            onSelectBook={handleSelectBook}
            onSelectDiscussion={setTargetQuestionId}
            onSelectReview={handleSelectReview}
            onSelectPath={setSelectedPathId}
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileView
            user={user}
            onUpdateUser={handleUpdateUser}
            onAvatarUpload={handleAvatarUpload}
            onNavigate={handleNavigate}
            onOpenAuth={() => setIsAuthOpen(true)}
            onSignOut={handleSignOut}
            onShowToast={showToast}
            theme={theme}
            onSetTheme={handleSetTheme}
          />
        )}
        </>}
      </main>

      {!isAdminRoute && !isGuestLanding && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          theme={theme}
        />
      )}

      {!isAdminRoute && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          books={books} questions={questions} authUserId={authUserId}
          onNavigate={handleNavigate}
        />
      )}

      {!isAdminRoute && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthenticated={handleAuthenticated}
          onShowToast={showToast}
        />
      )}
    </div>
  );
};

export default App;