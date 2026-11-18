import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Clock,
  ImagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Book, Difficulty, ReadingPath, ScreenId } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import {
  addBooksToPath,
  createReadingPath,
  deleteReadingPath,
  loadReadingPathBooks,
  loadMyReadingPaths,
  loadReadingPaths,
  NewPathStopInput,
  updateReadingPath,
} from '../path.service';
import { useBookmarks } from '../../saved/useBookmarks';
import { RouteSketch } from './RouteSketch';
import { formatReadTime, StationStatus, TrailMap, TrailStation } from './TrailMap';

interface PathsViewProps {
  isDetailView: boolean;
  selectedPathId?: string | null;
  onSelectPath: (pathId: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onShowToast: (msg: string) => void;
  userId: string | null;
  canCreatePaths: boolean;
  onSelectBook: (bookId: string) => void;
  books: Book[];
  isAdmin?: boolean;
  bookStatuses?: Record<string, string>;
  onCreateBook?: (input: {
    title: string;
    author: string;
    language: string;
    page_count: number;
    coverFile?: File | null;
  }) => Promise<{ ok: boolean; bookId?: string; error?: string }>;
}

const PAGES_PER_HOUR = 40;

const toStationStatus = (status?: string): StationStatus => {
  if (status === 'finished' || status === 'read') return 'finished';
  if (status === 'reading') return 'reading';
  return 'todo';
};

const difficultyLabel = (difficulty: string | null | undefined, isAmharic: boolean) => {
  const key = (difficulty ?? '').toLowerCase();
  const labels: Record<string, { en: string; am: string }> = {
    beginner: { en: 'Beginner', am: 'ጀማሪ' },
    intermediate: { en: 'Intermediate', am: 'መካከለኛ' },
    advanced: { en: 'Advanced', am: 'ከፍተኛ' },
  };
  if (!labels[key]) return isAmharic ? 'አልተገለጸም' : 'Not specified';
  return isAmharic ? labels[key].am : labels[key].en;
};

const BTN_BASE =
  'inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-4 font-sans text-sm font-semibold transition-colors';
const BTN_PRIMARY = `${BTN_BASE} bg-theme-accent text-theme-surface hover:opacity-90`;
const BTN_SECONDARY = `${BTN_BASE} border border-theme bg-theme-surface text-theme-main hover:bg-theme-subtle`;
const BTN_SAVED = `${BTN_BASE} border border-theme-accent/40 bg-theme-accent-light text-theme-accent hover:opacity-90`;
const BADGE =
  'rounded-md border border-theme bg-theme-subtle px-2.5 py-0.5 font-sans text-xs font-semibold text-theme-accent';

// =========================================================================
// REUSABLE THEME-AWARE POPOVER SELECT
// =========================================================================
interface PopoverOption<T extends string> {
  value: T;
  label: string;
}

interface FilterPopoverSelectProps<T extends string> {
  prefix: string;
  value: T;
  options: PopoverOption<T>[];
  onChange: (value: T) => void;
  align?: 'left' | 'right';
}

function FilterPopoverSelect<T extends string>({
  prefix,
  value,
  options,
  onChange,
  align = 'right',
}: FilterPopoverSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-xl border bg-theme-surface px-3.5 font-sans text-xs transition-colors ${
          open
            ? 'border-theme-accent text-theme-main'
            : 'border-theme text-theme-muted hover:border-theme-accent/60 hover:text-theme-main'
        }`}
      >
        <span className="whitespace-nowrap">
          <span>{prefix}: </span>
          <strong className="font-semibold text-theme-main">{currentLabel}</strong>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-theme-muted transition-transform duration-150 ${
            open ? 'rotate-180 text-theme-accent' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={prefix}
          className={`absolute top-full z-30 mt-1.5 min-w-[176px] overflow-hidden rounded-xl border border-theme bg-theme-surface p-1 shadow-xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left font-sans text-xs transition-colors ${
                    isSelected
                      ? 'bg-theme-accent-light font-semibold text-theme-accent'
                      : 'font-medium text-theme-body hover:bg-theme-subtle hover:text-theme-main'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={13} className="shrink-0 text-theme-accent" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const PathsView: React.FC<PathsViewProps> = ({
  isDetailView,
  selectedPathId,
  onSelectPath,
  onNavigate,
  onShowToast,
  userId,
  canCreatePaths,
  onSelectBook,
  books,
  bookStatuses,
  onCreateBook,
}) => {
  const { isAmharic } = useLanguage();
  const queryClient = useQueryClient();

  const { data: paths = [], isPending: isPathsPending } = useQuery({
    queryKey: ['paths'],
    queryFn: loadReadingPaths,
  });

  const { data: myPaths = [], isPending: areMyPathsPending } = useQuery({
    queryKey: ['my-reading-paths', userId],
    queryFn: () => loadMyReadingPaths(userId!),
    enabled: Boolean(userId),
  });

  const { isSaved, toggle: toggleSave } = useBookmarks(userId, 'path', onShowToast);

  // Active trail selection (defaults to first saved path or first available path)
  const [enrolledPathId, setEnrolledPathId] = useState<string | null>(null);
  const effectiveEnrolledPath = useMemo(() => {
    if (enrolledPathId) {
      const found = paths.find((p) => p.id === enrolledPathId);
      if (found) return found;
    }
    const firstSaved = paths.find((p) => isSaved(p.id));
    return firstSaved ?? paths[0] ?? null;
  }, [enrolledPathId, paths, isSaved]);

  const selectedSubmissionPath = useMemo(
    () => myPaths.find((path) => path.id === selectedPathId) ?? null,
    [myPaths, selectedPathId],
  );

  const activePath =
    paths.find((path) => path.id === selectedPathId) ?? selectedSubmissionPath ?? effectiveEnrolledPath;

  // Load stations for the Detail View path
  const { data: detailPathBooks = [], isPending: areDetailBooksPending } = useQuery({
    queryKey: ['reading-path-books', activePath?.id],
    queryFn: () => loadReadingPathBooks(activePath!.id),
    enabled: isDetailView && Boolean(activePath?.id),
  });

  // Load stations for the Active Trail hero card on the List View
  const { data: heroPathBooks = [], isPending: areHeroBooksPending } = useQuery({
    queryKey: ['reading-path-books', effectiveEnrolledPath?.id],
    queryFn: () => loadReadingPathBooks(effectiveEnrolledPath!.id),
    enabled: !isDetailView && Boolean(effectiveEnrolledPath?.id),
  });

  // Discovery filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'All' | 'Patristic' | 'Monastic' | 'Historical'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | Difficulty>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title'>('newest');

  // Create Path Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPath, setEditingPath] = useState<ReadingPath | null>(null);
  const [selectedStops, setSelectedStops] = useState<NewPathStopInput[]>([]);
  const [bookSearch, setBookSearch] = useState('');
  const [newPath, setNewPath] = useState({
    title: '',
    description: '',
    topic: '',
    difficulty: 'beginner' as Difficulty,
  });

  // Quick-add book inside modal
  const [isNewBookOpen, setIsNewBookOpen] = useState(false);
  const [createdBooks, setCreatedBooks] = useState<Record<string, { title: string; author_name: string }>>({});
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookLanguage, setNewBookLanguage] = useState('en');
  const [newPageCount, setNewPageCount] = useState('');
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isAddingBook, setIsAddingBook] = useState(false);

  useEffect(() => {
    if (!newCoverFile) {
      setCoverPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(newCoverFile);
    setCoverPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [newCoverFile]);

  const resetNewBookForm = () => {
    setNewBookTitle('');
    setNewBookAuthor('');
    setNewBookLanguage('en');
    setNewPageCount('');
    setNewCoverFile(null);
    setIsNewBookOpen(false);
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onShowToast(isAmharic ? 'እባክዎ ምስል ይምረጡ።' : 'Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onShowToast(isAmharic ? 'ምስሉ ከ5MB መብለጥ የለበትም።' : 'Image must be 5 MB or smaller.');
      return;
    }
    setNewCoverFile(file);
  };

  const handleAddNewBook = async () => {
    if (isAddingBook) return;
    if (!userId) {
      onShowToast(isAmharic ? 'መጽሐፍ ለመጨመር ይግቡ።' : 'Please sign in to add a book.');
      return;
    }

    const title = (newBookTitle || bookSearch).trim();
    const author = newBookAuthor.trim();
    const pageCount = Number(newPageCount);

    if (!title || !author) {
      onShowToast(isAmharic ? 'የመጽሐፉን ርዕስ እና ደራሲ ያስገቡ።' : 'Enter the book title and author.');
      return;
    }
    if (!newPageCount.trim() || !Number.isInteger(pageCount) || pageCount < 1) {
      onShowToast(isAmharic ? 'የገጾች ብዛት ያስገቡ።' : 'Please enter the number of pages.');
      return;
    }
    if (!onCreateBook) {
      onShowToast('Adding books is not connected.');
      return;
    }

    setIsAddingBook(true);
    try {
      const result = await onCreateBook({
        title,
        author,
        language: newBookLanguage,
        page_count: pageCount,
        coverFile: newCoverFile,
      });
      if (!result.ok || !result.bookId) {
        throw new Error(result.error || 'Could not add the book.');
      }

      const createdId = result.bookId;
      setCreatedBooks((current) => ({ ...current, [createdId]: { title, author_name: author } }));
      setSelectedStops((current) =>
        current.some((s) => s.bookId === createdId) ? current : [...current, { bookId: createdId, note: '' }],
      );
      setBookSearch('');
      resetNewBookForm();
      onShowToast(isAmharic ? 'መጽሐፉ ተጨምሯል' : 'Book added to the path.');
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Could not add the book.');
    } finally {
      setIsAddingBook(false);
    }
  };

  const createPathMutation = useMutation({
    mutationFn: async () => {
      const path = await createReadingPath(
        userId!,
        newPath.title.trim(),
        newPath.description.trim(),
        newPath.topic.trim(),
        newPath.difficulty,
      );
      await addBooksToPath(path.id, selectedStops);
      return path;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['paths'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reading-paths'] }),
        queryClient.invalidateQueries({ queryKey: ['books'] }),
      ]);
      setIsCreateModalOpen(false);
      setNewPath({ title: '', description: '', topic: '', difficulty: 'beginner' });
      setSelectedStops([]);
      setCreatedBooks({});
      setBookSearch('');
      resetNewBookForm();
      onShowToast(
        isAmharic
          ? 'የንባብ መንገዱ ለግምገማ ተልኳል።'
          : 'Reading path submitted for admin review.',
      );
    },
    onError: (error) => {
      onShowToast(error instanceof Error ? error.message : 'Could not create reading path.');
    },
  });

  const updatePathMutation = useMutation({
    mutationFn: () =>
      updateReadingPath(
        editingPath!.id,
        {
          title: newPath.title,
          description: newPath.description,
          topic: newPath.topic,
          difficulty: newPath.difficulty,
        },
        selectedStops,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['paths'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reading-paths'] }),
      ]);
      setIsCreateModalOpen(false);
      setEditingPath(null);
      setSelectedStops([]);
      onShowToast(isAmharic ? 'የንባብ መንገዱ ለድጋሚ ግምገማ ተልኳል።' : 'Reading path updated and resubmitted for review.');
    },
    onError: (error) => onShowToast(error instanceof Error ? error.message : 'Could not update reading path.'),
  });

  const deletePathMutation = useMutation({
    mutationFn: deleteReadingPath,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['paths'] }),
        queryClient.invalidateQueries({ queryKey: ['my-reading-paths'] }),
      ]);
      onShowToast(isAmharic ? 'የንባብ መንገዱ ተሰርዟል።' : 'Reading path deleted.');
    },
    onError: (error) => onShowToast(error instanceof Error ? error.message : 'Could not delete reading path.'),
  });

  const openEditPath = async (path: ReadingPath) => {
    try {
      const pathBooks = await loadReadingPathBooks(path.id);
      setEditingPath(path);
      setNewPath({
        title: path.title,
        description: path.description ?? '',
        topic: path.topic,
        difficulty: (path.difficulty ?? 'beginner') as Difficulty,
      });
      setSelectedStops(
        pathBooks.map((row) => ({ bookId: row.book_id, note: row.note ?? '' })),
      );
      setIsCreateModalOpen(true);
    } catch (error) {
      onShowToast(error instanceof Error ? error.message : 'Could not load reading path for editing.');
    }
  };

  const buildStations = (rows: typeof detailPathBooks): TrailStation[] =>
    [...rows]
      .sort((a, b) => a.position - b.position)
      .map((pathBook) => {
        const book = Array.isArray(pathBook.book) ? pathBook.book[0] : pathBook.book;
        return {
          id: String(pathBook.book_id),
          bookId: book?.id ?? null,
          position: pathBook.position,
          title: book?.title || 'Untitled book',
          author: book?.author_name || undefined,
          pages: Number(book?.page_count ?? 0),
          note: pathBook.note || undefined,
          status: toStationStatus(bookStatuses?.[String(pathBook.book_id)]),
        };
      });

  const openPath = (pathId: string) => {
    onSelectPath(pathId);
    onNavigate('path-detail');
  };

  const canManageActivePath = Boolean(
    userId &&
      activePath &&
      activePath.creator_id === userId &&
      (activePath.status === 'pending' || activePath.status === 'rejected'),
  );

  const handleSetActiveTrail = (pathId: string) => {
    setEnrolledPathId(pathId);
    if (!isSaved(pathId) && userId) {
      toggleSave(pathId);
    } else {
      onShowToast(isAmharic ? 'ንቁ የንባብ መንገድ ሆኗል' : 'Set as your active trail');
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || selectedTopic !== 'All' || selectedDifficulty !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedTopic('All');
    setSelectedDifficulty('all');
    setSortBy('newest');
  };

  const filteredPaths = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = paths.filter((path) => {
      if (q) {
        const matchesText =
          path.title.toLowerCase().includes(q) ||
          path.topic.toLowerCase().includes(q) ||
          (path.description ?? '').toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      if (selectedDifficulty !== 'all' && (path.difficulty ?? '').toLowerCase() !== selectedDifficulty) {
        return false;
      }

      if (selectedTopic === 'Patristic') {
        return path.topic.toLowerCase().includes('patristic') || path.title.toLowerCase().includes('father');
      }
      if (selectedTopic === 'Monastic') {
        return path.topic.toLowerCase().includes('monastic') || path.title.toLowerCase().includes('monastic');
      }
      if (selectedTopic === 'Historical') {
        return (
          path.topic.toLowerCase().includes('theology') ||
          path.topic.toLowerCase().includes('civic') ||
          path.topic.toLowerCase().includes('historical') ||
          path.title.toLowerCase().includes('augustine')
        );
      }
      return true;
    });

    if (sortBy === 'title') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [paths, searchQuery, selectedTopic, selectedDifficulty, sortBy]);

  const matchingBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    return books
      .filter(
        (book) =>
          !selectedStops.some((s) => s.bookId === book.id) &&
          (!q ||
            book.title.toLowerCase().includes(q) ||
            (book.author_name ?? '').toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [books, bookSearch, selectedStops]);

  const moveStop = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedStops.length) return;
    setSelectedStops((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const updateStopNote = (bookId: string, note: string) => {
    setSelectedStops((prev) => prev.map((s) => (s.bookId === bookId ? { ...s, note } : s)));
  };

  const levelOptions: PopoverOption<'all' | Difficulty>[] = [
    { value: 'all', label: isAmharic ? 'ሁሉም ደረጃዎች' : 'Any level' },
    { value: 'beginner', label: isAmharic ? 'ጀማሪ' : 'Beginner' },
    { value: 'intermediate', label: isAmharic ? 'መካከለኛ' : 'Intermediate' },
    { value: 'advanced', label: isAmharic ? 'ከፍተኛ' : 'Advanced' },
  ];

  const sortOptions: PopoverOption<'newest' | 'title'>[] = [
    { value: 'newest', label: isAmharic ? 'አዲስ' : 'Newest' },
    { value: 'title', label: isAmharic ? 'በፊደል' : 'A–Z' },
  ];

  // =========================================================================
  // DETAIL VIEW: TRAIL OF BOOKS
  // =========================================================================
  if (isDetailView) {
    if (!activePath) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-theme-app pt-16 font-sans text-sm text-theme-muted">
          {isPathsPending ? 'Loading reading path...' : 'Reading path not found.'}
        </div>
      );
    }

    const stations = buildStations(detailPathBooks);
    const finishedCount = stations.filter((s) => s.status === 'finished').length;
    const totalPages = stations.reduce((sum, s) => sum + s.pages, 0);
    const remainingPages = stations
      .filter((s) => s.status !== 'finished')
      .reduce((sum, s) => sum + s.pages, 0);
    const estimatedRemainingHours =
      remainingPages > 0 ? Math.max(0.5, Math.round((remainingPages / PAGES_PER_HOUR) * 2) / 2) : 0;
    const isCurrentActive = effectiveEnrolledPath?.id === activePath.id;
    const pathSaved = isSaved(activePath.id);

    return (
      <div className="flex min-h-screen flex-col bg-theme-app pt-16 pb-28 text-theme-body transition-colors duration-200 md:pb-16">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:max-w-5xl lg:px-8">
          {/* Top bar navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => onNavigate('paths')} className={BTN_SECONDARY}>
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>{isAmharic ? 'ሁሉም የንባብ መንገዶች' : 'All reading paths'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSetActiveTrail(activePath.id)}
                aria-pressed={isCurrentActive}
                className={isCurrentActive ? BTN_SAVED : BTN_PRIMARY}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isCurrentActive ? 'check' : 'directions_walk'}
                </span>
                <span>
                  {isCurrentActive
                    ? isAmharic
                      ? 'ንቁ መንገድ'
                      : 'Active trail'
                    : isAmharic
                    ? 'ይህን መንገድ ጀምር'
                    : 'Walk this path'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => toggleSave(activePath.id)}
                aria-pressed={pathSaved}
                className={pathSaved ? BTN_SAVED : BTN_SECONDARY}
              >
                {pathSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                <span>{pathSaved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={() => onShowToast(isAmharic ? 'የንባብ መርሃ-ግብር ተገልብጧል' : 'Reading plan itinerary copied')}
                className={`${BTN_SECONDARY} w-10 px-0`}
                aria-label={isAmharic ? 'የንባብ እቅዱን አጋራ' : 'Share reading plan'}
                title={isAmharic ? 'የንባብ እቅዱን አጋራ' : 'Share reading plan'}
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>

              {canManageActivePath && (
                <>
                  <button
                    type="button"
                    onClick={() => void openEditPath(activePath)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-theme bg-theme-surface text-theme-main transition-colors hover:bg-theme-subtle"
                    aria-label={isAmharic ? 'የንባብ መንገዱን አርትዕ' : 'Edit reading path'}
                    title={isAmharic ? 'የንባብ መንገዱን አርትዕ' : 'Edit reading path'}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete “${activePath.title}”?`)) {
                        deletePathMutation.mutate(activePath.id, {
                          onSuccess: () => onNavigate('paths'),
                        });
                      }
                    }}
                    disabled={deletePathMutation.isPending}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/40 bg-theme-surface text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    aria-label={isAmharic ? 'የንባብ መንገዱን ሰርዝ' : 'Delete reading path'}
                    title={isAmharic ? 'የንባብ መንገዱን ሰርዝ' : 'Delete reading path'}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Path header & computed metrics */}
          <header className="flex flex-col gap-4 rounded-2xl border border-theme bg-theme-surface p-6 shadow-xs sm:p-7 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              {activePath.topic && <span className={BADGE}>{activePath.topic}</span>}
              <span className="rounded-md border border-theme px-2.5 py-0.5 font-sans text-xs font-semibold text-theme-muted">
                {difficultyLabel(activePath.difficulty, isAmharic)}
              </span>
            </div>

            <div>
              <h1 className="font-serif text-[32px] font-semibold leading-[1.1] text-theme-main sm:text-[36px]">
                {activePath.title}
              </h1>
              {activePath.description && (
                <p className="mt-2.5 max-w-2xl font-serif text-[17px] leading-relaxed text-theme-body">
                  {activePath.description}
                </p>
              )}
            </div>

            {/* Derived itinerary metrics */}
            {stations.length > 0 && (
              <div className="mt-1 grid grid-cols-2 gap-3 border-t border-theme pt-4 sm:grid-cols-4">
                <div>
                  <span className="font-sans text-xs text-theme-muted">
                    {isAmharic ? 'ጠቅላላ መጻሕፍት' : 'Stations'}
                  </span>
                  <p className="mt-0.5 font-serif text-lg font-semibold text-theme-main">
                    {stations.length} {isAmharic ? 'መጻሕፍት' : 'books'}
                  </p>
                </div>
                <div>
                  <span className="font-sans text-xs text-theme-muted">
                    {isAmharic ? 'ጠቅላላ ገጾች' : 'Total length'}
                  </span>
                  <p className="mt-0.5 font-serif text-lg font-semibold text-theme-main">
                    {totalPages > 0 ? `${totalPages.toLocaleString()} pp` : '—'}
                  </p>
                </div>
                <div>
                  <span className="font-sans text-xs text-theme-muted">
                    {isAmharic ? 'የቀረ ግምታዊ ጊዜ' : 'Est. remaining'}
                  </span>
                  <p className="mt-0.5 font-serif text-lg font-semibold text-theme-main">
                    {totalPages === 0
                      ? '—'
                      : remainingPages === 0
                      ? isAmharic
                        ? 'ተጠናቋል'
                        : 'Complete'
                      : `~${estimatedRemainingHours} hr`}
                  </p>
                </div>
                <div>
                  <span className="font-sans text-xs text-theme-muted">
                    {isAmharic ? 'ሂደት' : 'Progress'}
                  </span>
                  <p className="mt-0.5 font-serif text-lg font-semibold text-theme-accent">
                    {finishedCount} / {stations.length} {isAmharic ? 'ተነብቧል' : 'finished'}
                  </p>
                </div>
              </div>
            )}
          </header>

          {/* Interactive SVG Trail Map */}
          <section className="flex flex-col gap-3" aria-labelledby="itinerary-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="itinerary-heading" className="font-serif text-2xl font-semibold text-theme-main">
                  {isAmharic ? 'የንባብ መርሃ-ግብር' : 'Reading trail'}
                </h2>
                <p className="mt-1 font-sans text-[13px] text-theme-muted">
                  {isAmharic
                    ? 'እያንዳንዱ ጣቢያ አንድ መጽሐፍ ነው። ዝርዝሩን ለማየት ይምረጡ።'
                    : 'Each stop is a book in recommended order. Select a station on the map to inspect.'}
                </p>
              </div>
              <p className="flex items-center gap-4 font-sans text-[13px] text-theme-muted" aria-hidden="true">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-theme-accent" />
                  {isAmharic ? 'ተነብቧል' : 'Finished'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-theme-accent" />
                  {isAmharic ? 'እያነበብኩ ነው' : 'Reading'}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-theme" />
                  {isAmharic ? 'አልተጀመረም' : 'Not started'}
                </span>
              </p>
            </div>

            {areDetailBooksPending ? (
              <p className="py-8 text-center font-sans text-sm text-theme-muted">Loading books...</p>
            ) : stations.length === 0 ? (
              <article className="rounded-xl border border-theme bg-theme-surface p-5 shadow-xs">
                <p className="font-serif text-[17px] leading-relaxed text-theme-body">
                  No books have been added to this reading path yet.
                </p>
              </article>
            ) : (
              <>
                <div className="rounded-2xl border border-theme bg-theme-surface p-4 shadow-xs sm:p-6">
                  <TrailMap stations={stations} isAmharic={isAmharic} onOpenBook={onSelectBook} />
                </div>

                {/* Ordered Station Cards */}
                <div className="mt-2 flex flex-col gap-3">
                  <h3 className="font-serif text-xl font-semibold text-theme-main">
                    {isAmharic ? 'የጣቢያዎች ዝርዝር' : 'Curated reading order'}
                  </h3>
                  <ol className="flex flex-col gap-3">
                    {stations.map((station) => {
                      const isDone = station.status === 'finished';
                      const isReading = station.status === 'reading';
                      return (
                        <li
                          key={station.id}
                          className={`rounded-2xl border p-5 transition-colors ${
                            isReading
                              ? 'border-theme-accent/60 bg-theme-surface shadow-xs'
                              : 'border-theme bg-theme-surface'
                          }`}
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3.5">
                              <span
                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-sans text-xs font-bold ${
                                  isDone
                                    ? 'border-theme-accent bg-theme-accent text-theme-surface'
                                    : isReading
                                    ? 'border-theme-accent bg-theme-accent-light text-theme-accent'
                                    : 'border-theme bg-theme-subtle text-theme-muted'
                                }`}
                              >
                                {isDone ? <Check size={14} /> : station.position}
                              </span>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-sans text-xs font-medium text-theme-muted">
                                    {isAmharic ? 'ጣቢያ' : 'Station'} {station.position}
                                  </span>
                                  {isReading && (
                                    <span className={BADGE}>
                                      {isAmharic ? 'እያነበብኩ ነው' : 'Reading now'}
                                    </span>
                                  )}
                                  {isDone && (
                                    <span className="rounded-md border border-theme bg-theme-subtle px-2 py-0.5 font-sans text-xs font-medium text-theme-muted">
                                      {isAmharic ? 'ተነብቧል' : 'Finished'}
                                    </span>
                                  )}
                                </div>

                                <h4 className="mt-1 font-serif text-xl font-semibold text-theme-main">
                                  {station.bookId ? (
                                    <button
                                      type="button"
                                      onClick={() => onSelectBook(station.bookId!)}
                                      className="cursor-pointer text-left hover:text-theme-accent"
                                    >
                                      {station.title}
                                    </button>
                                  ) : (
                                    station.title
                                  )}
                                </h4>

                                <p className="mt-0.5 flex flex-wrap items-center gap-2 font-sans text-[13px] text-theme-muted">
                                  {station.author && <span>{station.author}</span>}
                                  {station.pages > 0 && (
                                    <>
                                      <span>·</span>
                                      <span className="inline-flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatReadTime(station.pages, isAmharic)}
                                      </span>
                                    </>
                                  )}
                                </p>

                                {station.note && (
                                  <blockquote className="mt-3 rounded-xl border border-theme bg-theme-subtle/70 px-3.5 py-2.5 font-serif text-[15px] italic leading-relaxed text-theme-body">
                                    “{station.note}”
                                  </blockquote>
                                )}
                              </div>
                            </div>

                            {station.bookId && (
                              <button
                                type="button"
                                onClick={() => onSelectBook(station.bookId!)}
                                className={`${BTN_SECONDARY} shrink-0 self-start`}
                              >
                                <BookOpen size={15} />
                                <span>{isAmharic ? 'መጽሐፉን ክፈት' : 'Open book'}</span>
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LIST VIEW
  // =========================================================================
  const heroStations = buildStations(heroPathBooks);
  const heroFinishedCount = heroStations.filter((s) => s.status === 'finished').length;
  const heroReadingIdx = heroStations.findIndex((s) => s.status === 'reading');
  const heroTodoIdx = heroStations.findIndex((s) => s.status === 'todo');
  const heroActiveStationNum =
    heroReadingIdx >= 0 ? heroReadingIdx + 1 : heroTodoIdx >= 0 ? heroTodoIdx + 1 : heroStations.length;
  const heroProgressPct =
    heroStations.length > 0 ? Math.round((heroFinishedCount / heroStations.length) * 100) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-theme-app pt-16 pb-28 text-theme-body transition-colors duration-200 md:pb-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:max-w-5xl lg:px-8">
        {/* Clean Page Header */}
        <header className="border-b border-theme pb-4">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-theme-accent">
            {isAmharic ? 'የተመራ ጥናት' : 'Guided Study'}
          </p>
          <h1 className="mt-1 font-serif text-[32px] font-semibold leading-[1.1] text-theme-main sm:text-[36px]">
            {isAmharic ? 'የንባብ መንገዶች' : 'Reading Paths'}
          </h1>
          <p className="page-subtitle mt-1.5 max-w-2xl font-serif text-[17px] italic leading-snug text-theme-muted">
            {isAmharic
              ? 'በቀደምት የገዳማውያን፣ የአበው እና የመንፈሳዊ ጽሑፎች ጉዞ አንድ ጣቢያ በአንድ ጊዜ ይራመዱ።'
              : 'Walk through early monasticism, patristics, and spiritual classics, one stop at a time.'}
          </p>
        </header>

        {/* Active Trail Hero Card — Compact vertical footprint */}
        {effectiveEnrolledPath && (
          <section aria-label={isAmharic ? 'በአሁኑ ጊዜ የተመዘገቡበት' : 'Active trail'}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => openPath(effectiveEnrolledPath.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPath(effectiveEnrolledPath.id);
                }
              }}
              className="group cursor-pointer rounded-2xl border border-theme bg-theme-surface p-4 shadow-xs transition-colors hover:border-theme-accent/60 sm:px-6 sm:py-4"
            >
              {/* Top metadata row — clean 3-tier hierarchy, zero crowding */}
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-theme bg-theme-accent-light px-2.5 py-0.5 font-sans text-[11px] font-semibold text-theme-accent">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-theme-accent motion-reduce:animate-none" />
                    {isAmharic ? 'ንቁ መንገድ' : 'Active trail'}
                  </span>

                  <span className="inline-flex shrink-0 items-center gap-1 font-sans text-xs font-semibold text-theme-accent transition-transform group-hover:translate-x-0.5">
                    <span>{isAmharic ? 'የንባብ እቅዱን ክፈት' : 'Open reading plan'}</span>
                    <ArrowRight size={14} />
                  </span>
                </div>

                <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-theme-main transition-colors group-hover:text-theme-accent">
                  {effectiveEnrolledPath.title}
                </h2>

                <p className="mt-1 font-sans text-xs text-theme-muted">
                  {heroStations.length > 0 && (
                    <>
                      {isAmharic
                        ? `ጣቢያ ${heroActiveStationNum} ከ ${heroStations.length}`
                        : `Station ${heroActiveStationNum} of ${heroStations.length}`}
                      {' · '}
                    </>
                  )}
                  {effectiveEnrolledPath.topic} · {difficultyLabel(effectiveEnrolledPath.difficulty, isAmharic)}
                </p>
              </div>

              {/* Compact Interactive TrailMap */}
              <div
                className="mt-2"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                {areHeroBooksPending ? (
                  <div className="py-3">
                    <RouteSketch difficulty={effectiveEnrolledPath.difficulty} className="w-full max-w-sm" />
                  </div>
                ) : heroStations.length > 0 ? (
                  <TrailMap compact stations={heroStations} isAmharic={isAmharic} onOpenBook={onSelectBook} />
                ) : (
                  <div className="py-2">
                    <RouteSketch difficulty={effectiveEnrolledPath.difficulty} className="w-full max-w-sm" />
                  </div>
                )}
              </div>

              {/* Bottom progress bar */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-theme pt-3">
                <div className="flex min-w-[200px] flex-1 items-center gap-3">
                  <span className="whitespace-nowrap font-sans text-xs font-semibold text-theme-main">
                    {heroStations.length > 0
                      ? isAmharic
                        ? `${heroFinishedCount} ከ ${heroStations.length} መጻሕፍት ተነብበዋል`
                        : `${heroFinishedCount} of ${heroStations.length} books finished`
                      : isAmharic
                      ? 'የንባብ እቅዱን ይመልከቱ'
                      : 'Explore stations'}
                  </span>
                  {heroStations.length > 0 && (
                    <div className="h-1.5 w-full max-w-[180px] overflow-hidden rounded-full bg-theme-subtle">
                      <div
                        className="h-full rounded-full bg-theme-accent transition-all duration-300"
                        style={{ width: `${heroProgressPct}%` }}
                      />
                    </div>
                  )}
                </div>

                <span className="font-sans text-xs text-theme-muted">
                  {isAmharic ? 'ዝርዝሩን ለማየት ጣቢያ ይምረጡ' : 'Select a stop to inspect'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Discover Trails Section */}
        <section className="flex flex-col gap-4 pt-1" aria-labelledby="all-plans-heading">
          <div>
            <h2 id="all-plans-heading" className="font-serif text-2xl font-semibold text-theme-main">
              {isAmharic ? 'የንባብ መንገዶችን ያግኙ' : 'Discover trails'}
            </h2>
            <p className="mt-0.5 font-sans text-[13px] text-theme-muted">
              {isAmharic
                ? 'በርዕስ፣ በርዕሰ ጉዳይ ወይም በደረጃ ይፈልጉ።'
                : 'Search by title or topic, or narrow by level.'}
            </p>
          </div>

          {/* Independent Bordered Controls + Custom Popover Dropdowns */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <label className="relative flex min-h-11 flex-1 items-center rounded-xl border border-theme bg-theme-surface transition-colors focus-within:border-theme-accent">
              <Search size={16} className="pointer-events-none ml-3.5 shrink-0 text-theme-muted" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAmharic
                    ? 'በርዕስ ወይም በርዕሰ ጉዳይ ይፈልጉ...'
                    : 'Search reading plans by title, topic or description...'
                }
                className="w-full bg-transparent px-3 py-2 font-sans text-sm text-theme-main placeholder:text-theme-muted focus:outline-none"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2.5">
              <FilterPopoverSelect<'newest' | 'title'>
                prefix={isAmharic ? 'ቅደም ተከተል' : 'Sort'}
                value={sortBy}
                options={sortOptions}
                onChange={(val) => setSortBy(val)}
                align="right"
              />

              <FilterPopoverSelect<'newest' | 'title'>
                prefix={isAmharic ? 'ቅደም ተከተል' : 'Sort'}
                value={sortBy}
                options={sortOptions}
                onChange={(val) => setSortBy(val)}
                align="right"
              />
            </div>
          </div>

          {/* Soft Ghost Topic Tabs + Result Count & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {(['All', 'Patristic', 'Monastic', 'Historical'] as const).map((filter) => {
                const active = selectedTopic === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedTopic(filter)}
                    aria-pressed={active}
                    className={`min-h-8 cursor-pointer whitespace-nowrap rounded-lg border px-3 font-sans text-xs font-semibold transition-colors ${
                      active
                        ? 'border-theme-accent/40 bg-theme-accent-light text-theme-accent'
                        : 'border-transparent bg-transparent text-theme-muted hover:bg-theme-subtle hover:text-theme-main'
                    }`}
                  >
                    {filter === 'All'
                      ? isAmharic
                        ? 'ሁሉም ርዕሶች'
                        : 'All topics'
                      : filter === 'Patristic'
                      ? isAmharic
                        ? 'የአበው'
                        : 'Patristic'
                      : filter === 'Monastic'
                      ? isAmharic
                        ? 'የገዳማውያን'
                        : 'Monastic'
                      : isAmharic
                      ? 'ታሪካዊ'
                      : 'Historical'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 font-sans text-xs text-theme-muted">
              <span>
                {filteredPaths.length} {isAmharic ? 'የንባብ እቅዶች' : 'reading plans'}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex cursor-pointer items-center gap-1 font-semibold text-theme-accent hover:underline"
                >
                  <RotateCcw size={12} />
                  <span>{isAmharic ? 'አጽዳ' : 'Reset'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid of Trail Cards */}
          {isPathsPending ? (
            <p className="py-8 text-center font-sans text-sm text-theme-muted">Loading reading paths...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPaths.map((path) => {
                const saved = isSaved(path.id);
                return (
                  <article
                    key={path.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openPath(path.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openPath(path.id);
                      }
                    }}
                    className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-theme bg-theme-surface shadow-xs transition-colors hover:border-theme-accent/60"
                  >
                    <div className="bg-theme-subtle px-4 pt-4">
                      <RouteSketch difficulty={path.difficulty} className="w-full" />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={BADGE}>{path.topic}</span>
                        <span className="font-sans text-[13px] text-theme-muted">
                          {difficultyLabel(path.difficulty, isAmharic)}
                        </span>
                      </div>
                      <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-theme-main">
                        {path.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 font-serif text-[15px] leading-relaxed text-theme-body">
                        {path.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSave(path.id);
                          }}
                          aria-pressed={saved}
                          className={
                            saved
                              ? 'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-theme-accent/40 bg-theme-accent-light px-3 font-sans text-xs font-semibold text-theme-accent transition-colors hover:opacity-90'
                              : 'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-theme bg-theme-surface px-3 font-sans text-xs font-semibold text-theme-main transition-colors hover:bg-theme-subtle'
                          }
                        >
                          {saved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                          <span>{saved ? (isAmharic ? 'ተቀምጧል' : 'Saved') : isAmharic ? 'አስቀምጥ' : 'Save'}</span>
                        </button>
                        <span className="inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-theme-accent">
                          <span>{isAmharic ? 'ለዝርዝር ይክፈቱ' : 'Open for details'}</span>
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!isPathsPending && filteredPaths.length === 0 && (
            <div className="rounded-xl border border-theme bg-theme-surface py-12 text-center font-serif text-[15px] italic text-theme-muted">
              {isAmharic ? 'ለዚህ ማጣሪያ ምንም የንባብ እቅድ አልተገኘም።' : 'No reading plans found for this filter.'}
            </div>
          )}

          {userId && (
            <section className="mt-8 border-t border-theme pt-7" aria-labelledby="my-submissions-heading">
              <h2 id="my-submissions-heading" className="font-serif text-2xl font-semibold text-theme-main">
                {isAmharic ? 'ያቀረቧቸው የንባብ መንገዶች' : 'Your submissions'}
              </h2>
              <p className="mt-1 font-sans text-sm text-theme-muted">
                {isAmharic ? 'የግምገማ ሁኔታን እና የአስተዳዳሪ ማስታወሻዎችን ይመልከቱ።' : 'Track review decisions and administrator notes.'}
              </p>
              {areMyPathsPending ? (
                <p className="py-5 font-sans text-sm text-theme-muted">Loading your submissions...</p>
              ) : myPaths.length === 0 ? (
                <p className="mt-4 rounded-xl border border-theme bg-theme-surface p-4 font-sans text-sm text-theme-muted">You have not submitted a reading path yet.</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {myPaths.map((path) => {
                    const statusStyle = path.status === 'approved' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700' : path.status === 'rejected' ? 'border-red-500/40 bg-red-500/10 text-red-700' : 'border-amber-500/40 bg-amber-500/10 text-amber-700';
                    return (
                      <article
                        key={path.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openPath(path.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openPath(path.id);
                          }
                        }}
                        className="cursor-pointer rounded-2xl border border-theme bg-theme-surface p-5 shadow-xs transition-colors hover:border-theme-accent/60"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-lg font-semibold text-theme-main">{path.title}</h3>
                          <span className={`rounded-md border px-2.5 py-1 font-sans text-xs font-semibold capitalize ${statusStyle}`}>{path.status}</span>
                        </div>
                        {path.status === 'rejected' && (
                          <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/5 p-3 font-sans text-sm text-theme-body">
                            <strong className="text-theme-main">{isAmharic ? 'የአስተዳዳሪ ማስታወሻ፦ ' : 'Admin note: '}</strong>
                            {path.rejection_note || (isAmharic ? 'ማስታወሻ አልተሰጠም።' : 'No note was provided.')}
                          </div>
                        )}
                        {path.status === 'approved' && <p className="mt-3 font-sans text-sm text-theme-muted">{isAmharic ? 'ተቀባይነት አግኝቷል እና ታትሟል።' : 'Accepted and published for the community.'}</p>}
                        <p className="mt-4 inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-theme-accent">
                          <span>{isAmharic ? 'ዝርዝር ለማየት ካርዱን ይክፈቱ' : 'Open card to view details'}</span>
                          <ArrowRight size={14} />
                        </p>
                        {path.status === 'approved' && <p className="mt-3 font-sans text-xs text-theme-muted">{isAmharic ? 'የታተሙ መንገዶች በአስተዳዳሪ ይተዳደራሉ።' : 'Published paths are managed by an administrator.'}</p>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Secondary Contributor Callout */}
          {canCreatePaths && userId && (
            <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl border border-theme bg-theme-surface p-5 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-theme bg-theme-accent-light text-theme-accent">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-theme-main">
                    {isAmharic ? 'የራስዎን የንባብ መንገድ ያጋሩ' : 'Curate a reading path for the community'}
                  </h3>
                  <p className="mt-0.5 font-sans text-[13px] text-theme-muted">
                    {isAmharic
                      ? 'ለጀማሪዎች ወይም ለጾምና ለበዓላት ወቅቶች የተመረጡ መጻሕፍትን በቅደም ተከተል ያዘጋጁ።'
                      : 'Guide fellow readers through a topic or liturgical season in intentional order.'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => { setEditingPath(null); setNewPath({ title: '', description: '', topic: '', difficulty: 'beginner' }); setSelectedStops([]); setIsCreateModalOpen(true); }} className={`${BTN_SECONDARY} shrink-0`}>
                <Plus size={16} />
                <span>{isAmharic ? 'መንገድ ፍጠር' : 'Create path'}</span>
              </button>
            </div>
          )}

          {/* Footnote */}
          <footer className="pt-2 text-center">
            <p className="font-serif text-[15px] italic text-theme-muted">
              {isAmharic
                ? 'ለእያንዳንዱ የጾምና የበዓላት ዑደት አዳዲስ የንባብ እቅዶች እና የተመረጡ ምዕራፎች ይዘጋጃሉ።'
                : 'New reading plans and curated stations are compiled for each liturgical and contemplative cycle.'}
            </p>
          </footer>
        </section>
      </div>

      {/* =====================================================================
          TWO-COLUMN CREATE PATH MODAL (With Live Preview + Stop Notes)
      ===================================================================== */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-path-title"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (editingPath) updatePathMutation.mutate();
              else createPathMutation.mutate();
            }}
            className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-theme bg-theme-surface shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-theme px-6 py-4">
              <div>
                <h2 id="create-path-title" className="font-serif text-2xl font-semibold text-theme-main">
                  {editingPath ? (isAmharic ? 'የንባብ መንገዱን አርትዕ' : 'Edit reading path') : (isAmharic ? 'የንባብ መንገድ ፍጠር' : 'Create a reading path')}
                </h2>
                <p className="mt-0.5 font-serif text-sm italic text-theme-muted">
                  {isAmharic
                    ? 'አንባቢዎች የሚከተሉትን መጻሕፍት በቅደም ተከተል ይምረጡ።'
                    : editingPath ? 'Update the path, then submit it again for admin review.' : 'Choose books in the order readers should walk them. New paths are reviewed before they appear.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreateModalOpen(false); setEditingPath(null); }}
                aria-label="Close"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-theme text-theme-muted hover:text-theme-main"
              >
                <X size={18} />
              </button>
            </div>

            {/* Split Two-Column Body */}
            <div className="grid flex-1 overflow-y-auto md:grid-cols-[1.15fr_0.85fr]">
              {/* Left Column: Metadata & Book Picker */}
              <div className="space-y-4 border-b border-theme p-6 md:border-r md:border-b-0">
                <label className="block font-sans text-xs font-semibold text-theme-main">
                  {isAmharic ? 'ርዕስ *' : 'Title *'}
                  <input
                    required
                    maxLength={120}
                    placeholder="e.g. Desert Fathers: First Steps"
                    value={newPath.title}
                    onChange={(e) => setNewPath({ ...newPath, title: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-app px-3.5 py-2.5 font-sans text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none"
                  />
                </label>

                <label className="block font-sans text-xs font-semibold text-theme-main">
                  {isAmharic ? 'መግለጫ *' : 'Description *'}
                  <textarea
                    required
                    rows={2}
                    placeholder="An unhurried entry into early monastic voices."
                    value={newPath.description}
                    onChange={(e) => setNewPath({ ...newPath, description: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-app px-3.5 py-2.5 font-sans text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none"
                  />
                </label>

                <div>
                  <label className="block font-sans text-xs font-semibold text-theme-main">
                    {isAmharic ? 'ርዕሰ ጉዳይ *' : 'Topic *'}
                    <input
                      required
                      maxLength={80}
                      placeholder="e.g. Monastic, Patristic, Passion Week"
                      value={newPath.topic}
                      onChange={(e) => setNewPath({ ...newPath, topic: e.target.value })}
                      className="mt-1.5 w-full rounded-xl border border-theme bg-theme-app px-3.5 py-2.5 font-sans text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Patristic', 'Monastic', 'Historical', 'Liturgical'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setNewPath({ ...newPath, topic: chip })}
                        className={`cursor-pointer rounded-full border px-3 py-1 font-sans text-xs font-medium transition-colors ${
                          newPath.topic === chip
                            ? 'border-theme-accent bg-theme-accent-light text-theme-accent'
                            : 'border-theme bg-theme-app text-theme-muted hover:text-theme-main'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-sans text-xs font-semibold text-theme-main">
                    {isAmharic ? 'ደረጃ' : 'Difficulty'}
                  </span>
                  <div className="mt-1.5 grid grid-cols-3 gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((level) => {
                      const active = newPath.difficulty === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setNewPath({ ...newPath, difficulty: level })}
                          className={`cursor-pointer rounded-xl border px-3 py-2 text-center font-sans text-xs font-semibold transition-colors ${
                            active
                              ? 'border-theme-accent bg-theme-accent-light text-theme-accent'
                              : 'border-theme bg-theme-app text-theme-muted hover:text-theme-main'
                          }`}
                        >
                          {difficultyLabel(level, isAmharic)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Book Search & Picker */}
                <div className="pt-1">
                  <label htmlFor="path-book-search" className="block font-sans text-xs font-semibold text-theme-main">
                    {isAmharic ? 'መጻሕፍትን ጨምር' : 'Add books'}
                  </label>
                  <input
                    id="path-book-search"
                    type="search"
                    value={bookSearch}
                    onChange={(event) => setBookSearch(event.target.value)}
                    placeholder={isAmharic ? 'በመጽሐፍ ርዕስ ይፈልጉ...' : 'Search books by title...'}
                    className="mt-1.5 w-full rounded-xl border border-theme bg-theme-app px-3.5 py-2.5 font-sans text-sm text-theme-main placeholder:text-theme-muted focus:border-theme-accent focus:outline-none"
                  />

                  <ul className="mt-2 max-h-40 divide-y divide-theme overflow-y-auto rounded-xl border border-theme bg-theme-app">
                    {matchingBooks.length > 0 ? (
                      matchingBooks.map((book) => (
                        <li key={book.id} className="flex items-center justify-between gap-2 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate font-serif text-sm font-semibold text-theme-main">{book.title}</p>
                            {book.author_name && (
                              <p className="truncate font-sans text-xs text-theme-muted">{book.author_name}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedStops((current) => [...current, { bookId: book.id, note: '' }])
                            }
                            className="shrink-0 cursor-pointer rounded-lg border border-theme bg-theme-surface px-2.5 py-1 font-sans text-xs font-semibold text-theme-main hover:border-theme-accent hover:text-theme-accent"
                          >
                            {isAmharic ? 'ጨምር' : 'Add'}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2.5 font-sans text-xs text-theme-muted">
                        {isAmharic ? 'ተዛማጅ መጽሐፍ አልተገኘም።' : 'No matching books in catalog.'}
                      </li>
                    )}
                  </ul>

                  <button
                    type="button"
                    onClick={() => setIsNewBookOpen((v) => !v)}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1 font-sans text-xs font-semibold text-theme-accent hover:underline"
                  >
                    <Plus size={13} />
                    <span>
                      {isAmharic ? 'መጽሐፉን አላገኙትም? አዲስ መጽሐፍ ያስገቡ' : "Can't find it? Add a new book"}
                    </span>
                  </button>

                  {isNewBookOpen && (
                    <div
                      className="mt-3 space-y-3 rounded-xl border border-theme bg-theme-app p-3.5"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.preventDefault();
                      }}
                    >
                      <p className="font-sans text-xs font-semibold text-theme-main">
                        {isAmharic ? 'አዲስ መጽሐፍ ዝርዝር' : 'New catalog book details'}
                      </p>

                      <label className="block font-sans text-xs text-theme-muted">
                        {isAmharic ? 'የመጽሐፍ ርዕስ *' : 'Book title *'}
                        <input
                          value={newBookTitle || bookSearch}
                          onChange={(e) => {
                            setNewBookTitle(e.target.value);
                            setBookSearch(e.target.value);
                          }}
                          className="mt-1 w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-main"
                        />
                      </label>

                      <label className="block font-sans text-xs text-theme-muted">
                        {isAmharic ? 'ደራሲ *' : 'Author *'}
                        <input
                          value={newBookAuthor}
                          onChange={(e) => setNewBookAuthor(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-main"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="block font-sans text-xs text-theme-muted">
                          {isAmharic ? 'ቋንቋ' : 'Language'}
                          <select
                            value={newBookLanguage}
                            onChange={(e) => setNewBookLanguage(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-main"
                          >
                            <option value="en">English</option>
                            <option value="am">Amharic</option>
                            <option value="gez">Geez</option>
                            <option value="other">Other</option>
                          </select>
                        </label>

                        <label className="block font-sans text-xs text-theme-muted">
                          {isAmharic ? 'የገጾች ብዛት *' : 'Page count *'}
                          <input
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={newPageCount}
                            onChange={(e) => setNewPageCount(e.target.value)}
                            placeholder="e.g. 240"
                            className="mt-1 w-full rounded-lg border border-theme bg-theme-surface px-3 py-2 text-sm text-theme-main"
                          />
                        </label>
                      </div>

                      <div className="font-sans text-xs text-theme-muted">
                        <span className="block">
                          {isAmharic ? 'የሽፋን ፎቶ (አማራጭ)' : 'Cover photo (optional)'}
                        </span>
                        {coverPreview ? (
                          <div className="mt-2 flex items-end gap-3">
                            <img
                              src={coverPreview}
                              alt="Cover preview"
                              className="h-20 w-auto rounded border border-theme object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setNewCoverFile(null)}
                              className="text-theme-accent hover:underline"
                            >
                              {isAmharic ? 'አስወግድ' : 'Remove'}
                            </button>
                          </div>
                        ) : (
                          <label className="mt-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-theme bg-theme-surface p-2.5 hover:border-theme-accent">
                            <ImagePlus size={15} />
                            <span>{isAmharic ? 'ፎቶ ይስቀሉ' : 'Upload a photo'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverFileChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleAddNewBook()}
                        disabled={isAddingBook}
                        className={`${BTN_PRIMARY} w-full`}
                      >
                        {isAddingBook
                          ? isAmharic
                            ? 'በመጨመር ላይ...'
                            : 'Adding book...'
                          : isAmharic
                          ? 'መጽሐፉን ጨምር'
                          : 'Add book to path'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Preview & Ordered Itinerary */}
              <div className="flex flex-col bg-theme-app/60 p-6">
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-theme-muted">
                  {isAmharic ? 'ቀጥታ እይታ' : 'Live preview'}
                </span>

                <div className="mt-3 rounded-2xl border border-theme bg-theme-surface p-4 shadow-xs">
                  <div className="rounded-xl bg-theme-subtle px-3 pt-3">
                    <RouteSketch difficulty={newPath.difficulty} className="w-full" />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={BADGE}>{newPath.topic.trim() || 'Topic'}</span>
                    <span className="font-sans text-xs text-theme-muted">
                      {difficultyLabel(newPath.difficulty, isAmharic)}
                    </span>
                  </div>

                  <h3 className="mt-2 font-serif text-lg font-semibold text-theme-main">
                    {newPath.title.trim() || (isAmharic ? 'የመንገድ ርዕስ' : 'Untitled reading path')}
                  </h3>
                  <p className="mt-0.5 font-sans text-xs text-theme-muted">
                    {selectedStops.length}{' '}
                    {selectedStops.length === 1
                      ? isAmharic
                        ? 'መጽሐፍ በቅደም ተከተል'
                        : 'book in reading order'
                      : isAmharic
                      ? 'መጻሕፍት በቅደም ተከተል'
                      : 'books in reading order'}
                  </p>

                  {selectedStops.length === 0 ? (
                    <div className="mt-4 rounded-xl border border-dashed border-theme py-6 text-center font-sans text-xs text-theme-muted">
                      {isAmharic
                        ? 'ከግራ በኩል መጻሕፍትን ይምረጡ።'
                        : 'Add books from the left to build your itinerary.'}
                    </div>
                  ) : (
                    <ol className="mt-3 space-y-2.5">
                      {selectedStops.map((stop, index) => {
                        const book = books.find(({ id }) => id === stop.bookId) ?? createdBooks[stop.bookId];
                        return (
                          <li
                            key={stop.bookId}
                            className="rounded-xl border border-theme bg-theme-app p-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-theme-accent bg-theme-accent-light font-sans text-xs font-bold text-theme-accent">
                                  {index + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="truncate font-serif text-sm font-semibold text-theme-main">
                                    {book?.title ?? 'Book'}
                                  </p>
                                  {book?.author_name && (
                                    <p className="truncate font-sans text-[11px] text-theme-muted">
                                      {book.author_name}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => moveStop(index, -1)}
                                  aria-label="Move up"
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-theme bg-theme-surface text-theme-muted hover:text-theme-main disabled:opacity-30"
                                >
                                  <ArrowUp size={13} />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === selectedStops.length - 1}
                                  onClick={() => moveStop(index, 1)}
                                  aria-label="Move down"
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-theme bg-theme-surface text-theme-muted hover:text-theme-main disabled:opacity-30"
                                >
                                  <ArrowDown size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedStops((current) =>
                                      current.filter((s) => s.bookId !== stop.bookId),
                                    )
                                  }
                                  aria-label="Remove book"
                                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-theme bg-theme-surface text-theme-muted hover:text-theme-main"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={stop.note ?? ''}
                              onChange={(e) => updateStopNote(stop.bookId, e.target.value)}
                              placeholder={
                                isAmharic
                                  ? 'አጭር ማስታወሻ (አማራጭ፣ ለምሳሌ፦ ምዕራፍ 1–4 ያንብቡ)'
                                  : 'Curator note (optional — e.g. Read chapters 1–4 first)'
                              }
                              className="mt-2 w-full rounded-lg border border-theme bg-theme-surface px-2.5 py-1.5 font-sans text-xs text-theme-body placeholder:text-theme-muted focus:border-theme-accent focus:outline-none"
                            />
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-theme bg-theme-surface px-6 py-3.5">
              <span className="font-sans text-xs text-theme-muted">
                {isAmharic
                  ? 'መንገዶች ከመታተማቸው በፊት በአስተዳዳሪ ይገመገማሉ።'
                  : 'Paths are reviewed by an admin before becoming public.'}
              </span>
              <div className="flex items-center gap-2.5">
                <button type="button" onClick={() => { setIsCreateModalOpen(false); setEditingPath(null); }} className={BTN_SECONDARY}>
                  {isAmharic ? 'ተወው' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={createPathMutation.isPending || updatePathMutation.isPending || isAddingBook || selectedStops.length === 0}
                  className={`${BTN_PRIMARY} disabled:opacity-50`}
                >
                  {createPathMutation.isPending || updatePathMutation.isPending
                    ? isAmharic
                      ? 'በመላክ ላይ…'
                      : 'Submitting…'
                    : isAmharic
                    ? editingPath ? 'እንደገና ላክ' : 'ለግምገማ ላክ'
                    : editingPath ? 'Resubmit for review' : 'Submit for review'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
