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
  | 'auth';

export type ReadingStatus = 'want-to-read' | 'currently-reading' | 'read' | 'dnf';

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

export interface Book {
  id: string;
  title: string;
  originalTitle?: string;
  author: string;
  authorEra?: string;
  authorBio?: string;
  category: string;
  categoryTag: string;
  progress: number; // percentage
  currentLocation: string;
  notesCount: number;
  circleCount: number;
  coverImage?: string;
  bgCode?: string;
  codexLabel?: string;
  era?: string;
  totalPages?: number;
  summary?: string;
  historicalContext?: string;
  
  // Goodreads-style Catalog Metrics & State
  rating: number; // e.g. 4.85
  ratingsCount: number; // e.g. 1840
  reviewsCount: number; // e.g. 246
  ratingBreakdown: { stars: number; count: number; percentage: number }[];
  readingStatus: ReadingStatus;
  userRating?: number; // 0 = unrated, 1-5 = stars given by current user
  userDateFinished?: string;
  currentPage?: number;
  
  // Scholarly Edition Details
  isbn?: string;
  clavisId?: string;
  originalLanguage?: string;
  translator?: string;
  publisher?: string;
  publishedYear?: string;
  editionFormat?: string;
  
  // Quotes & Related
  quotes?: BookQuote[];
  relatedBookIds?: string[];
  externalLinks?: ExternalLibraryLink[];
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

export interface ReadingPath {
  id: string;
  title: string;
  category: string;
  timeLeft: string;
  percentage: number;
  description: string;
  currentStepLabel: string;
  currentLectioLabel: string;
  totalSteps: number;
  completedSteps: number;
  nextStepLabel: string;
  lastReadNote?: string;
  stations: ReadingStation[];
  curator?: {
    name: string;
    title: string;
    avatar: string;
  };
}

export interface Review {
  id: string;
  bookId?: string;
  bookTitle: string;
  bookAuthor: string;
  tradition: 'Patristic' | 'Orthodox' | 'Scholastic' | 'Soteriology' | string;
  rating: number;
  reviewerName: string;
  reviewerAffiliation: string;
  reviewerAvatar: string;
  date: string;
  quote: string;
  citation: string;
  peerReviewed?: boolean;
  discussionCount: number;
  bookCover?: string;
  likesCount?: number;
  userLiked?: boolean;
  userSaved?: boolean;
  fullReview?: string;
  keyThemes?: string[];
  historicalContext?: string;
  chapterFocus?: string;
}

export interface Note {
  id: string;
  bookTitle: string;
  timeAgo: string;
  text: string;
  tag: string;
  location: string;
  accentColor?: string;
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
