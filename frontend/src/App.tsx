import React, { useState, useEffect, useRef } from 'react';
import { ScreenId, UserProfile, Book, DialecticComment, Question, QuestionReply, ReadingPath, Review, ReviewComment, ReviewLike, Note, Bookmark, ThemeMode, PostLike, SavedPost, DiscussionPost } from './types';
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
  const [reviewComments, setReviewComments] = useState<ReviewComment[]>([]);
  const [reviewLikes, setReviewLikes] = useState<ReviewLike[]>([]);
  const [postLikes, setPostLikes] = useState<PostLike[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const sessionUserIdRef = useRef<string | null>(null);
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

  const mapPostToQuestion = (post: any, likes: PostLike[], saved: SavedPost[], userId: string | null): Question => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(post.created_at).getTime()) / 60000));
    const timeAgo = minutes < 1 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;
    return {
      id: post.id,
      author: 'Reader', // Hardcoded until we fix joins
      authorAvatar: '',
      timeAgo,
      topic: 'Reflections' as Question['topic'],
      title: post.title ?? '',
      body: post.content,
      likesCount: likes.filter(like => like.post_id === post.id).length,
      saved: !!userId && saved.some(item => item.post_id === post.id && item.user_id === userId),
      repliesCount: 0,
      bookId: post.book_id || undefined,
      bookTitle: undefined,
      replies: [],
    };
  };

  useEffect(() => {
    let isMounted = true;
    const loadCurrentProfile = async (userId: string) => {
      if (isMounted) await loadProfile(userId);
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('Failed to load auth session:', error);
      sessionUserIdRef.current = session?.user.id ?? null;
      if (session?.user) void loadCurrentProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionUserIdRef.current = session?.user.id ?? null;
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

    Promise.all([
      supabase.from('discussion_posts')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false }),
      supabase.from('post_likes').select('*'),
      supabase.from('saved_posts').select('*'),
    ]).then(([postsResult, likesResult, savedResult]) => {
      if (postsResult.error) console.error('Failed to load discussion posts:', postsResult.error);
      if (likesResult.error) console.error('Failed to load post likes:', likesResult.error);
      if (savedResult.error) console.error('Failed to load saved posts:', savedResult.error);
      const likes = (likesResult.data ?? []) as PostLike[];
      const saved = (savedResult.data ?? []) as SavedPost[];
      setPostLikes(likes);
      setSavedPosts(saved);
      if (!postsResult.error) setQuestions(((postsResult.data ?? []) as any[]).map(post => mapPostToQuestion(post, likes, saved, sessionUserIdRef.current)));
    });

    supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load reviews:', error);
        else setReviews((data ?? []) as Review[]);
      });

    supabase.from('review_comments').select('*').order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Failed to load review comments:', error);
        else setReviewComments((data ?? []) as ReviewComment[]);
      });

    supabase.from('review_likes').select('*')
      .then(({ data, error }) => {
        if (error) console.error('Failed to load review likes:', error);
        else setReviewLikes((data ?? []) as ReviewLike[]);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const handleToggleReviewLike = async (reviewId: string) => {
    if (!user.id) {
      showToast('Sign in to like reviews');
      return;
    }

    const isLiked = reviewLikes.some(like => like.review_id === reviewId && like.user_id === user.id);
    const result = isLiked
      ? await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', user.id)
      : await supabase.from('review_likes').insert({ review_id: reviewId, user_id: user.id });

    if (result.error) {
      console.error('Failed to update review like:', result.error);
      showToast(result.error.message);
      return;
    }

    setReviewLikes(prev => isLiked
      ? prev.filter(like => like.review_id !== reviewId || like.user_id !== user.id)
      : [...prev, { review_id: reviewId, user_id: user.id, created_at: new Date().toISOString() }]
    );
  };

  const handleAddReviewComment = async (reviewId: string, content: string) => {
    if (!user.id) {
      showToast('Sign in to comment on reviews');
      throw new Error('No user ID');
    }

    const { data, error } = await supabase
      .from('review_comments')
      .insert({ review_id: reviewId, user_id: user.id, content })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to add review comment:', error);
      showToast(error.message);
      throw error;
    }
    setReviewComments(prev => [...prev, data as ReviewComment]);
  };

  const handleToggleThreadLike = async (postId: string) => {
    if (!user.id) { showToast('Sign in to like discussions'); throw new Error('No user ID'); }
    const isLiked = postLikes.some(l => l.post_id === postId && l.user_id === user.id);
    const result = isLiked ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id) : await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    if (result.error) { console.error(result.error); showToast(result.error.message); throw result.error; }
    setPostLikes(prev => isLiked ? prev.filter(l => l.post_id !== postId || l.user_id !== user.id) : [...prev, { post_id: postId, user_id: user.id, created_at: new Date().toISOString() }]);
    setQuestions(prev => prev.map(q => q.id === postId ? { ...q, likesCount: Math.max(0, q.likesCount + (isLiked ? -1 : 1)) } : q));
  };

  const handleToggleThreadSave = async (postId: string) => {
    if (!user.id) { showToast('Sign in to save discussions'); throw new Error('No user ID'); }
    const isSaved = savedPosts.some(s => s.post_id === postId && s.user_id === user.id);
    const result = isSaved ? await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id) : await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
    if (result.error) { console.error(result.error); showToast(result.error.message); throw result.error; }
    setSavedPosts(prev => isSaved ? prev.filter(s => s.post_id !== postId || s.user_id !== user.id) : [...prev, { post_id: postId, user_id: user.id, created_at: new Date().toISOString() }]);
    setQuestions(prev => prev.map(q => q.id === postId ? { ...q, saved: !isSaved } : q));
  };

  const handleToggleReplyLike = async (replyId: string) => {
    if (!user.id) { showToast('Sign in to like replies'); throw new Error('No user ID'); }
    const isLiked = postLikes.some(l => l.post_id === replyId && l.user_id === user.id);
    const result = isLiked ? await supabase.from('post_likes').delete().eq('post_id', replyId).eq('user_id', user.id) : await supabase.from('post_likes').insert({ post_id: replyId, user_id: user.id });
    if (result.error) { console.error(result.error); showToast(result.error.message); throw result.error; }
    setPostLikes(prev => isLiked ? prev.filter(l => l.post_id !== replyId || l.user_id !== user.id) : [...prev, { post_id: replyId, user_id: user.id, created_at: new Date().toISOString() }]);
    const updateReplies = (list: QuestionReply[]): QuestionReply[] => list.map(reply => reply.id === replyId ? { ...reply, likesCount: Math.max(0, (reply.likesCount || 0) + (isLiked ? -1 : 1)), userLiked: !isLiked } : { ...reply, replies: updateReplies(reply.replies || []) });
    setQuestions(prev => prev.map(q => ({ ...q, replies: updateReplies(q.replies || []) })));
  };

  const handleToggleReviewSave = (_reviewId: string) => {};

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
    setUser(prev => ({ ...prev, ...updated }));
    if (user?.id) {
      try {
        const { error } = await supabase.from('profiles').update({ name: updated.name, avatar_url: updated.avatar }).eq('id', user.id);
        if (error) throw error;
      } catch (error) {
        console.error('Failed to save profile update:', error);
        showToast('Failed to save to database');
      }
    }
  };

  const handleAddBook = async (newBookData: { title: string; author_name: string }) => {
    if (!user || !user.name) {
      showToast('You must be logged in to add a book');
      return;
    }
    const { data, error } = await supabase.from('books').insert({ title: newBookData.title, author_name: newBookData.author_name, language: 'en' }).select().single();
    if (error) {
      console.error('Failed to add book:', error);
      showToast('Could not add book');
      return;
    }
    setBooks(prev => [data as Book, ...prev]);
    showToast('Book added successfully!');
  };

  const handleUpdateBookStatus = (_bookId: string, _status: any, _userRating?: number, _currentPage?: number, _currentLocation?: string) => {};

  const handleAddBookmarkFromQuote = (quoteText: string, source: string, author: string) => {
    const initials = author.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'SP';
    const newBm: Bookmark = { id: `bm-${Date.now()}`, category: 'Patristic Quote', source, quote: quoteText, author, initials, isFavorite: true };
    setBookmarks((prev) => [newBm, ...prev]);
  };

  const handleAddQuestion = async (q: Question): Promise<void> => {
    if (!user.id) { showToast('Sign in to post a discussion'); throw new Error('No user ID'); }
    const { data, error } = await supabase.from('discussion_posts').insert({ author_id: user.id, parent_id: null, book_id: q.bookId ?? null, title: q.title, content: q.body }).select().single();
    if (error) { console.error(error); showToast(error.message); throw error; }
    setQuestions(prev => [mapPostToQuestion(data, postLikes, savedPosts, user.id), ...prev]);
  };

  const handleUpdateQuestion = async (id: string, updated: Partial<Question>): Promise<void> => {
    if (!user.id) { showToast('Sign in to edit discussions'); throw new Error('No user ID'); }
    const patch: { title?: string; content?: string } = {};
    if (updated.title !== undefined) patch.title = updated.title;
    if (updated.body !== undefined) patch.content = updated.body;
    const { error } = await supabase.from('discussion_posts').update(patch).eq('id', id);
    if (error) { console.error(error); showToast(error.message); throw error; }
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updated } : q));
  };

  const handleDeleteQuestion = async (id: string): Promise<void> => {
    if (!user.id) { showToast('Sign in to delete discussions'); throw new Error('No user ID'); }
    const { error } = await supabase.from('discussion_posts').delete().eq('id', id);
    if (error) { console.error(error); showToast(error.message); throw error; }
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleAddReply = async (questionId: string, replyText: string, parentReplyId?: string, replyToAuthor?: string): Promise<void> => {
    if (!user.id) { showToast('Sign in to reply'); throw new Error('No user ID'); }
    const { data, error } = await supabase.from('discussion_posts').insert({ author_id: user.id, parent_id: parentReplyId ?? questionId, book_id: null, title: null, content: replyText }).select().single();
    if (error) { console.error(error); showToast(error.message); throw error; }
    const newRep: QuestionReply = { id: data.id, author: user.name || 'Reader', authorAvatar: user.avatar || '', timeAgo: 'Just now', text: data.content, likesCount: 0, userLiked: false, replyToAuthor };
    
    const insertReplyRecursively = (list: QuestionReply[], targetId: string): { updated: QuestionReply[]; found: boolean } => {
      let found = false;
      const updated = list.map(item => {
        if (item.id === targetId) {
          found = true;
          return { ...item, replies: [...(item.replies || []), newRep] };
        }
        if (item.replies && item.replies.length > 0) {
          const res = insertReplyRecursively(item.replies, targetId);
          if (res.found) { found = true; return { ...item, replies: res.updated }; }
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

  const handleLoadThreadReplies = async (threadId: string): Promise<DiscussionPost[] | undefined> => {
    const { data, error } = await supabase.from('discussion_posts').select('*').eq('parent_id', threadId).order('created_at', { ascending: true });
    if (error) { console.error('Failed to load discussion replies:', error); showToast(error.message); return undefined; }
    return (data ?? []) as DiscussionPost[];
  };

  const handleAddComment = (c: DialecticComment) => {
    setColloquiumComments(prev => [...prev, c]);
  };
  
  const handleAddReview = async (data: Review | { bookTitle: string; bookAuthor: string; rating: number; quote: string; content: string }) => {
    if (!user.id) { showToast('You must be logged in'); throw new Error('No user ID'); }

    const bookTitle = 'bookTitle' in data ? data.bookTitle : data.title || '';
    let book = 'book_id' in data
      ? books.find(item => item.id === data.book_id)
      : books.find(item => item.title.trim().toLowerCase() === data.bookTitle.trim().toLowerCase() && item.author_name.trim().toLowerCase() === data.bookAuthor.trim().toLowerCase());

    if (!book) {
      if ('book_id' in data) throw new Error('Book for this review was not found');
      const { data: createdBook, error: bookError } = await supabase.from('books').insert({ title: data.bookTitle.trim(), author_name: data.bookAuthor.trim(), language: 'en' }).select('*').single();
      if (bookError) { console.error('Failed to find or create review book:', bookError); showToast('Could not find or create book'); throw bookError; }
      book = createdBook as Book;
      setBooks(prev => [...prev, book as Book]);
    }
    
    const { data: newReview, error } = await supabase.from('reviews').insert({ book_id: book.id, user_id: user.id, title: bookTitle.trim() || null, content: data.content, rating: data.rating, quote: data.quote || null }).select().single();

    if (error) { console.error('4. SUPABASE ERROR:', error); showToast('Database error: ' + error.message); throw error; }
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

  const handleAddBookmark = (b: Bookmark) => { setBookmarks(prev => [b, ...prev]); };
  const handleUpdateBookmark = (id: string, updated: Partial<Bookmark>) => { setBookmarks(prev => prev.map(b => b.id === id ? { ...b, ...updated } : b)); };
  const handleDeleteBookmark = (id: string) => { setBookmarks(prev => prev.filter(b => b.id !== id)); };
  const handleToggleBookmark = (id: string) => { setBookmarks(prev => prev.map(b => (b.id === id ? { ...b, isFavorite: !b.isFavorite } : b))); };

  const handleAuthenticated = async (_name: string, _email: string) => {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error) { console.error('Failed to get authenticated user:', error); return; }
    if (authUser) await loadProfile(authUser.id);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { console.error('Sign out failed:', error); showToast('Could not sign out'); return; }
    setUser(INITIAL_USER);
    setCurrentScreen('home');
    showToast('Signed out');
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user || !user.id) { showToast('You must be logged in'); return; }
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      setUser(prev => ({ ...prev, avatar: publicUrl }));
      showToast('Profile picture updated!');
    } catch (error: any) { console.error('Upload failed:', error); showToast('Failed to upload image'); }
  };

  return (
    <div className="min-h-screen bg-theme-app text-theme-body relative flex flex-col font-sans antialiased selection:bg-theme-accent-light selection:text-theme-accent transition-colors duration-200">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-theme-main text-theme-surface text-xs font-label-md rounded-full shadow-lg border border-theme-subtle/40 flex items-center gap-2 animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-theme-accent"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      <Header currentScreen={currentScreen} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} user={user} onOpenSearch={() => setIsSearchOpen(true)} onOpenAuth={() => setIsAuthOpen(true)} onSignOut={handleSignOut} theme={theme} onSetTheme={handleSetTheme} />

      <main className="flex-1 flex flex-col">
        {currentScreen === 'home' && (
          <HomeFeedView user={user} books={books} onUpdateUser={handleUpdateUser} onNavigate={(s) => { if (s === 'discussions') setTargetQuestionId(null); if (s === 'reviews') setTargetReviewId(null); setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onSelectBook={handleSelectBook} onOpenSeminar={handleOpenSeminar} onShowToast={showToast} onNavigateToDiscussion={handleNavigateToDiscussion} onNavigateToReview={handleNavigateToReview} />
        )}

        {currentScreen === 'library' && (
          <SavedView bookmarks={bookmarks} notes={notes} books={books} initialTab="library" onAddBookmark={handleAddBookmark} onUpdateBookmark={handleUpdateBookmark} onDeleteBookmark={handleDeleteBookmark} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} onUpdateBookStatus={(bId, status) => handleUpdateBookStatus(bId, status)} onSelectBook={handleSelectBook} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'discussions' && (
          <DiscussionsView questions={questions} currentUser={user} targetQuestionId={targetQuestionId} onClearTargetQuestion={() => setTargetQuestionId(null)} onAddQuestion={handleAddQuestion} onUpdateQuestion={handleUpdateQuestion} onDeleteQuestion={handleDeleteQuestion} onAddReply={handleAddReply} onToggleThreadLike={handleToggleThreadLike} onToggleThreadSave={handleToggleThreadSave} onToggleReplyLike={handleToggleReplyLike} onLoadThreadReplies={handleLoadThreadReplies} likedPostIds={new Set(postLikes.filter(l => l.user_id === user.id).map(l => l.post_id))} savedPostIds={new Set(savedPosts.filter(s => s.user_id === user.id).map(s => s.post_id))} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'colloquium' && (
          <BookDiscussionsDirectory books={books} onSelectBook={handleSelectBook} onOpenSeminar={handleOpenSeminar} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'book-detail' && books.length > 0 && (
          <BookDetailView book={books.find((b) => b.id === selectedBookId) || books[0]} questions={questions} notes={notes} reviews={reviews} currentUser={user} onAddNote={handleAddNote} onAddReview={handleAddReview} onUpdateBookStatus={handleUpdateBookStatus} onAddQuestion={handleAddQuestion} onAddReply={handleAddReply} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onOpenSeminar={handleOpenSeminar} onShowToast={showToast} />
        )}

        {currentScreen === 'seminar' && books.length > 0 && (
          <ColloquiumView book={books.find((b) => b.id === selectedBookId) || books[0]} comments={colloquiumComments} onAddComment={handleAddComment} onBack={() => { setCurrentScreen(previousScreen === 'seminar' ? 'colloquium' : previousScreen); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'paths' && (
          <PathsView paths={paths} isDetailView={false} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'path-detail' && (
          <PathsView paths={paths} isDetailView={true} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'reviews' && (
          <ReviewsView reviews={reviews} reviewLikes={reviewLikes} reviewComments={reviewComments} currentUser={user} targetReviewId={targetReviewId} onClearTargetReview={() => setTargetReviewId(null)} onAddReview={handleAddReview} onToggleLike={handleToggleReviewLike} onAddComment={handleAddReviewComment} onUpdateReview={handleUpdateReview} onDeleteReview={handleDeleteReview} onSelectBook={handleSelectBook} onSelectReview={handleSelectReview} onNavigate={(s) => { if (s === 'reviews') setTargetReviewId(null); if (s === 'discussions') setTargetQuestionId(null); setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'review-detail' && reviews.length > 0 && (
          <ReviewDetailView review={reviews.find((r) => r.id === (selectedReviewId || targetReviewId)) || reviews[0]} currentUser={user} comments={reviewComments.filter(comment => comment.review_id === (selectedReviewId || targetReviewId || reviews[0].id))} likes={reviewLikes.filter(like => like.review_id === (selectedReviewId || targetReviewId || reviews[0].id))} book={books.find((b) => b.id === (reviews.find((r) => r.id === (selectedReviewId || targetReviewId))?.book_id))} onBack={() => { setCurrentScreen('reviews'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onSelectBook={handleSelectBook} onToggleLike={handleToggleReviewLike} onAddComment={handleAddReviewComment} onToggleSave={handleToggleReviewSave} onShowToast={showToast} />
        )}

        {currentScreen === 'notes' && (
          <SavedView bookmarks={bookmarks} notes={notes} books={books} initialTab="notes" onAddBookmark={handleAddBookmark} onUpdateBookmark={handleUpdateBookmark} onDeleteBookmark={handleDeleteBookmark} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} onUpdateBookStatus={(bId, status) => handleUpdateBookStatus(bId, status)} onSelectBook={handleSelectBook} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'bookmarks' && (
          <SavedView bookmarks={bookmarks} notes={notes} books={books} initialTab="bookmarks" onAddBookmark={handleAddBookmark} onUpdateBookmark={handleUpdateBookmark} onDeleteBookmark={handleDeleteBookmark} onAddNote={handleAddNote} onUpdateNote={handleUpdateNote} onDeleteNote={handleDeleteNote} onUpdateBookStatus={(bId, status) => handleUpdateBookStatus(bId, status)} onSelectBook={handleSelectBook} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onShowToast={showToast} />
        )}

        {currentScreen === 'profile' && (
            <ProfileView user={user} onUpdateUser={handleUpdateUser} onAvatarUpload={handleAvatarUpload} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} onOpenAuth={() => setIsAuthOpen(true)} onSignOut={handleSignOut} onShowToast={showToast} theme={theme} onSetTheme={handleSetTheme} />
        )}
      </main>

      <BottomNav currentScreen={currentScreen} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} theme={theme} />

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} books={books} questions={questions} paths={paths} notes={notes} onNavigate={(s) => { setCurrentScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onAuthenticated={handleAuthenticated} onShowToast={showToast} />
    </div>
  );
};

export default App;