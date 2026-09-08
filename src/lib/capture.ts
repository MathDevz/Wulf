/**
 * Deterministic capture syntax. No guessing, no AI — the user opts in by
 * typing an explicit token, and every token is documented in the app.
 *
 *   #tag          add a tag
 *   !1 !2 !3      priority high / medium / low
 *   ~45m ~2h      time estimate
 *   @today @tomorrow @later   destination
 */
import { Priority } from '../types';
import { addDays, atTime } from './util';

export interface ParsedCapture {
  title: string;
  tags: string[];
  priority: Priority;
  estimateMinutes: number | null;
  dueAt: string | null;
  bucket: 'queue' | 'today' | 'later' | null;
}

const PRIORITY: Record<string, Priority> = { '1': 'high', '2': 'medium', '3': 'low' };

export function parseCapture(raw: string): ParsedCapture {
  const out: ParsedCapture = {
    title: '',
    tags: [],
    priority: 'none',
    estimateMinutes: null,
    dueAt: null,
    bucket: null
  };
  const words = raw.split(/\s+/);
  const kept: string[] = [];

  for (const w of words) {
    if (!w) continue;
    if (w.length > 1 && w.startsWith('#')) {
      const t = w.slice(1).replace(/[^\w\- ]/g, '');
      if (t) out.tags.push(t.toLowerCase());
      continue;
    }
    if (/^![123]$/.test(w)) {
      out.priority = PRIORITY[w[1]];
      continue;
    }
    const est = /^~(\d+)(m|min|h|hr)?$/i.exec(w);
    if (est) {
      const n = parseInt(est[1], 10);
      const unit = (est[2] || 'm').toLowerCase();
      out.estimateMinutes = unit.startsWith('h') ? n * 60 : n;
      continue;
    }
    const at = /^@(today|tomorrow|later|queue|weekend)$/i.exec(w);
    if (at) {
      const k = at[1].toLowerCase();
      if (k === 'today') {
        out.bucket = 'today';
      } else if (k === 'later') {
        out.bucket = 'later';
      } else if (k === 'queue') {
        out.bucket = 'queue';
      } else if (k === 'tomorrow') {
        out.dueAt = atTime(addDays(new Date(), 1), 9).toISOString();
      } else if (k === 'weekend') {
        const d = new Date();
        const delta = (6 - d.getDay() + 7) % 7 || 7;
        out.dueAt = atTime(addDays(d, delta), 10).toISOString();
      }
      continue;
    }
    kept.push(w);
  }

  out.title = kept.join(' ').trim();
  if (!out.title) out.title = raw.trim();
  return out;
}

export const CAPTURE_HELP: { token: string; meaning: string }[] = [
  { token: '#tag', meaning: 'Add a tag' },
  { token: '!1 !2 !3', meaning: 'High, medium, low priority' },
  { token: '~30m  ~2h', meaning: 'Time estimate' },
  { token: '@today', meaning: 'Straight into Today' },
  { token: '@later', meaning: 'Straight into Later' },
  { token: '@tomorrow', meaning: 'Due tomorrow morning' },
  { token: '@weekend', meaning: 'Due this weekend' }
];
