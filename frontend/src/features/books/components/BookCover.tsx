import React from 'react';
import { BookOpen } from 'lucide-react';
import { Book } from '../../../types';

interface BookCoverProps {
  book?: Pick<Book, 'title' | 'cover_url'> | null;
  title?: string;
  className?: string;
  imageClassName?: string;
}

const CLOTH_SWATCHES = [
  '#4A1E24', // Oxblood burgundy
  '#5A421E', // Burnished ochre
  '#1E2C42', // Midnight navy
  '#1F3A2E', // Forest moss
  '#3A2640', // Deep plum
] as const;

function hashTitle(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getInitials(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'B';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/** The single cover treatment used whenever catalog art is unavailable. */
export const BookCover: React.FC<BookCoverProps> = ({
  book,
  title,
  className = '',
  imageClassName = '',
}) => {
  const label = book?.title?.trim() || title?.trim() || 'Book';

  if (book?.cover_url) {
    return (
      <div className={`relative overflow-hidden rounded-md border border-theme bg-theme-subtle shadow-xs ${className}`}>
        <img
          src={book.cover_url}
          alt={`Cover of ${label}`}
          className={`h-full w-full object-cover ${imageClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const swatch = CLOTH_SWATCHES[hashTitle(label.toLowerCase()) % CLOTH_SWATCHES.length];
  const initials = getInitials(label);

  return (
    <div
      role="img"
      aria-label={`Fallback cover for ${label}`}
      style={{
        backgroundColor: `color-mix(in srgb, ${swatch} 68%, var(--bg-subtle, #191C23))`,
      }}
      className={`@container relative flex flex-col items-center justify-center overflow-hidden rounded-md border border-theme p-1.5 text-center shadow-xs ${className}`}
    >
      {/* Subtle left book-spine crease */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-black/20"
      />
      <div
        style={{
          borderColor: 'color-mix(in srgb, currentColor 55%, transparent)',
        }}
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-[4px] border text-theme-accent px-1.5 py-1.5"
      >
        <BookOpen
          aria-hidden="true"
          className="h-3.5 w-3.5 @[72px]:h-4 @[72px]:w-4 shrink-0"
          strokeWidth={1.75}
        />
        {/* Monogram initials on small thumbnails (< 72px wide) */}
        <span
          aria-hidden="true"
          className="@[72px]:hidden font-serif text-[11px] font-semibold tracking-wider text-theme-main leading-none"
        >
          {initials}
        </span>
        {/* Full title on regular/large covers (>= 72px wide) */}
        <span className="hidden @[72px]:line-clamp-3 font-serif text-[11px] font-semibold leading-snug text-theme-main break-words">
          {label}
        </span>
      </div>
    </div>
  );
};