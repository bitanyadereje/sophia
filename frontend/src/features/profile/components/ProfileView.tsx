import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserProfile, ScreenId, ThemeMode } from '../../../types';
import { THEMES_LIST } from '../../../data/themes';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { supabase } from '../../../lib/supabase';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onAvatarUpload?: (file: File) => void;
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth: () => void;
  onSignOut?: () => void;
  onShowToast: (msg: string) => void;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
}

interface ArchiveEntry {
  key: string;
  kind: 'review' | 'discussion' | 'path';
  id: string;
  badge: string;
  title: string;
  meta: string;
  createdAt: string;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onAvatarUpload,
  onNavigate,
  onSignOut,
  onShowToast,
  theme,
  onSetTheme,
}) => {
  const { language, setLanguage, t, isAmharic } = useLanguage();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editTitle, setEditTitle] = useState(user.title);
  const [editLocation, setEditLocation] = useState(user.location);

  // Collapsible Intellectual Archive
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [showAllArchive, setShowAllArchive] = useState(false);

  // Active Security Drawer ('email' | 'password' | null)
  const [activeSecurityDrawer, setActiveSecurityDrawer] = useState<'email' | 'password' | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Delete Account Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Export state
  const [isExportingNotes, setIsExportingNotes] = useState(false);

  // Fetch auth user email + derived scholarly contributions from existing tables
  const { data: contributionData, isPending: isStatsPending } = useQuery({
    queryKey: ['profile-contributions', user.id],
    enabled: Boolean(user.id),
    queryFn: async () => {
      const [
        authRes,
        completedRes,
        reviewsRes,
        discussionsRes,
        pathsRes,
        notesCountRes,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('library_books')
          .select('book_id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        supabase
          .from('reviews')
          .select('id, title, content, rating, status, created_at, book:books(title)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('discussion_posts')
          .select('id, content, parent_id, reply_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reading_paths')
          .select('id, title, status, created_at')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('notes')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);

      const reviews = reviewsRes.data ?? [];
      const discussions = discussionsRes.data ?? [];
      const paths = pathsRes.data ?? [];

      const publishedReviewsCount = reviews.filter((r: any) => r.status === 'published' || !r.status).length;

      return {
        email: authRes.data?.user?.email ?? '',
        booksCompleted: completedRes.count ?? 0,
        reviewsPublished: publishedReviewsCount,
        discussionsCount: discussions.length,
        pathsCurated: paths.length,
        privateNotesCount: notesCountRes.count ?? 0,
        reviews,
        discussions,
        paths,
      };
    },
  });

  // Build unified chronological archive list
  const archiveEntries = useMemo<ArchiveEntry[]>(() => {
    if (!contributionData) return [];
    const entries: ArchiveEntry[] = [];

    contributionData.reviews.forEach((rev: any) => {
      const bookTitle = Array.isArray(rev.book) ? rev.book[0]?.title : rev.book?.title;
      entries.push({
        key: `review-${rev.id}`,
        kind: 'review',
        id: rev.id,
        badge: rev.status === 'draft' ? 'Review Draft' : `Review · ★ ${rev.rating}/5`,
        title: rev.title || (bookTitle ? `Review: ${bookTitle}` : rev.content),
        meta: bookTitle ? `${bookTitle} · ${new Date(rev.created_at).toLocaleDateString()}` : new Date(rev.created_at).toLocaleDateString(),
        createdAt: rev.created_at,
      });
    });

    contributionData.discussions.forEach((post: any) => {
      const isReply = Boolean(post.parent_id);
      entries.push({
        key: `discussion-${post.id}`,
        kind: 'discussion',
        id: post.parent_id || post.id,
        badge: isReply ? 'Reply' : 'Discussion',
        title: post.content,
        meta: `${post.reply_count ?? 0} ${post.reply_count === 1 ? 'reply' : 'replies'} · ${new Date(post.created_at).toLocaleDateString()}`,
        createdAt: post.created_at,
      });
    });

    contributionData.paths.forEach((path: any) => {
      entries.push({
        key: `path-${path.id}`,
        kind: 'path',
        id: path.id,
        badge: `Path · ${path.status || 'Published'}`,
        title: path.title,
        meta: new Date(path.created_at).toLocaleDateString(),
        createdAt: path.created_at,
      });
    });

    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contributionData]);

  const visibleArchiveEntries = showAllArchive ? archiveEntries : archiveEntries.slice(0, 3);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name: editName,
      title: editTitle,
      location: editLocation,
    });
    setIsEditProfileOpen(false);
    onShowToast(isAmharic ? 'መገለጫ ተዘምኗል' : 'Profile updated');
  };

  const handleExportMarkdown = async () => {
    if (!user.id || isExportingNotes) return;
    setIsExportingNotes(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content, created_at, book:books(title, author_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        onShowToast(isAmharic ? 'ምንም የግል ማስታወሻ አልተገኘም' : 'No private notes to export yet');
        return;
      }

      const lines = [
        `# Sophia Marginalia & Reading Notes`,
        `Reader: ${user.name || 'Scholar'}`,
        `Exported: ${new Date().toLocaleDateString()}`,
        ``,
        ...data.map((note: any) => {
          const bookObj = Array.isArray(note.book) ? note.book[0] : note.book;
          const heading = note.title || bookObj?.title || 'Untitled Note';
          const sub = bookObj?.title ? `*${bookObj.title}${bookObj.author_name ? ` — ${bookObj.author_name}` : ''}* · ` : '';
          return `## ${heading}\n${sub}${new Date(note.created_at).toLocaleDateString()}\n\n${note.content}\n\n---`;
        }),
      ];

      const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sophia-marginalia-${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast(isAmharic ? 'ማስታወሻዎች በማርክዳውን ወርደዋል' : 'Marginalia exported as Markdown');
    } catch (err) {
      console.error('Export failed:', err);
      onShowToast(isAmharic ? 'ማስታወሻዎችን ማውረድ አልተቻለም' : 'Could not export notes');
    } finally {
      setIsExportingNotes(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      onShowToast(isAmharic ? 'የማረጋገጫ ኢሜይል ተልኳል' : 'Confirmation sent to your new email address');
      setNewEmail('');
      setActiveSecurityDrawer(null);
    } catch (err: any) {
      onShowToast(err?.message || 'Could not update email');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      onShowToast(isAmharic ? 'የይለፍ ቃል ቢያንስ 8 ፊደላት መሆን አለበት' : 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast(isAmharic ? 'የይለፍ ቃሎቹ አይመሳሰሉም' : 'Passwords do not match');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      onShowToast(isAmharic ? 'የይለፍ ቃል ተቀይሯል' : 'Password updated');
      setNewPassword('');
      setConfirmPassword('');
      setActiveSecurityDrawer(null);
    } catch (err: any) {
      onShowToast(err?.message || 'Could not update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETE' || isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      setIsDeleteModalOpen(false);
      onShowToast(isAmharic ? 'መለያዎ ተሰርዟል' : 'Your account has been permanently deleted');
      await onSignOut?.();
    } catch (err: any) {
      console.error('Account deletion failed:', err);
      onShowToast(err?.message || 'Account deletion RPC not configured yet');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const subtitleParts = [
    user.location?.trim(),
    user.memberSince?.trim() ? `${isAmharic ? 'የተቀላቀሉት' : 'Joined'} ${user.memberSince.trim()}` : '',
  ].filter(Boolean);

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        {/* Scholar Header Card — Preserved */}
        <article className="bg-theme-surface rounded-2xl p-5 sm:p-7 border border-theme shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm ring-2 ring-theme-accent/40"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-2xl shadow-sm ring-2 ring-theme-accent/40">
                    {user.name?.charAt(0) || '?'}
                  </div>
                )}

                {onAvatarUpload && (
                  <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                    <span className="text-[9px] mt-0.5 font-semibold uppercase tracking-wider">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onAvatarUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-serif text-[19px] sm:text-[22px] font-bold text-theme-main">{user.name}</h1>
                  <span
                    className="material-symbols-outlined text-[16px] text-theme-accent"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                {user.title && <span className="text-xs sm:text-sm text-theme-muted">{user.title}</span>}
                {subtitleParts.length > 0 && (
                  <span className="text-[11px] sm:text-xs text-theme-subtle mt-0.5">
                    {subtitleParts.join(' · ')}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setEditName(user.name);
                setEditTitle(user.title);
                setEditLocation(user.location);
                setIsEditProfileOpen(true);
              }}
              className="self-start sm:self-center px-3 py-2 rounded-lg text-theme-muted hover:text-theme-main hover:bg-theme-subtle border border-theme flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              <span>{isAmharic ? 'መገለጫ አስተካክል' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* 4 Derived Scholarly Contribution Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-theme">
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main block">
                {isStatsPending ? '—' : contributionData?.booksCompleted ?? 0}
              </span>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'የተጠናቀቁ መጻሕፍት' : 'Books Completed'}
              </span>
            </div>
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main block">
                {isStatsPending ? '—' : contributionData?.reviewsPublished ?? 0}
              </span>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'የታተሙ ግምገማዎች' : 'Reviews Published'}
              </span>
            </div>
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main block">
                {isStatsPending ? '—' : contributionData?.discussionsCount ?? 0}
              </span>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'ውይይቶች እና ምላሾች' : 'Discussions & Replies'}
              </span>
            </div>
            <div className="bg-theme-subtle rounded-xl p-3 text-center border border-theme">
              <span className="font-serif text-xl sm:text-2xl font-bold text-theme-main block">
                {isStatsPending ? '—' : contributionData?.pathsCurated ?? 0}
              </span>
              <span className="text-[10px] font-label-md uppercase tracking-wider text-theme-subtle">
                {isAmharic ? 'የተዘጋጁ መንገዶች' : 'Paths Curated'}
              </span>
            </div>
          </div>

          {/* Private Marginalia Footnote */}
          <div className="flex items-center justify-between text-xs pt-1 text-theme-muted">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-theme-subtle">lock</span>
              <span>
                {isAmharic
                  ? `${contributionData?.privateNotesCount ?? 0} የግል ማስታወሻዎች (ለእርስዎ ብቻ የሚታዩ)`
                  : `${contributionData?.privateNotesCount ?? 0} private marginalia notes (visible only to you)`}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('notes')}
              className="text-theme-accent font-medium hover:underline cursor-pointer"
            >
              {isAmharic ? 'ማስታወሻዎችን ክፈት →' : 'Open Notes →'}
            </button>
          </div>
        </article>

        {/* Collapsible Unified Intellectual Archive */}
        <section className="bg-theme-surface rounded-xl border border-theme shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setIsArchiveOpen((prev) => !prev)}
            aria-expanded={isArchiveOpen}
            className="w-full p-5 sm:px-6 flex items-center justify-between text-left hover:bg-theme-subtle/50 transition-colors cursor-pointer"
          >
            <div>
              <h2 className="font-serif text-[16px] font-bold text-theme-main">
                {isAmharic ? 'የምሁራዊ አስተዋጽኦ መዝገብ' : 'Intellectual Archive'}
              </h2>
              <p className="text-xs text-theme-subtle mt-0.5">
                {isAmharic
                  ? `${archiveEntries.length} የታተሙ ግምገማዎች፣ ውይይቶች እና የንባብ መንገዶች`
                  : `${archiveEntries.length} recorded reviews, discussions & curated paths`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-theme-muted">
              <span className="text-xs font-medium hidden sm:inline">
                {isArchiveOpen ? (isAmharic ? 'ደብቅ' : 'Collapse') : (isAmharic ? 'ክፈት' : 'Expand')}
              </span>
              {isArchiveOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {isArchiveOpen && (
            <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-theme flex flex-col divide-y divide-theme">
              {archiveEntries.length === 0 ? (
                <p className="py-6 text-center text-xs text-theme-subtle">
                  {isAmharic
                    ? 'ገና ምንም የታተመ ግምገማ፣ ውይይት ወይም መንገድ የለም።'
                    : 'No published reviews, discussions, or curated paths yet.'}
                </p>
              ) : (
                <>
                  {visibleArchiveEntries.map((entry) => (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => {
                        if (entry.kind === 'review') onNavigate('reviews');
                        else if (entry.kind === 'discussion') onNavigate('discussions');
                        else onNavigate('paths');
                      }}
                      className="py-3.5 flex items-center justify-between gap-4 text-left hover:bg-theme-subtle/40 -mx-2 px-2 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-theme-subtle text-theme-muted border border-theme">
                            {entry.badge}
                          </span>
                          <span className="text-[11px] text-theme-subtle truncate">{entry.meta}</span>
                        </div>
                        <p className="font-serif text-sm font-medium text-theme-main group-hover:text-theme-accent line-clamp-1">
                          {entry.title}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-theme-subtle group-hover:text-theme-main shrink-0" />
                    </button>
                  ))}

                  {archiveEntries.length > 3 && (
                    <div className="pt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllArchive((prev) => !prev)}
                        className="text-xs font-medium text-theme-accent hover:underline cursor-pointer"
                      >
                        {showAllArchive
                          ? (isAmharic ? 'ያነሰ አሳይ' : 'Show fewer')
                          : (isAmharic ? `ሁሉንም ${archiveEntries.length} አሳይ` : `Show all ${archiveEntries.length} entries`)}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* Settings & Appearance */}
        <section className="bg-theme-surface rounded-xl p-5 sm:p-6 border border-theme shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-theme gap-2">
            <div>
              <h2 className="font-serif text-[16px] font-bold text-theme-main">
                {isAmharic ? 'የመተግበሪያ ቅንብሮች እና ገጽታ' : 'App Settings & Appearance'}
              </h2>
              <p className="text-xs text-theme-subtle">
                {isAmharic ? 'ከተዘጋጁት የብራና እና የገዳማት ቀለማት ገጽታዎች ይምረጡ' : 'Choose from all curated Ethiopian manuscript & monastic illumination themes'}
              </p>
            </div>
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-theme-subtle border border-theme text-theme-muted self-start sm:self-auto">
              {THEMES_LIST.find((t) => t.id === theme)?.label || 'Custom'}
            </span>
          </div>

          {/* Complete Manuscript Themes Grid Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">palette</span>
                {isAmharic ? `ያሉ የብራና ገጽታዎች (${THEMES_LIST.length})` : `Available Manuscript Themes (${THEMES_LIST.length})`}
              </span>
              <span className="text-[11px] text-theme-subtle">
                {isAmharic ? 'በቅጽበት ለመተግበር ይጫኑ' : 'Click to apply instantly'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {THEMES_LIST.map((themeOption) => {
                const isActive = theme === themeOption.id;
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      onSetTheme(themeOption.id);
                      onShowToast(isAmharic ? `ወደ ${themeOption.label} ገጽታ ተቀይሯል` : `Switched to ${themeOption.label} theme`);
                    }}
                    className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isActive
                        ? 'border-[#d4af37] bg-theme-subtle shadow-sm ring-1 ring-[#d4af37]/50'
                        : 'border-theme bg-theme-surface hover:bg-theme-subtle/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: themeOption.previewColor }}
                        />
                        <span className="font-serif font-bold text-xs text-theme-main">
                          {themeOption.label}
                        </span>
                      </div>
                      {isActive && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#b8860b] bg-[#d4af37]/15 px-1.5 py-0.5 rounded-full border border-[#d4af37]/30">
                          <Check className="w-3 h-3" />
                          <span>{isAmharic ? 'ገባሪ' : 'Active'}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-theme-subtle line-clamp-1 mb-2">
                      {themeOption.description}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-1 border-t border-theme/40">
                      <span className="text-[9px] font-sans font-medium uppercase tracking-wider text-theme-muted">
                        {themeOption.category}
                      </span>
                      <div className="flex items-center gap-1">
                        {themeOption.palette.map((item, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-2.5 rounded-full border border-black/15"
                            style={{ backgroundColor: item.color }}
                            title={`${item.name} (${item.hex})`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Theme Detailed Palette Showcase */}
          {(() => {
            const current = THEMES_LIST.find((t) => t.id === theme) || THEMES_LIST[0];
            return (
              <div className="bg-theme-subtle rounded-xl p-4 border border-theme mt-1 text-xs flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20"
                      style={{ backgroundColor: current.previewColor }}
                    />
                    <span className="font-serif font-bold text-theme-main text-[13px]">
                      {current.label} — {isAmharic ? 'የቀለማት ስብስብ' : 'Harmonic Palette & Provenance'}
                    </span>
                  </div>
                  <span className="text-[10px] font-sans text-[#b8860b] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#d4af37]/15 border border-[#d4af37]/30">
                    {current.category} Mode
                  </span>
                </div>
                <p className="text-[11px] text-theme-subtle">
                  {current.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                  {current.palette.map((item, idx) => (
                    <div key={idx} className="bg-theme-surface p-2 rounded-lg border border-theme flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-sans font-medium text-[10px] text-theme-muted uppercase tracking-wider">{item.hex}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[11px] text-theme-main truncate">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Interface Language */}
          <div className="flex items-center justify-between py-2.5 border-t border-theme">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-theme-subtle text-[20px]">translate</span>
              <div>
                <span className="text-xs font-semibold text-theme-main block">
                  {isAmharic ? 'የመተግበሪያ ቋንቋ' : 'Interface Language'}
                </span>
                <span className="text-[11px] text-theme-subtle">
                  {language === 'am' ? 'አማርኛ (Amharic)' : 'English (English)'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  onShowToast('Language set to English');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-medium border transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-theme-main text-theme-surface border-theme-main shadow-xs'
                    : 'bg-theme-subtle hover:bg-theme-muted text-theme-main border-theme'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage('am');
                  onShowToast('ቋንቋ ወደ አማርኛ ተቀይሯል');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-serif font-medium border transition-all cursor-pointer ${
                  language === 'am'
                    ? 'bg-theme-main text-theme-surface border-theme-main shadow-xs'
                    : 'bg-theme-subtle hover:bg-theme-muted text-theme-main border-theme'
                }`}
              >
                አማርኛ
              </button>
            </div>
          </div>
        </section>

        {/* Account & Security — Clean Clickable Chevron Rows (No Boxed Row Buttons) */}
        <section className="bg-theme-surface rounded-xl p-5 sm:p-6 border border-theme shadow-sm flex flex-col">
          <div className="pb-3 border-b border-theme">
            <h2 className="font-serif text-[16px] font-bold text-theme-main">
              {isAmharic ? 'መለያ እና ደህንነት' : 'Account & Security'}
            </h2>
            <p className="text-xs text-theme-subtle mt-0.5">
              {isAmharic ? 'የመግቢያ መረጃዎን ያስተዳድሩ እና የግል ማስታወሻዎችዎን ያውርዱ' : 'Manage your credentials and export your personal marginalia'}
            </p>
          </div>

          <div className="divide-y divide-theme">
            {/* Email Address Row */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSecurityDrawer((prev) => (prev === 'email' ? null : 'email'))}
                className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-theme-subtle/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-theme-subtle text-[20px]">mail</span>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-theme-main block">
                      {isAmharic ? 'የኢሜይል አድራሻ' : 'Email Address'}
                    </span>
                    <span className="text-[11px] text-theme-subtle truncate block">
                      {contributionData?.email || (isAmharic ? 'በመጫን ላይ...' : 'Loading account email...')}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-theme-subtle transition-transform shrink-0 ${
                    activeSecurityDrawer === 'email' ? 'rotate-90 text-theme-main' : ''
                  }`}
                />
              </button>

              {activeSecurityDrawer === 'email' && (
                <form onSubmit={handleUpdateEmail} className="pb-4 pt-1 pl-8 pr-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={isAmharic ? 'አዲስ ኢሜይል ያስገቡ' : 'Enter new email address'}
                    className="flex-1 bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSecurityDrawer(null)}
                      className="px-3 py-2 text-xs text-theme-muted hover:text-theme-main cursor-pointer"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingEmail || !newEmail.trim()}
                      className="px-3.5 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingEmail ? 'Sending...' : (isAmharic ? 'ኢሜይል ቀይር' : 'Update Email')}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Password Row */}
            <div>
              <button
                type="button"
                onClick={() => setActiveSecurityDrawer((prev) => (prev === 'password' ? null : 'password'))}
                className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-theme-subtle/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-theme-subtle text-[20px]">key</span>
                  <div>
                    <span className="text-xs font-semibold text-theme-main block">
                      {isAmharic ? 'የይለፍ ቃል' : 'Password'}
                    </span>
                    <span className="text-[11px] text-theme-subtle">
                      {isAmharic ? 'የመግቢያ የይለፍ ቃልዎን ይቀይሩ' : 'Update your sign-in password'}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-theme-subtle transition-transform shrink-0 ${
                    activeSecurityDrawer === 'password' ? 'rotate-90 text-theme-main' : ''
                  }`}
                />
              </button>

              {activeSecurityDrawer === 'password' && (
                <form onSubmit={handleUpdatePassword} className="pb-4 pt-1 pl-8 pr-2 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={isAmharic ? 'አዲስ የይለፍ ቃል (ቢያንስ 8 ፊደላት)' : 'New password (min 8 chars)'}
                      className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                    />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={isAmharic ? 'አዲሱን የይለፍ ቃል ያረጋግጡ' : 'Confirm new password'}
                      className="bg-theme-subtle border border-theme rounded-lg px-3 py-2 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSecurityDrawer(null);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="px-3 py-2 text-xs text-theme-muted hover:text-theme-main cursor-pointer"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !newPassword}
                      className="px-3.5 py-2 rounded-lg bg-theme-main text-theme-surface text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingPassword ? 'Saving...' : (isAmharic ? 'የይለፍ ቃል አስቀምጥ' : 'Save Password')}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Export Marginalia Row */}
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={isExportingNotes}
              className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-theme-subtle/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-theme-subtle text-[20px]">file_download</span>
                <div>
                  <span className="text-xs font-semibold text-theme-main block">
                    {isAmharic ? 'ማስታወሻዎችን እና ጥቅሶችን አውርድ' : 'Export Marginalia & Notes'}
                  </span>
                  <span className="text-[11px] text-theme-subtle">
                    {isAmharic ? 'ሁሉንም የግል ማስታወሻዎች በማርክዳውን (.md) ያውርዱ' : 'Download all private notes as a Markdown (.md) file'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium text-theme-accent shrink-0">
                {isExportingNotes ? (isAmharic ? 'በማውረድ ላይ...' : 'Downloading...') : (isAmharic ? 'አውርድ (.md)' : 'Download .md')}
              </span>
            </button>
          </div>

          {/* Subtle Danger Zone */}
          <div className="pt-3 mt-1 border-t border-theme flex items-center justify-between">
            <span className="text-[11px] text-theme-subtle">
              {isAmharic ? 'መለያዎን እና ሁሉንም ውሂብ እስከመጨረሻው ይሰርዙ' : 'Permanently remove your profile and reading records'}
            </span>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText('');
                setIsDeleteModalOpen(true);
              }}
              className="text-xs font-medium text-red-600 hover:underline cursor-pointer"
            >
              {isAmharic ? 'መለያ ሰርዝ' : 'Delete account'}
            </button>
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={onSignOut}
          className="w-full py-3 rounded-xl border border-theme bg-theme-surface hover:bg-theme-subtle text-red-600 text-xs font-label-md uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">logout</span>
          <span>{isAmharic ? 'ውጣ' : 'Sign Out'}</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md bg-theme-surface rounded-2xl p-6 shadow-2xl border border-theme"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <h3 className="font-serif text-lg font-bold text-theme-main">
                {isAmharic ? 'መገለጫ አስተካክል' : 'Edit Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'ሙሉ ስም' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'ማዕረግ / ሚና' : 'Headline / Role'}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1">
                  {isAmharic ? 'አድራሻ' : 'Location'}
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-theme-accent"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-3 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle hover:bg-theme-muted text-theme-main font-label-md text-xs uppercase tracking-wider cursor-pointer border border-theme transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-theme-main text-theme-surface font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                {isAmharic ? 'መገለጫ አስቀምጥ' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <form
            onSubmit={handleDeleteAccount}
            className="w-full max-w-md bg-theme-surface rounded-2xl p-6 shadow-2xl border border-theme"
          >
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <h3 className="font-serif text-lg font-bold text-red-600">
                {isAmharic ? 'መለያዎን እስከመጨረሻው ይሰርዙ' : 'Delete Account Permanently'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-theme-subtle hover:text-theme-main p-1 rounded-full cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-theme-body leading-relaxed">
              <p>
                {isAmharic
                  ? 'ይህ እርምጃ ወደኋላ መመለስ አይቻልም። ሁሉም የንባብ መዝገቦችዎ እና የግል ማስታወሻዎችዎ ይሰረዛሉ።'
                  : 'This action cannot be undone. Your profile, library shelves, and private marginalia notes will be permanently deleted.'}
              </p>
              <div>
                <label className="block text-[11px] font-label-md uppercase tracking-wider text-theme-muted font-semibold mb-1.5">
                  {isAmharic ? 'ለማረጋገጥ DELETE ብለው ይጻፉ' : 'Type DELETE to confirm'}
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-theme-subtle border border-theme rounded-lg p-2.5 text-xs text-theme-main focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-3 border-t border-theme">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-theme-subtle hover:bg-theme-muted text-theme-main font-label-md text-xs uppercase tracking-wider cursor-pointer border border-theme transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-label-md text-xs uppercase tracking-wider font-semibold cursor-pointer disabled:opacity-40 hover:bg-red-700 transition-colors"
              >
                {isDeletingAccount ? 'Deleting...' : (isAmharic ? 'መለያ ሰርዝ' : 'Delete Account')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};