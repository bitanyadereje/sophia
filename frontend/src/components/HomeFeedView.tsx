import React, { useState } from 'react';
import { Book, ScreenId, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface HomeFeedViewProps {
  user?: UserProfile;
  books?: Book[];
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectBook?: (bookId: string) => void;
  onOpenSeminar?: (bookId: string) => void;
  onShowToast?: (msg: string) => void;
  onNavigateToDiscussion?: (questionId: string) => void;
  onNavigateToReview?: (reviewId: string) => void;
}

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  user = {
    name: 'Caleb',
    title: 'Monastic Scholar',
    location: 'Oxford, UK',
    memberSince: '2023',
    avatar: '',
    booksRead: 14,
    notesCount: 42,
    dayStreak: 12,
    goalTarget: 24,
    topics: ['Patristics', 'Early Church']
  },
  books: _books = [],
  onUpdateUser,
  onNavigate,
  onSelectBook,
  onOpenSeminar,
  onShowToast,
  onNavigateToDiscussion,
  onNavigateToReview
}) => {
  const { t, isAmharic } = useLanguage();

  // Contemplation state (customizable via reading logger)
  const [activeBook, setActiveBook] = useState('On the Incarnation');
  const [activeAuthor, setActiveAuthor] = useState('St. Athanasius of Alexandria');
  const [activeChapter, setActiveChapter] = useState('Chapter 4: The Divine Dilemma');

  // Currently Reading Items
  const [readingTreatises, setReadingTreatises] = useState([
    {
      id: 'conf-4',
      title: 'The Confessions',
      author: 'Augustine of Hippo',
      location: 'Book VIII',
      chapterTarget: 'Book VIII: The Conversion in the Garden',
      progress: 85,
      pagesReadTotal: 238,
      discussionPrompt: 'How does Augustine define the conflict of two wills in Book VIII?',
      discussionReplies: 24
    },
    {
      id: 'inc-1',
      title: 'On the Incarnation',
      author: 'Athanasius of Alexandria',
      location: 'Ch. IV',
      chapterTarget: 'Chapter 4: The Divine Dilemma',
      progress: 68,
      pagesReadTotal: 142,
      discussionPrompt: 'Why does Athanasius insist that repentance alone cannot cure ontological corruption?',
      discussionReplies: 18
    }
  ]);

  const handleOpenBookDetail = (item: { id: string; title: string }) => {
    let targetId = item.id;
    if (_books && _books.length > 0) {
      const match = _books.find(
        (b) => b.id === item.id || b.title.toLowerCase() === item.title.toLowerCase()
      );
      if (match) targetId = match.id;
    }
    if (targetId === 'confessions') targetId = 'conf-4';
    if (targetId === 'incarnation') targetId = 'inc-1';

    if (onSelectBook) {
      onSelectBook(targetId);
    } else {
      onNavigate('colloquium');
    }
  };

  // Progressive disclosure sheet state
  const [isResumeSheetOpen, setIsResumeSheetOpen] = useState(false);

  // Reading Logger Modal State ("the user can add how many pages they read and if they are on a chapter")
  const [isLoggerModalOpen, setIsLoggerModalOpen] = useState(false);
  const [loggerBook, setLoggerBook] = useState('On the Incarnation');
  const [loggerChapter, setLoggerChapter] = useState('Chapter 4: The Divine Dilemma');
  const [loggerPagesRead, setLoggerPagesRead] = useState(12);
  const [loggerNote, setLoggerNote] = useState('');

  // Target Goal Adjustment Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoal, setTempGoal] = useState(user.goalTarget);

  // Write Notes Modal
  const [activeNotesBook, setActiveNotesBook] = useState<{
    title: string;
    location: string;
  } | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Discussion Modal
  const [activeDiscussionBook, setActiveDiscussionBook] = useState<{
    title: string;
    location: string;
    prompt: string;
    repliesCount: number;
  } | null>(null);

  // Active insight inspection modal state
  const [activeItemModal, setActiveItemModal] = useState<
    | { type: 'discussion-grace'; title: string; meta: string }
    | { type: 'review-augustine'; title: string; meta: string }
    | { type: 'discussion-atonement'; title: string; meta: string }
    | null
  >(null);

  // Private marginalia state
  const [marginaliaText, setMarginaliaText] = useState(
    'Note on §4.2: Athanasius argues that the corruption of human nature was an ontological catastrophe, not merely a legal transgression. God could not abandon His creation to non-existence, yet human repentance alone could not regenerate corruptible mortal flesh. The Incarnation is therefore cosmic restoration, not merely a court pardon.'
  );
  const [isEditingMarginalia, setIsEditingMarginalia] = useState(false);

  // Handlers
  const handleSaveReadingLog = (e: React.FormEvent) => {
    e.preventDefault();
    const pages = Number(loggerPagesRead) || 0;

    // Update active anchor if it matches
    if (loggerBook === 'On the Incarnation') {
      setActiveChapter(loggerChapter);
    }

    // Update the progress percentage of the treatise
    setReadingTreatises((prev) =>
      prev.map((t) => {
        if (t.title.toLowerCase().includes(loggerBook.toLowerCase())) {
          const newProgress = Math.min(100, t.progress + Math.max(2, Math.round(pages / 3)));
          return {
            ...t,
            location: loggerChapter,
            chapterTarget: loggerChapter,
            progress: newProgress,
            pagesReadTotal: t.pagesReadTotal + pages
          };
        }
        return t;
      })
    );

    // Update streak and show toast
    if (onUpdateUser) {
      onUpdateUser({ dayStreak: user.dayStreak });
    }

    if (onShowToast) {
      onShowToast(`Recorded ${pages} pages read in ${loggerChapter}. Streak active at ${user.dayStreak} days!`);
    }

    setLoggerNote('');
    setIsLoggerModalOpen(false);
  };

  const handleSaveGoal = () => {
    if (onUpdateUser) {
      onUpdateUser({ goalTarget: tempGoal });
    }
    setIsGoalModalOpen(false);
    if (onShowToast) {
      onShowToast(`Annual reading target set to ${tempGoal} volumes`);
    }
  };

  const handleSaveNote = () => {
    if (!newNoteText.trim()) {
      setActiveNotesBook(null);
      return;
    }
    if (onShowToast) {
      onShowToast(`Marginal note saved for ${activeNotesBook?.title}`);
    }
    if (onUpdateUser) {
      onUpdateUser({ notesCount: user.notesCount + 1 });
    }
    setNewNoteText('');
    setActiveNotesBook(null);
  };

  return (
    <div
      id="sanctuary-home-screen"
      className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200 selection:bg-theme-accent-light selection:text-theme-accent font-sans antialiased"
    >
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex-1 flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* 1. THE ARCHIVAL HEADER & READING STREAK                                   */}
        {/* ========================================================================= */}
        <header id="archival-header" className="select-none">
          <div className="flex items-baseline justify-between border-b border-theme/40 pb-3 lg:pb-4">
            <div>
              <h1 className="font-serif font-light text-xl sm:text-2xl lg:text-3xl tracking-[0.24em] text-theme-main uppercase">
                {isAmharic ? 'ሶፊያ' : 'SOPHIA'}
              </h1>
              <p className="text-[10px] lg:text-xs font-sans uppercase tracking-[0.25em] text-theme-muted mt-1">
                {isAmharic ? 'የመንፈስ ማረፊያ • መነሻ' : 'Reading Desk • Home'}
              </p>
            </div>
            <span className="text-[11px] lg:text-xs font-serif italic text-theme-muted hidden sm:inline">
              {isAmharic ? 'እምነት ማስተዋልን ይሻል (Faith seeking understanding)' : 'Faith seeking understanding'}
            </span>
          </div>

          {/* Reading Streak & Annual Volumes (From Library requirements) */}
          <div className="mt-3 lg:mt-4 flex items-center justify-between flex-wrap gap-2 text-xs lg:text-sm font-sans text-theme-muted">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="text-theme-accent font-serif font-semibold">
                {user.booksRead} {isAmharic ? 'በዚህ ዓመት የተነበቡ ጥራዞች' : 'volumes read this year'}
              </span>
              <span className="opacity-40">•</span>
              <span className="inline-flex items-center gap-1 font-medium text-theme-main px-2.5 lg:px-3 py-0.5 lg:py-1 rounded-full bg-theme-surface border border-theme shadow-2xs">
                <span className="material-symbols-outlined text-[15px] lg:text-[17px] text-theme-accent">local_fire_department</span>
                <span>{user.dayStreak} {isAmharic ? 'የተከታታይ ቀናት' : '-day streak'}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTempGoal(user.goalTarget);
                  setIsGoalModalOpen(true);
                }}
                className="px-3 lg:px-3.5 py-1 lg:py-1.5 rounded-full bg-theme-surface border border-theme text-xs lg:text-sm font-serif text-theme-muted hover:text-theme-main hover:bg-theme-subtle inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px] lg:text-[17px] text-theme-accent">flag</span>
                <span>{isAmharic ? 'ግብ:' : 'Goal:'} {user.goalTarget} {isAmharic ? 'መጻሕፍት' : 'books'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLoggerModalOpen(true)}
                className="px-3 lg:px-3.5 py-1 lg:py-1.5 rounded-full bg-theme-accent text-white text-xs lg:text-sm font-serif font-medium hover:bg-theme-accent/90 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px] lg:text-[17px]">add</span>
                <span>{isAmharic ? 'ንባብ መዝግብ' : 'Log Reading'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. THE "ACTIVE CONTEMPLATION" ANCHOR                                      */}
        {/* ========================================================================= */}
        <section
          id="active-contemplation-anchor"
          aria-label="Active Contemplation"
          className="bg-theme-surface border border-theme rounded-2xl p-6 sm:p-7 lg:p-10 shadow-xs text-center relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-sans font-semibold uppercase tracking-wider bg-theme-accent-light text-theme-accent border border-theme mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
            {isAmharic ? 'ገባሪ ንባብ' : 'Active Lectio'}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl xl:text-[32px] text-theme-main font-semibold leading-snug max-w-xl lg:max-w-3xl mx-auto">
            {isAmharic ? (
              <>
                {user.name}፣ በ<span className="italic font-bold text-theme-accent">{activeBook}</span> {activeChapter.split(':')[0]} ላይ ነዎት።
              </>
            ) : (
              <>
                {user.name}, you are on {activeChapter.split(':')[0]} of{' '}
                <span className="italic font-bold text-theme-accent">{activeBook}</span>.
              </>
            )}
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-theme-muted font-serif mt-1 lg:mt-2">
            {activeAuthor} · {activeChapter}
          </p>

          <div className="mt-5 lg:mt-7 flex items-center justify-center gap-3 flex-wrap">
            <button
              id="resume-study-btn"
              type="button"
              onClick={() => setIsResumeSheetOpen(true)}
              className="px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-theme-main text-white font-serif text-xs sm:text-sm lg:text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] lg:text-[20px]">auto_stories</span>
              <span>{isAmharic ? 'የንባብ ማስታወሻዎች' : 'Reading Notes'}</span>
            </button>

            <button
              id="log-reading-btn"
              type="button"
              onClick={() => {
                setLoggerBook(activeBook);
                setLoggerChapter(activeChapter);
                setIsLoggerModalOpen(true);
              }}
              className="px-4 lg:px-5 py-2.5 lg:py-3 rounded-xl bg-theme-surface border border-theme text-theme-main font-serif text-xs sm:text-sm lg:text-base font-semibold hover:bg-theme-subtle active:scale-[0.98] transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] lg:text-[20px] text-theme-accent">menu_book</span>
              <span>{isAmharic ? 'ንባብ መዝግብ' : 'Log Reading'}</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CURRENTLY READING SECTION                                              */}
        {/* ========================================================================= */}
        <section
          id="home-currently-reading"
          aria-label="Currently Reading Treatises"
          className="space-y-4 lg:space-y-5"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-[11px] lg:text-xs font-sans font-semibold uppercase tracking-[0.25em] text-theme-muted whitespace-nowrap">
              {isAmharic ? 'በማንበብ ላይ ያሉ' : 'CURRENTLY READING'}
            </h2>
            <div className="h-px bg-theme w-full flex-1" />
          </div>

          <div className="space-y-3.5 lg:space-y-4">
            {readingTreatises.map((item) => (
              <article
                key={item.id}
                id={`reading-treatise-${item.id}`}
                onClick={() => handleOpenBookDetail(item)}
                className="bg-theme-surface border border-theme rounded-xl p-4 sm:p-5 lg:p-6 shadow-xs space-y-3 lg:space-y-4 transition-colors hover:border-theme-accent/50 group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBookDetail(item);
                      }}
                      className="font-serif text-base sm:text-lg lg:text-xl font-semibold text-theme-main hover:text-theme-accent cursor-pointer transition-colors inline-block leading-snug"
                      title={`View details for ${item.title}`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-theme-muted font-serif mt-0.5">
                      {item.author} • {item.location}
                    </p>
                  </div>
                  <span className="text-xs lg:text-sm font-serif font-semibold text-theme-accent bg-theme-subtle px-2.5 lg:px-3 py-0.5 lg:py-1 rounded-full border border-theme flex-shrink-0">
                    {item.progress}% Complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 lg:h-2 w-full bg-theme-muted/50 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-theme-accent transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNotesBook({
                        title: item.title,
                        location: item.location
                      });
                      setNewNoteText('');
                    }}
                    className="px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-main text-xs lg:text-sm font-serif font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] lg:text-[17px] text-theme-accent">edit_note</span>
                    <span>Write Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDiscussionBook({
                        title: item.title,
                        location: item.location,
                        prompt: item.discussionPrompt,
                        repliesCount: item.discussionReplies
                      });
                    }}
                    className="px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg border border-theme bg-theme-surface hover:bg-theme-subtle text-theme-muted hover:text-theme-main text-xs lg:text-sm font-serif font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[15px] lg:text-[17px]">forum</span>
                    <span>Discussion Feed</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoggerBook(item.title);
                      setLoggerChapter(item.location);
                      setIsLoggerModalOpen(true);
                    }}
                    className="px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs lg:text-sm font-serif font-semibold hover:bg-stone-700 dark:hover:bg-stone-600 inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ml-auto"
                  >
                    <span className="material-symbols-outlined text-[15px] lg:text-[17px]">menu_book</span>
                    <span>Log Reading</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE JOURNAL COLLOQUIUM FEED (Recent Insights)                          */}
        {/* ========================================================================= */}
        <section
          id="journal-colloquium-feed"
          aria-label="Recent Insights Feed"
          className="pt-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] lg:text-xs font-sans font-medium uppercase tracking-[0.25em] text-theme-muted">
              {isAmharic ? 'የቅርብ ጊዜ ግንዛቤዎች' : 'RECENT INSIGHTS'}
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('discussions')}
              className="text-[11px] lg:text-xs font-sans text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሁሉንም ውይይቶች እይ →' : 'All Discussions →'}
            </button>
          </div>

          {/* Minimalist text rows separated by thin hairlines */}
          <div className="divide-y divide-theme border-t border-b border-theme">
            {/* Item Row 1 (Discussion Link) */}
            <article
              id="feed-item-grace"
              onClick={() => {
                if (onNavigateToDiscussion) {
                  onNavigateToDiscussion('q-grace-romans');
                } else {
                  onNavigate('discussions');
                }
              }}
              className="py-4 lg:py-5 px-2 lg:px-3 hover:bg-theme-subtle/70 rounded-lg transition-colors cursor-pointer group flex items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-serif font-bold text-[15px] sm:text-base lg:text-lg xl:text-xl text-theme-main group-hover:text-theme-accent leading-snug transition-colors">
                  How did the early church fathers interpret Grace in the Book of Romans?
                </h3>
                <p className="mt-1.5 text-xs lg:text-sm text-theme-muted font-sans font-normal tracking-tight">
                  #ChurchHistory • 14 scholarly replies
                </p>
              </div>
              <span className="material-symbols-outlined text-theme-subtle group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all text-[18px] sm:text-[20px] flex-shrink-0">
                arrow_forward
              </span>
            </article>

            {/* Item Row 2 (Review Link) */}
            <article
              id="feed-item-augustine-review"
              onClick={() => {
                if (onNavigateToReview) {
                  onNavigateToReview('rev-civ-god');
                } else {
                  onNavigate('reviews');
                }
              }}
              className="py-4 lg:py-5 px-2 lg:px-3 hover:bg-theme-subtle/70 rounded-lg transition-colors cursor-pointer group flex items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-serif font-normal text-[15px] sm:text-base lg:text-lg xl:text-xl text-theme-main group-hover:text-theme-accent leading-snug transition-colors">
                  REVIEW: St. Augustine&apos;s &apos;City of God&apos;
                </h3>
                <p className="mt-1.5 text-xs lg:text-sm text-theme-muted font-sans font-normal tracking-tight">
                  ⭐⭐⭐⭐⭐ • Written by Dr. Moreau
                </p>
              </div>
              <span className="material-symbols-outlined text-theme-subtle group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all text-[18px] sm:text-[20px] flex-shrink-0">
                arrow_forward
              </span>
            </article>

            {/* Item Row 3 (Discussion Link) */}
            <article
              id="feed-item-atonement"
              onClick={() => {
                if (onNavigateToDiscussion) {
                  onNavigateToDiscussion('q-atonement-patristic');
                } else {
                  onNavigate('discussions');
                }
              }}
              className="py-4 lg:py-5 px-2 lg:px-3 hover:bg-theme-subtle/70 rounded-lg transition-colors cursor-pointer group flex items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-serif font-bold text-[15px] sm:text-base lg:text-lg xl:text-xl text-theme-main group-hover:text-theme-accent leading-snug transition-colors">
                  Understanding the teaching of Atonement in the early church
                </h3>
                <p className="mt-1.5 text-xs lg:text-sm text-theme-muted font-sans font-normal tracking-tight">
                  #Dogma • 4 scholarly replies
                </p>
              </div>
              <span className="material-symbols-outlined text-theme-subtle group-hover:text-theme-accent group-hover:translate-x-0.5 transition-all text-[18px] sm:text-[20px] flex-shrink-0">
                arrow_forward
              </span>
            </article>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: LOG READING & UPDATE CHAPTER                                    */}
      {/* ========================================================================= */}
      {isLoggerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsLoggerModalOpen(false)}
        >
          <form
            onSubmit={handleSaveReadingLog}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted block">
                  DAILY STUDY LOG
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  Record Pages Read & Chapter
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLoggerModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-sans text-theme-muted mb-1">Select Treatise:</label>
                <select
                  value={loggerBook}
                  onChange={(e) => {
                    setLoggerBook(e.target.value);
                    if (e.target.value === 'The Confessions') {
                      setLoggerChapter('Book VIII: The Conversion in the Garden');
                    } else {
                      setLoggerChapter('Chapter 4: The Divine Dilemma');
                    }
                  }}
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main focus:outline-none focus:border-theme-accent"
                >
                  <option value="On the Incarnation">On the Incarnation (Athanasius)</option>
                  <option value="The Confessions">The Confessions (Augustine)</option>
                  <option value="City of God">City of God (Augustine)</option>
                  <option value="The Rule of St. Benedict">The Rule of St. Benedict</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-theme-muted mb-1">
                  Current Chapter / Section:
                </label>
                <input
                  type="text"
                  value={loggerChapter}
                  onChange={(e) => setLoggerChapter(e.target.value)}
                  placeholder="e.g. Chapter 4: The Divine Dilemma"
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main focus:outline-none focus:border-theme-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-sans text-theme-muted mb-1">
                  Pages Read Today:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={150}
                    value={loggerPagesRead}
                    onChange={(e) => setLoggerPagesRead(Number(e.target.value))}
                    className="w-24 bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main text-center focus:outline-none focus:border-theme-accent"
                    required
                  />
                  <span className="text-xs text-theme-muted font-serif italic">
                    pages read in contemplative silence
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-theme-muted mb-1">
                  Marginal Reflection (Optional):
                </label>
                <textarea
                  rows={3}
                  value={loggerNote}
                  onChange={(e) => setLoggerNote(e.target.value)}
                  placeholder="Note a quick reflection on today's reading..."
                  className="w-full bg-theme-app border border-theme rounded-lg p-2.5 font-serif text-theme-main leading-relaxed focus:outline-none focus:border-theme-accent resize-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLoggerModalOpen(false)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs font-serif tracking-wide hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-xs cursor-pointer"
              >
                Save Progress
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PROGRESSIVE DISCLOSURE: RESUME STUDY SHEET                             */}
      {/* ========================================================================= */}
      {isResumeSheetOpen && (
        <div
          id="dashboard-sheet-backdrop"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end transition-opacity duration-200"
          onClick={() => setIsResumeSheetOpen(false)}
        >
          <div
            id="organic-dashboard-sheet"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg mx-auto bg-theme-surface text-theme-main rounded-t-3xl border-t border-theme p-6 sm:p-8 max-h-[85vh] overflow-y-auto shadow-2xl space-y-6 animate-in slide-in-from-bottom duration-300"
          >
            <div className="w-10 h-1 bg-theme-muted/50 rounded-full mx-auto" />

            <div className="flex items-start justify-between border-b border-theme pb-4">
              <div>
                <p className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted">
                  READING NOTES
                </p>
                <h3 className="font-serif font-bold text-lg sm:text-xl text-theme-main mt-0.5">
                  {activeBook}
                </h3>
                <p className="text-xs text-theme-muted font-serif italic">
                  {activeAuthor} • {activeChapter}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsResumeSheetOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Detailed Reading Metrics */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-theme-muted">
                READING METRICS
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-theme-subtle border border-theme rounded-xl p-3.5">
                  <span className="block text-[10px] font-sans uppercase tracking-wider text-theme-muted">
                    Current Position
                  </span>
                  <span className="font-serif font-bold text-base text-theme-main mt-0.5 block">
                    Chapter 4 of 8
                  </span>
                  <span className="text-[11px] text-theme-muted mt-0.5 block font-sans">
                    68% of treatise
                  </span>
                </div>

                <div className="bg-theme-subtle border border-theme rounded-xl p-3.5">
                  <span className="block text-[10px] font-sans uppercase tracking-wider text-theme-muted">
                    Pacing
                  </span>
                  <span className="font-serif font-bold text-base text-theme-main mt-0.5 block">
                    ~22 min
                  </span>
                  <span className="text-[11px] text-theme-muted mt-0.5 block font-sans">
                    Contemplative pace
                  </span>
                </div>
              </div>

              <div className="text-xs text-theme-muted font-sans pt-1">
                Last meditation session recorded: <span className="text-theme-main font-medium">Today at 9:40 AM</span>
              </div>
            </div>

            {/* Private Personal Notes Section */}
            <div className="space-y-3 pt-2 border-t border-theme">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-sans font-medium uppercase tracking-[0.2em] text-theme-muted">
                  {isAmharic ? 'የግል ማስታወሻ (§4.2)' : 'PERSONAL NOTES (§4.2)'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingMarginalia(!isEditingMarginalia)}
                  className="text-[11px] font-serif text-theme-accent hover:underline cursor-pointer"
                >
                  {isEditingMarginalia ? (isAmharic ? 'አስቀምጥ' : 'Save') : (isAmharic ? 'ማስታወሻ አስተካክል' : 'Edit Note')}
                </button>
              </div>

              {isEditingMarginalia ? (
                <textarea
                  rows={4}
                  value={marginaliaText}
                  onChange={(e) => setMarginaliaText(e.target.value)}
                  className="w-full bg-theme-app border border-theme rounded-xl p-3 text-xs font-serif text-theme-main leading-relaxed focus:outline-none focus:border-theme-accent"
                />
              ) : (
                <blockquote className="bg-theme-subtle border-l-2 border-theme-accent p-3.5 rounded-r-xl text-xs font-serif text-theme-body leading-relaxed italic">
                  &ldquo;{marginaliaText}&rdquo;
                </blockquote>
              )}
            </div>

            {/* Primary Study Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsResumeSheetOpen(false);
                  setLoggerBook(activeBook);
                  setLoggerChapter(activeChapter);
                  setIsLoggerModalOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-stone-800 dark:bg-stone-700 text-stone-100 font-serif text-sm font-semibold tracking-wide hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Log Reading on {activeBook}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsResumeSheetOpen(false);
                  onNavigate('library');
                }}
                className="w-full py-2.5 rounded-xl bg-theme-subtle border border-theme text-theme-main font-serif text-xs tracking-wide hover:bg-theme-muted transition-colors cursor-pointer"
              >
                {isAmharic ? 'የተቀመጡ ማስታወሻዎችን እይ →' : 'View Saved Notes →'}
              </button>

              <button
                type="button"
                onClick={() => setIsResumeSheetOpen(false)}
                className="w-full py-2 text-center text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                {isAmharic ? 'ወደ መነሻ ተመለስ' : 'Return to Home'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {activeNotesBook && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setActiveNotesBook(null)}
        >
          <div
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted block">
                  {isAmharic ? 'የግል ማስታወሻ' : 'PERSONAL NOTES'}
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  {activeNotesBook.title}
                </h3>
                <p className="text-xs text-theme-muted font-serif italic">
                  {activeNotesBook.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNotesBook(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-sans text-theme-muted block">
                Write reflection or marginal note:
              </label>
              <textarea
                rows={4}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Record your contemplation on this passage..."
                className="w-full bg-theme-app border border-theme rounded-xl p-3 text-xs font-serif text-theme-main leading-relaxed focus:outline-none focus:border-theme-accent resize-none"
              />
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveNotesBook(null)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs font-serif tracking-wide hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-xs cursor-pointer"
              >
                Save Reflection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Modal */}
      {activeDiscussionBook && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setActiveDiscussionBook(null)}
        >
          <div
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted block">
                  COLLOQUIUM DISCUSSION
                </span>
                <h3 className="font-serif font-bold text-base text-theme-main mt-0.5">
                  {activeDiscussionBook.title}
                </h3>
                <p className="text-xs text-theme-muted font-serif italic">
                  {activeDiscussionBook.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveDiscussionBook(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-theme-subtle p-3.5 rounded-xl border border-theme space-y-2">
              <span className="text-[10px] font-sans uppercase tracking-wider text-theme-accent font-medium block">
                Active Colloquium Question
              </span>
              <p className="text-xs sm:text-sm font-serif text-theme-main leading-relaxed font-normal">
                {activeDiscussionBook.prompt}
              </p>
              <span className="text-[11px] text-theme-muted font-sans block">
                {activeDiscussionBook.repliesCount} scholarly responses in colloquium
              </span>
            </div>

            <div className="pt-2 border-t border-theme flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveDiscussionBook(null)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = (activeDiscussionBook as any).id === 'incarnation' ? 'inc-1' : 'conf-4';
                  setActiveDiscussionBook(null);
                  if (onOpenSeminar) {
                    onOpenSeminar(targetId);
                  } else if (onSelectBook) {
                    onSelectBook(targetId);
                  } else {
                    onNavigate('colloquium');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-stone-800 dark:bg-stone-700 text-stone-100 text-xs font-serif tracking-wide hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors shadow-xs cursor-pointer"
              >
                Join Seminar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Goal Modal */}
      {isGoalModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setIsGoalModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-serif font-bold text-base text-theme-main">
                Annual Reading Target
              </h3>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 py-4 bg-theme-subtle rounded-xl border border-theme">
              <button
                type="button"
                onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                className="w-9 h-9 rounded-lg bg-theme-surface border border-theme text-base font-serif hover:bg-theme-muted cursor-pointer flex items-center justify-center"
              >
                −
              </button>
              <div className="text-center">
                <span className="font-serif text-2xl font-bold text-theme-main">{tempGoal}</span>
                <span className="block text-[10px] uppercase tracking-wider text-theme-muted mt-0.5">
                  Volumes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTempGoal(tempGoal + 1)}
                className="w-9 h-9 rounded-lg bg-theme-surface border border-theme text-base font-serif hover:bg-theme-muted cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-theme-subtle text-theme-muted text-xs font-serif cursor-pointer hover:text-theme-main"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="flex-1 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer"
              >
                Save Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed Item Reading Modal */}
      {activeItemModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setActiveItemModal(null)}
        >
          <div
            className="w-full max-w-md bg-theme-surface text-theme-main rounded-2xl border border-theme p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-theme pb-3">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.25em] text-theme-muted block">
                  COLLOQUIUM ARCHIVE
                </span>
                <span className="text-xs text-theme-muted font-sans mt-0.5 block">
                  {activeItemModal.meta}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-main hover:bg-theme-subtle transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <h3 className="font-serif font-bold text-base text-theme-main leading-snug">
              {activeItemModal.title}
            </h3>

            {activeItemModal.type === 'discussion-grace' && (
              <div className="space-y-3 text-xs font-serif text-theme-body leading-relaxed">
                <p>
                  In examining early patristic commentaries on Romans 3–8 (notably Ambrosiaster, Origen, and Chrysostom), grace is treated primarily as the unmerited re-creation of the broken human will rather than an impersonal forensic transfer.
                </p>
                <p className="text-theme-muted italic font-sans text-[11px]">
                  14 responses from university scholars and monastic fellows recorded in the Colloquium.
                </p>
              </div>
            )}

            {activeItemModal.type === 'review-augustine' && (
              <div className="space-y-3 text-xs font-serif text-theme-body leading-relaxed">
                <blockquote className="border-l-2 border-theme-accent pl-3 italic text-theme-body">
                  &ldquo;A magnum opus that dismantled the pagan civic theology of antiquity. Augustine contrasts the city of man, built on the love of self unto contempt of God, with the city of God, built on the love of God unto contempt of self.&rdquo;
                </blockquote>
                <p className="text-theme-muted font-sans text-[11px]">
                  Assessed 5.0/5.0 by Dr. Moreau • Patristic Studies Chair.
                </p>
              </div>
            )}

            {activeItemModal.type === 'discussion-atonement' && (
              <div className="space-y-3 text-xs font-serif text-theme-body leading-relaxed">
                <p>
                  Before late scholastic formulations of penal substitution, the dominant patristic understanding centered on Christus Victor and recapitulation—Christ restoring human nature by experiencing all its stages and swallowing mortality in His divine life.
                </p>
                <p className="text-theme-muted italic font-sans text-[11px]">
                  4 scholarly replies cataloged under Dogma.
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-theme flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveItemModal(null)}
                className="px-4 py-2 text-xs font-serif text-theme-muted hover:text-theme-main cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const modalType = activeItemModal.type;
                  setActiveItemModal(null);
                  if (modalType === 'review-augustine') {
                    if (onNavigateToReview) onNavigateToReview('rev-civ-god');
                    else onNavigate('reviews');
                  } else if (modalType === 'discussion-atonement') {
                    if (onNavigateToDiscussion) onNavigateToDiscussion('q-atonement-patristic');
                    else onNavigate('discussions');
                  } else {
                    if (onNavigateToDiscussion) onNavigateToDiscussion('q-grace-romans');
                    else onNavigate('discussions');
                  }
                }}
                className="px-4 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-serif tracking-wide hover:opacity-90 cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>
                  {activeItemModal.type === 'review-augustine' ? 'Open Book Review' : 'Open Discussion'}
                </span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
