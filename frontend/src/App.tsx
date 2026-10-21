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
      setUser(prev => ({ ...prev, id: userId }));
      return;
    }

    setUser(prev => ({
      ...prev,
      id: data.id,
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
      if (session?.user) void loadCurrentProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void loadCurrentProfile(session.user.id);
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
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: updated.name,
            avatar_url: updated.avatar,
            // Add other fields here if you add them to the UI later
          })
          .eq('id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Failed to save profile update:', error);
        showToast('Failed to save to database');
      }
    }
  };

  // ADD THE NEW FUNCTION HERE
  const handleAddBook = async (newBookData: { title: string; author_name: string }) => {
    if (!user || !user.name) {
      showToast('You must be logged in to add a book');
      return;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        title: newBookData.title,
        author_name: newBookData.author_name,
        language: 'en',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add book:', error);
      showToast('Could not add book');
      return;
    }

    setBooks(prev => [data as Book, ...prev]);
    showToast('Book added successfully!');
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
  const handleAddReview = async (data: Review | { bookTitle: string; bookAuthor: string; rating: number; quote: string; content: string }) => {
    if (!user.id) {
      showToast('You must be logged in');
      throw new Error('No user ID');
    }

    const bookTitle = 'bookTitle' in data ? data.bookTitle : data.title || '';
    let book = 'book_id' in data
      ? books.find(item => item.id === data.book_id)
      : books.find(
        item => item.title.trim().toLowerCase() === data.bookTitle.trim().toLowerCase()
          && item.author_name.trim().toLowerCase() === data.bookAuthor.trim().toLowerCase()
      );

    if (!book) {
      if ('book_id' in data) {
        throw new Error('Book for this review was not found');
      }
      const { data: createdBook, error: bookError } = await supabase
        .from('books')
        .insert({ title: data.bookTitle.trim(), author_name: data.bookAuthor.trim(), language: 'en' })
        .select('*')
        .single();

      if (bookError) {
        console.error('Failed to find or create review book:', bookError);
        showToast('Could not find or create book');
        throw bookError;
      }
      book = createdBook as Book;
      setBooks(prev => [...prev, book as Book]);
    }
    
    const { data: newReview, error } = await supabase
      .from('reviews')
      .insert({
        book_id: book.id,
        user_id: user.id,
        title: bookTitle.trim() || null,
        content: data.content,
        rating: data.rating,
        quote: data.quote || null,
      })
      .select()
      .single();

    if (error) {
      console.error('4. SUPABASE ERROR:', error);
      showToast('Database error: ' + error.message);
      throw error;
    }

    setReviews(prev => [newReview as Review, ...prev]);
  };
  
  const handleUpdateReview = (id: string, updated: Partial<Review>) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  };

  const handleDeleteReview = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
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

  const handleAuthenticated = async (_name: string, _email: string) => {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Failed to get authenticated user:', error);
      return;
    }
    if (authUser) await loadProfile(authUser.id);
  };

    const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out failed:', error);
      showToast('Could not sign out');
      return;
    }
    setUser(INITIAL_USER);
    setCurrentScreen('home');
    showToast('Signed out');
  };

  // --- ADD THIS NEW FUNCTION HERE ---
  const handleAvatarUpload = async (file: File) => {
    if (!user || !user.id) {
      showToast('You must be logged in');
      return;
    }

    try {
      // 1. Create a unique file path (userId + timestamp)
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 4. Save URL to the user's profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 5. Update local state so the UI changes instantly
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
            currentUser={user}
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
