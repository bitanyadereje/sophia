// ============================================================
// DB TYPES
// These match the actual Supabase schema.
// If you change the database, update these too.
// ============================================================

export type ReadingStatus = 'to_be_read' | 'reading' | 'finished' | 'dnf';

export type VerificationStatus = 'unverified' | 'verified' | 'rejected';

export type PathStatus = 'pending' | 'approved' | 'rejected';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// ---------- profiles ----------
export interface Profile {
  id: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- books ----------
export interface Book {
  codexLabel: string;
  id: string;
  title: string;
  author_name: string;
  description: string | null;
  cover_url: string | null;
  language: string;
  page_count: number | null;
  verification_status: VerificationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- traditions ----------
export interface Tradition {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BookTradition {
  book_id: string;
  tradition_id: string;
}

// ---------- tags ----------
export interface Tag {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  created_at: string;
}

export interface BookTag {
  book_id: string;
  tag_id: string;
}

export interface DiscussionPostTag {
  post_id: string;
  tag_id: string;
}

// ---------- discussion_posts ----------
export interface DiscussionPost {
  id: string;
  author_id: string | null;
  parent_id: string | null;
  book_id: string | null;
  title: string | null;
  content: string;
  deleted_at: string | null;
  is_moderated: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

// ---------- reviews ----------
export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  title: string | null;
  content: string;
  rating: number;
  quote: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewLike {
  review_id: string;
  user_id: string;
  created_at: string;
}

// ---------- library_books ----------
export interface LibraryBook {
  user_id: string;
  book_id: string;
  status: ReadingStatus;
  pages_read: number;
  created_at: string;
  updated_at: string;
}

// ---------- notes ----------
export interface Note {
  id: string;
  user_id: string;
  book_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// ---------- reading_paths ----------
export interface ReadingPath {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  topic: string;
  difficulty: Difficulty | null;
  status: PathStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingPathBook {
  reading_path_id: string;
  book_id: string;
  position: number;
  note: string | null;
}

export interface SavedPath {
  user_id: string;
  path_id: string;
  created_at: string;
}

export interface SavedReview {
  user_id: string;
  review_id: string;
  created_at: string;
}

export interface SavedPost {
  user_id: string;
  post_id: string;
  created_at: string;
}

// ============================================================
// UI-ONLY TYPES
// Not in the database. Used only by the frontend.
// ============================================================

export type ThemeMode = 'light' | 'navy' | 'burgundy' | 'gray' | 'brown' | 'vintage' | 'dark' | 'cream';

export type ScreenId =
  | 'home'
  | 'library'
  | 'discussions'
  | 'colloquium'
  | 'book-detail'
  | 'seminar'
  | 'paths'
  | 'path-detail'
  | 'reviews'
  | 'review-detail'
  | 'notes'
  | 'profile'
  | 'auth'
  | 'bookmarks';

// ---------- Legacy shapes used by existing UI components ----------
// These will be phased out. If you're writing new code, use the DB types above.

export interface BookQuote {
  id: string;
  quote: string;
  citation: string;
  likes: number;
  isFavorited?: boolean;
}

export interface ExternalLibraryLink {
  label: string;
  type: 'worldcat' | 'archive' | 'academic' | 'ccel';
  url: string;
  description: string;
}

export interface DialecticComment {
  id: string;
  author: string;
  role: string;
  timeLocation: string;
  thesisTag?: string;
  avatar: string;
  content: string[];
  referenceFolio?: string;
  assents: number;
  userAssented?: boolean;
  replies?: DialecticComment[];
}

export interface QuestionReply {
  id: string;
  author: string;
  authorAvatar?: string;
  authorTitle?: string;
  timeAgo: string;
  text: string;
  likesCount?: number;
  userLiked?: boolean;
  replyToAuthor?: string;
  thesisTag?: string;
  replies?: QuestionReply[];
}

export interface Question {
  id: string;
  author: string;
  authorAvatar: string;
  timeAgo: string;
  topic: 'Early Texts' | 'Philosophy' | 'Reflections' | 'History';
  title: string;
  body: string;
  repliesCount: number;
  likesCount: number;
  saved?: boolean;
  replies?: QuestionReply[];
  bookId?: string;
  bookTitle?: string;
  chapter?: string;
}

export interface ReadingStation {
  id: number;
  numeral: string;
  title: string;
  authorEra: string;
  weeksLabel: string;
  image?: string;
  publisher?: string;
  pages?: string;
  quote: string;
  completed: boolean;
  status: 'active' | 'scheduled' | 'locked';
  colloquiumCount?: number;
  reviewsCount?: number;
}

export interface Bookmark {
  id: string;
  category: string;
  source: string;
  quote: string;
  author: string;
  initials: string;
  isFavorite: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  location: string;
  memberSince: string;
  avatar: string;
  booksRead: number;
  notesCount: number;
  dayStreak: number;
  goalTarget: number;
  topics: string[];
  themePreference?: ThemeMode;
}