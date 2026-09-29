import React, { useState, useEffect } from 'react';
import { ScreenId, UserProfile, Book, DialecticComment, Question, QuestionReply, ReadingPath, Review, Note, Bookmark, ThemeMode } from './types';
import {
  INITIAL_USER,
  INITIAL_BOOKS,
  INITIAL_COLLOQUIUM_COMMENTS,
  INITIAL_QUESTIONS,
  INITIAL_PATHS,
  INITIAL_REVIEWS,
  INITIAL_NOTES,
  INITIAL_BOOKMARKS
} from './data/initialData';

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

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [theme, setTheme] = useState<ThemeMode>(INITIAL_USER.themePreference || 'light');
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [colloquiumComments, setColloquiumComments] = useState<DialecticComment[]>(INITIAL_COLLOQUIUM_COMMENTS);
  const [questions, setQuestions] = useState<Question[]>(INITIAL_QUESTIONS);
  const [paths, setPaths] = useState<ReadingPath[]>(INITIAL_PATHS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);

  // Sync theme with DOM data-theme attribute
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setUser((prev) => ({ ...prev, themePreference: newTheme }));
  };

  // Search & Auth modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Reader context
  const [readerContext, setReaderContext] = useState<{ title: string; chapter?: string }>({
    title: "The Confessions",
    chapter: "Book VIII, Chapter 12"
  });

  // Selected volume for Book Discussions & Detail
  const [selectedBookId, setSelectedBookId] = useState<string>('conf-4');

  // Direct target links for discussions and reviews
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

  const handleToggleReviewLike = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextLiked = !r.userLiked;
          const currentCount = r.likesCount ?? 0;
          return {
            ...r,
            userLiked: nextLiked,
            likesCount: nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1)
          };
        }
        return r;
      })
    );
  };

  const handleToggleReviewSave = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            userSaved: !r.userSaved
          };
        }
        return r;
      })
    );
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

  // Notification toast
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

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  const handleUpdateBookStatus = (
    bookId: string,
    status: any,
    userRating?: number,
    currentPage?: number,
    currentLocation?: string
  ) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const total = b.totalPages || 100;
        let prog = b.progress;
        if (currentPage !== undefined) {
          prog = Math.min(100, Math.round((currentPage / total) * 100));
        } else if (status === 'read') {
          prog = 100;
        } else if (status === 'want-to-read') {
          prog = 0;
        }

        return {
          ...b,
          readingStatus: status,
          progress: prog,
          currentPage: currentPage !== undefined ? currentPage : b.currentPage,
          currentLocation: currentLocation !== undefined ? currentLocation : b.currentLocation,
          userRating: userRating !== undefined ? userRating : b.userRating
        };
      })
    );

    if (status === 'read') {
      setUser((prev) => ({
        ...prev,
        booksRead: (prev.booksRead || 0) + 1
      }));
    }
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
          return {
            ...item,
            replies: [...(item.replies || []), newRep]
          };
        }
        if (item.replies && item.replies.length > 0) {
          const res = insertReplyRecursively(item.replies, targetId);
          if (res.found) {
            found = true;
            return {
              ...item,
              replies: res.updated
            };
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
          return {
            ...q,
            repliesCount: q.repliesCount + 1,
            replies: updated
          };
        }
        return {
          ...q,
          repliesCount: q.repliesCount + 1,
          replies: [...(q.replies || []), newRep]
        };
      })
    );
  };

  const handleAddComment = (c: DialecticComment) => {
    setColloquiumComments(prev => [...prev, c]);
  };

  const handleAddReview = (r: Review) => {
    setReviews(prev => [r, ...prev]);
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
prev.map(b => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))    );
  };

  const handleAuthenticated = (name: string, email: string) => {
    setUser(prev => ({
      ...prev,
      name,
      title: "Sorbonne Patristics Scholar",
      location: "Paris Abbey"
    }));
  };

  return (
    <div className="min-h-screen bg-theme-app text-theme-body relative flex flex-col font-sans antialiased selection:bg-theme-accent-light selection:text-theme-accent transition-colors duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-theme-main text-theme-surface text-xs font-label-md rounded-full shadow-lg border border-theme-subtle/40 flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        user={user}
        onOpenSearch={() => setIsSearchOpen(true)}
        theme={theme}
        onSetTheme={handleSetTheme}
      />

      {/* Screen Router */}
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

        {currentScreen === 'book-detail' && (
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

        {currentScreen === 'seminar' && (
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

        {currentScreen === 'review-detail' && (
          <ReviewDetailView
            review={reviews.find((r) => r.id === (selectedReviewId || targetReviewId)) || reviews[0]}
            currentUser={user}
            book={books.find((b) => b.id === (reviews.find((r) => r.id === (selectedReviewId || targetReviewId))?.bookId))}
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
            onNavigate={(s) => {
              setCurrentScreen(s);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsAuthOpen(true)}
            onShowToast={showToast}
            theme={theme}
            onSetTheme={handleSetTheme}
          />
        )}
      </main>

      {/* Global Bottom Navigation */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={(s) => {
          setCurrentScreen(s);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        theme={theme}
      />

      {/* Global Search Modal */}
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

      {/* Auth / Inscription Modal */}
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
