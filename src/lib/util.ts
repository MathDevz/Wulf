export function uid(prefix = ''): string {
  const b = new Uint8Array(9);
  crypto.getRandomValues(b);
  const s = Array.from(b, (x) => x.toString(36).padStart(2, '0')).join('').slice(0, 12);
  return prefix ? `${prefix}_${s}` : s;
}

export const nowIso = () => new Date().toISOString();

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export function daysBetween(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

/** "Tomorrow", "In 3 days", "2 days overdue", "12 Mar" */
export function formatDue(iso: string | null): { label: string; state: 'none' | 'future' | 'soon' | 'today' | 'overdue' } {
  if (!iso) return { label: '', state: 'none' };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { label: '', state: 'none' };
  const diff = daysBetween(new Date(), d);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  const time = hasTime
    ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : '';
  if (diff < 0) {
    const n = Math.abs(diff);
    return { label: n === 1 ? 'Yesterday' : `${n} days overdue`, state: 'overdue' };
  }
  if (diff === 0) return { label: time ? `Today ${time}` : 'Today', state: 'today' };
  if (diff === 1) return { label: time ? `Tomorrow ${time}` : 'Tomorrow', state: 'soon' };
  if (diff <= 6) return { label: d.toLocaleDateString(undefined, { weekday: 'long' }), state: 'soon' };
  return {
    label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    state: 'future'
  };
}

export function formatDateTime(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function relativeTime(iso: string) {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const s = Math.round((Date.now() - d) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const dd = Math.round(h / 24);
  if (dd < 30) return `${dd}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatEstimate(min: number | null) {
  if (!min) return '';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatBytes(n: number) {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}

/** Parse a local datetime-local string into an ISO string. */
export function localInputToIso(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function isoToLocalInput(iso: string | null, withTime = true): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return withTime ? `${date}T${p(d.getHours())}:${p(d.getMinutes())}` : date;
}

export function atTime(base: Date, hours: number, minutes = 0) {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function nextWeekend(from = new Date()) {
  const d = new Date(from);
  const delta = (6 - d.getDay() + 7) % 7 || 7;
  return addDays(d, delta);
}

export function debounce<T extends (...a: any[]) => void>(fn: T, ms: number) {
  let t: any;
  return (...a: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

export function normalizeUrl(raw: string) {
  const v = raw.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(v)) return 'https://' + v;
  return v;
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function reindex<T extends { order: number }>(list: T[]) {
  list.forEach((x, i) => (x.order = i));
  return list;
}
