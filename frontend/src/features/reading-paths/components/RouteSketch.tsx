import React from 'react';

interface RouteSketchProps {
  difficulty?: string | null;
  stopCount?: number;
  className?: string;
}

// Wave patterns per difficulty (Y coordinates from bottom=64 to top=14)
const WAVE_PROFILES: Record<string, number[]> = {
  beginner: [56, 48, 42, 34, 26],
  intermediate: [60, 42, 52, 30, 18],
  advanced: [64, 34, 56, 22, 12],
};

export const RouteSketch: React.FC<RouteSketchProps> = ({
  difficulty,
  stopCount = 0,
  className,
}) => {
  const key = (difficulty ?? 'beginner').toLowerCase();
  const profile = WAVE_PROFILES[key] ?? WAVE_PROFILES.beginner;

  const width = 280;
  const height = 76;
  const padX = 18;
  const count = Math.max(0, stopCount);

  // Fallback when a path has 0 books
  if (count === 0) {
    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true" focusable="false">
        <path
          d="M18,54 C90,54 180,26 262,26"
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Generate exact (x, y) coordinates for each book stop
  const points = Array.from({ length: count }, (_, i) => {
    const x = count === 1 ? width / 2 : padX + ((width - padX * 2) * i) / (count - 1);
    const y =
      count === 1
        ? 40
        : profile[i % profile.length] - Math.min(8, Math.floor(i / profile.length) * 4);
    return { x, y: Math.max(12, Math.min(64, y)) };
  });

  // Smooth cubic bezier connecting all stops in order
  let pathD = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = (curr.x - prev.x) / 2;
    pathD += ` C${prev.x + dx},${prev.y} ${curr.x - dx},${curr.y} ${curr.x},${curr.y}`;
  }

  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true" focusable="false">
      {/* Trail line connecting all stops */}
      <path
        d={pathD}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth="2"
        strokeDasharray="2 6"
        strokeLinecap="round"
      />

      {/* Finish flag pole on the final stop */}
      <path d={`M${last.x},${last.y} v-14`} stroke="var(--text-muted)" strokeWidth="1.75" />

      {/* Render a stop node for every book */}
      {points.map((pt, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === points.length - 1;
        return (
          <circle
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r={isFirst || isLast ? 4.5 : 3.5}
            fill={isFirst ? 'var(--accent)' : 'var(--bg-surface)'}
            stroke={isFirst || isLast ? 'var(--accent)' : 'var(--text-subtle)'}
            strokeWidth="2"
          />
        );
      })}
    </svg>
  );
};