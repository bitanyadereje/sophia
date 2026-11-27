import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Book, Note, Review, ScreenId, UserProfile, ReadingStatus, Question } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { NotesView } from '../../notes/components/NotesView';
import { loadNotes } from '../../notes/notes.service';
import { loadUserLibraryBook, removeBookFromLibrary, updateBookStatus } from '../../library/library.service';
import { BookCover } from './BookCover';

interface BookDetailViewProps {
  book: Book;
  questions?: Question[];
  reviews?: Review[];
  currentUser?: UserProfile;
  onAddNote?: (n: Note) => void;
  onAddReview?: (reviewData: any) => void;
  onAddQuestion?: (q: Question) => void;
  onAddReply?: (questionId: string, replyText: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onBack?: () => void;
  onOpenSeminar?: (bookId?: string) => void;
  onShowToast: (msg: string) => void;
}

const STATUS_OPTIONS: { value: ReadingStatus; en: string; am: string; icon: string }[] = [
  { value: 'to_be_read', en: 'Want to read', am: 'ማንበብ እፈልጋለሁ', icon: 'bookmark' },
  { value: 'reading', en: 'Reading', am: 'በማንበብ ላይ', icon: 'auto_stories' },
  { value: 'finished', en: 'Finished', am: 'ተጠናቋል', icon: 'check_circle' },
  { value: 'dnf', en: 'Did not finish', am: 'አልጨረስኩም', icon: 'block' },
];

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  reviews = [],
  currentUser,
  onAddNote,
  onAddReview,
  onNavigate,
  onBack,
  onOpenSeminar,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const queryClient = useQueryClient();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'status' | null>(null);

  const [logPage, setLogPage] = useState<number>(1);
  const [logLocation, setLogLocation] = useState<string>('');

  const [noteText, setNoteText] = useState('');
  const [noteLocation, setNoteLocation] = useState('');

  const [revRating, setRevRating] = useState<number>(5);
  const [revBody, setRevBody] = useState('');
  const [revQuote, setRevQuote] = useState('');

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', currentUser?.id ?? null, book.id],
    queryFn: () => loadNotes(currentUser!.id, book.id),
    enabled: Boolean(currentUser?.id),
  });
  const bookNotes = notes;

  const { data: libraryBook } = useQuery({
    queryKey: ['library', currentUser?.id, book.id],
    queryFn: () => loadUserLibraryBook(currentUser!.id, book.id),
    enabled: Boolean(currentUser?.id),
  });
  const libraryStatusMutation = useMutation({
    mutationFn: (values: { status: ReadingStatus; pagesRead?: number }) =>
      updateBookStatus(currentUser!.id, book.id, values.status, values.pagesRead),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', currentUser?.id] });
      onShowToast('Library status updated');
    },
    onError: () => onShowToast('Could not update your library'),
  });
  const isBookSaved = Boolean(libraryBook);
  const saveBookMutation = useMutation({
    mutationFn: async (save: boolean): Promise<void> => {
      if (save) await updateBookStatus(currentUser!.id, book.id, 'to_be_read');
      else await removeBookFromLibrary(currentUser!.id, book.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['library', currentUser?.id] });
    },
    onError: () => onShowToast('Could not update your library'),
  });

  const bookReviews = useMemo(() => {
    return reviews.filter((r) => r.book_id === book.id);
  }, [reviews, book.id]);

  const currentStatus: ReadingStatus | null = libraryBook ? (libraryBook.status as ReadingStatus) : null;
  const currentStatusOption = STATUS_OPTIONS.find((s) => s.value === currentStatus);
  const isBusy = libraryStatusMutation.isPending || saveBookMutation.isPending;

  const changeStatus = (status: ReadingStatus) => {
    setOpenMenu(null);
    if (!currentUser?.id) return onShowToast('Sign in to update your library');
    if (status === currentStatus) return;
    libraryStatusMutation.mutate({ status });
  };

  const handleRemoveFromLibrary = () => {
    setOpenMenu(null);
    if (!currentUser?.id) return onShowToast('Sign in to update your library');
    const message = isAmharic
      ? 'ይህን መጽሐፍ ከቤተ-መጻሕፍትዎ ማስወገድ ይፈልጋሉ? ሂደትዎ ይጠፋል።'
      : 'Remove this book from your library? Your progress will be lost.';
    if (!window.confirm(message)) return;
    saveBookMutation.mutate(false);
    onShowToast(isAmharic ? 'ከቤተ-መጻሕፍት ተወግዷል' : 'Removed from library');
  };

  const openReviewModal = () => {
    setOpenMenu(null);
    setIsReviewModalOpen(true);
  };

  const handleSaveReadingLog = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = Number(logPage) || 0;
    if (currentUser?.id) libraryStatusMutation.mutate({ status: 'reading', pagesRead: pageNum });
    else onShowToast('Sign in to update your library');
    setIsLogModalOpen(false);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    if (onAddNote) {
      const newNote: Note = {
        id: `note-${Date.now()}`,
        user_id: (currentUser as any)?.id || '',
        book_id: book.id,
        title: noteLocation.trim() || null,
        content: noteText.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onAddNote(newNote);
    }

    setNoteText('');
    setNoteLocation('');
    setIsNoteModalOpen(false);
    onShowToast(`Note added to ${book.title}`);
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revBody.trim()) return;

    if (onAddReview) {
      const newReview: Review = {
        id: `rev-${Date.now()}`,
        user_id: (currentUser as any)?.id || '',
        book_id: book.id,
        title: null,
        content: revBody.trim(),
        rating: revRating,
        quote: revQuote.trim() || null,
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        like_count: 0,
        comment_count: 0,
      };
      onAddReview(newReview);
    }

    setRevBody('');
    setRevQuote('');
    setIsReviewModalOpen(false);
    onShowToast(`Review published for ${book.title}`);
  };

  const t = {
    primaryBtn:
      'h-10 px-4 rounded-lg bg-theme-accent text-white hover:opacity-90 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed',
    secondaryBtn:
      'h-10 px-4 rounded-lg bg-theme-surface border border-theme text-theme-main hover:bg-theme-subtle text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
    menu:
      'absolute top-full mt-2 z-30 min-w-[210px] bg-theme-surface border border-theme rounded-xl shadow-lg p-1.5 flex flex-col',
    menuItem:
      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer text-left',
    icon: 'material-symbols-outlined text-[18px]',
  };

  const renderPrimary = () => {
    switch (currentStatus) {
      case 'reading':
        return (
          <button type="button" onClick={() => setIsLogModalOpen(true)} disabled={isBusy} className={t.primaryBtn}>
            <span className={t.icon}>menu_book</span>
            <span>{isAmharic ? 'ንባብ መዝግብ' : 'Log reading'}</span>
          </button>
        );
      case 'finished':
        return (
          <button type="button" onClick={() => changeStatus('reading')} disabled={isBusy} className={t.primaryBtn}>
            <span className={t.icon}>replay</span>
            <span>{isAmharic ? 'እንደገና አንብብ' : 'Read again'}</span>
          </button>
        );
      case 'dnf':
        return (
          <button type="button" onClick={() => changeStatus('reading')} disabled={isBusy} className={t.primaryBtn}>
            <span className={t.icon}>play_arrow</span>
            <span>{isAmharic ? 'ንባብ ቀጥል' : 'Resume reading'}</span>
          </button>
        );
      default:
        return (
          <button type="button" onClick={() => changeStatus('reading')} disabled={isBusy} className={t.primaryBtn}>
            <span className={t.icon}>play_arrow</span>
            <span>{isAmharic ? 'ንባብ ጀምር' : 'Start reading'}</span>
          </button>
        );
    }
  };

  const renderSecondary = () => {
    switch (currentStatus) {
      case null:
        return (
          <button type="button" onClick={() => changeStatus('to_be_read')} disabled={isBusy} className={t.secondaryBtn}>
            <span className={t.icon}>bookmark_add</span>
            <span>{isAmharic ? 'ወደ TBR አስቀምጥ' : 'Want to read'}</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      {/* Top Sub-Bar */}
      <div className="sticky top-16 z-30 bg-theme-surface border-b border-theme shadow-xs">
        <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => onBack ? onBack() : onNavigate('colloquium')}
              className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full bg-theme-subtle hover:bg-theme-muted text-theme-main transition-colors cursor-pointer"
              aria-label={isAmharic ? 'ተመለስ' : 'Back'}
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
                if (!currentUser?.id) return onShowToast('Sign in to save books.');
                saveBookMutation.mutate(!isBookSaved);
                onShowToast(isBookSaved ? (isAmharic ? 'ከተቀመጡ ተሰርዟል' : 'Removed from saved') : (isAmharic ? 'ጥራዙ ተቀምጧል' : 'Volume saved'));
              }}
              className={`min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                isBookSaved ? 'text-theme-gold bg-theme-gold/10' : 'text-theme-muted hover:bg-theme-subtle'
              }`}
              aria-label={isAmharic ? 'ጥራዝ አስቀምጥ' : 'Bookmark this volume'}
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
        {/* 1. BOOK OVERVIEW CARD */}
        <section className="bg-theme-surface rounded-xl border border-theme p-6 sm:p-8 shadow-xs relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 items-start">
            {/* Cover */}
            <div className="w-24 h-34 sm:w-28 sm:h-40 rounded-lg overflow-hidden flex-shrink-0 bg-theme-subtle border border-theme shadow-md relative mx-auto sm:mx-0">
              <BookCover book={book} className="h-full w-full rounded-none border-0 shadow-none" />
            </div>

            {/* Book metadata */}
            <div className="flex flex-col flex-1 min-w-0 w-full">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent-light px-2 py-0.5 rounded border border-theme whitespace-nowrap">
                  {book.language}
                </span>
                {book.verification_status === 'verified' && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded border border-theme-accent/20 whitespace-nowrap flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">verified</span>
                    <span>{isAmharic ? 'የተረጋገጠ' : 'Verified'}</span>
                  </span>
                )}
              </div>

              <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-tight">
                {book.title}
              </h1>

              <p className="text-sm text-theme-body font-medium mt-1.5">
                {isAmharic ? 'ደራሲ፡ ' : 'By '}
                <span className="text-theme-main font-semibold">{book.author_name}</span>
              </p>

              {book.description && (
                <p className="text-sm text-theme-body mt-4 leading-relaxed max-w-[70ch]">
                  {book.description}
                </p>
              )}

              {/* Stats row */}
              <div className="mt-5 pt-4 border-t border-theme flex flex-wrap items-center gap-4 text-xs text-theme-muted">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-theme-accent">edit_note</span>
                  <strong className="text-theme-main font-semibold">{bookNotes.length}</strong>{' '}
                  {isAmharic ? 'የግል ማስታወሻዎች' : 'personal notes'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-theme-accent">rate_review</span>
                  <strong className="text-theme-main font-semibold">{bookReviews.length}</strong>{' '}
                  {isAmharic ? 'ግምገማዎች' : 'reviews'}
                </span>
                {book.page_count != null && (
                  <>
                    <span>·</span>
                    <span>{book.page_count} {isAmharic ? 'ገጾች' : 'pages'}</span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-4 border-t border-theme">
                {openMenu && (
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setOpenMenu(null)}
                    aria-hidden="true"
                  />
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
                      aria-haspopup="menu"
                      aria-expanded={openMenu === 'status'}
                      className={`h-10 pl-3.5 pr-2.5 rounded-lg border text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors relative z-30 ${
                        currentStatus
                          ? 'bg-theme-subtle text-theme-main border-theme hover:bg-theme-muted'
                          : 'bg-theme-subtle text-theme-muted border-theme hover:text-theme-main'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${currentStatus ? 'bg-theme-accent' : 'bg-theme-muted'}`} aria-hidden="true" />
                      <span>
                        {currentStatusOption
                          ? isAmharic ? currentStatusOption.am : currentStatusOption.en
                          : isAmharic ? 'በቤተ-መጻሕፍት የለም' : 'Not in library'}
                      </span>
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>

                    {openMenu === 'status' && (
                      <div role="menu" className={`${t.menu} left-0`}>
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={opt.value === currentStatus}
                            onClick={() => changeStatus(opt.value)}
                            className={t.menuItem}
                          >
                            <span className={`${t.icon} text-theme-muted`}>{opt.icon}</span>
                            <span className="flex-1">{isAmharic ? opt.am : opt.en}</span>
                            {opt.value === currentStatus && (
                              <span className="material-symbols-outlined text-[18px] text-theme-accent">check</span>
                            )}
                          </button>
                        ))}
                        {isBookSaved && (
                          <>
                            <div className="my-1.5 border-t border-theme" role="separator" />
                            <button
                              type="button"
                              role="menuitem"
                              onClick={handleRemoveFromLibrary}
                              className={`${t.menuItem} text-red-500 hover:bg-red-500/10`}
                            >
                              <span className={t.icon}>delete</span>
                              <span>{isAmharic ? 'ከቤተ-መጻሕፍት አስወግድ' : 'Remove from library'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {renderPrimary()}
                  {renderSecondary()}

                  <button type="button" onClick={openReviewModal} className={t.secondaryBtn}>
                    <span className={t.icon}>rate_review</span>
                    <span>{isAmharic ? 'መጽሐፍ ዳሰሳ ጻፍ' : 'Write a review'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SEMINAR LINK */}
        <section
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

        {/* 3. NOTES */}
        <NotesView userId={currentUser?.id} books={[book]} onShowToast={onShowToast} initialBookId={book.id} bookFilterId={book.id} compact />

        {/* 4. REVIEWS */}
        <section className="bg-theme-surface rounded-xl border border-theme p-5 sm:p-6 shadow-xs space-y-4">
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
                  : 'Peer assessments and reader reviews'}
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

          {bookReviews.length === 0 ? (
            <div className="text-center py-10 px-4 bg-theme-subtle/50 rounded-xl border border-theme/60">
              <span className="material-symbols-outlined text-4xl text-theme-subtle mb-2">rate_review</span>
              <p className="font-serif font-bold text-theme-main text-sm">
                {isAmharic ? 'በዚህ መጽሐፍ ላይ እስካሁን ምንም መጽሐፍ ዳሰሳ የለም' : 'No reviews on this volume yet'}
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
              {bookReviews.map((rev) => {
                const revDate = new Date(rev.created_at).toLocaleDateString(
                  isAmharic ? 'am-ET' : 'en',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                );

                return (
                  <article key={rev.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-xs">
                          R
                        </div>
                        <div>
                          <span className="font-serif text-xs font-bold text-theme-main block">
                            {isAmharic ? 'አንባቢ' : 'Reader'}
                          </span>
                          <p className="text-[11px] text-theme-muted font-serif">{revDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-theme-gold shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined text-[15px]"
                            style={{ fontVariationSettings: rev.rating >= star ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>

                    {rev.title && (
                      <h4 className="font-serif text-sm font-bold text-theme-main">{rev.title}</h4>
                    )}

                    <blockquote className="font-serif text-xs sm:text-sm text-theme-body leading-relaxed pl-3 border-l-2 border-theme-accent">
                      {rev.content}
                    </blockquote>

                    {rev.quote && (
                      <p className="text-[11px] text-theme-muted font-serif italic pl-3">
                        &ldquo;{rev.quote}&rdquo;
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* MODAL A: Log Reading */}
      {isLogModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
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
                  {isAmharic ? 'የተነበበው ገጽ' : 'Current Page Read'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={book.page_count ?? 2000}
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
                  placeholder={isAmharic ? 'ለምሳሌ፡ ምዕራፍ ፬' : 'e.g. Chapter 4'}
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

      {/* MODAL C: Add Note */}
      {isNoteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
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
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'የምዕራፍ / የጥቅስ ማጣቀሻ (አማራጭ)' : 'Chapter / Passage Citation (Optional)'}
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

      {/* MODAL D: Add Review */}
      {isReviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div
            className="bg-theme-surface rounded-xl border border-theme max-w-lg w-full p-5 sm:p-6 shadow-xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-theme-accent block">
                  {isAmharic ? 'መጽሐፍ ዳሰሳ' : 'Book Review'}
                </span>
                <h3 className="font-serif text-base sm:text-lg font-bold text-theme-main">
                  {isAmharic ? `ለ${book.title} ዳሰሳ ጻፍ` : `Write Review for ${book.title}`}
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

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'ጥቅስ (አማራጭ)' : 'Quote (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={isAmharic ? 'የመጽሐፉ ጥቅስ' : 'A quote from the book'}
                  value={revQuote}
                  onChange={(e) => setRevQuote(e.target.value)}
                  className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-theme-main focus:outline-hidden focus:border-theme-accent font-serif"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-semibold text-theme-main font-serif">
                  {isAmharic ? 'የመጽሐፍ ዳሰሳ እና አስተያየት' : 'Appraisal & Review'}
                </label>
                <textarea
                  rows={4}
                  placeholder={isAmharic ? 'የዚህን መጽሐፍ የጽሑፍ ጥልቀት፣ ጠቀሜታ እና ጥራት ይገምግሙ...' : 'Evaluate the textual depth, theological significance, and quality of this treatise...'}
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
                  <span>{isAmharic ? 'መጽሐፍ ዳሳሳ ለጥፍ' : 'Publish Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
