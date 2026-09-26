import React, { useState } from 'react';
import { Book, Question, ReadingPath, Note, ScreenId } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  books?: Book[];
  questions: Question[];
  paths: ReadingPath[];
  notes: Note[];
  onNavigate: (screen: ScreenId) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  books: _books = [],
  questions,
  paths,
  notes,
  onNavigate
}) => {
  const { isAmharic } = useLanguage();
  const [term, setTerm] = useState('');

  if (!isOpen) return null;

  const q = term.toLowerCase().trim();

  const matchedQuestions = q
    ? questions.filter((qu) => qu.title.toLowerCase().includes(q) || qu.body.toLowerCase().includes(q))
    : questions.slice(0, 3);

  const matchedPaths = q
    ? paths.filter((p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
    : paths.slice(0, 3);

  const matchedNotes = q
    ? notes.filter((n) => n.text.toLowerCase().includes(q) || n.bookTitle.toLowerCase().includes(q))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/50">
      <div className="w-full max-w-xl bg-theme-surface rounded-2xl shadow-2xl border border-theme overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-theme flex items-center gap-3 bg-theme-subtle">
          <span className="material-symbols-outlined text-theme-subtle text-[22px]">search</span>
          <input
            type="text"
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={isAmharic ? 'የንባብ መንገዶችን፣ ጥያቄዎችን፣ ውይይቶችን እና ማስታወሻዎችን ፈልግ...' : 'Search reading paths, questions, discussions, and notes...'}
            className="flex-1 bg-transparent text-sm text-theme-main placeholder:text-theme-subtle focus:outline-none"
          />
          {term && (
            <button onClick={() => setTerm('')} className="text-theme-subtle hover:text-theme-main cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-label-md uppercase font-semibold text-theme-muted hover:text-theme-main cursor-pointer ml-1"
          >
            {isAmharic ? 'ዝጋ' : 'Esc'}
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Questions & Discussions */}
          {matchedQuestions.length > 0 && (
            <div>
              <span className="font-label-md text-[10px] uppercase font-bold text-theme-accent block mb-2">
                {isAmharic ? 'ውይይቶች እና ጥያቄዎች' : 'Discussions & Questions'} ({matchedQuestions.length})
              </span>
              <div className="space-y-1.5">
                {matchedQuestions.map((qItem) => (
                  <button
                    key={qItem.id}
                    onClick={() => {
                      onClose();
                      onNavigate('colloquium');
                    }}
                    className="w-full p-2.5 rounded-lg hover:bg-theme-subtle text-left flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-[18px] text-theme-subtle group-hover:text-theme-accent">
                        forum
                      </span>
                      <div className="min-w-0">
                        <span className="font-serif text-xs sm:text-sm font-bold text-theme-main block truncate">
                          {qItem.title}
                        </span>
                        <span className="text-[11px] text-theme-muted truncate">
                          {qItem.author} · {qItem.responsesCount} {isAmharic ? 'ምላሾች' : 'responses'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-theme-subtle">chevron_right</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Paths */}
          {matchedPaths.length > 0 && (
            <div>
              <span className="font-label-md text-[10px] uppercase font-bold text-theme-accent block mb-2">
                {isAmharic ? 'የንባብ መንገዶች' : 'Reading Paths'} ({matchedPaths.length})
              </span>
              <div className="space-y-1.5">
                {matchedPaths.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onNavigate('path-detail');
                    }}
                    className="w-full p-2.5 rounded-lg hover:bg-theme-subtle text-left flex items-center justify-between group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="material-symbols-outlined text-[18px] text-theme-subtle group-hover:text-theme-accent">
                        alt_route
                      </span>
                      <div className="min-w-0">
                        <span className="font-serif text-xs sm:text-sm font-bold text-theme-main block truncate">
                          {p.title}
                        </span>
                        <span className="text-[11px] text-theme-muted truncate">
                          {p.category} · {p.timeLeft}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-theme-accent">{p.percentage}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {matchedNotes.length > 0 && (
            <div>
              <span className="font-label-md text-[10px] uppercase font-bold text-theme-accent block mb-2">
                {isAmharic ? 'ማስታወሻዎች እና ጥቅሶች' : 'Notes & Quotes'} ({matchedNotes.length})
              </span>
              <div className="space-y-1.5">
                {matchedNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onClose();
                      onNavigate('notes');
                    }}
                    className="w-full p-2.5 rounded-lg hover:bg-theme-subtle text-left flex items-start gap-2.5 group cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-theme-subtle group-hover:text-theme-accent mt-0.5">
                      edit_note
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-serif text-xs font-semibold text-theme-main block truncate">
                        {n.bookTitle} · {n.location}
                      </span>
                      <p className="text-[11px] text-theme-muted italic line-clamp-2 mt-0.5">{n.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
