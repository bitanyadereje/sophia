import React, { useState, useEffect } from 'react';
import { Book, DialecticComment, ScreenId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ColloquiumViewProps {
  book?: Book;
  comments: DialecticComment[];
  onAddComment: (comment: DialecticComment) => void;
  onBack?: () => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
}

interface BookSeminarData {
  bookId: string;
  categoryTag: string;
  citationLabel: string;
  authorName: string;
  authorTitle: string;
  authorAvatar: string;
  thesisTitle: string;
  thesisSubtitle: string;
  narrativeText: string[];
  scriptureQuote: string;
  scriptureCitation: string;
  concludingPrompt: string;
  citationsCount: number;
  initialComments: DialecticComment[];
}

const buildSeminarData = (book: Book | undefined, comments: DialecticComment[]): BookSeminarData => ({
  bookId: book?.id ?? '',
  categoryTag: book?.language ? book.language.toUpperCase() : 'General',
  citationLabel: book?.title ?? 'Seminar',
  authorName: 'Sophia Community',
  authorTitle: 'Reader-led discussion',
  authorAvatar: '',
  thesisTitle: book ? `Reading ${book.title}` : 'Book Seminar',
  thesisSubtitle: book
    ? `${book.title} by ${book.author_name}`
    : 'A shared discussion of the text',
  narrativeText: book?.description
    ? [book.description]
    : ['This seminar brings together readers of this text to discuss its themes and arguments.'],
  scriptureQuote: '',
  scriptureCitation: '',
  concludingPrompt: 'What did you find most striking in this text?',
  citationsCount: 0,
  initialComments: comments,
});

export const ColloquiumView: React.FC<ColloquiumViewProps> = ({
  book,
  comments,
  onAddComment,
  onBack,
  onNavigate,
  onShowToast
}) => {
  const { isAmharic } = useLanguage();
  const seminarData: BookSeminarData = buildSeminarData(book, comments);

  const [citationsCount, setCitationsCount] = useState(seminarData.citationsCount);
  const [hasCited, setHasCited] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [localComments, setLocalComments] = useState<DialecticComment[]>(() => {
    return seminarData.initialComments && seminarData.initialComments.length > 0
      ? seminarData.initialComments
      : comments;
  });

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
      author: 'Reader',
      role: 'Member',
      timeLocation: 'Just now · Member',
      thesisTag: `Response #${localComments.length + 1}`,
      avatar: '',
      assents: 0,
      userAssented: false,
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
                      {isAmharic ? 'ስለዚህ ውይይት ሴሚናር' : 'About This Discussion Seminar'}
                    </h2>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-theme-accent-light text-theme-accent border border-theme">
                      {isAmharic ? 'የተመረጠ ውይይት' : 'Featured Discussion'}
                    </span>
                  </div>

                  <p className="text-theme-body leading-relaxed text-[13px]">
                    {isAmharic
                      ? 'ይህ ሴሚናር በአንድ መጽሐፍ ላይ ያተኮረ ጥልቅ የንባብ ውይይት ነው።'
                      : 'This seminar is an in-depth reading discussion centered on a single book.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-theme-subtle/80 p-3 rounded-lg border border-theme text-xs">
                    <div>
                      <span className="font-semibold text-theme-main block mb-0.5">
                        {isAmharic ? '💬 የማህበረሰብ ጥያቄዎች vs ሴሚናር:' : '💬 Community Q&A vs. Seminar:'}
                      </span>
                      <p className="text-theme-muted text-[11px] leading-relaxed">
                        {isAmharic
                          ? 'በማህበረሰብ ጥያቄዎች አባላት ሰፊ ጥያቄዎችን ይጠይቃሉ። በሴሚናሩ ውስጥ የተወሰነ ጽሑፍ እናጠናለን።'
                          : 'In Discussions & Q&A, members ask broad questions. In a Seminar, we examine key themes in one specific text.'}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-theme-main block mb-0.5">
                        {isAmharic ? '📜 እንዴት እንደሚሳተፉ:' : '📜 How to Participate:'}
                      </span>
                      <p className="text-theme-muted text-[11px] leading-relaxed">
                        {isAmharic
                          ? 'የተመረጠውን ክፍል ያንብቡ፣ ምላሾችን ይመልከቱ፣ ማለቂያ ላይ የራስዎን ሃሳብ ይጻፉ።'
                          : 'Read the featured passage, review responses, and share your own thoughts in the box below.'}
                      </p>
                    </div>
                  </div>

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
                          : (isAmharic ? 'የውይይት ፅንሰ-ሀሳቦችን እይ' : 'View Discussion Concepts')}
                      </span>
                    </button>

                    {showGlossary && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-theme-subtle p-2.5 rounded-lg border border-theme text-[11px] text-theme-muted">
                        <div>
                          <strong className="text-theme-main">{isAmharic ? 'ማዕከላዊ ጥያቄ:' : 'Central Question:'}</strong>{' '}
                          {isAmharic
                            ? 'የዚህ ጽሑፍ ዋና ጥያቄ ምንድን ነው?'
                            : 'What is the central argument of this text?'}
                        </div>
                        <div>
                          <strong className="text-theme-main">{isAmharic ? 'መውደዶች:' : 'Likes & Endorsements:'}</strong>{' '}
                          {isAmharic
                            ? 'ለጥሩ ክርክር አድናቆት ያሳያል።'
                            : 'Shows appreciation for clear reasoning and sound evidence.'}
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

        <article className="bg-theme-surface rounded-xl p-5 sm:p-7 shadow-xs border border-theme">
          <div className="flex items-center gap-2 mb-3 text-xs text-theme-muted">
            <span className="font-semibold uppercase tracking-wider text-[11px] bg-theme-subtle px-2.5 py-0.5 rounded border border-theme">
              {seminarData.categoryTag}
            </span>
            <span>·</span>
            <span className="font-serif italic text-theme-main font-semibold">
              {book ? `${book.title} (${seminarData.citationLabel})` : seminarData.citationLabel}
            </span>
          </div>

          <div className="flex items-center justify-between pb-3 border-b border-theme mb-4">
            <div className="flex items-center gap-2.5">
              {seminarData.authorAvatar ? (
                <img
                  src={seminarData.authorAvatar}
                  alt={seminarData.authorName}
                  className="w-9 h-9 rounded-full object-cover shadow-2xs border border-black/10"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-sm">
                  {seminarData.authorName.charAt(0)}
                </div>
              )}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-theme-main font-semibold">
                    {seminarData.authorName}
                  </span>
                </div>
                <span className="text-xs text-theme-muted">
                  {seminarData.authorTitle}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="font-serif text-[22px] sm:text-[26px] font-bold text-theme-main leading-snug">
              {seminarData.thesisTitle}
            </h1>
            <p className="text-sm text-theme-muted mt-1 leading-normal">
              {seminarData.thesisSubtitle}
            </p>
          </div>

          <div className="space-y-3 text-theme-body text-[14px] sm:text-[15px] leading-relaxed">
            {seminarData.narrativeText.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}

            {seminarData.scriptureQuote && (
              <div className="bg-theme-subtle rounded-lg p-4 my-3 border-l-2 border-theme-accent">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-theme-accent text-[20px] mt-0.5">format_quote</span>
                  <div className="flex flex-col">
                    <blockquote className="font-serif text-[15px] sm:text-[16px] leading-relaxed text-theme-main italic">
                      "{seminarData.scriptureQuote}"
                    </blockquote>
                    <span className="text-[10px] sm:text-[11px] text-theme-subtle mt-2 uppercase tracking-widest font-semibold">
                      {seminarData.scriptureCitation}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {seminarData.concludingPrompt && (
              <p className="font-semibold text-theme-main font-serif italic pt-1">
                {isAmharic ? 'የውይይት ጥያቄ:' : 'Colloquium Question:'} {seminarData.concludingPrompt}
              </p>
            )}
          </div>

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

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[17px] sm:text-[19px] text-theme-main font-bold tracking-tight">
                {isAmharic ? 'የሴሚናር ውይይት እና ምላሾች' : 'Seminar Discussion & Responses'}
              </h2>
              <span className="uppercase text-theme-accent tracking-widest font-semibold text-xs">
                {localComments.length} {isAmharic ? 'ምላሾች' : 'Responses'}
              </span>
            </div>
          </div>

          {localComments.length === 0 ? (
            <div className="text-center py-8 bg-theme-surface rounded-xl border border-theme">
              <span className="material-symbols-outlined text-theme-subtle text-3xl">forum</span>
              <p className="text-sm font-serif font-bold text-theme-main mt-2">
                {isAmharic ? 'እስካሁን ምላሽ የለም' : 'No responses yet'}
              </p>
              <p className="text-xs text-theme-muted mt-1">
                {isAmharic ? 'የመጀመሪያውን ምላሽ ይስጡ።' : 'Be the first to respond.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {localComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-theme-surface rounded-xl p-4 sm:p-5 border border-theme shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      {comment.avatar ? (
                        <img
                          src={comment.avatar}
                          alt={comment.author}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-black/10"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-sm">
                          {comment.author.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-label-lg text-sm text-theme-main font-semibold">
                            {comment.author}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-theme-subtle text-theme-muted border border-theme">
                            {comment.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-theme-subtle">
                          {comment.timeLocation}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-theme-muted font-medium">
                      {comment.thesisTag}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-theme-body leading-relaxed">
                    {comment.content.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  {comment.referenceFolio && (
                    <div className="pl-3 pr-4 py-2 bg-theme-subtle rounded-md text-theme-muted border-l-2 border-theme-accent">
                      <span className="italic text-xs">
                        {comment.referenceFolio}
                      </span>
                    </div>
                  )}

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
                        onClick={() => handleQuote(comment.author, comment.content[0]?.slice(0, 60) || '')}
                        className="flex items-center gap-1 text-theme-muted hover:bg-theme-subtle py-1 px-2 rounded text-xs font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">format_quote</span>
                        <span>{isAmharic ? 'ጥቀስ' : 'Quote'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handlePrepareReply(`@${comment.author.replace(/\s+/g, '')} `)}
                      className="text-xs uppercase tracking-wider text-theme-accent font-semibold hover:text-theme-main cursor-pointer"
                    >
                      {isAmharic ? 'መልስ ስጥ' : 'Reply'}
                    </button>
                  </div>

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 ml-3 sm:ml-5 pl-3 space-y-3 relative border-l-2 border-theme-accent/40">
                      {comment.replies.map((reply) => (
                        <article key={reply.id} className="bg-theme-subtle rounded-lg p-3.5 shadow-2xs border border-theme">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {reply.avatar ? (
                                <img
                                  src={reply.avatar}
                                  alt={reply.author}
                                  className="w-7 h-7 rounded-full object-cover ring-1 ring-black/10"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-xs">
                                  {reply.author.charAt(0)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-label-lg text-xs text-theme-main font-semibold">
                                  {reply.author}
                                </span>
                                <span className="text-[10px] text-theme-subtle">
                                  {reply.timeLocation}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-theme-accent font-medium tracking-wider">
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
                              className="text-[10px] uppercase font-semibold text-theme-muted hover:text-theme-accent cursor-pointer"
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
          )}
        </section>
      </div>

      <div className="fixed bottom-16 md:bottom-4 lg:bottom-6 left-0 right-0 z-30 pointer-events-none px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl xl:max-w-3xl mx-auto w-full pointer-events-auto">
          <form onSubmit={handleSubmitContribution} className="flex flex-col gap-1.5">
            {quotedContext && (
              <div className="flex items-center justify-between px-4 py-1.5 bg-theme-surface rounded-full text-theme-muted text-xs border border-theme shadow-md">
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
                className="flex-1 bg-transparent border-0 text-[13px] sm:text-sm text-theme-main placeholder:text-theme-muted placeholder:opacity-85 placeholder:italic focus:outline-none py-2.5 sm:py-3 px-2 sm:px-2.5 resize-none font-serif leading-relaxed max-h-28"
              />

              <button
                type="submit"
                disabled={!replyInput.trim()}
                aria-label={isAmharic ? 'መልስ አስገባ' : 'Submit Response'}
                className={`min-w-[36px] min-h-[36px] sm:min-w-[38px] sm:min-h-[38px] flex items-center justify-center rounded-full transition-all shrink-0 ${
                  replyInput.trim()
                    ? 'bg-theme-accent text-white hover:bg-theme-accent/90 shadow-md active:scale-95 cursor-pointer'
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