import React, { useState } from 'react';
import { BookOpen, Clock, X } from 'lucide-react';

export type StationStatus = 'finished' | 'reading' | 'todo';

export interface TrailStation {
  id: string;
  bookId: string | null;
  position: number;
  title: string;
  author?: string;
  cover_url?: string | null;
  pages: number;
  note?: string;
  status: StationStatus;
}

interface TrailMapProps {
  stations: TrailStation[];
  isAmharic: boolean;
  onOpenBook: (bookId: string) => void;
  compact?: boolean;
}

const PAD_X = 110;
const FULL_HEIGHT = 340;
const FULL_WAVE = [275, 145, 255, 105];

const COMPACT_HEIGHT = 215;
const COMPACT_WAVE = [152, 68, 148, 72];

const PAGES_PER_HOUR = 40;

const STATUS_LABEL: Record<StationStatus, { en: string; am: string }> = {
  finished: { en: 'Finished', am: 'ተነብቧል' },
  reading: { en: 'Reading now', am: 'እያነበብኩ ነው' },
  todo: { en: 'Not started', am: 'አልተጀመረም' },
};

export const formatReadTime = (pages: number, isAmharic: boolean): string => {
  if (!pages || pages < 1) {
    return isAmharic ? 'የገጽ ብዛት ሲገባ ግምት ይታያል' : 'Add a page count to see an estimate';
  }
  const minutes = Math.round((pages / PAGES_PER_HOUR) * 60);
  const text = minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 30) / 2} hr`;
  return `${isAmharic ? 'ግምታዊ ጊዜ' : 'Est. time'}: ${text}`;
};

const shorten = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

export const TrailMap: React.FC<TrailMapProps> = ({
  stations,
  isAmharic,
  onOpenBook,
  compact = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const count = stations.length;
  if (count === 0) return null;

  const height = compact ? COMPACT_HEIGHT : FULL_HEIGHT;
  const wave = compact ? COMPACT_WAVE : FULL_WAVE;
  const midY = height / 2;

  const minStep = compact ? 210 : 180;
  const width = Math.max(960, minStep * (count - 1) + PAD_X * 2);
  const step = count > 1 ? (width - 2 * PAD_X) / (count - 1) : 0;

  const points = stations.map((_, i) => ({
    x: count > 1 ? PAD_X + step * i : width / 2,
    y: wave[i % wave.length],
  }));

  const curve = (from: number, to: number) => {
    let d = `M${points[from].x},${points[from].y}`;
    for (let i = from + 1; i <= to; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const dx = (b.x - a.x) / 2;
      d += ` C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
    }
    return d;
  };

  const readingIndex = stations.findIndex((s) => s.status === 'reading');
  const todoIndex = stations.findIndex((s) => s.status === 'todo');
  const currentIndex = readingIndex >= 0 ? readingIndex : todoIndex >= 0 ? todoIndex : count - 1;
  const activeGold = 'var(--gold, #D4A94E)';

  const selectedIndex = stations.findIndex((s) => s.id === selectedId);
  const selected = selectedIndex >= 0 ? stations[selectedIndex] : null;
  const selectedPoint = selectedIndex >= 0 ? points[selectedIndex] : null;
  const label = (status: StationStatus) => (isAmharic ? STATUS_LABEL[status].am : STATUS_LABEL[status].en);

  return (
    <div
      className="flex flex-col gap-3"
      onKeyDown={(e) => {
        if (e.key === 'Escape') setSelectedId(null);
      }}
    >
      {/* Scrollable SVG Trail */}
      <div className="overflow-x-auto pb-1">
        <div
          className="relative w-full"
          style={{
            minWidth: compact ? Math.min(width * 0.72, 760) : width * 0.75,
            aspectRatio: `${width} / ${height}`,
          }}
        >
          {/* Decorative SVG layer — pointer-events-none ensures buttons above always receive clicks */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="pointer-events-none absolute inset-0 h-full w-full select-none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d={curve(0, count - 1)}
              fill="none"
              stroke="var(--border-color)"
              strokeWidth={compact ? '2.5' : '3'}
              strokeDasharray="3 9"
              strokeLinecap="round"
            />
            {currentIndex > 0 && (
              <path
                d={curve(0, currentIndex)}
                fill="none"
                stroke="var(--accent)"
                strokeWidth={compact ? '4' : '5'}
                strokeLinecap="round"
              />
            )}
            {stations.map((station, i) => {
              const { x, y } = points[i];
              const isSelected = station.id === selectedId;
              const isCurrentStation = i === currentIndex && station.status !== 'finished';
              const labelY = compact
                ? y >= midY
                  ? y - 34
                  : y + 28
                : y >= midY
                ? y - 40
                : y + 36;

              return (
                <g key={station.id}>
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={compact ? '21' : '24'}
                      fill="none"
                      stroke={isCurrentStation ? activeGold : 'var(--accent)'}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {station.status === 'finished' && (
                    <>
                      <circle cx={x} cy={y} r={compact ? '13' : '15'} fill="var(--accent)" />
                      <path
                        d={compact ? `M${x - 5},${y} l3.5,4 l7,-7.5` : `M${x - 6},${y} l4,5 l8,-9`}
                        stroke="var(--bg-surface)"
                        strokeWidth="2.5"
                        fill="none"
                      />
                    </>
                  )}
                  {isCurrentStation && (
                    <>
                      <circle
                        cx={x}
                        cy={y}
                        r={compact ? '15' : '17'}
                        fill="var(--bg-surface)"
                        stroke={activeGold}
                        strokeWidth="3"
                      />
                      <circle cx={x} cy={y} r={compact ? '5.5' : '6'} fill={activeGold} />
                      <circle
                        cx={x}
                        cy={y}
                        r={compact ? '18' : '20'}
                        fill="none"
                        stroke={activeGold}
                        strokeOpacity=".55"
                        className="motion-reduce:hidden"
                      >
                        <animate
                          attributeName="r"
                          values={compact ? '18;27;18' : '20;32;20'}
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate attributeName="stroke-opacity" values=".55;0;.55" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                    </>
                  )}
                  {station.status === 'todo' && !isCurrentStation && (
                    <circle
                      cx={x}
                      cy={y}
                      r={compact ? '12' : '14'}
                      fill="var(--bg-surface)"
                      stroke="var(--text-subtle)"
                      strokeWidth="2"
                    />
                  )}

                  <text
                    x={x}
                    y={labelY}
                    textAnchor="middle"
                    fontSize={compact ? '16' : '18'}
                    fontWeight="600"
                    fill={isCurrentStation ? activeGold : isSelected ? 'var(--accent)' : 'var(--text-main)'}
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {shorten(station.title, compact ? 18 : 22)}
                  </text>
                  <text
                    x={x}
                    y={labelY + (compact ? 17 : 19)}
                    textAnchor="middle"
                    fontSize={compact ? '12' : '13'}
                    fill="var(--text-muted)"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {label(station.status)}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Hit Targets (z-10 above SVG) */}
          {stations.map((station, i) => (
            <button
              key={station.id}
              type="button"
              aria-label={`${isAmharic ? 'ጣቢያ' : 'Station'} ${station.position}: ${station.title}, ${label(station.status)}`}
              aria-pressed={station.id === selectedId}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId((prev) => (prev === station.id ? null : station.id));
              }}
              className="absolute z-10 h-14 w-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-transparent transition-colors hover:bg-theme-accent-light/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              style={{ left: `${(points[i].x / width) * 100}%`, top: `${(points[i].y / height) * 100}%` }}
            />
          ))}

          {/* Full-View Floating Popover (Detail View) */}
          {!compact && selected && selectedPoint && (
            <div
              role="dialog"
              aria-label={selected.title}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-20 w-[290px] rounded-2xl border border-theme bg-theme-surface p-4 shadow-xl"
              style={{
                left: `${Math.min(82, Math.max(18, (selectedPoint.x / width) * 100))}%`,
                top: `${(selectedPoint.y / height) * 100}%`,
                transform: `translate(-50%, ${selectedPoint.y >= midY ? 'calc(-100% - 26px)' : '26px'})`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-md border border-theme bg-theme-subtle px-2.5 py-0.5 font-sans text-xs font-semibold text-theme-accent">
                  {label(selected.status)}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-theme text-theme-muted hover:text-theme-main"
                  aria-label={isAmharic ? 'ዝጋ' : 'Close'}
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mt-2.5 font-sans text-xs text-theme-muted">
                {isAmharic ? 'ጣቢያ' : 'Station'} {selected.position}
              </p>
              <h3 className="mt-0.5 font-serif text-lg font-semibold leading-snug text-theme-main">
                {selected.title}
              </h3>
              <p className="mt-1 font-sans text-xs text-theme-muted">
                {[selected.author, selected.pages > 0 ? `${selected.pages} ${isAmharic ? 'ገጾች' : 'pages'}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {selected.note && (
                <p className="mt-2 font-serif text-sm italic leading-relaxed text-theme-body">
                  “{selected.note}”
                </p>
              )}
              <p className="mt-2.5 font-sans text-xs font-semibold text-theme-accent">
                {formatReadTime(selected.pages, isAmharic)}
              </p>
              {selected.bookId && (
                <button
                  type="button"
                  onClick={() => onOpenBook(selected.bookId!)}
                  className="mt-3 inline-flex min-h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-theme-accent px-4 font-sans text-xs font-semibold text-theme-surface hover:opacity-90"
                >
                  <BookOpen size={14} />
                  <span>{isAmharic ? 'መጽሐፉን ክፈት' : 'Open book'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Compact-View Inline Station Inspector Strip */}
      {compact && selected && (
        <div
          role="region"
          aria-label={selected.title}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col justify-between gap-3 rounded-xl border border-theme bg-theme-app/80 p-3.5 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-theme bg-theme-subtle px-2 py-0.5 font-sans text-[11px] font-semibold text-theme-accent">
                {isAmharic ? 'ጣቢያ' : 'Station'} {selected.position} · {label(selected.status)}
              </span>
              {selected.pages > 0 && (
                <span className="inline-flex items-center gap-1 font-sans text-xs text-theme-muted">
                  <Clock size={12} />
                  {formatReadTime(selected.pages, isAmharic)}
                </span>
              )}
            </div>

            <h3 className="mt-1 font-serif text-base font-semibold leading-snug text-theme-main">
              {selected.title}
              {selected.author && (
                <span className="font-sans text-xs font-normal text-theme-muted"> — {selected.author}</span>
              )}
            </h3>

            {selected.note && (
              <p className="mt-1 line-clamp-2 font-serif text-xs italic leading-relaxed text-theme-body">
                “{selected.note}”
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
            {selected.bookId && (
              <button
                type="button"
                onClick={() => onOpenBook(selected.bookId!)}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-theme-accent px-3.5 font-sans text-xs font-semibold text-theme-surface hover:opacity-90"
              >
                <BookOpen size={14} />
                <span>{isAmharic ? 'መጽሐፉን ክፈት' : 'Open book'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label={isAmharic ? 'ዝጋ' : 'Close'}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-theme bg-theme-surface text-theme-muted hover:text-theme-main"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};