import React, { useState } from 'react';
import { Review, ScreenId, UserProfile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface UserProfileViewProps {
  user: UserProfile;
  currentUser?: UserProfile;
  reviews: Review[];
  booksRead?: number;
  booksReading?: number;
  booksWantToRead?: number;
  isOwnProfile: boolean;
  onBack: () => void;
  onNavigate: (screen: ScreenId) => void;
  onSelectReview: (reviewId: string) => void;
  onEditProfile?: () => void;
  onFollowToggle?: (userId: string) => void;
  onShowToast: (msg: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user,
  currentUser,
  reviews,
  booksRead,
  booksReading = 0,
  booksWantToRead = 0,
  isOwnProfile,
  onBack,
  onNavigate,
  onSelectReview,
  onEditProfile,
  onFollowToggle,
  onShowToast,
}) => {
  const { isAmharic } = useLanguage();
  const [avatarFailed, setAvatarFailed] = useState(false);

  const t = (en: string, am: string) => (isAmharic ? am : en);
  const displayedBooksRead = booksRead ?? user.booksRead;
  const joined = user.memberSince ? new Date(user.memberSince) : null;
  const joinedLabel =
    joined && !Number.isNaN(joined.getTime())
      ? joined.toLocaleDateString(isAmharic ? 'am-ET' : 'en', {
          month: 'long',
          year: 'numeric',
        })
      : user.memberSince;

  const handleShare = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard?.writeText(url);
    onShowToast(t('Profile link copied', 'የመገለጫ አገናኝ ተቀድቷል'));
  };

  return (
    <div className="flex flex-col min-h-screen bg-theme-app text-theme-body pt-16 pb-28 md:pb-16 transition-colors duration-200">
      <div className="max-w-4xl xl:max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-theme pb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-sans font-medium text-theme-muted hover:text-theme-main transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {t('Back', 'ተመለስ')}
          </button>
          <span className="font-label-md text-[11px] uppercase tracking-[0.16em] text-theme-muted">
            {t('Reader profile', 'የአንባቢ መገለጫ')}
          </span>
        </div>

        <section className="relative overflow-hidden bg-theme-surface rounded-2xl border border-theme shadow-xs">
          <div className="h-24 sm:h-32 bg-theme-accent-light border-b border-theme-accent/20" />
          <div className="px-5 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
              {!avatarFailed && user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onError={() => setAvatarFailed(true)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-theme-surface bg-theme-subtle shadow-md flex-shrink-0"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-theme-accent text-white flex items-center justify-center font-serif font-bold text-3xl border-4 border-theme-surface shadow-md flex-shrink-0">
                  {user.name?.charAt(0) ?? '?'}
                </div>
              )}

              <div className="flex-1 min-w-0 sm:pb-1">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-theme-main">
                  {user.name}
                </h1>
                {user.title && (
                  <p className="text-sm text-theme-accent font-medium mt-0.5">
                    {user.title}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-theme-muted">
                  {user.location && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">
                        location_on
                      </span>
                      {user.location}
                    </span>
                  )}
                  {joinedLabel && (
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">
                        calendar_month
                      </span>
                      {t('Member since', 'አባል ከ')} {joinedLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 sm:pb-1">
                {isOwnProfile ? (
                  <button
                    onClick={onEditProfile}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-theme text-theme-main hover:bg-theme-subtle text-xs font-label-md font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                    {t('Edit profile', 'መገለጫ አስተካክል')}
                  </button>
                ) : (
                  <button
                    onClick={() => onFollowToggle?.(user.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-theme-main text-theme-surface hover:opacity-90 text-xs font-label-md font-semibold transition-opacity cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[17px]">
                      person_add
                    </span>
                    {t('Follow', 'ተከተል')}
                  </button>
                )}
                <button
                  onClick={handleShare}
                  aria-label={t('Share profile', 'መገለጫ አጋራ')}
                  title={t('Share profile', 'መገለጫ አጋራ')}
                  className="w-9 h-9 rounded-lg border border-theme text-theme-muted hover:text-theme-main hover:bg-theme-subtle flex items-center justify-center cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[19px]">share</span>
                </button>
              </div>
            </div>

            {user.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {user.topics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1 rounded-full bg-theme-subtle border border-theme text-[11px] text-theme-muted font-label-md"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-theme">
              {[
                {
                  label: t('Books read', 'ያነበባቸው'),
                  value: displayedBooksRead,
                  icon: 'menu_book',
                },
                {
                  label: t('Reading now', 'እያነበበ ያለ'),
                  value: booksReading,
                  icon: 'auto_stories',
                },
                {
                  label: t('Want to read', 'ማንበብ የሚፈልግ'),
                  value: booksWantToRead,
                  icon: 'bookmark',
                },
                {
                  label: t('Reviews', 'ግምገማዎች'),
                  value: reviews.length,
                  icon: 'rate_review',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-theme-subtle/60 rounded-xl px-3 py-3 text-center"
                >
                  <span className="material-symbols-outlined text-theme-gold text-[18px]">
                    {stat.icon}
                  </span>
                  <p className="font-serif font-bold text-xl text-theme-main leading-tight">
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-theme-muted font-label-md uppercase tracking-wide">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between border-b border-theme pb-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-theme-main">
                {t('Reviews & reflections', 'ግምገማዎች እና ማስታወሻዎች')}
              </h2>
              <p className="text-xs text-theme-muted mt-1">
                {t('Thoughts from the reading life of', 'ከአንባቢው ሕይወት፦')} {user.name}
              </p>
            </div>
            <button
              onClick={() => onNavigate('reviews')}
              className="text-xs font-label-md text-theme-accent hover:underline cursor-pointer"
            >
              {t('All reviews', 'ሁሉም ግምገማዎች')}
            </button>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-theme-surface border border-theme rounded-xl p-8 text-center">
              <span className="material-symbols-outlined text-theme-subtle text-4xl">
                rate_review
              </span>
              <p className="font-serif text-theme-main font-semibold mt-2">
                {t('No reviews yet', 'ገና ግምገማ የለም')}
              </p>
              <p className="text-xs text-theme-muted mt-1">
                {t('Their reflections will appear here.', 'ግምገማዎች እዚህ ይታያሉ።')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <button
                  key={review.id}
                  onClick={() => onSelectReview(review.id)}
                  className="text-left bg-theme-surface rounded-xl p-5 border border-theme shadow-xs hover:border-theme-accent/60 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-label-md uppercase tracking-wider text-theme-accent">
                        {review.tradition}
                      </p>
                      <h3 className="font-serif text-lg font-bold text-theme-main mt-1 group-hover:text-theme-accent transition-colors">
                        {review.bookTitle}
                      </h3>
                      <p className="text-xs text-theme-muted">{review.bookAuthor}</p>
                    </div>
                    <div className="flex items-center gap-1 text-theme-gold text-xs shrink-0">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      {(review.rating ?? 0).toFixed(1)}
                    </div>
                  </div>
                  <p className="font-serif italic text-sm text-theme-body mt-4 line-clamp-3">
                    {review.quote}
                  </p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-theme/60 text-[11px] text-theme-muted">
                    <span>{review.date}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">
                        forum
                      </span>
                      {review.discussionCount} {t('responses', 'ምላሾች')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfileView;