import React, { useState, useMemo } from 'react';
import { Book, Note, Review, ScreenId, UserProfile, ReadingStatus, Question } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BookDetailViewProps {
  book: Book;
  questions?: Question[];
  notes?: Note[];
  reviews?: Review[];
  currentUser?: UserProfile;
  onAddNote?: (n: Note) => void;
  onAddReview?: (r: Review) => void;
  onUpdateBookStatus?: (
    bookId: string,
    status: ReadingStatus,
    userRating?: number,
    currentPage?: number,
    currentLocation?: string
  ) => void;
  onAddQuestion?: (q: Question) => void;
  onAddReply?: (questionId: string, replyText: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenSeminar?: (bookId?: string) => void;
  onShowToast: (msg: string) => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  notes = [],
  reviews = [],
  currentUser,
  onAddNote,
  onAddReview,
  onUpdateBookStatus,
  onNavigate,
  onOpenSeminar,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  // Book save state (bookmark)
  const [isBookSaved, setIsBookSaved] = useState(false);

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isWantModalOpen, setIsWantModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Form states: Log Reading
  const [logPage, setLogPage] = useState<number>(book.currentPage || Math.round(((book.progress || 0) / 100) * (book.totalPages || 100)) || 1);
  const [logLocation, setLogLocation] = useState<string>(book.currentLocation || '');

  // Form states: Want to Read remarks
  const [wantRemarks, setWantRemarks] = useState<string>('');

  // Form states: Add Note
  const [noteText, setNoteText] = useState('');
  const [noteLocation, setNoteLocation] = useState(book.currentLocation || '');
  const [noteTag, setNoteTag] = useState<'Marginal Annotation' | 'Lectio Divina' | 'Contemplative Insight' | 'Philosophical Note' | 'Study Note'>('Marginal Annotation');

  // Form states: Add Review
  const [revRating, setRevRating] = useState<number>(5);
  const [revBody, setRevBody] = useState('');
  const [revTradition, setRevTradition] = useState('Patristic');
  const [revCitation, setRevCitation] = useState(book.codexLabel || '');

  // Interactive star hover for rating
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Status flags
  const isCurrentlyReading = book.readingStatus === 'currently-reading';
  const isWantToRead = book.readingStatus === 'want-to-read';
  const isRead = book.readingStatus === 'read';

  // Filter notes specifically for this book
  const bookNotes = useMemo(() => {
    const bTitle = book.title.toLowerCase();
    return notes.filter((n) => {
      const nTitle = n.bookTitle.toLowerCase();
      return nTitle.includes(bTitle) || bTitle.includes(nTitle);
    });
  }, [notes, book.title]);

  // Filter reviews specifically for this book
  const bookReviews = useMemo(() => {
    const bTitle = book.title.toLowerCase();
    return reviews.filter((r) => {
      const rTitle = r.bookTitle.toLowerCase();
      return rTitle.includes(bTitle) || bTitle.includes(rTitle);
    });
  }, [reviews, book.title]);

  // Handlers
  const handleSaveReadingLog = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = Number(logPage) || 0;
    if (onUpdateBookStatus) {
      onUpdateBookStatus(book.id, 'currently-reading', book.userRating, pageNum, logLocation);
    }
    setIsLogModalOpen(false);
    onShowToast(`Reading progress updated: page ${pageNum}${logLocation ? ` in ${logLocation}` : ''}`);
  };

  const handleSaveWantToRead = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBookStatus) {
      onUpdateBookStatus(book.id, 'want-to-read', book.userRating, 0);
    }

    if (wantRemarks.trim() && onAddNote) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        bookTitle: book.title,
        timeAgo: 'Just now',
        text: wantRemarks.trim(),
        tag: 'Reading Intention',
        location: 'Want to Read Shelf',
        accentColor: '#693a30'
      };
      onAddNote(newNote);
    }

    setIsWantModalOpen(false);
    setWantRemarks('');
    onShowToast(`Saved "${book.title}" to your Want to Read shelf with remarks`);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    if (onAddNote) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        bookTitle: book.title,
        timeAgo: 'Just now',
        text: noteText.trim(),
        tag: noteTag,
        location: noteLocation.trim() || book.currentLocation || 'General Note',
        accentColor: '#466550'
      };
      onAddNote(newNote);
    }

    setNoteText('');
    setIsNoteModalOpen(false);
    onShowToast(`Note added to ${book.title}`);
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revBody.trim()) return;

    if (onAddReview) {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        bookTitle: book.title,
        bookAuthor: book.author,
        tradition: revTradition,
        rating: revRating,
        reviewerName: currentUser?.name || 'Scholar Inquirer',
        reviewerAffiliation: currentUser?.location || 'Oxford Fellowship',
        reviewerAvatar:
          currentUser?.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        date: 'Today',
        quote: revBody.trim(),
        citation: revCitation.trim() || 'Annotated Edition',
        peerReviewed: false,
        discussionCount: 0,
        bookCover: book.coverImage
      };
      onAddReview(newReview);
    }

    setRevBody('');
    setIsReviewModalOpen(false);
    onShowToast(`Scholarly appraisal published for ${book.title}`);
  };

  const handleRateBook = (stars: number) => {
    if (onUpdateBookStatus) {
      onUpdateBookStatus(book.id, 'read', stars);
    }
    onShowToast(`Rated ${book.title} ${stars} out of 5 stars`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      {/* Top Sub-Bar with Breadcrumb Navigation */}
      <div className="sticky top-16 z-30 bg-theme-surface border-b border-theme shadow-xs">
        <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => onNavigate('colloquium')}
              className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full bg-theme-subtle hover:bg-theme-muted text-theme-main transition-colors cursor-pointer"
              aria-label={isAmharic ? 'ወደ የመጽሐፍ ውይይቶች ማውጫ ተመለስ' : 'Return to Book Discussions Directory'}
              title={isAmharic ? 'ወደ የመጽሐፍ ውይይቶች ማውጫ ተመለስ' : 'Return to Book Discussions Directory'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-[10px] uppercase text-theme-accent tracking-widest truncate font-semibold">
                {isAmharic ? 'የጥራዝ ዝርዝር' : 'Volume Details'}
              </span>
              <span className="font-serif text-[14px] sm:text-[15px] leading-tight text-theme-main font-bold truncate">
                {book.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setIsBookSaved(!isBookSaved);
                onShowToast(isBookSaved ? (isAmharic ? 'ከተቀመጡ ጥራዞች ተሰርዟል' : 'Removed from saved volumes') : (isAmharic ? 'ጥራዙ በምልክቶች ተቀምጧል' : 'Volume saved to bookmarks'));
              }}
              className={`min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                isBookSaved ? 'text-theme-gold bg-theme-gold/10' : 'text-theme-muted hover:bg-theme-subtle'
              }`}
              aria-label={isAmharic ? 'ይህን ጥራዝ ምልክት አድርግ' : 'Bookmark this volume'}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: isBookSaved ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>

            <button
              onClick={() => onNavigate('library')}
              className="text-xs font-serif text-theme-muted hover:text-theme-main transition-colors px-2.5 py-1.5 rounded-lg hover:bg-theme-subtle hidden sm:flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">menu_book</span>
              <span>{isAmharic ? 'ቤተ-መጻሕፍት' : 'Library'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* ========================================================================= */}
        {/* 1. BOOK OVERVIEW CARD                                                     */}
        {/* ========================================================================= */}
        <section className="bg-theme-surface rounded-xl border border-theme p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 items-start">
            {/* Cover image */}
            <div className="w-24 h-34 sm:w-28 sm:h-40 rounded-lg overflow-hidden flex-shrink-0 bg-theme-subtle border border-theme shadow-md relative mx-auto sm:mx-0">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
              {book.codexLabel && (
                <span className="absolute bottom-0 inset-x-0 text-white text-[10px] text-center font-serif py-0.5 tracking-wider truncate drop-shadow-xs px-1 z-10">
                  {book.codexLabel}
                </span>
              )}
            </div>

            {/* Book metadata & summary */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded border border-theme whitespace-nowrap">
                  {book.categoryTag || book.category || 'Patristic'}
                </span>
                <span className="text-xs text-theme-muted whitespace-nowrap">{book.era}</span>

                {/* Status Badges */}
                {isCurrentlyReading && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded border border-theme-accent/20 whitespace-nowrap flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                    <span>{isAmharic ? `በማንበብ ላይ · ${book.progress || 0}%` : `Actively Reading · ${book.progress || 0}%`}</span>
                  </span>
                )}

                {isWantToRead && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                    {isAmharic ? 'በTBR መደርደሪያ ላይ' : 'In Want to Read Shelf'}
                  </span>
                )}

                {isRead && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded border border-theme whitespace-nowrap flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    <span>{isAmharic ? 'የተጠናቀቀ ንባብ' : 'Completed Reading'}</span>
                  </span>
                )}
              </div>

              <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-tight">
                {book.title}
              </h1>
              {book.originalTitle && (
                <p className="text-xs sm:text-sm font-serif italic text-theme-muted mt-1">
                  «{book.originalTitle}»
                </p>
              )}
              <p className="text-sm text-theme-body font-medium mt-1.5">
                {isAmharic ? 'ደራሲ፡ ' : 'By '}<span className="text-theme-main font-semibold">{book.author}</span>
                {book.authorEra && <span className="text-theme-muted font-normal text-xs"> ({book.authorEra})</span>}
              </p>

              {book.summary && (
                <p className="text-sm text-theme-body mt-4 leading-relaxed max-w-[70ch]">
                  {book.summary}
                </p>
              )}

              {/* Reading Progress Indicator if actively reading */}
              {isCurrentlyReading && (
                <div className="mt-5 pt-4 border-t border-theme/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-theme-muted">
                    <span className="flex items-center gap-1.5 text-theme-main font-medium">
                      <span className="material-symbols-outlined text-[16px] text-theme-accent">bookmark</span>
                      <span>{isAmharic ? 'አሁን፡ ' : 'Current: '}{book.currentLocation || (isAmharic ? 'በሂደት ላይ' : 'In progress')}</span>
                      {book.currentPage && <span>· {isAmharic ? `ገጽ ${book.currentPage} / ${book.totalPages || 100}` : `Page ${book.currentPage} / ${book.totalPages || 100}`}</span>}
                    </span>
                    <span className="font-bold text-theme-main">
                      {book.progress || 0}% {isAmharic ? 'ተጠናቋል' : 'complete'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-theme-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-theme-accent rounded-full transition-all duration-300"
                      style={{ width: `${book.progress || 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Scholar Stats & Details */}
              <div className="mt-5 pt-4 border-t border-theme flex flex-wrap items-center gap-4 text-xs text-theme-muted">
                <span className="flex items-center gap-1.5 text-theme-gold">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                  <strong className="text-theme-main font-semibold">{book.rating || 4.8}</strong> {isAmharic ? 'የካታሎግ ደረጃ' : 'catalog rating'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-theme-accent">edit_note</span>
                  <strong className="text-theme-main font-semibold">{bookNotes.length}</strong> {isAmharic ? 'የግል ማስታወሻዎች' : 'personal notes'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-theme-accent">rate_review</span>
                  <strong className="text-theme-main font-semibold">{bookReviews.length}</strong> {isAmharic ? 'ግምገማዎች' : 'reviews'}
                </span>
                {book.totalPages && (
                  <>
                    <span>·</span>
                    <span>{book.totalPages} {isAmharic ? 'ገጾች' : 'pages'}</span>
                  </>
                )}
                {book.translator && (
                  <>
                    <span>·</span>
                    <span className="truncate max-w-[220px]" title={book.translator}>
                      Tr. {book.translator}
                    </span>
                  </>
                )}
              </div>

              {/* ========================================================================= */}
              {/* DYNAMIC ACTION BUTTONS (Based on Reading Status)                          */}
              {/* ========================================================================= */}
              <div className="mt-5 pt-4 border-t border-theme flex flex-wrap items-center gap-3">
                {/* 1. If currently reading: Show Log Reading button */}
                {isCurrentlyReading && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsLogModalOpen(true)}
                      className="h-10 px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 hover:bg-stone-700 dark:hover:bg-stone-600 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">menu_book</span>
                      <span>{isAmharic ? 'ንባብ መዝግብ' : 'Log Reading'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateBookStatus) {
                          onUpdateBookStatus(book.id, 'read', book.userRating || 5);
                        }
                        onShowToast(`Congratulations! Marked "${book.title}" as completed.`);
                      }}
                      className="h-10 px-3.5 py-2 rounded-lg bg-theme-surface border border-theme text-theme-main hover:bg-theme-subtle text-xs sm:text-sm font-serif font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[17px] text-theme-accent">check_circle</span>
                      <span>{isAmharic ? 'እንደተጠናቀቀ ምልክት አድርግ' : 'Mark as Finished'}</span>
                    </button>
                  </>
                )}

                {/* 2. If NOT currently reading: Show Save to Library as Want to Read with remarks */}
                {!isCurrentlyReading && !isRead && (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsWantModalOpen(true)}
                      className="h-10 px-4 py-2 rounded-lg bg-theme-surface border-2 border-theme-accent text-theme-accent hover:bg-theme-accent hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                      <span>{isAmharic ? 'ወደ TBR አስቀምጥ' : 'Save to Library as Want to Read'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateBookStatus) {
                          onUpdateBookStatus(book.id, 'currently-reading', book.userRating, 1);
                        }
                        onShowToast(`Started reading "${book.title}"`);
                      }}
                      className="h-10 px-3.5 py-2 rounded-lg bg-theme-surface border border-theme text-theme-main hover:bg-theme-subtle text-xs sm:text-sm font-serif font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[17px] text-theme-accent">play_arrow</span>
                      <span>{isAmharic ? 'ንባብ ጀምር' : 'Start Reading'}</span>
                    </button>
                  </>
                )}

                {/* 3. Rating if finished reading */}
                {isRead && (
                  <div className="flex flex-wrap items-center gap-3 bg-theme-subtle/70 px-3.5 py-2 rounded-xl border border-theme">
                    <span className="text-xs font-serif font-semibold text-theme-main flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-theme-accent">task_alt</span>
                      <span>{isAmharic ? 'የእርስዎ ደረጃ:' : 'Your Rating:'}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => handleRateBook(star)}
                          className="p-0.5 text-theme-gold hover:scale-125 transition-transform cursor-pointer"
                          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <span
                            className="material-symbols-outlined text-[22px]"
                            style={{
                              fontVariationSettings:
                                (hoverRating || book.userRating || 0) >= star ? "'FILL' 1" : "'FILL' 0"
                            }}
                          >
                            star
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-serif text-theme-muted ml-1">
                      {book.userRating ? `(${book.userRating}/5)` : (isAmharic ? '(ደረጃ ይስጡ)' : '(Tap to rate)')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SEMINAR & DISCUSSION THREAD LINK ("enter seminal link is enough")      */}
        {/* ========================================================================= */}
        <section
          id="volume-seminar-link"
          aria-label={isAmharic ? 'የመጽሐፍ ውይይት እና ሴሚናር' : 'Discussion Thread and Seminar'}
          onClick={() => {
            if (onOpenSeminar) {
              onOpenSeminar(book.id);
            } else {
              onNavigate('seminar');
            }
          }}
          className="bg-theme-surface rounded-xl border border-theme p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-theme-accent/50 cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-theme-accent/10 border border-theme-accent/25 flex items-center justify-center text-theme-accent flex-shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded border border-theme">
                  {isAmharic ? 'የመጽሐፍ ውይይት' : 'Colloquium'}
                </span>
                <span className="text-xs text-theme-muted font-serif italic">
                  {isAmharic ? 'የሴሚናር ክፍል' : 'Dialectic Seminar Room'}
                </span>
              </div>
              <h2 className="font-serif text-base sm:text-lg font-bold text-theme-main mt-1">
                {book.title} {isAmharic ? 'የውይይት መድረክ' : 'Discussion Thread'}
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted mt-0.5 leading-relaxed max-w-xl">
                {isAmharic 
                  ? 'ስለዚህ ጥራዝ ከምሁራን እና አንባቢያን ጋር በጥልቀት ለመወያየት ወደ ሴሚናር ክፍሉ ይግቡ።' 
                  : 'Enter the formal colloquium seminar and scholarly discussion thread for this treatise with monastic fellows and university scholars.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="enter-seminar-room-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenSeminar) {
                onOpenSeminar(book.id);
              } else {
                onNavigate('seminar');
              }
            }}
            className="whitespace-nowrap px-4 py-2.5 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 hover:bg-stone-700 dark:hover:bg-stone-600 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs self-stretch sm:self-auto justify-center"
          >
            <span>{isAmharic ? 'የሴሚናር ክፍል' : 'Seminar Room'}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 3. BOOK NOTES (Specifically grouped under this book)                      */}
        {/* ========================================================================= */}
        <section
          id="volume-notes-section"
          aria-label="Book Notes"
          className="bg-theme-surface rounded-xl border border-theme p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-lg font-bold text-theme-main">
                  {isAmharic ? `የ${book.title} ማስታወሻዎች` : `Notes on ${book.title}`}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-subtle border border-theme text-theme-accent">
                  {bookNotes.length}
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5 font-serif">
                {isAmharic 
                  ? 'የግል ማስታወሻዎች፣ የምዕራፍ ጥቅሶች እና የማሰላሰያ ሃሳቦች' 
                  : 'Personal reading notes, chapter citations, and reflections specifically grouped under this volume'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNoteModalOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-theme-surface border-2 border-theme-accent text-theme-accent hover:bg-theme-accent hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>{isAmharic ? 'ማስታወሻ ጨምር' : 'Add Note'}</span>
            </button>
          </div>

          {/* Notes List */}
          {bookNotes.length === 0 ? (
            <div className="text-center py-10 px-4 bg-theme-subtle/50 rounded-xl border border-theme/60">
              <span className="material-symbols-outlined text-4xl text-theme-subtle mb-2">edit_note</span>
              <p className="font-serif font-bold text-theme-main text-sm">
                {isAmharic ? 'ለዚህ ጥራዝ የተመዘገበ ማስታወሻ የለም' : 'No notes recorded for this volume yet'}
              </p>
              <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto font-serif">
                {isAmharic ? `የ${book.title} የኅዳግ ማስታወሻዎችን ወይም ማሰላሰያዎችን እዚህ ይመዝግቡ።` : `Capture your marginal annotations, favorite passages, or study notes for ${book.title}.`}
              </p>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(true)}
                className="mt-3.5 px-3.5 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>{isAmharic ? 'የመጀመሪያውን ማስታወሻ ጨምር' : 'Add First Note'}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {bookNotes.map((note) => (
                <article
                  key={note.id}
                  className="p-4 rounded-xl bg-theme-subtle/40 border border-theme space-y-2 hover:border-theme-accent/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-theme-main font-serif flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-theme-accent">bookmark</span>
                        <span>{note.location || 'General'}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-2 py-0.2 rounded border border-theme">
                        {note.tag}
                      </span>
                    </div>
                    <span className="text-theme-muted text-[11px] font-sans">{note.timeAgo}</span>
                  </div>

                  <p className="font-serif text-xs sm:text-sm text-theme-body leading-relaxed pl-2 border-l-2 border-theme-accent/50 italic">
                    {note.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 4. REVIEWS & SCHOLARLY APPRAISALS (View & Add Reviews)                    */}
        {/* ========================================================================= */}
        <section
          id="volume-reviews-section"
          aria-label="Reviews and Scholarly Appraisals"
          className="bg-theme-surface rounded-xl border border-theme p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-theme">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-lg font-bold text-theme-main">
                  {isAmharic ? 'መጽሐፍ ዳሰሳዎች እና አስተያየቶች' : 'Reviews & Scholarly Appraisals'}
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-subtle border border-theme text-theme-accent">
                  {bookReviews.length}
                </span>
              </div>
              <p className="text-xs text-theme-muted mt-0.5 font-serif">
                {isAmharic 
                  ? 'የአቻ አንባቢዎች መጽሐፍ ዳሰሳዎች እና ሂሶች' 
                  : 'Peer assessments, textual evaluations, and critical appraisals of this edition'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="h-9 px-3.5 rounded-lg bg-theme-surface border-2 border-theme-accent text-theme-accent hover:bg-theme-accent hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">rate_review</span>
              <span>{isAmharic ? 'መጽሐፍ ዳሰሳ ጨምር' : 'Add Review'}</span>
            </button>
          </div>

          {/* Reviews List */}
          {bookReviews.length === 0 ? (
            <div className="text-center py-10 px-4 bg-theme-subtle/50 rounded-xl border border-theme/60">
              <span className="material-symbols-outlined text-4xl text-theme-subtle mb-2">rate_review</span>
              <p className="font-serif font-bold text-theme-main text-sm">
                {isAmharic ? 'በዚህ መጽሐፍ ላይ እስካሁን ምንም መጽሐፍ ዳሰሳ የለም' : 'No reviews on this volume yet'}
              </p>
              <p className="text-xs text-theme-muted mt-1 max-w-sm mx-auto font-serif">
                {isAmharic ? `ስለ ${book.title} የመጀመሪያውን መጽሐፍ ዳሰሳ ወይም ማሰላሰያ ይጻፉ።` : `Be the first to leave a scholarly appraisal or reader reflection on ${book.title}.`}
              </p>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="mt-3.5 px-3.5 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                <span>{isAmharic ? 'የመጀመሪያውን መጽሐፍ ዳሰሳ ጻፍ' : 'Write First Review'}</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-theme">
              {bookReviews.map((rev) => (
                <article key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.reviewerAvatar}
                        alt={rev.reviewerName}
                        className="w-8 h-8 rounded-full object-cover border border-theme bg-theme-subtle"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif text-xs font-bold text-theme-main">
                            {rev.reviewerName}
                          </span>
                          {rev.peerReviewed && (
                            <span className="text-[9px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent/10 px-1.5 py-0.2 rounded border border-theme-accent/20">
                              {isAmharic ? 'በአቻ የተገመገመ' : 'Peer Reviewed'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-theme-muted font-serif">
                          {rev.reviewerAffiliation} · {rev.date}
                        </p>
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-0.5 text-theme-gold shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className="material-symbols-outlined text-[15px]"
                          style={{
                            fontVariationSettings: rev.rating >= star ? "'FILL' 1" : "'FILL' 0"
                          }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Review Body */}
                  <blockquote className="font-serif text-xs sm:text-sm text-theme-body leading-relaxed pl-3 border-l-2 border-theme-accent italic">
                    {rev.quote}
                  </blockquote>

                  {/* Citation / Meta */}
                  <div className="flex items-center justify-between text-[11px] text-theme-muted font-serif pt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-theme-accent">menu_book</span>
                      <span>{rev.citation}</span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-subtle px-2 py-0.5 rounded border border-theme">
                      {rev.tradition}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS                                                                 */}
      {/* ========================================================================= */}

      {/* Modal A: Log Reading Progress */}
      {isLogModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsLogModalOpen(false)}
        >
          <div
            className="bg-theme-surface rounded-xl border border-theme max-w-md w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-theme-accent block">
                  {isAmharic ? 'የንባብ መዝገብ' : 'Lectio Log'}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
                  {isAmharic ? 'የንባብ ሂደትን አዘምን' : 'Update Reading Progress'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveReadingLog} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? `የተነበበው ገጽ (ከ${book.totalPages || 100} ገጾች ውስጥ)` : `Current Page Read (out of ${book.totalPages || 100} pages)`}
                </label>
                <input
                  type="number"
                  min="1"
                  max={book.totalPages || 2000}
                  value={logPage}
                  onChange={(e) => setLogPage(Number(e.target.value))}
                  required
                  className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main text-sm focus:outline-hidden focus:border-theme-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'የአሁኑ ምዕራፍ ወይም ክፍል' : 'Current Chapter or Section'}
                </label>
                <input
                  type="text"
                  placeholder={isAmharic ? 'ለምሳሌ፡ መጽሐፍ ፰፡ በሚላን የአትክልት ስፍራ' : 'e.g. Book VIII: The Garden at Milan'}
                  value={logLocation}
                  onChange={(e) => setLogLocation(e.target.value)}
                  className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main text-sm focus:outline-hidden focus:border-theme-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme mt-1">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 hover:bg-stone-700 dark:hover:bg-stone-600 font-semibold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isAmharic ? 'ሂደት አስቀምጥ' : 'Save Progress'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal B: Save to Want to Read with Specific Remarks */}
      {isWantModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsWantModalOpen(false)}
        >
          <div
            className="bg-theme-surface rounded-xl border border-theme max-w-md w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-theme-accent block">
                  {isAmharic ? 'የቤተ-መጻሕፍት መደርደሪያ' : 'Library Shelf'}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
                  {isAmharic ? 'ወደ TBR ዝርዝር አስቀምጥ' : 'Save to Want to Read List'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWantModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveWantToRead} className="flex flex-col gap-3.5 text-xs">
              <p className="text-theme-muted font-serif leading-relaxed">
                {isAmharic 
                  ? `«${book.title}»ን ወደ ንባብ ዕቅድዎ ከማስታወሻዎች እና ግቦች ጋር ያክሉ።`
                  : `Add ${book.title} to your personal library shelf with any specific study notes, recommendations, or reading goals.`}
              </p>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'ልዩ አስተያየቶች እና የንባብ ማስታወሻዎች (አማራጭ)' : 'Specific Remarks & Reading Notes (Optional)'}
                </label>
                <textarea
                  rows={4}
                  placeholder={isAmharic ? 'ለምሳሌ፡ ለሥላሴ ሴሚናር የተጠቆመ፤ ትርጉሙን ለማነጻጸር...' : "e.g. Recommended by Father Vance for the Trinity seminar; want to compare Chadwick's translation with Outler..."}
                  value={wantRemarks}
                  onChange={(e) => setWantRemarks(e.target.value)}
                  className="bg-theme-subtle border border-theme rounded-lg p-3 text-theme-main placeholder:text-theme-subtle focus:outline-hidden focus:border-theme-accent resize-none text-xs font-serif"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme mt-1">
                <button
                  type="button"
                  onClick={() => setIsWantModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-theme-accent text-white font-semibold hover:opacity-90 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">bookmark_add</span>
                  <span>{isAmharic ? 'ወደ ቤተ-መጻሕፍት አስቀምጥ' : 'Save to Library'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal C: Add Book Note */}
      {isNoteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsNoteModalOpen(false)}
        >
          <div
            className="bg-theme-surface rounded-xl border border-theme max-w-lg w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-theme-accent block">
                  {isAmharic ? 'የመጽሐፍ ማስታወሻ' : 'Book Notes'}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
                  {isAmharic ? `ለ${book.title} ማስታወሻ ጨምር` : `Add Note for ${book.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="flex flex-col gap-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-theme-main font-serif">
                    {isAmharic ? 'የምዕራፍ / የጥቅስ ማጣቀሻ' : 'Chapter / Passage Citation'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Book VIII, Ch. 12 or §4.2"
                    value={noteLocation}
                    onChange={(e) => setNoteLocation(e.target.value)}
                    className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main focus:outline-hidden focus:border-theme-accent font-serif"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-theme-main font-serif">
                    {isAmharic ? 'የምድብ መለያ' : 'Category Tag'}
                  </label>
                  <select
                    value={noteTag}
                    onChange={(e) => setNoteTag(e.target.value as any)}
                    className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main focus:outline-hidden focus:border-theme-accent cursor-pointer font-serif"
                  >
                    <option value="Marginal Annotation">{isAmharic ? 'የኅዳግ ማስታወሻ' : 'Marginal Annotation'}</option>
                    <option value="Lectio Divina">Lectio Divina</option>
                    <option value="Contemplative Insight">{isAmharic ? 'የማሰላሰያ ግንዛቤ' : 'Contemplative Insight'}</option>
                    <option value="Philosophical Note">{isAmharic ? 'የፍልስፍና ማስታወሻ' : 'Philosophical Note'}</option>
                    <option value="Study Note">{isAmharic ? 'የጥናት ማስታወሻ' : 'Study Note'}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'የማስታወሻው ይዘት እና ማሰላሰያ' : 'Note Content & Reflection'}
                </label>
                <textarea
                  rows={4}
                  placeholder={isAmharic ? 'የትርጉም ግንዛቤዎን፣ መንፈሳዊ ማሰላሰያዎን ወይም አስተያየትዎን እዚህ ይመዝግቡ...' : 'Record your translation insight, theological meditation, or textual commentary...'}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                  className="bg-theme-subtle border border-theme rounded-lg p-3 text-theme-main focus:outline-hidden focus:border-theme-accent resize-none font-serif leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme mt-1">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="px-4 py-2 rounded-lg bg-theme-accent text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isAmharic ? 'ማስታወሻ አስቀምጥ' : 'Save Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal D: Add Review */}
      {isReviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div
            className="bg-theme-surface rounded-xl border border-theme max-w-lg w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-theme-accent block">
                  {isAmharic ? 'መጽሐፍ ዳሰሳ' : 'Peer Appraisal'}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
                  {isAmharic ? `ለ${book.title} መጽሐፍ ዳሰሳ ጻፍ` : `Write Review for ${book.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="flex flex-col gap-3.5 text-xs">
              {/* Rating selection */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'የእርስዎ ደረጃ' : 'Your Rating'}
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRevRating(star)}
                      className="p-1 text-theme-gold hover:scale-125 transition-transform cursor-pointer"
                      title={`${star} star`}
                    >
                      <span
                        className="material-symbols-outlined text-[24px]"
                        style={{ fontVariationSettings: revRating >= star ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                  <span className="text-xs text-theme-muted ml-2 font-serif">
                    {revRating} {isAmharic ? 'ከ 5 ኮከቦች' : 'out of 5 stars'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-theme-main font-serif">
                    {isAmharic ? 'የትምህርት ትውፊት / ምድብ' : 'Theological Tradition / Category'}
                  </label>
                  <select
                    value={revTradition}
                    onChange={(e) => setRevTradition(e.target.value)}
                    className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main focus:outline-hidden focus:border-theme-accent cursor-pointer font-serif"
                  >
                    <option value="Patristic">{isAmharic ? 'ፓትሪስቲክ (የአበው)' : 'Patristic'}</option>
                    <option value="Orthodox">{isAmharic ? 'ኦርቶዶክስ' : 'Orthodox'}</option>
                    <option value="Scholastic">{isAmharic ? 'ስኮላስቲክ' : 'Scholastic'}</option>
                    <option value="Soteriology">{isAmharic ? 'ስነ-ድህነት' : 'Soteriology'}</option>
                    <option value="Monastic">{isAmharic ? 'ገዳማዊ' : 'Monastic'}</option>
                    <option value="Philosophy">{isAmharic ? 'ፍልስፍና' : 'Philosophy'}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-theme-main font-serif">
                    {isAmharic ? 'የተነበበው እትም / ምንጭ' : 'Citation / Edition Tested'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chadwick translation (OUP)"
                    value={revCitation}
                    onChange={(e) => setRevCitation(e.target.value)}
                    className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main focus:outline-hidden focus:border-theme-accent font-serif"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'የመጽሐፍ ዳሰሳ እና አስተያየት' : 'Appraisal & Critical Review'}
                </label>
                <textarea
                  rows={4}
                  placeholder={isAmharic ? 'የዚህን መጽሐፍ ወይም እትም የጽሑፍ ጥልቀት፣ ጠቀሜታ እና ጥራት ይገምግሙ...' : 'Evaluate the textual depth, theological significance, and quality of this treatise or edition...'}
                  value={revBody}
                  onChange={(e) => setRevBody(e.target.value)}
                  required
                  className="bg-theme-subtle border border-theme rounded-lg p-3 text-theme-main focus:outline-hidden focus:border-theme-accent resize-none font-serif leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-theme mt-1">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                >
                  {isAmharic ? 'ሰርዝ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!revBody.trim()}
                  className="px-4 py-2 rounded-lg bg-theme-accent text-white font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{isAmharic ? 'መጽሐፍ ዳሰሳ ለጥፍ' : 'Publish Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
