import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Book, ScreenId } from '../types';
import { loadDiscussionsWithAuthors } from '../features/discussions/services/discussion.service';
import { loadReviews } from '../features/reviews/review.service';
import { loadReviewerProfilesForReviews } from '../features/reviews/reviewerProfiles';
import { BookCover } from '../features/books/components/BookCover';

interface LandingViewProps {
  books?: Book[];
  onNavigate: (screen: ScreenId) => void;
  onOpenAuth: (defaultMode?: 'signin' | 'signup') => void;
  onNavigateToDiscussion: (questionId: string) => void;
  onNavigateToReview: (reviewId: string) => void;
  onSelectBook: (bookId: string) => void;
}

type DiscussionFilter = 'all' | 'book' | 'topic';

type DiscussionPostRow = Awaited<ReturnType<typeof loadDiscussionsWithAuthors>>[number] & {
  book_id?: string | null;
  author_name?: string | null;
  author?: { name?: string | null; username?: string | null } | null;
};

export const LandingView: React.FC<LandingViewProps> = ({
  books = [],
  onNavigate,
  onOpenAuth,
  onNavigateToDiscussion,
  onNavigateToReview,
  onSelectBook,
}) => {
  const [discussionFilter, setDiscussionFilter] = useState<DiscussionFilter>('all');

  const { data: recentData, isPending } = useQuery({
    queryKey: ['landing-recent-activity'],
    queryFn: async () => {
      const [posts, reviews] = await Promise.all([
        loadDiscussionsWithAuthors(),
        loadReviews(),
      ]);
      const publishedReviews = reviews.filter((r) => r.status === 'published');
      const reviewerProfiles = await loadReviewerProfilesForReviews(publishedReviews);
      return {
        posts: posts as DiscussionPostRow[],
        reviews: publishedReviews,
        reviewerProfiles,
      };
    },
  });

  const bookMap = useMemo(() => {
    const map = new Map<string, Book>();
    books.forEach((b) => map.set(b.id, b));
    return map;
  }, [books]);

  const filteredDiscussions = useMemo(() => {
    const allPosts = recentData?.posts ?? [];
    const byTab = allPosts.filter((post) => {
      if (discussionFilter === 'book') return Boolean(post.book_id);
      if (discussionFilter === 'topic') return !post.book_id;
      return true;
    });
    return [...byTab]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [recentData?.posts, discussionFilter]);

  const recentReviews = useMemo(() => {
    const allReviews = recentData?.reviews ?? [];
    return [...allReviews]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  }, [recentData?.reviews]);

  return (
    <div className="min-h-screen bg-theme-app text-theme-body flex flex-col font-sans antialiased">
      {/* TOP LANDING HEADER */}
      <header className="sticky top-0 z-40 bg-theme-app/95 backdrop-blur-xs border-b border-theme-subtle">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-baseline gap-3 text-left cursor-pointer focus:outline-none"
          >
            <span className="font-display text-sm sm:text-base tracking-[0.26em] text-theme-gold uppercase font-semibold">
              SOPHIA
            </span>
            <span className="text-xs text-theme-subtle hidden sm:inline">
              Orthodox discussion and books
            </span>
          </button>

          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-[13px]">
            <button
              type="button"
              onClick={() => onNavigate('discussions')}
              className="text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              Discussions
            </button>
            <button
              type="button"
              onClick={() => onNavigate('colloquium')}
              className="text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              Books
            </button>
            <button
              type="button"
              onClick={() => onNavigate('paths')}
              className="text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              Paths
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-1.5 rounded-full bg-theme-accent text-stone-950 font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Join
            </button>
          </nav>
        </div>
      </header>

      {/* HERO + 3 FEATURE CARDS */}
      <section className="max-w-6xl mx-auto w-full px-5 sm:px-8 pt-14 sm:pt-20 pb-14">
        <div className="max-w-2xl">
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-theme-gold mb-4">
            A COMMUNITY FOR ORTHODOX CHRISTIANS
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-[54px] font-medium text-theme-main tracking-tight leading-[1.08]">
            Read, ask and discuss.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-theme-muted leading-relaxed max-w-xl">
            Questions about the faith and reviews of Orthodox books, in one community.
          </p>

          <div className="mt-8 flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenAuth('signup')}
              className="px-5 py-2.5 rounded-full bg-theme-accent text-stone-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Join the conversation
            </button>
            <button
              type="button"
              onClick={() => onNavigate('colloquium')}
              className="px-5 py-2.5 rounded-full border border-theme bg-theme-surface/60 text-theme-main text-xs sm:text-sm font-medium hover:bg-theme-subtle transition-colors cursor-pointer"
            >
              Browse books
            </button>
          </div>
        </div>

        {/* THREE PILLAR CARDS */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Discuss */}
          <div className="bg-theme-surface border border-theme rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-theme-subtle block">
                DISCUSS
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-theme-main mt-2 leading-snug">
                Ask anything about the faith
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted mt-3 leading-relaxed">
                Post a question on any topic, or start a thread about a specific book. Get answers from an Orthodox perspective and hear other viewpoints, respectfully.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('discussions')}
              className="mt-6 text-xs font-medium text-theme-gold hover:underline inline-flex items-center gap-1 self-start cursor-pointer"
            >
              <span>Browse discussions</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Card 2: Read */}
          <div className="bg-theme-surface border border-theme rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-theme-subtle block">
                READ
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-theme-main mt-2 leading-snug">
                Find books, review them, keep your place
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted mt-3 leading-relaxed">
                Read honest reviews, rate what you have read, save books to your shelf and track your progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('colloquium')}
              className="mt-6 text-xs font-medium text-theme-gold hover:underline inline-flex items-center gap-1 self-start cursor-pointer"
            >
              <span>Browse books</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>

          {/* Card 3: Paths */}
          <div className="bg-theme-surface border border-theme rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-theme-subtle block">
                PATHS
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-theme-main mt-2 leading-snug">
                Not sure what to read next?
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted mt-3 leading-relaxed">
                Follow a reading path: books in order, marked by difficulty, so you always know what comes next. Sophia is new and more paths are being added.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('paths')}
              className="mt-6 text-xs font-medium text-theme-gold hover:underline inline-flex items-center gap-1 self-start cursor-pointer"
            >
              <span>See reading paths</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* RECENT DISCUSSIONS & RECENT REVIEWS */}
      <section className="border-t border-theme-subtle bg-theme-surface/35 py-14 flex-1">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
          {/* LEFT COLUMN: RECENT DISCUSSIONS */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-3">
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-theme-main">
                Recent discussions
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('discussions')}
                className="text-xs text-theme-subtle hover:text-theme-gold transition-colors cursor-pointer"
              >
                All →
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 mb-4">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'book', label: 'About a book' },
                  { id: 'topic', label: 'Any topic' },
                ] as const
              ).map((pill) => {
                const active = discussionFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setDiscussionFilter(pill.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-theme-accent text-stone-950 font-semibold'
                        : 'border border-theme bg-theme-surface text-theme-muted hover:text-theme-main'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3">
              {isPending ? (
                <div className="bg-theme-surface border border-theme rounded-xl p-5 text-xs text-theme-muted">
                  Loading discussions...
                </div>
              ) : filteredDiscussions.length === 0 ? (
                <div className="bg-theme-surface border border-theme rounded-xl p-5 text-xs text-theme-muted">
                  No discussions in this category yet.
                </div>
              ) : (
                filteredDiscussions.map((post) => {
                  const linkedBook = post.book_id ? bookMap.get(post.book_id) : undefined;
                  const authorLabel =
                    post.author?.name ||
                    post.author?.username ||
                    post.author_name ||
                    'Community Member';

                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => onNavigateToDiscussion(post.id)}
                      className="w-full text-left bg-theme-surface border border-theme hover:border-theme-accent/60 rounded-xl p-4 flex items-center justify-between gap-4 transition-colors group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-sans px-2 py-0.5 rounded-md bg-theme-subtle text-theme-muted border border-theme-subtle mb-2">
                          {linkedBook ? `On a book · ${linkedBook.title}` : 'Any topic'}
                        </span>
                        <h3 className="font-serif text-sm sm:text-base font-medium text-theme-main group-hover:text-theme-gold transition-colors line-clamp-1">
                          {post.title || post.content}
                        </h3>
                        <p className="text-xs text-theme-subtle mt-1 truncate">{authorLabel}</p>
                      </div>
                      <span className="text-theme-subtle group-hover:text-theme-gold transition-colors text-sm flex-none">
                        →
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: RECENT REVIEWS */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-3 lg:mb-[46px]">
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-theme-main">
                Recent reviews
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('reviews')}
                className="text-xs text-theme-subtle hover:text-theme-gold transition-colors cursor-pointer"
              >
                All books →
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {isPending ? (
                <div className="bg-theme-surface border border-theme rounded-xl p-5 text-xs text-theme-muted">
                  Loading reviews...
                </div>
              ) : recentReviews.length === 0 ? (
                <div className="bg-theme-surface border border-theme rounded-xl p-5 text-xs text-theme-muted">
                  No published reviews yet.
                </div>
              ) : (
                recentReviews.map((review) => {
                  const book = bookMap.get(review.book_id);
                  const reviewer = recentData?.reviewerProfiles?.[review.user_id];
                  const roundedStars = Math.max(1, Math.min(5, Math.round(review.rating || 5)));

                  return (
                    <div
                      key={review.id}
                      onClick={() => onNavigateToReview(review.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onNavigateToReview(review.id);
                      }}
                      className="bg-theme-surface border border-theme hover:border-theme-accent/60 rounded-xl p-4 flex items-center gap-4 transition-colors group cursor-pointer"
                    >
                      {/* Mini Book Cover Thumbnail */}
                      <BookCover book={book} title="Book" className="h-14 w-10 flex-none" />

                      <div className="min-w-0 flex-1">
                        <h3 className="font-serif text-sm sm:text-base font-medium text-theme-main group-hover:text-theme-gold transition-colors truncate">
                          {review.title || book?.title || 'Book Review'}
                        </h3>
                        <p className="text-xs text-theme-subtle mt-0.5 truncate">
                          {reviewer?.name
                            ? `Review by ${reviewer.name}${book ? ` · ${book.title}` : ''}`
                            : book?.author_name || 'Reader'}
                        </p>
                        <div
                          className="flex items-center gap-0.5 mt-1.5 text-theme-gold text-xs"
                          aria-label={`${roundedStars} out of 5 stars`}
                        >
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <span key={idx} className={idx < roundedStars ? 'opacity-100' : 'opacity-25'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>

                      {book && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectBook(book.id);
                          }}
                          className="hidden sm:inline-block text-[11px] text-theme-subtle hover:text-theme-main px-2.5 py-1 rounded-md border border-transparent hover:border-theme transition-colors cursor-pointer"
                        >
                          Book
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CONVERSION BANNER */}
      <section className="border-t border-theme-subtle bg-theme-app py-12">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-theme-main">
            Join the conversation. Keep your place.
          </h2>
          <button
            type="button"
            onClick={() => onOpenAuth('signup')}
            className="px-5 py-2.5 rounded-full bg-theme-accent text-stone-950 text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer flex-none"
          >
            Create a free account
          </button>
        </div>
      </section>
    </div>
  );
};
