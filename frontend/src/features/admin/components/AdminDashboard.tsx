import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  GitMerge,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { Book, Difficulty, ReadingPath, UserProfile, VerificationStatus } from '../../../types';
import {
  difficulties,
  deleteAdminBook,
  deleteAdminPath,
  grantAdminRoleByUsername,
  loadAdminBooks,
  loadAdminPaths,
  loadAdmins,
  revokeAdminRole,
  saveAdminBook,
  saveAdminPath,
  setPathReview
} from '../admin.service';
import { loadReadingPathBooks } from '../../reading-paths/path.service';

type Tab = 'review' | 'paths' | 'books' | 'admins';
type QueueFilter = 'all' | 'book' | 'path';
type AdminPathRecord = ReadingPath & { rejection_note?: string | null };
type QueueItem =
  | { key: string; kind: 'book'; data: Book }
  | { key: string; kind: 'path'; data: AdminPathRecord };

type Props = {
  userId: string | null;
  profile: UserProfile;
  onExit: () => void;
  onShowToast: (message: string) => void;
};

const REJECT_REASONS = [
  'Duplicate path',
  'Needs clearer description',
  'Too few books / incomplete',
  'Out of scope'
];

const PAGES_PER_HOUR = 40;

const field =
  'mt-1.5 w-full rounded-xl border border-theme bg-theme-app px-3.5 py-2.5 text-sm text-theme-main outline-none focus:border-theme-accent';
const statusClass = (status: string) =>
  status === 'approved' || status === 'verified'
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
    : status === 'rejected'
      ? 'bg-[#f0706d]/15 text-[#f0706d] border border-[#f0706d]/30'
      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30';

const emptyBook = (): Partial<Book> => ({
  title: '',
  author_name: '',
  description: '',
  cover_url: '',
  language: 'en',
  page_count: 0,
  verification_status: 'unverified'
});

const emptyPath = (): Partial<ReadingPath> => ({
  title: '',
  description: '',
  topic: '',
  difficulty: 'beginner'
});

export const AdminDashboard: React.FC<Props> = ({ userId, profile, onExit, onShowToast }) => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('review');

  // Tab 1: Review Queue State
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<QueueItem | null>(null);
  const [dismissedDuplicate, setDismissedDuplicate] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectedHistory, setShowRejectedHistory] = useState(false);

  // Tab 2: Reading Paths Master-Detail + Create Modal State
  const [pathSearch, setPathSearch] = useState('');
  const [pathStatusFilter, setPathStatusFilter] = useState<string>('all');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [pathInspectorDraft, setPathInspectorDraft] = useState<AdminPathRecord | null>(null);
  const [newPathModal, setNewPathModal] = useState<Partial<ReadingPath> | null>(null);

  // Tab 3: Book Catalogue Master-Detail + Create Modal State
  const [bookSearch, setBookSearch] = useState('');
  const [bookStatusFilter, setBookStatusFilter] = useState<string>('all');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [bookInspectorDraft, setBookInspectorDraft] = useState<Book | null>(null);
  const [newBookModal, setNewBookModal] = useState<Partial<Book> | null>(null);

  // Tab 4: Admins State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [confirmRemoveAdminId, setConfirmRemoveAdminId] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [removing, setRemoving] = useState<{ kind: 'book' | 'path'; id: string; title: string } | null>(null);

  const isAdmin = profile?.role === 'admin';

  const booksQuery = useQuery({
    queryKey: ['admin-books'],
    queryFn: loadAdminBooks,
    enabled: Boolean(userId && isAdmin)
  });

  const pathsQuery = useQuery({
    queryKey: ['admin-paths'],
    queryFn: loadAdminPaths,
    enabled: Boolean(userId && isAdmin)
  });

  const adminsQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: loadAdmins,
    enabled: Boolean(userId && isAdmin)
  });

  const books = booksQuery.data ?? [];
  const paths = (pathsQuery.data ?? []) as AdminPathRecord[];
  const admins = adminsQuery.data ?? [];

  const pendingPaths = useMemo(() => paths.filter((path) => path.status === 'pending'), [paths]);
  const pendingBooks = useMemo(
    () => books.filter((book) => book.verification_status === 'unverified'),
    [books]
  );

  const queueItems = useMemo<QueueItem[]>(() => {
    const combined: QueueItem[] = [
      ...pendingBooks.map((b) => ({ key: `book:${b.id}`, kind: 'book' as const, data: b })),
      ...pendingPaths.map((p) => ({ key: `path:${p.id}`, kind: 'path' as const, data: p }))
    ];
    return combined.filter((item) => (queueFilter === 'all' ? true : item.kind === queueFilter));
  }, [pendingBooks, pendingPaths, queueFilter]);

  const rejectedHistory = useMemo(() => {
    const rejectedBooks = books
      .filter((b) => b.verification_status === 'rejected')
      .map((b) => ({
        key: `book:${b.id}`,
        kind: 'book',
        title: b.title,
        note: null
      }));
    const rejectedPaths = paths
      .filter((p) => p.status === 'rejected')
      .map((p) => ({
        key: `path:${p.id}`,
        kind: 'path',
        title: p.title,
        note: p.rejection_note || 'Rejected'
      }));
    return [...rejectedPaths, ...rejectedBooks];
  }, [books, paths]);

  const activeQueueItem = useMemo(() => {
    return queueItems.find((i) => i.key === selectedKey) || queueItems[0] || null;
  }, [queueItems, selectedKey]);

  const filteredPaths = useMemo(() => {
    const q = pathSearch.toLowerCase();
    return paths.filter((p) => {
      const matchesStatus = pathStatusFilter === 'all' || p.status === pathStatusFilter;
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.topic.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [paths, pathSearch, pathStatusFilter]);

  const activeCatalogPath = useMemo(() => {
    return filteredPaths.find((p) => p.id === selectedPathId) || filteredPaths[0] || null;
  }, [filteredPaths, selectedPathId]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.toLowerCase();
    return books.filter((b) => {
      const matchesStatus = bookStatusFilter === 'all' || b.verification_status === bookStatusFilter;
      const matchesQuery =
        !q || b.title.toLowerCase().includes(q) || b.author_name.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [books, bookSearch, bookStatusFilter]);

  const activeCatalogBook = useMemo(() => {
    return filteredBooks.find((b) => b.id === selectedBookId) || filteredBooks[0] || null;
  }, [filteredBooks, selectedBookId]);

  const duplicateMatch = useMemo(() => {
    if (!draft || draft.kind !== 'book' || !draft.data?.title?.trim()) return null;
    const normalized = draft.data.title.trim().toLowerCase().slice(0, 18);
    if (normalized.length < 5) return null;
    return (
      books.find(
        (b) =>
          b.id !== draft.data.id &&
          b.verification_status === 'verified' &&
          b.title.toLowerCase().includes(normalized)
      ) || null
    );
  }, [draft, books]);

  // Sync drafts when active items change
  useEffect(() => {
    if (activeQueueItem) {
      setDraft(JSON.parse(JSON.stringify(activeQueueItem)));
      setDismissedDuplicate(false);
      setRejectOpen(false);
      setRejectReason('');
      setRejectionNote('');
    } else {
      setDraft(null);
    }
  }, [activeQueueItem?.key]);

  useEffect(() => {
    if (activeCatalogPath) {
      setPathInspectorDraft(JSON.parse(JSON.stringify(activeCatalogPath)));
    } else {
      setPathInspectorDraft(null);
    }
  }, [activeCatalogPath?.id]);

  useEffect(() => {
    if (activeCatalogBook) {
      setBookInspectorDraft(JSON.parse(JSON.stringify(activeCatalogBook)));
    } else {
      setBookInspectorDraft(null);
    }
  }, [activeCatalogBook?.id]);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-books'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-paths'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-path-stops'] }),
      queryClient.invalidateQueries({ queryKey: ['books'] }),
      queryClient.invalidateQueries({ queryKey: ['paths'] })
    ]);

  const mutation = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: () => void refresh(),
    onError: (error: Error) => onShowToast(error.message || 'That change could not be saved.')
  });

  // --- EARLY RETURNS MUST COME AFTER ALL HOOKS ---
  if (!userId) {
    return (
      <AccessState
        title="Sign in required"
        text="Please sign in with an administrator account to use this workspace."
        onExit={onExit}
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessState
        title="Administrator access required"
        text="This route is protected. Your account does not have the administrator role."
        onExit={onExit}
      />
    );
  }

  const advanceSelection = (removedKey: string) => {
    const remaining = queueItems.filter((i) => i.key !== removedKey);
    setSelectedKey(remaining.length > 0 ? remaining[0].key : null);
  };

  // Tab 1: Review Queue Actions
  const canPublish = Boolean(
    draft &&
      (draft.kind === 'book'
        ? draft.data.title?.trim() && draft.data.author_name?.trim()
        : draft.data.title?.trim() && draft.data.topic?.trim())
  );

  const handlePublish = () => {
    if (!draft) return;

    if (draft.kind === 'book') {
      if (!draft.data.title?.trim() || !draft.data.author_name?.trim()) {
        return onShowToast('Title and author are required.');
      }
      mutation.mutate(async () => {
        await saveAdminBook({
          ...draft.data,
          verification_status: 'verified'
        });
        advanceSelection(draft.key);
        onShowToast(`Verified and published “${draft.data.title.trim()}”.`);
      });
    } else {
      if (!draft.data.title?.trim() || !draft.data.topic?.trim()) {
        return onShowToast('Title and topic are required.');
      }
      mutation.mutate(async () => {
        await saveAdminPath({
          id: draft.data.id,
          title: draft.data.title,
          topic: draft.data.topic,
          difficulty: draft.data.difficulty,
          description: draft.data.description
        });
        await setPathReview(draft.data.id, 'approved', userId, null);
        advanceSelection(draft.key);
        onShowToast(`Approved and published “${draft.data.title.trim()}”.`);
      });
    }
  };

  const handleRejectClick = () => {
    if (!draft) return;
    if (draft.kind === 'book') {
      mutation.mutate(async () => {
        await saveAdminBook({
          id: draft.data.id,
          title: draft.data.title,
          author_name: draft.data.author_name,
          description: draft.data.description,
          cover_url: draft.data.cover_url,
          language: draft.data.language,
          page_count: draft.data.page_count,
          verification_status: 'rejected'
        });
        advanceSelection(draft.key);
        onShowToast(`Rejected book “${draft.data.title}”.`);
      });
    } else {
      setRejectOpen((prev) => !prev);
    }
  };

  const canConfirmPathRejection = Boolean(rejectReason.trim() || rejectionNote.trim());

  const handleConfirmPathReject = () => {
    if (!draft || draft.kind !== 'path' || !canConfirmPathRejection) return;
    const combinedNote = [rejectReason.trim(), rejectionNote.trim()].filter(Boolean).join(' — ');

    mutation.mutate(async () => {
      await setPathReview(draft.data.id, 'rejected', userId, combinedNote);
      advanceSelection(draft.key);
      setRejectOpen(false);
      setRejectReason('');
      setRejectionNote('');
      onShowToast(`Rejected reading path “${draft.data.title}”.`);
    });
  };

  const handleMergeDuplicate = () => {
    if (!draft || draft.kind !== 'book' || !duplicateMatch) return;
    mutation.mutate(async () => {
      await deleteAdminBook(draft.data.id);
      advanceSelection(draft.key);
      onShowToast(`Merged into existing book “${duplicateMatch.title}”.`);
    });
  };

  // Tab 2: Reading Path Inspector Save & Status Change
  const handleSaveCatalogPath = () => {
    if (!pathInspectorDraft) return;
    if (!pathInspectorDraft.title?.trim() || !pathInspectorDraft.topic?.trim()) {
      return onShowToast('Title and topic are required.');
    }
    mutation.mutate(async () => {
      await saveAdminPath({
        id: pathInspectorDraft.id,
        title: pathInspectorDraft.title,
        topic: pathInspectorDraft.topic,
        difficulty: pathInspectorDraft.difficulty,
        description: pathInspectorDraft.description
      });
      onShowToast(`Saved changes to “${pathInspectorDraft.title.trim()}”.`);
    });
  };

  const handleCatalogPathStatus = (status: 'approved' | 'pending' | 'rejected') => {
    if (!pathInspectorDraft) return;
    mutation.mutate(async () => {
      await setPathReview(
        pathInspectorDraft.id,
        status,
        userId,
        status === 'rejected' ? pathInspectorDraft.rejection_note || 'Rejected by administrator' : null
      );
      onShowToast(`Marked reading path as ${status}.`);
    });
  };

  // Tab 3: Book Catalogue Inspector Save
  const handleSaveCatalogBook = () => {
    if (!bookInspectorDraft) return;
    if (!bookInspectorDraft.title?.trim() || !bookInspectorDraft.author_name?.trim()) {
      return onShowToast('Title and author are required.');
    }
    mutation.mutate(async () => {
      await saveAdminBook(bookInspectorDraft);
      onShowToast(`Saved changes to “${bookInspectorDraft.title.trim()}”.`);
    });
  };

  // Create New Modal Submitters
  const submitNewBook = (event: FormEvent) => {
    event.preventDefault();
    if (!newBookModal?.title?.trim() || !newBookModal.author_name?.trim()) {
      return onShowToast('Title and author are required.');
    }
    mutation.mutate(async () => {
      await saveAdminBook(newBookModal);
      setNewBookModal(null);
      onShowToast('Book added to catalogue.');
    });
  };

  const submitNewPath = (event: FormEvent) => {
    event.preventDefault();
    if (!newPathModal?.title?.trim() || !newPathModal.topic?.trim()) {
      return onShowToast('Title and topic are required.');
    }
    mutation.mutate(async () => {
      await saveAdminPath({ ...newPathModal, creator_id: userId });
      setNewPathModal(null);
      onShowToast('Reading path created.');
    });
  };

  const confirmDelete = () => {
    if (!removing) return;
    mutation.mutate(async () => {
      if (removing.kind === 'book') {
        await deleteAdminBook(removing.id);
        if (selectedBookId === removing.id) setSelectedBookId(null);
      } else {
        await deleteAdminPath(removing.id);
        if (selectedPathId === removing.id) setSelectedPathId(null);
      }
      if (draft?.key === `${removing.kind}:${removing.id}`) {
        advanceSelection(draft.key);
      }
      setRemoving(null);
      onShowToast(`Deleted ${removing.kind}.`);
    });
  };

  // Tab 4: Add / Remove Admins
  const handleGrantAdmin = (event: FormEvent) => {
    event.preventDefault();
    if (!adminUsernameInput.trim()) return;
    mutation.mutate(async () => {
      const updated = await grantAdminRoleByUsername(adminUsernameInput.trim());
      setAdminUsernameInput('');
      setShowAddAdminModal(false);
      onShowToast(`Granted administrator role to @${updated.username}.`);
    });
  };

  const handleRevokeAdmin = (targetId: string) => {
    if (targetId === userId) return;
    mutation.mutate(async () => {
      await revokeAdminRole(targetId);
      setConfirmRemoveAdminId(null);
      onShowToast('Removed administrator role.');
    });
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-2xl border border-theme bg-theme-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-theme-accent">
            <ShieldAlert size={18} />
            <span className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
              Moderation workspace
            </span>
          </div>
          <h1 className="font-display text-3xl text-theme-main">Administration</h1>
          <p className="mt-1 text-sm text-theme-muted">
            Review community submissions and maintain the shared catalogue.
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="self-start sm:self-center inline-flex items-center justify-center gap-1.5 rounded-xl border border-theme px-4 py-2.5 text-sm font-semibold text-theme-main hover:bg-theme-subtle transition-colors"
        >
          Return to Sophia
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-6 border-b border-theme overflow-x-auto">
        <TabButton
          active={tab === 'review'}
          onClick={() => setTab('review')}
          label={`Review queue (${pendingPaths.length + pendingBooks.length})`}
        />
        <TabButton
          active={tab === 'paths'}
          onClick={() => setTab('paths')}
          label={`Reading paths (${paths.length})`}
        />
        <TabButton
          active={tab === 'books'}
          onClick={() => setTab('books')}
          label={`Book catalogue (${books.length})`}
        />
        <TabButton
          active={tab === 'admins'}
          onClick={() => setTab('admins')}
          label={`Admins (${admins.length})`}
        />
      </nav>

      {/* =================================================================== */}
      {/* TAB 1: MASTER-DETAIL REVIEW QUEUE                                   */}
      {/* =================================================================== */}
      {tab === 'review' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Queue List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-theme bg-theme-surface overflow-hidden">
              <div className="p-4 border-b border-theme flex items-center gap-2">
                {[
                  { id: 'all' as const, label: `All (${pendingBooks.length + pendingPaths.length})` },
                  { id: 'book' as const, label: `Books (${pendingBooks.length})` },
                  { id: 'path' as const, label: `Paths (${pendingPaths.length})` }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setQueueFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      queueFilter === pill.id
                        ? 'bg-[#e8b730] text-[#0d0e11]'
                        : 'bg-theme-subtle text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-theme">
                {queueItems.length === 0 ? (
                  <div className="p-12 text-center space-y-2">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                    <p className="font-display text-sm text-theme-main">Queue Clear</p>
                    <p className="text-xs text-theme-muted">
                      No items are waiting for review in this filter.
                    </p>
                  </div>
                ) : (
                  queueItems.map((item) => {
                    const isSelected = activeQueueItem?.key === item.key;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setSelectedKey(item.key)}
                        className={`p-5 transition-colors cursor-pointer border-l-2 ${
                          isSelected
                            ? 'bg-theme-subtle border-l-[#e8b730]'
                            : 'hover:bg-theme-subtle/50 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-theme-muted">
                            {item.kind === 'book' ? 'Book' : 'Reading Path'}
                          </span>
                          <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize bg-amber-500/15 text-amber-600 dark:text-amber-300">
                            {item.kind === 'book'
                              ? item.data.verification_status
                              : item.data.status}
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-theme-main leading-snug mb-1">
                          {item.data.title}
                        </h3>

                        <p className="text-xs text-theme-muted">
                          {item.kind === 'book'
                            ? `${item.data.author_name} · ${item.data.language} · ${item.data.page_count} pages`
                            : `${item.data.topic} · ${item.data.difficulty ?? 'No difficulty'}`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Collapsible Rejected History */}
            {rejectedHistory.length > 0 && (
              <div className="rounded-2xl border border-theme bg-theme-surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRejectedHistory((prev) => !prev)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-theme-subtle/50 transition-colors"
                >
                  <span className="font-mono text-xs text-theme-muted">
                    Rejected ({rejectedHistory.length})
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-theme-muted transition-transform ${
                      showRejectedHistory ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {showRejectedHistory && (
                  <div className="border-t border-theme divide-y divide-theme">
                    {rejectedHistory.map((rej) => (
                      <div key={rej.key} className="px-5 py-3.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-theme-main truncate">
                            {rej.title}
                          </span>
                          <span className="font-mono text-[10px] uppercase text-theme-muted">
                            {rej.kind}
                          </span>
                        </div>
                        {rej.note && (
                          <div className="inline-block font-mono text-[11px] text-[#f0706d] bg-[#f0706d]/10 border border-[#f0706d]/25 px-2.5 py-1 rounded-md">
                            {rej.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Detail & Inline Edit Inspector */}
          <div className="lg:col-span-8 rounded-2xl border border-theme bg-theme-surface overflow-hidden">
            {!draft ? (
              <div className="p-20 text-center space-y-3">
                <BookOpen className="w-9 h-9 text-theme-muted/50 mx-auto" />
                <h3 className="font-display text-lg text-theme-main">Nothing Awaiting Review</h3>
                <p className="text-sm text-theme-muted max-w-sm mx-auto">
                  All books and reading paths in the queue have been reviewed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-theme">
                {/* Inspector Header */}
                <div className="p-7 sm:p-8 flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-xs uppercase tracking-wider text-theme-accent">
                      {draft.kind === 'book'
                        ? 'Book Submission (unverified)'
                        : 'Reading Path Submission (pending)'}
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl text-theme-main">
                      {draft.data.title || 'Untitled Submission'}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-theme-muted">ID: {draft.data.id}</span>
                </div>

                {/* Duplicate Alert Banner */}
                {duplicateMatch && !dismissedDuplicate && (
                  <div className="px-7 sm:px-8 py-4 bg-amber-500/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-300">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          Similar verified book in catalogue: “{duplicateMatch.title}”
                        </span>
                      </div>
                      <p className="font-mono text-xs text-theme-muted pl-6">
                        {duplicateMatch.author_name} · {duplicateMatch.language} ·{' '}
                        {duplicateMatch.page_count} pages
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 pl-6 sm:pl-0 shrink-0">
                      <button
                        type="button"
                        disabled={mutation.isPending}
                        onClick={handleMergeDuplicate}
                        className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-transparent hover:bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-400/60 text-xs font-medium transition-colors"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>Merge</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissedDuplicate(true)}
                        className="h-8 px-3 rounded-lg bg-theme-subtle text-theme-muted hover:text-theme-main border border-theme text-xs"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Editable Metadata Fields */}
                <div className="p-7 sm:p-8 space-y-5">
                  <div className="flex items-center gap-2 font-mono text-xs text-theme-muted">
                    <Edit3 className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Edit fields before publishing</span>
                  </div>

                  {draft.kind === 'book' ? (
                    <BookFieldsForm
                      data={draft.data}
                      onChange={(updated) => setDraft({ ...draft, data: { ...draft.data, ...updated } })}
                    />
                  ) : (
                    <>
                      <PathFieldsForm
                        data={draft.data}
                        onChange={(updated) => setDraft({ ...draft, data: { ...draft.data, ...updated } })}
                      />
                      <PathStopsBreakdown
                        pathId={draft.data.id}
                        allBooks={books}
                        enabled={Boolean(userId && isAdmin)}
                      />
                    </>
                  )}
                </div>

                {/* Rejection Note Drawer (Reading Paths only) */}
                {draft.kind === 'path' && rejectOpen && (
                  <div className="px-7 sm:px-8 py-6 bg-[#f0706d]/[0.05] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-[#f0706d]">
                        Reject Reading Path & Record Note for Creator
                      </span>
                      <button
                        type="button"
                        onClick={() => setRejectOpen(false)}
                        className="text-xs text-theme-muted hover:text-theme-main"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {REJECT_REASONS.map((reason) => {
                        const active = rejectReason === reason;
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setRejectReason(active ? '' : reason)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                              active
                                ? 'bg-[#f0706d]/20 border-[#f0706d] text-[#f0706d]'
                                : 'bg-theme-app border-theme text-theme-muted hover:text-theme-main'
                            }`}
                          >
                            {reason}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-xs text-theme-muted mb-1.5">
                        Rejection Note
                      </label>
                      <textarea
                        rows={2}
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        placeholder="Explain to the path creator what needs improvement..."
                        className="w-full rounded-xl border border-theme bg-theme-app px-4 py-2.5 text-sm text-theme-main focus:border-[#f0706d] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setRejectOpen(false)}
                        className="h-10 px-4 rounded-xl bg-theme-subtle text-theme-muted hover:text-theme-main border border-theme text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!canConfirmPathRejection || mutation.isPending}
                        onClick={handleConfirmPathReject}
                        className="h-10 px-5 rounded-xl bg-[#f0706d] hover:bg-[#f4827f] disabled:opacity-40 disabled:pointer-events-none text-[#0d0e11] text-sm font-semibold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="px-7 sm:px-8 pt-5 pb-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setRemoving({
                        kind: draft.kind,
                        id: draft.data.id,
                        title: draft.data.title
                      })
                    }
                    aria-label={`Delete ${draft.kind}`}
                    title={`Delete ${draft.kind}`}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-xl bg-transparent text-theme-muted hover:text-[#f0706d] hover:bg-[#f0706d]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={handleRejectClick}
                      className={`h-10 inline-flex items-center justify-center gap-2 px-5 rounded-xl border border-[#f0706d] text-sm font-medium transition-colors ${
                        draft.kind === 'path' && rejectOpen
                          ? 'bg-[#f0706d]/15 text-[#f0706d]'
                          : 'bg-transparent hover:bg-[#f0706d]/10 text-[#f0706d]'
                      }`}
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={!canPublish || mutation.isPending}
                      onClick={handlePublish}
                      className="h-10 min-w-[120px] inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-[#e8b730] hover:bg-[#f0c243] disabled:opacity-40 disabled:pointer-events-none text-[#0d0e11] text-sm font-semibold transition-all"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>Publish</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* TAB 2: READING PATHS (MASTER-DETAIL)                                */}
      {/* =================================================================== */}
      {tab === 'paths' && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-theme-main">All reading paths</h2>

            <button
              type="button"
              onClick={() => setNewPathModal(emptyPath())}
              className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#e8b730] hover:bg-[#f0c243] px-4 py-2.5 text-sm font-semibold text-[#0d0e11] transition-colors"
            >
              <Plus size={16} />
              <span>New path</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Path List */}
            <div className="lg:col-span-4 rounded-2xl border border-theme bg-theme-surface overflow-hidden">
              <div className="p-4 border-b border-theme space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter title or topic..."
                    value={pathSearch}
                    onChange={(e) => setPathSearch(e.target.value)}
                    className="w-full rounded-xl border border-theme bg-theme-app pl-9 pr-3 py-2 text-xs text-theme-main outline-none focus:border-theme-accent"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'approved', 'pending', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setPathStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                        pathStatusFilter === status
                          ? 'bg-[#e8b730] text-[#0d0e11]'
                          : 'bg-theme-subtle text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-theme max-h-[68vh] overflow-y-auto">
                {filteredPaths.length === 0 ? (
                  <div className="p-10 text-center text-xs text-theme-muted">
                    No reading paths found.
                  </div>
                ) : (
                  filteredPaths.map((path) => {
                    const isSelected = activeCatalogPath?.id === path.id;
                    return (
                      <div
                        key={path.id}
                        onClick={() => setSelectedPathId(path.id)}
                        className={`p-4 transition-colors cursor-pointer border-l-2 ${
                          isSelected
                            ? 'bg-theme-subtle border-l-[#e8b730]'
                            : 'hover:bg-theme-subtle/50 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] text-theme-muted truncate">
                            {path.topic}
                          </span>
                          <Status value={path.status} />
                        </div>
                        <h3 className="text-sm font-semibold text-theme-main leading-snug">
                          {path.title}
                        </h3>
                        <p className="mt-1 font-mono text-[11px] capitalize text-theme-muted">
                          {path.difficulty ?? 'No difficulty'}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Reading Path Detail & Edit Inspector */}
            <div className="lg:col-span-8 rounded-2xl border border-theme bg-theme-surface overflow-hidden">
              {!pathInspectorDraft ? (
                <div className="p-20 text-center space-y-3">
                  <BookOpen className="w-9 h-9 text-theme-muted/50 mx-auto" />
                  <h3 className="font-display text-lg text-theme-main">No Reading Path Selected</h3>
                  <p className="text-sm text-theme-muted max-w-sm mx-auto">
                    Select a reading path on the left to inspect its books, notes, and metadata.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-theme">
                  <div className="p-7 sm:p-8 flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <Status value={pathInspectorDraft.status} />
                        <span className="font-mono text-xs text-theme-muted">
                          ID: {pathInspectorDraft.id}
                        </span>
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl text-theme-main">
                        {pathInspectorDraft.title || 'Untitled Reading Path'}
                      </h3>
                    </div>

                    {/* Quick Status Switcher */}
                    <div className="flex flex-wrap items-center gap-2">
                      {pathInspectorDraft.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={mutation.isPending}
                          onClick={() => handleCatalogPathStatus('approved')}
                          className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      )}
                      {pathInspectorDraft.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={mutation.isPending}
                          onClick={() => handleCatalogPathStatus('rejected')}
                          className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#f0706d]/10 text-[#f0706d] border border-[#f0706d]/30 text-xs font-semibold hover:bg-[#f0706d]/20 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {pathInspectorDraft.rejection_note && (
                    <div className="px-7 sm:px-8 py-3.5 bg-[#f0706d]/[0.06] font-mono text-xs text-[#f0706d]">
                      Rejection note: {pathInspectorDraft.rejection_note}
                    </div>
                  )}

                  <div className="p-7 sm:p-8 space-y-5">
                    <div className="flex items-center gap-2 font-mono text-xs text-theme-muted">
                      <Edit3 className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Path details</span>
                    </div>

                    <PathFieldsForm
                      data={pathInspectorDraft}
                      onChange={(updated) =>
                        setPathInspectorDraft({ ...pathInspectorDraft, ...updated })
                      }
                    />

                    <PathStopsBreakdown
                      pathId={pathInspectorDraft.id}
                      allBooks={books}
                      enabled={Boolean(userId && isAdmin)}
                    />
                  </div>

                  <div className="px-7 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setRemoving({
                          kind: 'path',
                          id: pathInspectorDraft.id,
                          title: pathInspectorDraft.title
                        })
                      }
                      className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold text-[#f0706d] hover:bg-[#f0706d]/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete path</span>
                    </button>

                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={handleSaveCatalogPath}
                      className="h-10 inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-[#e8b730] hover:bg-[#f0c243] disabled:opacity-40 text-[#0d0e11] text-sm font-semibold transition-colors"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{mutation.isPending ? 'Saving…' : 'Save changes'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* TAB 3: BOOK CATALOGUE (MASTER-DETAIL)                               */}
      {/* =================================================================== */}
      {tab === 'books' && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-2xl text-theme-main">Book catalogue</h2>

            <button
              type="button"
              onClick={() => setNewBookModal(emptyBook())}
              className="self-start sm:self-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#e8b730] hover:bg-[#f0c243] px-4 py-2.5 text-sm font-semibold text-[#0d0e11] transition-colors"
            >
              <Plus size={16} />
              <span>New book</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Book List */}
            <div className="lg:col-span-4 rounded-2xl border border-theme bg-theme-surface overflow-hidden">
              <div className="p-4 border-b border-theme space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-theme-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter title or author..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full rounded-xl border border-theme bg-theme-app pl-9 pr-3 py-2 text-xs text-theme-main outline-none focus:border-theme-accent"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'verified', 'unverified', 'rejected'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setBookStatusFilter(status)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                        bookStatusFilter === status
                          ? 'bg-[#e8b730] text-[#0d0e11]'
                          : 'bg-theme-subtle text-theme-muted hover:text-theme-main'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-theme max-h-[68vh] overflow-y-auto">
                {filteredBooks.length === 0 ? (
                  <div className="p-10 text-center text-xs text-theme-muted">
                    No books found.
                  </div>
                ) : (
                  filteredBooks.map((book) => {
                    const isSelected = activeCatalogBook?.id === book.id;
                    return (
                      <div
                        key={book.id}
                        onClick={() => setSelectedBookId(book.id)}
                        className={`p-4 transition-colors cursor-pointer border-l-2 ${
                          isSelected
                            ? 'bg-theme-subtle border-l-[#e8b730]'
                            : 'hover:bg-theme-subtle/50 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-mono text-[11px] uppercase text-theme-muted">
                            {book.language} · {book.page_count} pp
                          </span>
                          <Status value={book.verification_status} />
                        </div>
                        <h3 className="text-sm font-semibold text-theme-main leading-snug">
                          {book.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-theme-muted truncate">
                          {book.author_name}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Book Detail & Edit Inspector */}
            <div className="lg:col-span-8 rounded-2xl border border-theme bg-theme-surface overflow-hidden">
              {!bookInspectorDraft ? (
                <div className="p-20 text-center space-y-3">
                  <BookOpen className="w-9 h-9 text-theme-muted/50 mx-auto" />
                  <h3 className="font-display text-lg text-theme-main">No Book Selected</h3>
                  <p className="text-sm text-theme-muted max-w-sm mx-auto">
                    Select a book on the left to view or edit its catalogue record.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-theme">
                  <div className="p-7 sm:p-8 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {bookInspectorDraft.cover_url && (
                        <img
                          src={bookInspectorDraft.cover_url}
                          alt={bookInspectorDraft.title}
                          className="h-20 w-14 shrink-0 rounded-lg border border-theme object-cover bg-theme-app"
                        />
                      )}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <Status value={bookInspectorDraft.verification_status} />
                          <span className="font-mono text-xs text-theme-muted">
                            ID: {bookInspectorDraft.id}
                          </span>
                        </div>
                        <h3 className="font-display text-xl sm:text-2xl text-theme-main">
                          {bookInspectorDraft.title || 'Untitled Book'}
                        </h3>
                        <p className="text-xs text-theme-muted">
                          {bookInspectorDraft.author_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-7 sm:p-8 space-y-5">
                    <div className="flex items-center gap-2 font-mono text-xs text-theme-muted">
                      <Edit3 className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Book catalogue record</span>
                    </div>

                    <BookFieldsForm
                      data={bookInspectorDraft}
                      showVerificationSelect
                      onChange={(updated) =>
                        setBookInspectorDraft({ ...bookInspectorDraft, ...updated })
                      }
                    />
                  </div>

                  <div className="px-7 sm:px-8 py-5 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setRemoving({
                          kind: 'book',
                          id: bookInspectorDraft.id,
                          title: bookInspectorDraft.title
                        })
                      }
                      className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl text-xs font-semibold text-[#f0706d] hover:bg-[#f0706d]/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete book</span>
                    </button>

                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={handleSaveCatalogBook}
                      className="h-10 inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-[#e8b730] hover:bg-[#f0c243] disabled:opacity-40 text-[#0d0e11] text-sm font-semibold transition-colors"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{mutation.isPending ? 'Saving…' : 'Save changes'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* TAB 4: ADMINS (profiles.role === 'admin')                           */}
      {/* =================================================================== */}
      {tab === 'admins' && (
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-theme-main">Administrators</h2>
              <p className="text-xs text-theme-muted mt-0.5">
                Accounts with <code className="font-mono text-theme-accent">profile.role = &apos;admin&apos;</code>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddAdminModal(true)}
              className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e8b730] hover:bg-[#f0c243] text-[#0d0e11] text-sm font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add admin</span>
            </button>
          </div>

          <div className="rounded-2xl border border-theme bg-theme-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-theme-subtle font-mono text-xs text-theme-muted">
                    <th className="p-4">Administrator</th>
                    <th className="p-4">Username</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme text-sm">
                  {admins.map((admin) => {
                    const displayName = admin.name || admin.username;
                    const initials = displayName
                      .split(' ')
                      .map((part) => part[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const isCurrent = admin.id === userId;

                    return (
                      <tr key={admin.id} className="hover:bg-theme-subtle/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-theme-subtle border border-theme flex items-center justify-center font-display text-xs font-semibold text-theme-accent shrink-0">
                              {initials}
                            </div>
                            <div className="font-medium text-theme-main flex items-center gap-2">
                              <span>{displayName}</span>
                              {isCurrent && (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#e8b730]/15 text-[#e8b730] border border-[#e8b730]/30">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs text-theme-muted">
                          @{admin.username}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#e8b730]/10 text-[#e8b730] border border-[#e8b730]/30">
                            {admin.role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isCurrent ? (
                            <span className="font-mono text-xs text-theme-muted/60">
                              Active session
                            </span>
                          ) : confirmRemoveAdminId === admin.id ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                disabled={mutation.isPending}
                                onClick={() => handleRevokeAdmin(admin.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#f0706d] text-[#0d0e11] text-xs font-semibold"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRemoveAdminId(null)}
                                className="px-2.5 py-1 rounded-lg bg-theme-subtle text-theme-muted text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmRemoveAdminId(admin.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-mono text-theme-muted hover:text-[#f0706d] hover:bg-[#f0706d]/10 transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-theme-muted">
                        No administrators found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Creation & Confirmation Modals */}
      {newBookModal && (
        <BookFormModal
          draft={newBookModal}
          onChange={setNewBookModal}
          onClose={() => setNewBookModal(null)}
          onSubmit={submitNewBook}
          busy={mutation.isPending}
        />
      )}
      {newPathModal && (
        <PathFormModal
          draft={newPathModal}
          onChange={setNewPathModal}
          onClose={() => setNewPathModal(null)}
          onSubmit={submitNewPath}
          busy={mutation.isPending}
        />
      )}
      {removing && (
        <ConfirmDelete
          kind={removing.kind}
          onCancel={() => setRemoving(null)}
          onConfirm={confirmDelete}
          busy={mutation.isPending}
        />
      )}
      {showAddAdminModal && (
        <AddAdminModal
          username={adminUsernameInput}
          onChangeUsername={setAdminUsernameInput}
          onClose={() => setShowAddAdminModal(false)}
          onSubmit={handleGrantAdmin}
          busy={mutation.isPending}
        />
      )}
    </main>
  );
};

// =========================================================================
// REUSABLE INSPECTOR SUB-COMPONENTS
// =========================================================================

const BookFieldsForm = ({
  data,
  onChange,
  showVerificationSelect = false
}: {
  data: Partial<Book>;
  onChange: (updated: Partial<Book>) => void;
  showVerificationSelect?: boolean;
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <label className="block text-xs text-theme-muted">
      Title <span className="text-[#f0706d]">*</span>
      <input
        required
        className={field}
        value={data.title ?? ''}
        onChange={(e) => onChange({ title: e.target.value })}
      />
    </label>

    <label className="block text-xs text-theme-muted">
      Author <span className="text-[#f0706d]">*</span>
      <input
        required
        className={field}
        value={data.author_name ?? ''}
        onChange={(e) => onChange({ author_name: e.target.value })}
      />
    </label>

    <label className="block text-xs text-theme-muted">
      Language
      <input
        className={`${field} font-mono`}
        value={data.language ?? ''}
        onChange={(e) => onChange({ language: e.target.value })}
      />
    </label>

    <label className="block text-xs text-theme-muted">
      Pages
      <input
        min="0"
        type="number"
        className={`${field} font-mono`}
        value={data.page_count ?? 0}
        onChange={(e) => onChange({ page_count: Number(e.target.value) })}
      />
    </label>

    {showVerificationSelect && (
      <label className="block text-xs text-theme-muted sm:col-span-2">
        Verification status
        <select
          className={field}
          value={data.verification_status ?? 'unverified'}
          onChange={(e) =>
            onChange({ verification_status: e.target.value as VerificationStatus })
          }
        >
          <option value="unverified">Unverified</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
    )}

    <label className="block text-xs text-theme-muted sm:col-span-2">
      Cover URL
      <input
        type="url"
        placeholder="https://..."
        className={`${field} font-mono`}
        value={data.cover_url ?? ''}
        onChange={(e) => onChange({ cover_url: e.target.value })}
      />
    </label>

    <label className="block text-xs text-theme-muted sm:col-span-2">
      Description
      <textarea
        rows={3}
        className={field}
        value={data.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
      />
    </label>
  </div>
);

const PathFieldsForm = ({
  data,
  onChange
}: {
  data: Partial<ReadingPath>;
  onChange: (updated: Partial<ReadingPath>) => void;
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <label className="block text-xs text-theme-muted sm:col-span-2">
      Title <span className="text-[#f0706d]">*</span>
      <input
        required
        className={field}
        value={data.title ?? ''}
        onChange={(e) => onChange({ title: e.target.value })}
      />
    </label>

    <label className="block text-xs text-theme-muted">
      Topic <span className="text-[#f0706d]">*</span>
      <input
        required
        className={field}
        value={data.topic ?? ''}
        onChange={(e) => onChange({ topic: e.target.value })}
      />
    </label>

    <label className="block text-xs text-theme-muted">
      Difficulty
      <select
        className={`${field} capitalize`}
        value={data.difficulty ?? ''}
        onChange={(e) =>
          onChange({ difficulty: (e.target.value || null) as Difficulty | null })
        }
      >
        <option value="">Not specified</option>
        {difficulties.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </label>

    <label className="block text-xs text-theme-muted sm:col-span-2">
      Description
      <textarea
        rows={4}
        className={field}
        value={data.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
      />
    </label>
  </div>
);

const PathStopsBreakdown = ({
  pathId,
  allBooks,
  enabled
}: {
  pathId: string;
  allBooks: Book[];
  enabled: boolean;
}) => {
  const pathBooksQuery = useQuery({
    queryKey: ['admin-path-stops', pathId],
    queryFn: () => loadReadingPathBooks(pathId),
    enabled: Boolean(enabled && pathId)
  });

  const stops = useMemo(() => {
    const rows = pathBooksQuery.data ?? [];
    return [...rows]
      .sort((a, b) => a.position - b.position)
      .map((row) => {
        const joinedBook = Array.isArray(row.book) ? row.book[0] : row.book;
        const fullBook = allBooks.find((b) => b.id === row.book_id);
        return {
          position: row.position,
          bookId: row.book_id,
          title: fullBook?.title ?? joinedBook?.title ?? 'Untitled book',
          author: fullBook?.author_name ?? joinedBook?.author_name ?? '',
          language: fullBook?.language ?? '',
          pages: Number(fullBook?.page_count ?? joinedBook?.page_count ?? 0),
          verificationStatus: fullBook?.verification_status ?? 'verified',
          note: row.note ?? ''
        };
      });
  }, [pathBooksQuery.data, allBooks]);

  const metrics = useMemo(() => {
    const totalPages = stops.reduce((sum, s) => sum + s.pages, 0);
    const estHours =
      totalPages > 0 ? Math.max(0.5, Math.round((totalPages / PAGES_PER_HOUR) * 2) / 2) : 0;
    const unverifiedCount = stops.filter((s) => s.verificationStatus !== 'verified').length;
    return { totalPages, estHours, unverifiedCount };
  }, [stops]);

  return (
    <div className="pt-4 border-t border-theme space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-xs text-theme-muted">
          <BookOpen className="w-3.5 h-3.5 text-theme-accent" />
          <span>
            Curated reading order ({stops.length} {stops.length === 1 ? 'book' : 'books'})
          </span>
        </div>

        {stops.length > 0 && (
          <div className="flex items-center gap-3 font-mono text-xs text-theme-muted">
            <span>{metrics.totalPages.toLocaleString()} pages</span>
            {metrics.estHours > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />~{metrics.estHours} hr
              </span>
            )}
          </div>
        )}
      </div>

      {metrics.unverifiedCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            Includes {metrics.unverifiedCount} unverified{' '}
            {metrics.unverifiedCount === 1 ? 'book' : 'books'}. Review or verify those books in
            the Book catalogue as well.
          </span>
        </div>
      )}

      {pathBooksQuery.isPending ? (
        <p className="py-4 text-xs font-mono text-theme-muted">Loading books in this path...</p>
      ) : stops.length === 0 ? (
        <div className="rounded-xl border border-dashed border-theme bg-theme-app/60 p-4 text-xs text-theme-muted">
          No books were attached to this reading path.
        </div>
      ) : (
        <ol className="space-y-2.5">
          {stops.map((stop) => (
            <li
              key={`${stop.bookId}-${stop.position}`}
              className="rounded-xl border border-theme bg-theme-app p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-theme-accent bg-theme-accent-light font-mono text-xs font-bold text-theme-accent">
                    {stop.position}
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-base font-semibold text-theme-main leading-snug">
                      {stop.title}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-theme-muted">
                      {[
                        stop.author,
                        stop.language ? stop.language.toUpperCase() : null,
                        stop.pages > 0 ? `${stop.pages} pp` : null
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>

                <Status value={stop.verificationStatus} />
              </div>

              {stop.note && (
                <blockquote className="mt-2.5 ml-9 rounded-lg border border-theme bg-theme-surface px-3 py-2 font-serif text-xs italic leading-relaxed text-theme-body">
                  “{stop.note}”
                </blockquote>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

// =========================================================================
// SHARED UI & CREATION MODALS
// =========================================================================

const AccessState = ({
  title,
  text,
  onExit
}: {
  title: string;
  text: string;
  onExit: () => void;
}) => (
  <main className="mx-auto flex min-h-[60vh] max-w-lg flex-1 items-center px-4">
    <div className="w-full rounded-2xl border border-theme bg-theme-surface p-8 text-center">
      <ShieldAlert className="mx-auto mb-4 text-theme-accent" size={32} />
      <h1 className="font-display text-2xl text-theme-main">{title}</h1>
      <p className="mt-2 text-sm text-theme-muted">{text}</p>
      <button
        type="button"
        onClick={onExit}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#e8b730] px-4 py-2.5 text-sm font-semibold text-[#0d0e11]"
      >
        Go to home
      </button>
    </div>
  </main>
);

const TabButton = ({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`border-b-2 pb-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
      active
        ? 'border-[#e8b730] text-[#e8b730]'
        : 'border-transparent text-theme-muted hover:text-theme-main'
    }`}
  >
    {label}
  </button>
);

const Status = ({ value }: { value: string }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusClass(
      value
    )}`}
  >
    {value.replace('_', ' ')}
  </span>
);

const Modal = ({ children }: { children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-theme bg-theme-surface p-6 shadow-xl">
      {children}
    </div>
  </div>
);

const BookFormModal = ({
  draft,
  onChange,
  onClose,
  onSubmit,
  busy
}: {
  draft: Partial<Book>;
  onChange: (value: Partial<Book>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) => (
  <Modal>
    <form onSubmit={onSubmit}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-theme-main">Add book</h2>
        <button type="button" onClick={onClose} className="text-theme-muted hover:text-theme-main">
          <X />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs text-theme-muted">
          Title
          <input
            required
            className={field}
            value={draft.title ?? ''}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted">
          Author
          <input
            required
            className={field}
            value={draft.author_name ?? ''}
            onChange={(e) => onChange({ ...draft, author_name: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted">
          Language
          <input
            className={field}
            value={draft.language ?? ''}
            onChange={(e) => onChange({ ...draft, language: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted">
          Pages
          <input
            min="0"
            type="number"
            className={field}
            value={draft.page_count ?? 0}
            onChange={(e) => onChange({ ...draft, page_count: Number(e.target.value) })}
          />
        </label>
        <label className="block text-xs text-theme-muted sm:col-span-2">
          Cover URL
          <input
            type="url"
            className={field}
            value={draft.cover_url ?? ''}
            onChange={(e) => onChange({ ...draft, cover_url: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted sm:col-span-2">
          Description
          <textarea
            className={field}
            rows={3}
            value={draft.description ?? ''}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted">
          Verification
          <select
            className={field}
            value={draft.verification_status ?? 'unverified'}
            onChange={(e) =>
              onChange({ ...draft, verification_status: e.target.value as VerificationStatus })
            }
          >
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-main"
        >
          Cancel
        </button>
        <button
          disabled={busy}
          className="inline-flex items-center justify-center rounded-xl bg-[#e8b730] px-4 py-2 text-sm font-semibold text-[#0d0e11]"
        >
          {busy ? 'Saving…' : 'Save book'}
        </button>
      </div>
    </form>
  </Modal>
);

const PathFormModal = ({
  draft,
  onChange,
  onClose,
  onSubmit,
  busy
}: {
  draft: Partial<ReadingPath>;
  onChange: (value: Partial<ReadingPath>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) => (
  <Modal>
    <form onSubmit={onSubmit}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-2xl text-theme-main">New reading path</h2>
        <button type="button" onClick={onClose} className="text-theme-muted hover:text-theme-main">
          <X />
        </button>
      </div>
      <div className="grid gap-4">
        <label className="block text-xs text-theme-muted">
          Title
          <input
            required
            className={field}
            value={draft.title ?? ''}
            onChange={(e) => onChange({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted">
          Topic
          <input
            required
            className={field}
            value={draft.topic ?? ''}
            onChange={(e) => onChange({ ...draft, topic: e.target.value })}
          />
        </label>
        <label className="block text-xs text-theme-muted">
          Difficulty
          <select
            className={field}
            value={draft.difficulty ?? ''}
            onChange={(e) =>
              onChange({ ...draft, difficulty: (e.target.value || null) as Difficulty | null })
            }
          >
            <option value="">Not specified</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-theme-muted">
          Description
          <textarea
            className={field}
            rows={4}
            value={draft.description ?? ''}
            onChange={(e) => onChange({ ...draft, description: e.target.value })}
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-main"
        >
          Cancel
        </button>
        <button
          disabled={busy}
          className="inline-flex items-center justify-center rounded-xl bg-[#e8b730] px-4 py-2 text-sm font-semibold text-[#0d0e11]"
        >
          {busy ? 'Saving…' : 'Save path'}
        </button>
      </div>
    </form>
  </Modal>
);

const ConfirmDelete = ({
  kind,
  onCancel,
  onConfirm,
  busy
}: {
  kind: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) => (
  <Modal>
    <h2 className="font-display text-2xl text-theme-main">Delete this {kind}?</h2>
    <p className="mt-2 text-sm text-theme-muted">
      This cannot be undone. A book or path with dependent content may be protected by the database.
    </p>
    <div className="mt-6 flex justify-end gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center justify-center rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-main"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={onConfirm}
        className="inline-flex items-center justify-center rounded-xl bg-[#f0706d] px-4 py-2 text-sm font-semibold text-[#0d0e11]"
      >
        Delete
      </button>
    </div>
  </Modal>
);

const AddAdminModal = ({
  username,
  onChangeUsername,
  onClose,
  onSubmit,
  busy
}: {
  username: string;
  onChangeUsername: (val: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  busy: boolean;
}) => (
  <Modal>
    <form onSubmit={onSubmit}>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-theme-accent" />
          <h2 className="font-display text-xl text-theme-main">Add admin</h2>
        </div>
        <button type="button" onClick={onClose} className="text-theme-muted hover:text-theme-main">
          <X />
        </button>
      </div>
      <p className="text-xs text-theme-muted mb-4">
        Enter the Sophia username of an existing user to promote their profile role to{' '}
        <code className="font-mono text-theme-accent">admin</code>.
      </p>
      <label className="block text-xs text-theme-muted">
        Username
        <input
          required
          type="text"
          placeholder="@username"
          className={`${field} font-mono`}
          value={username}
          onChange={(e) => onChangeUsername(e.target.value)}
        />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl border border-theme px-4 py-2 text-sm font-semibold text-theme-main"
        >
          Cancel
        </button>
        <button
          disabled={busy}
          className="inline-flex items-center justify-center rounded-xl bg-[#e8b730] px-4 py-2 text-sm font-semibold text-[#0d0e11]"
        >
          {busy ? 'Granting…' : 'Grant admin role'}
        </button>
      </div>
    </form>
  </Modal>
);