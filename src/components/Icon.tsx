/** One coherent 16px stroke icon set. No emoji anywhere in the UI. */
import React from 'react';

const paths: Record<string, React.ReactNode> = {
  inbox: (
    <>
      <path d="M2.5 9.5h3l1 2h3l1-2h3" />
      <path d="M3.6 3.2h8.8l1.6 6.3v3.3H2V9.5z" />
    </>
  ),
  today: (
    <>
      <rect x="2.2" y="3.2" width="11.6" height="10.6" rx="1.6" />
      <path d="M2.2 6.4h11.6M5.4 2v2.4M10.6 2v2.4" />
    </>
  ),
  projects: (
    <>
      <path d="M2 4.4A1.4 1.4 0 013.4 3h2.4l1.3 1.7h5.5A1.4 1.4 0 0114 6.1v5.5a1.4 1.4 0 01-1.4 1.4H3.4A1.4 1.4 0 012 11.6z" />
    </>
  ),
  later: (
    <>
      <circle cx="8" cy="8" r="5.9" />
      <path d="M8 4.6V8l2.4 1.6" />
    </>
  ),
  done: (
    <>
      <circle cx="8" cy="8" r="5.9" />
      <path d="M5.4 8.2l1.8 1.8 3.4-3.7" />
    </>
  ),
  check: <path d="M3.4 8.4l3 3 6.2-6.6" strokeWidth="2" />,
  plus: <path d="M8 3.2v9.6M3.2 8h9.6" />,
  minus: <path d="M3.2 8h9.6" />,
  search: (
    <>
      <circle cx="7.2" cy="7.2" r="4.4" />
      <path d="M10.5 10.5L13.5 13.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.1" />
      <path d="M12.6 9.6a1.1 1.1 0 00.22 1.21l.04.04a1.32 1.32 0 11-1.87 1.87l-.04-.04a1.1 1.1 0 00-1.85.78v.11a1.32 1.32 0 11-2.64 0v-.06a1.1 1.1 0 00-1.9-.74l-.04.04a1.32 1.32 0 11-1.87-1.87l.04-.04a1.1 1.1 0 00-.78-1.85h-.11a1.32 1.32 0 110-2.64h.06a1.1 1.1 0 00.74-1.9l-.04-.04A1.32 1.32 0 114.35 2.6l.04.04a1.1 1.1 0 001.21.22h.05a1.1 1.1 0 00.66-1v-.11a1.32 1.32 0 112.64 0v.06a1.1 1.1 0 001.85.78l.04-.04a1.32 1.32 0 111.87 1.87l-.04.04a1.1 1.1 0 00.22 1.21v.05a1.1 1.1 0 001 .66h.11a1.32 1.32 0 010 2.64h-.06a1.1 1.1 0 00-1 .66z" />
    </>
  ),
  x: <path d="M4 4l8 8M12 4l-8 8" />,
  chevronRight: <path d="M6 3.5L10.5 8 6 12.5" />,
  chevronDown: <path d="M3.5 6L8 10.5 12.5 6" />,
  chevronLeft: <path d="M10 3.5L5.5 8 10 12.5" />,
  grip: (
    <>
      <circle cx="6" cy="4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="6" cy="8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="6" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="10" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  more: (
    <>
      <circle cx="3.4" cy="8" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="8" cy="8" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="12.6" cy="8" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),
  trash: (
    <>
      <path d="M2.8 4.2h10.4M6 4.2V2.9h4v1.3M4.2 4.2l.7 8.4a1 1 0 001 .9h4.2a1 1 0 001-.9l.7-8.4" />
    </>
  ),
  edit: <path d="M11.4 2.6l2 2L6 12H4v-2zM10 4l2 2" />,
  link: (
    <>
      <path d="M6.6 9.4a2.6 2.6 0 003.9.3l2-2a2.6 2.6 0 00-3.7-3.7l-1.1 1.1" />
      <path d="M9.4 6.6a2.6 2.6 0 00-3.9-.3l-2 2a2.6 2.6 0 003.7 3.7l1.1-1.1" />
    </>
  ),
  paperclip: (
    <path d="M12.6 7.6l-4.9 4.9a3 3 0 11-4.3-4.3l5.4-5.4a2 2 0 112.9 2.9l-5.4 5.4a1 1 0 11-1.4-1.4l4.8-4.8" />
  ),
  note: (
    <>
      <path d="M3.4 2.6h9.2v10.8H3.4z" />
      <path d="M5.6 5.6h4.8M5.6 8h4.8M5.6 10.4h3" />
    </>
  ),
  tag: (
    <>
      <path d="M2.6 7.2V3.4a.8.8 0 01.8-.8h3.8l6 6-4.6 4.6z" />
      <circle cx="5.4" cy="5.4" r="0.9" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="5.9" />
      <path d="M8 4.8V8l2.2 1.4" />
    </>
  ),
  bell: (
    <>
      <path d="M4 6.6a4 4 0 018 0c0 3 1.2 4 1.2 4H2.8s1.2-1 1.2-4z" />
      <path d="M6.6 13a1.6 1.6 0 002.8 0" />
    </>
  ),
  flag: (
    <>
      <path d="M4 14V2.8M4 3.2h7.6l-1.4 2.6 1.4 2.6H4" />
    </>
  ),
  arrowRight: <path d="M3 8h10M9.2 4.2L13 8l-3.8 3.8" />,
  arrowUturn: <path d="M4.2 9.4L1.8 7l2.4-2.4M2.2 7h7a3.6 3.6 0 010 7.2H6" />,
  undo: (
    <>
      <path d="M3.2 7.2h6.4a3.4 3.4 0 010 6.8H6.6" />
      <path d="M5.6 4.6L3 7.2l2.6 2.6" />
    </>
  ),
  copy: (
    <>
      <rect x="5.4" y="5.4" width="7.6" height="7.6" rx="1.2" />
      <path d="M10.6 5.4V4.2A1.2 1.2 0 009.4 3H4.2A1.2 1.2 0 003 4.2v5.2a1.2 1.2 0 001.2 1.2h1.2" />
    </>
  ),
  folder: <path d="M2 4.4A1.4 1.4 0 013.4 3h2.4l1.3 1.7h5.5A1.4 1.4 0 0114 6.1v5.5a1.4 1.4 0 01-1.4 1.4H3.4A1.4 1.4 0 012 11.6z" />,
  archive: (
    <>
      <rect x="2.2" y="3" width="11.6" height="3" rx="0.9" />
      <path d="M3.4 6.4v6a.9.9 0 00.9.9h7.4a.9.9 0 00.9-.9v-6M6.4 9h3.2" />
    </>
  ),
  download: <path d="M8 2.6v7.6M4.8 7.4L8 10.6l3.2-3.2M2.8 13h10.4" />,
  upload: <path d="M8 10.6V3M4.8 6.2L8 3l3.2 3.2M2.8 13h10.4" />,
  external: (
    <>
      <path d="M9.4 2.6H13.4v4" />
      <path d="M13.4 2.6L7.6 8.4" />
      <path d="M12 9.4v3a1 1 0 01-1 1H3.6a1 1 0 01-1-1V5a1 1 0 011-1h3" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="5.9" />
      <path d="M8 7.4v3.4M8 5.2v.5" />
    </>
  ),
  keyboard: (
    <>
      <rect x="1.8" y="4" width="12.4" height="8" rx="1.4" />
      <path d="M4.4 6.6h.01M6.8 6.6h.01M9.2 6.6h.01M11.6 6.6h.01M4.4 9h.01M11.6 9h.01M6.6 9.2h2.8" />
    </>
  ),
  bolt: <path d="M8.8 1.8L3.6 9h3.6l-.8 5.2L12.4 7H8.8z" />,
  list: <path d="M5.4 4.2h8.4M5.4 8h8.4M5.4 11.8h8.4M2.6 4.2h.01M2.6 8h.01M2.6 11.8h.01" />,
  filter: <path d="M2.4 3.4h11.2L9.2 8.6v4.2l-2.4 1.2V8.6z" />,
  moon: <path d="M13 9.4A5.6 5.6 0 016.6 3a5.6 5.6 0 106.4 6.4z" />,
  refresh: (
    <>
      <path d="M13.2 8a5.2 5.2 0 01-9 3.6M2.8 8a5.2 5.2 0 019-3.6" />
      <path d="M11.8 1.8v2.8H9M4.2 14.2v-2.8H7" />
    </>
  ),
  minimize: <path d="M3 8h10" />,
  maximize: <rect x="3.2" y="3.2" width="9.6" height="9.6" rx="1.2" />,
  restore: (
    <>
      <rect x="2.6" y="5.4" width="8" height="8" rx="1.1" />
      <path d="M5.4 5.4V3.7a1.1 1.1 0 011.1-1.1h6.8a1.1 1.1 0 011.1 1.1v6.8a1.1 1.1 0 01-1.1 1.1h-1.7" />
    </>
  ),
  panel: (
    <>
      <rect x="2.2" y="3" width="11.6" height="10" rx="1.4" />
      <path d="M6.4 3v10" />
    </>
  ),
  hash: <path d="M6.2 2.4L4.8 13.6M11.2 2.4L9.8 13.6M2.8 5.6h10.6M2.2 10.4h10.6" />,
  sparkline: <path d="M2.4 11.6l3.2-4 2.6 2.2 3.2-5.2 2.2 3" />
};

export function Icon({
  name,
  size = 16,
  className,
  strokeWidth = 1.5,
  style
}: {
  name: keyof typeof paths | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const p = paths[name];
  if (!p) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {p}
    </svg>
  );
}

export type IconName = keyof typeof paths;
