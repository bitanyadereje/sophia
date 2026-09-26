import React, { useState, useEffect } from 'react';
import { Book, DialecticComment, ScreenId } from '../types';
import { getBookSeminarData, BookSeminarData } from '../data/bookSeminars';
import { useLanguage } from '../context/LanguageContext';

interface ColloquiumViewProps {
  book?: Book;
  comments: DialecticComment[];
  onAddComment: (comment: DialecticComment) => void;
  onBack?: () => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

export const ColloquiumView: React.FC<ColloquiumViewProps> = ({
  book,
  comments,
  onAddComment,
  onBack,
  onNavigate,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  // Determine seminar details for the current book
  const seminarData: BookSeminarData = book
    ? getBookSeminarData(book)
    : {
        bookId: 'conf-4',
        categoryTag: 'Soteriology & Grace',
        citationLabel: 'Confessions VIII.12',
        authorName: 'Dr. Alistair Vance, O.P.',
        authorTitle: 'Patristic Scholar · Yesterday at Vespers',
        authorAvatar:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDkmcGSMCOOWCBbEHqfe9ELBfOe7bd5ZtFBpZq63XrdfX693NXFx_t9d-GQ_4Pnjs5BZq2kcK-Wj2XfCuhSLE-qTsygxJbDRWbkJ7NvRe5WVsMl7uSI-QYftqfRwccX7flQIHQqSDi506rg5rSY5W3UL5RePHoz6GMXLdC3caVVzF33mudpBau1Vs6oWiGBvZ7bgqLGPDAKt4_JyAAuJAKv-CoXMjxhU1pDld6VYZMtjmHg7kCtnKMXGg',
        thesisTitle: 'Grace and Assent in Confessions VIII.12',
        thesisSubtitle: 'Beneath the fig tree: divine grace, irresistible volition, and illuminated assent.',
        narrativeText: [
          'In examining the climactic resolution beneath the fig tree in the Milanese garden, we encounter the mysterious chanting child—«tolle, lege; tolle, lege». Opening the codex of the Apostle to Romans 13:13-14, Augustine recounts an immediate infusion of serenity where "all the shadows of doubt dispersed".',
          'The heart of this Master Book Discussion rests on reconciling this moment against contemporary Pelagian assertions of raw self-determination. Does Augustine witness his own agency being sovereignly superseded through an irresistible impulse of divine decree, or is his fragmented will healed through victorious delight (delectatio victrix), rendering assent spontaneous, ecstatic, and authentically human?'
        ],
        scriptureQuote:
          'Not in rioting and drunkenness, not in chambering and wantonness, not in strife and envying: but put ye on the Lord Jesus Christ, and make not provision for the flesh, to fulfil the lusts thereof.',
        scriptureCitation: 'Epistola ad Romanos XIII, xiii-xiv (Vulgata)',
        concludingPrompt:
          'How does Augustine’s psychology of the affections reconcile sovereign divine initiative with an authentic, unforced human will?',
        citationsCount: 24,
        initialComments: comments
      };

  const [citationsCount, setCitationsCount] = useState(seminarData.citationsCount);
  const [hasCited, setHasCited] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Local comments state initialized from book seminar data or passed comments
  const [localComments, setLocalComments] = useState<DialecticComment[]>(() => {
    return seminarData.initialComments && seminarData.initialComments.length > 0
      ? seminarData.initialComments
      : comments;
  });

  // Re-sync when book changes
  useEffect(() => {
    if (seminarData) {
      setCitationsCount(seminarData.citationsCount);
      setLocalComments(
        seminarData.initialComments && seminarData.initialComments.length > 0
          ? seminarData.initialComments
          : comments
      );
    }
  }, [book?.id]);

  // Sticky dock state
  const [quotedContext, setQuotedContext] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const [showExplanation, setShowExplanation] = useState(true);
  const [showGlossary, setShowGlossary] = useState(false);

  const handleToggleCite = () => {
    if (!hasCited) {
      setCitationsCount((prev) => prev + 1);
      setHasCited(true);
      onShowToast('Citation added');
    } else {
      setCitationsCount((prev) => prev - 1);
      setHasCited(false);
      onShowToast('Citation removed');
    }
  };

  const handleToggleAssent = (commentId: string, parentId?: string) => {
    setLocalComments((prev) =>
      prev.map((c) => {
        if (parentId && c.id === parentId && c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                const userAssented = !r.userAssented;
                return {
                  ...r,
                  userAssented,
                  assents: userAssented ? r.assents + 1 : r.assents - 1
                };
              }
              return r;
            })
          };
        }
        if (c.id === commentId) {
          const userAssented = !c.userAssented;
          return {
            ...c,
            userAssented,
            assents: userAssented ? c.assents + 1 : c.assents - 1
          };
        }
        return c;
      })
    );
  };

  const handleQuote = (author: string, phrase: string) => {
    setQuotedContext(`Citing ${author}: "${phrase}"`);
    setReplyInput((prev) => (prev.startsWith('@') ? prev : `@${author.replace(/\s+/g, '')} `));
  };

  const handlePrepareReply = (prefix: string) => {
    setReplyInput(prefix);
    const input = document.getElementById('colloquium-dock-input');
    if (input) input.focus();
  };

  const handleSubmitContribution = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyInput.trim()) return;

    const newThesis: DialecticComment = {
      id: `thesis-${Date.now()}`,
      author: 'Sr. Beatrice Moreau',
      role: 'Church History Fellow',
      timeLocation: 'Just now · Member',
      thesisTag: `Response #${localComments.length + 1}`,
      avatar:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuA2YitWNNsZYX4iCDYttJhl7X0LYinSpghFRHfM840H2DLgfBEmLtsM5tkXsjJDfAuBPkJWhmG1CBDx03lY95CFALBy_Zd8btEymGHiBOHvU1CU51nGfd_vkHAVb5J-7s4hQaRZsbF82XCnDiF_Of0Jhnto_mc8N6_ljR_VAe8FvKXTWFJ_zvlntua9d2e6H1baC1kfebymZa_g2rRAHv4Ls6lAmxt5s1KqbKfP_YPH6-oIxi0Szv8q-A',
      assents: 1,
      userAssented: true,
      referenceFolio: quotedContext || undefined,
      content: [replyInput]
    };

    setLocalComments((prev) => [...prev, newThesis]);
    onAddComment(newThesis);
    setReplyInput('');
    setQuotedContext(null);
    onShowToast('Response posted to discussion');
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      {/* Top Navigation & Context Sub-Bar */}
      <div className="sticky top-16 z-30 bg-theme-surface border-b border-theme shadow-xs">
        <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => {
                if (onBack) {
                  onBack();
                } else {
                  onNavigate('colloquium');
                }
              }}
              className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full bg-theme-subtle hover:bg-theme-muted text-theme-main transition-colors cursor-pointer"
              aria-label={isAmharic ? 'ተመለስ' : 'Back to Previous Screen'}
              title={isAmharic ? 'ተመለስ' : 'Return'}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="font-label-md text-[10px] uppercase text-theme-accent tracking-widest truncate font-semibold">
                {isAmharic ? 'የመጽሐፍ ሴሚናር እና ውይይት' : 'Book Seminar & Discussion'}
              </span>
              <span className="font-serif text-[14px] sm:text-[15px] lg:text-base leading-tight text-theme-main font-bold truncate">
                {book ? `${book.title} • ${seminarData.citationLabel}` : seminarData.citationLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('book-detail')}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-theme-muted hover:text-theme-main px-2.5 py-1.5 rounded-lg border border-theme hover:bg-theme-subtle transition-colors cursor-pointer"
              title={isAmharic ? 'የጥራዝ ዝርዝር እይ' : `View ${book?.title || 'Volume'} details and notes`}
            >
              <span className="material-symbols-outlined text-[15px]">menu_book</span>
              <span>{isAmharic ? 'የጥራዝ ዝርዝር' : 'Volume Details'}</span>
            </button>
            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                onShowToast(isBookmarked ? (isAmharic ? 'ውይይቱ ከተቀመጡ ተሰርዟል' : 'Discussion removed from bookmarks') : (isAmharic ? 'ውይይቱ ተቀምጧል' : 'Discussion saved'));
              }}
              className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                isBookmarked ? 'text-theme-gold bg-theme-gold/10' : 'text-theme-muted hover:bg-theme-subtle'
              }`}
              aria-label={isAmharic ? 'ውይይት አስቀምጥ' : 'Save Discussion'}
            >
              <span
                className="material-symbols-outlined text-[19px]"
                style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
            <button
              onClick={() => onNavigate('library')}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-theme-muted hover:bg-theme-subtle transition-colors cursor-pointer"
              aria-label={isAmharic ? 'የተቀመጡ' : 'Saved Archive'}
            >
              <span className="material-symbols-outlined text-[19px]">bookmarks</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Educational Guide: What is a Colloquium? */}
        {showExplanation ? (
          <aside className="bg-theme-surface rounded-xl p-4 sm:p-5 border border-theme-accent/30 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 w-full">
                <div className="w-9 h-9 rounded-lg bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center text-theme-accent flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div className="flex flex-col gap-2 text-xs w-full">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-sm sm:text-[15px] font-bold text-theme-main">
                      About This Discussion Seminar
                    </h2>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-theme-accent-light text-theme-accent border border-theme">
                      Featured Discussion
                    </span>
                  </div>

                  <p className="text-theme-body leading-relaxed text-[13px]">
                    This seminar is an in-depth reading discussion centered on a <strong>single foundational chapter</strong>: Augustine's <em>Confessions Book VIII.12</em>.
                  </p>

                  {/* Contrast Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-theme-subtle/80 p-3 rounded-lg border border-theme text-xs">
                    <div>
                      <span className="font-semibold text-theme-main block mb-0.5">💬 Community Questions vs. Seminar:</span>
                      <p className="text-theme-muted text-[11px] leading-relaxed">
                        In <strong className="text-theme-body">Discussions & Q&A</strong>, members ask broad questions on topics across history and philosophy. In this <strong className="text-theme-body">Seminar</strong>, we examine key themes and arguments in this specific text.
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-theme-main block mb-0.5">📜 How to Participate:</span>
                      <p className="text-theme-muted text-[11px] leading-relaxed">
                        Read the featured passage above, review member responses below, click <strong className="text-theme-body">Like</strong> to endorse helpful analysis, or write your own thoughts in the box at the bottom.
                      </p>
                    </div>
                  </div>

                  {/* 3 Step Flow */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1 pt-2 border-t border-theme text-[11px] text-theme-muted">
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-theme-accent mt-0.5">menu_book</span>
                      <div>
                        <strong className="text-theme-main block font-semibold">1. Read the Passage</strong>
                        <span>Read the featured excerpt and the opening discussion prompt.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-theme-gold mt-0.5">thumb_up</span>
                      <div>
                        <strong className="text-theme-main block font-semibold">2. Like Insightful Notes</strong>
                        <span>Like comments that offer thoughtful analysis or helpful context.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-theme-accent mt-0.5">edit_note</span>
                      <div>
                        <strong className="text-theme-main block font-semibold">3. Share Your View</strong>
                        <span>Type in the response bar to add your thoughts or ask a follow-up.</span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Glossary Toggle */}
                  <div className="mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowGlossary(!showGlossary)}
                      className="text-[11px] text-theme-accent font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {showGlossary ? 'expand_less' : 'expand_more'}
                      </span>
                      <span>
                        {showGlossary 
                          ? (isAmharic ? 'የውይይት ፅንሰ-ሀሳቦችን ደብቅ' : 'Hide Discussion Concepts') 
                          : (isAmharic ? 'የውይይት ፅንሰ-ሀሳቦችን እይ (መመሪያ)' : 'View Discussion Concepts (Guide)')}
                      </span>
                    </button>

                    {showGlossary && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-theme-subtle p-2.5 rounded-lg border border-theme text-[11px] text-theme-muted">
                        <div>
                          <strong className="text-theme-main">{isAmharic ? 'ማዕከላዊ ጥያቄ:' : 'Central Question:'}</strong> {isAmharic ? 'የአውግስጢኖስ መመለስ ፈጣን ውሳኔ ነበር ወይስ ጥልቅ የፍላጎት ለውጥ?' : 'Whether Augustine’s conversion was sudden volition or a deeper transformation of desires.'}
                        </div>
                        <div>
                          <strong className="text-theme-main">{isAmharic ? 'መውደዶች እና ስምምነቶች:' : 'Likes & Endorsements:'}</strong> {isAmharic ? 'ለጥሩ ክርክር እና የጽሑፍ ማስረጃ ያለውን አድናቆት ያሳያል።' : 'Shows appreciation for clear reasoning and sound textual evidence.'}
                        </div>
                        <div>
                          <strong className="text-theme-main">{isAmharic ? 'የምዕራፍ ማጣቀሻ:' : 'Chapter Reference:'}</strong> {isAmharic ? 'የተወሰኑ ጥቅሶች ማጣቀሻ።' : 'Citation of specific verses, readable in full within the Reader.'}
                        </div>
                        <div>
                          <strong className="text-theme-main">{isAmharic ? 'ጥቀስ እና መልስ:' : 'Quote & Reply:'}</strong> {isAmharic ? 'የሌላ አባልን ሃሳብ በመጥቀስ ቀጥተኛ ምላሽ ለመስጠት።' : 'Clicking "Quote" references another member\'s point so you can respond directly.'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowExplanation(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded transition-colors cursor-pointer flex-shrink-0"
                title={isAmharic ? 'መመሪያውን ዝጋ' : 'Dismiss guide'}
                aria-label={isAmharic ? 'መመሪያውን ዝጋ' : 'Dismiss guide'}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </aside>
        ) : (
          <div className="flex justify-end -mb-4">
            <button
              onClick={() => setShowExplanation(true)}
              className="text-[11px] text-theme-muted hover:text-theme-main flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-theme-surface border border-theme shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-theme-accent">help</span>
              <span>{isAmharic ? 'ስለዚህ ውይይት (መመሪያ)' : 'About This Discussion (Guide)'}</span>
            </button>
          </div>
        )}

        {/* Primary Colloquium Vessel */}
        <article className="bg-theme-surface rounded-xl p-5 sm:p-7 shadow-xs border border-theme">
          {/* Metadata Category */}
          <div className="flex items-center gap-2 mb-3 text-xs text-theme-muted">
            <span className="font-semibold text-theme-crimson uppercase tracking-wider text-[11px] bg-theme-crimson-light px-2.5 py-0.5 rounded border border-theme-crimson-subtle">
              {seminarData.categoryTag}
            </span>
            <span>·</span>
            <span className="font-serif italic text-theme-main font-semibold">
              {book ? `${book.title} (${seminarData.citationLabel})` : seminarData.citationLabel}
            </span>
          </div>

          {/* Author Information Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-theme mb-4">
            <div className="flex items-center gap-2.5">
              <img
                src={seminarData.authorAvatar}
                alt={seminarData.authorName}
                className="w-9 h-9 rounded-full object-cover shadow-2xs border border-black/10"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-theme-main font-semibold">
                    {seminarData.authorName}
                  </span>
                  <span
                    className="material-symbols-outlined text-[14px] text-theme-accent"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    title="Verified Scholar-in-Residence"
                  >
                    verified
                  </span>
                </div>
                <span className="text-xs text-theme-muted">
                  {seminarData.authorTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Thesis Title */}
          <div className="mb-4">
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-snug">
              {seminarData.thesisTitle}
            </h1>
            <p className="text-sm text-theme-muted mt-1 leading-normal">
              {seminarData.thesisSubtitle}
            </p>
          </div>

          {/* Scholarly Narrative Context */}
          <div className="space-y-3 text-theme-body text-[14px] sm:text-[15px] leading-relaxed">
            {seminarData.narrativeText.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}

            {/* Scripture / Textual Inset Well */}
            {seminarData.scriptureQuote && (
              <div className="bg-theme-subtle rounded-lg p-4 my-3 border-l-2 border-theme-accent">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-theme-accent text-[20px] mt-0.5">format_quote</span>
                  <div className="flex flex-col">
                    <blockquote className="font-serif text-[15px] sm:text-[16px] leading-relaxed text-theme-main italic">
                      "{seminarData.scriptureQuote}"
                    </blockquote>
                    <span className="font-marginalia text-[10px] sm:text-[11px] text-theme-subtle mt-2 uppercase tracking-widest font-semibold">
                      {seminarData.scriptureCitation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {seminarData.concludingPrompt && (
              <p className="font-semibold text-theme-main font-serif italic pt-1">
                Colloquium Question: {seminarData.concludingPrompt}
              </p>
            )}
          </div>

          {/* Endorsement & Dialectic Bar */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 pl-1 border-t border-theme">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleCite}
                className={`min-h-[34px] px-3.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                  hasCited
                    ? 'bg-theme-accent-light text-theme-accent border border-theme'
                    : 'bg-theme-subtle hover:bg-theme-muted text-theme-main border border-theme'
                }`}
              >
                <span className="material-symbols-outlined text-[16px] text-theme-accent">stylus_note</span>
                <span>{citationsCount} {isAmharic ? 'ጥቅሶች' : 'Citations'}</span>
              </button>

              <div className="min-h-[34px] px-3.5 rounded-full bg-theme-subtle flex items-center gap-1.5 text-theme-muted text-xs font-semibold border border-theme">
                <span className="material-symbols-outlined text-[16px]">forum</span>
                <span>{localComments.length} {isAmharic ? 'መልሶች' : 'Responses'}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  onShowToast(isAmharic ? 'አገናኙ ተገልብጧል' : 'Link copied to clipboard');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-theme-subtle text-theme-muted cursor-pointer"
                title={isAmharic ? 'አገናኝ ገልብጥ' : 'Copy Link'}
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </button>
            </div>
          </div>
        </article>

        {/* Seminar Discussion Section */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[17px] sm:text-[19px] text-theme-main font-bold tracking-tight">
                {isAmharic ? 'የሴሚናር ውይይት እና ምላሾች' : 'Seminar Discussion & Responses'}
              </h2>
              <span className="font-marginalia uppercase text-theme-accent tracking-widest font-semibold text-xs">
                {localComments.length + 2} {isAmharic ? 'ምላሾች' : 'Responses'}
              </span>
            </div>
            <div className="flex items-center justify-between text-theme-subtle text-xs">
              <p>{isAmharic ? 'በጠቃሚነት እና በቅርብ ጊዜ የተደረደረ' : 'Ordered by most helpful and recent'}</p>
              <button className="flex items-center gap-1 font-label-md text-xs uppercase tracking-wider text-theme-main hover:text-theme-accent cursor-pointer">
                <span>{isAmharic ? 'ደርድር' : 'Sort'}</span>
                <span className="material-symbols-outlined text-[14px]">sort</span>
              </button>
            </div>
          </div>

          {/* Dialectic Thread Stream */}
          <div className="space-y-4">
            {localComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-theme-surface rounded-xl p-4 sm:p-5 border border-theme shadow-sm space-y-3"
              >
                {/* Level 1 Comment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-lg text-sm text-theme-main font-semibold">
                          {comment.author}
                        </span>
                        <span className="font-marginalia text-[10px] px-1.5 py-0.5 rounded bg-theme-subtle text-theme-muted border border-theme">
                          {comment.role}
                        </span>
                      </div>
                      <span className="font-marginalia text-[10px] text-theme-subtle">
                        {comment.timeLocation}
                      </span>
                    </div>
                  </div>
                  <span className="font-marginalia text-[11px] text-theme-muted font-medium">
                    {comment.thesisTag}
                  </span>
                </div>

                {/* Level 1 Body */}
                <div className="space-y-2 text-sm text-theme-body leading-relaxed">
                  {comment.content.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>

                {/* Inline Reference Folio Card if present */}
                {comment.referenceFolio && (
                  <div className="pl-3 pr-4 py-2 bg-theme-subtle rounded-md text-theme-muted border-l-2 border-theme-accent">
                    <span className="font-marginalia italic text-xs">
                      {comment.referenceFolio}
                    </span>
                  </div>
                )}

                {/* Action Ribbon */}
                <div className="pt-2 flex items-center justify-between border-t border-theme">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleAssent(comment.id)}
                      className={`flex items-center gap-1 py-1 px-2.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        comment.userAssented
                          ? 'bg-theme-accent-light text-theme-accent'
                          : 'text-theme-muted hover:bg-theme-subtle'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                      <span>{comment.assents} {isAmharic ? 'መውደዶች' : 'Likes'}</span>
                    </button>

                    <button
                      onClick={() => handleQuote(comment.author, 'delectatio victrix')}
                      className="flex items-center gap-1 text-theme-muted hover:bg-theme-subtle py-1 px-2 rounded text-xs font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">format_quote</span>
                      <span>{isAmharic ? 'ጥቀስ' : 'Quote'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handlePrepareReply(`@${comment.author.replace(/\s+/g, '')} `)}
                    className="font-label-md text-xs uppercase tracking-wider text-theme-accent font-semibold hover:text-theme-main cursor-pointer"
                  >
                    {isAmharic ? 'መልስ ስጥ' : 'Reply'}
                  </button>
                </div>

                {/* LEVEL 2 NESTED REPLIES */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 ml-3 sm:ml-5 pl-3 space-y-3 relative border-l-2 border-theme-accent/40">
                    {comment.replies.map((reply) => (
                      <article key={reply.id} className="bg-theme-subtle rounded-lg p-3.5 shadow-2xs border border-theme">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <img
                              src={reply.avatar}
                              alt={reply.author}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10"
                            />
                            <div className="flex flex-col">
                              <span className="font-label-lg text-xs text-theme-main font-semibold">
                                {reply.author}
                              </span>
                              <span className="font-marginalia text-[10px] text-theme-subtle">
                                {reply.timeLocation}
                              </span>
                            </div>
                          </div>
                          <span className="font-marginalia text-[10px] text-theme-accent font-sans font-medium tracking-wider">
                            {reply.thesisTag}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-theme-body leading-relaxed mt-1">
                          {reply.content.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>

                        <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-theme">
                          <button
                            onClick={() => handleToggleAssent(reply.id, comment.id)}
                            className={`flex items-center gap-1 text-[11px] font-medium py-0.5 px-2 rounded cursor-pointer ${
                              reply.userAssented ? 'text-theme-accent bg-theme-accent-light' : 'text-theme-subtle hover:text-theme-main'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[13px]">thumb_up</span>
                            <span>{reply.assents} {isAmharic ? 'መውደዶች' : 'Likes'}</span>
                          </button>

                          <button
                            onClick={() => handlePrepareReply(`@${reply.author.replace(/\s+/g, '')} `)}
                            className="font-label-md text-[10px] uppercase font-semibold text-theme-muted hover:text-theme-accent cursor-pointer"
                          >
                            {isAmharic ? `ለ${reply.author.split(' ')[0]} መልስ ስጥ` : `Reply to ${reply.author.split(' ')[0]}`}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Contemplative Silence Card */}
        <div className="bg-theme-surface rounded-xl p-5 sm:p-6 text-center flex flex-col items-center border border-theme shadow-xs">
          <span className="material-symbols-outlined text-theme-accent text-[28px] mb-1">auto_stories</span>
          <h3 className="font-serif text-[17px] text-theme-main font-normal">
            {isAmharic ? 'የውይይቱ መጨረሻ' : 'End of Discussion Thread'}
          </h3>
          <p className="text-xs text-theme-muted max-w-md mt-1 mb-3">
            {isAmharic 
              ? 'የዚህን ውይይት መጨረሻ ላይ ደርሰዋል። በውይይቱ ለመሳተፍ የእርስዎን ሃሳብ ከታች ያጋሩ።' 
              : 'You have reached the end of this discussion. Share your perspective below to join the conversation.'}
          </p>
          <button
            onClick={() => handlePrepareReply('')}
            className="px-4 py-2 bg-theme-accent text-white rounded-lg font-label-md text-xs uppercase tracking-wider hover:bg-theme-accent-hover cursor-pointer shadow-xs transition-colors"
          >
            {isAmharic ? 'መልስ ጻፍ' : 'Write a Response'}
          </button>
        </div>
      </div>

      {/* Sticky Inscription Dock: Aligns with discussion column, transparent background, elevated composition bar */}
      <div className="fixed bottom-16 md:bottom-4 lg:bottom-6 left-0 right-0 z-30 pointer-events-none px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl xl:max-w-3xl mx-auto w-full pointer-events-auto">
          <form onSubmit={handleSubmitContribution} className="flex flex-col gap-1.5">
            {/* Active Context Pill when quoting */}
            {quotedContext && (
              <div className="flex items-center justify-between px-4 py-1.5 bg-theme-surface rounded-full text-theme-muted text-xs font-marginalia border border-theme shadow-md">
                <span className="truncate flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-theme-accent">format_quote</span>
                  <span className="italic truncate">{quotedContext}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setQuotedContext(null)}
                  className="hover:text-theme-main ml-2 cursor-pointer"
                  aria-label={isAmharic ? 'ጥቅስ አስወግድ' : 'Remove quote context'}
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            )}

            {/* Elevated Centered Composition Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-theme-surface rounded-full px-3.5 sm:px-5 py-1.5 sm:py-2 shadow-xl hover:shadow-2xl border border-theme transition-all">
              <button
                type="button"
                onClick={() => onShowToast(isAmharic ? 'የጥቅስ ረዳት' : 'Scripture reference helper')}
                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full text-theme-subtle hover:text-theme-accent hover:bg-theme-subtle cursor-pointer transition-colors shrink-0"
                title={isAmharic ? 'ምንጭ ወይም ጥቅስ ረዳት' : 'Cite Scripture or Historical Source'}
              >
                <span className="material-symbols-outlined text-[19px]">menu_book</span>
              </button>
              <button
                type="button"
                onClick={() => onShowToast(isAmharic ? 'ማስታወሻ ጨምር' : 'Add note or reference')}
                className="min-w-[34px] min-h-[34px] flex items-center justify-center rounded-full text-theme-subtle hover:text-theme-accent hover:bg-theme-subtle cursor-pointer transition-colors shrink-0"
                title={isAmharic ? 'ማስታወሻ ወይም ማጣቀሻ ጨምር' : 'Add Reference or Footnote'}
              >
                <span className="material-symbols-outlined text-[19px]">attachment</span>
              </button>

              <textarea
                id="colloquium-dock-input"
                rows={1}
                value={replyInput}
                onChange={(e) => {
                  setReplyInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitContribution(e);
                  }
                }}
                placeholder={isAmharic ? 'የእርስዎን አስተያየት፣ ጥያቄ ወይም ጥቅስ እዚህ ያጋሩ...' : 'Share your perspective, question, or quote...'}
                className="flex-1 bg-transparent border-0 text-[13px] sm:text-sm text-theme-main placeholder:text-theme-text-muted placeholder:opacity-85 placeholder:italic focus:outline-none py-2.5 sm:py-3 px-2 sm:px-2.5 resize-none font-serif leading-relaxed max-h-28"
              />

              <button
                type="submit"
                disabled={!replyInput.trim()}
                aria-label={isAmharic ? 'መልስ አስገባ' : 'Submit Response'}
                className={`min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center rounded-full transition-all shrink-0 ${
                  replyInput.trim()
                    ? 'bg-theme-accent text-white hover:bg-theme-accent-hover shadow-md active:scale-95 cursor-pointer'
                    : 'bg-theme-subtle text-theme-subtle cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
