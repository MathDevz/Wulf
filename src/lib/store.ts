/**
 * Wulf application store.
 *
 * A tiny observable store with an undo stack. All mutations go through
 * `commit()`, which snapshots the previous database, applies a pure
 * transform, persists asynchronously and records an undo entry.
 */
import { useSyncExternalStore } from 'react';
import { ActivityEntry, Attachment, Bucket, Database, Item, LinkRef, Priority, Project, Settings, Subtask, emptyDatabase } from '../types';
import { nowIso, uid } from './util';

const api = () => (window as any).wulf as any;

export interface UndoEntry {
  label: string;
  before: Database;
  at: number;
}

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'error' | 'success';
  actionLabel?: string;
  action?: () => void;
  duration?: number;
}

type Listener = () => void;

class WulfStore {
  db: Database = emptyDatabase();
  settings: Settings | null = null;
  ready = false;
  loadError: string | null = null;
  toasts: Toast[] = [];
  private undoStack: UndoEntry[] = [];
  private redoStack: UndoEntry[] = [];
  private listeners = new Set<Listener>();
  private version = 0;

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };

  getSnapshot = () => this.version;

  private emit() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  async load() {
    try {
      const [db, settings] = await Promise.all([api().data.read(), api().settings.read()]);
      this.db = normalize(db);
      this.settings = settings;
      this.ready = true;
      this.loadError = null;
    } catch (e: any) {
      this.loadError = e?.message || 'Wulf could not open your data file.';
      this.ready = true;
    }
    this.emit();
  }

  private persist() {
    api()
      .data.write(this.db)
      .catch((e: any) =>
        this.toast({
          message: 'Wulf could not save that change. Your previous data is still safe.',
          tone: 'error',
          duration: 8000
        })
      );
  }

  /** Apply a mutation with undo support. */
  commit(label: string, fn: (db: Database) => void, opts: { undoable?: boolean; silent?: boolean } = {}) {
    const undoable = opts.undoable !== false;
    const before = undoable ? structuredClone(this.db) : null;
    const draft = structuredClone(this.db);
    fn(draft);
    this.db = draft;
    if (before) {
      this.undoStack.push({ label, before, at: Date.now() });
      if (this.undoStack.length > 60) this.undoStack.shift();
      this.redoStack = [];
    }
    this.persist();
    this.emit();
  }

  canUndo() {
    return this.undoStack.length > 0;
  }
  canRedo() {
    return this.redoStack.length > 0;
  }
  lastUndoLabel() {
    return this.undoStack[this.undoStack.length - 1]?.label ?? '';
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return false;
    this.redoStack.push({ label: entry.label, before: structuredClone(this.db), at: Date.now() });
    this.db = entry.before;
    this.persist();
    this.emit();
    this.toast({ message: `Undid ${entry.label.toLowerCase()}`, tone: 'default' });
    return true;
  }

  redo() {
    const entry = this.redoStack.pop();
    if (!entry) return false;
    this.undoStack.push({ label: entry.label, before: structuredClone(this.db), at: Date.now() });
    this.db = entry.before;
    this.persist();
    this.emit();
    return true;
  }

  toast(t: Omit<Toast, 'id'>) {
    const toast: Toast = { id: uid('t'), duration: 4200, ...t };
    this.toasts = [...this.toasts.filter((x) => x.message !== toast.message), toast];
    this.emit();
    setTimeout(() => this.dismissToast(toast.id), toast.duration);
    return toast.id;
  }

  dismissToast(id: string) {
    if (!this.toasts.some((t) => t.id === id)) return;
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.emit();
  }

  /** Commit + offer an inline undo toast. */
  act(label: string, fn: (db: Database) => void, toastMessage?: string) {
    this.commit(label, fn);
    if (toastMessage) {
      this.toast({
        message: toastMessage,
        tone: 'default',
        actionLabel: 'Undo',
        action: () => this.undo()
      });
    }
  }

  async setSettings(patch: Partial<Settings>) {
    try {
      const next = await api().settings.write(patch);
      this.settings = next;
      this.emit();
    } catch (e: any) {
      this.toast({ message: 'Could not save that setting.', tone: 'error' });
    }
  }

  replaceDatabase(db: Database, label = 'Import') {
    const before = structuredClone(this.db);
    this.undoStack.push({ label, before, at: Date.now() });
    this.db = normalize(db);
    this.emit();
  }
}

export function normalize(raw: any): Database {
  const db: Database = { ...emptyDatabase(), ...(raw || {}) };
  db.items = (db.items || []).map((i: any, idx: number) => ({
    id: i.id || uid('i'),
    title: String(i.title ?? '').trim() || 'Untitled',
    bucket: (i.bucket as Bucket) || 'queue',
    projectId: i.projectId ?? null,
    order: typeof i.order === 'number' ? i.order : idx,
    createdAt: i.createdAt || nowIso(),
    updatedAt: i.updatedAt || i.createdAt || nowIso(),
    completedAt: i.completedAt ?? null,
    notes: i.notes ?? '',
    priority: (i.priority as Priority) || 'none',
    dueAt: i.dueAt ?? null,
    reminderAt: i.reminderAt ?? null,
    reminderFired: !!i.reminderFired,
    estimateMinutes: i.estimateMinutes ?? null,
    tags: Array.isArray(i.tags) ? i.tags : [],
    subtasks: Array.isArray(i.subtasks) ? i.subtasks : [],
    links: Array.isArray(i.links) ? i.links : [],
    attachments: Array.isArray(i.attachments) ? i.attachments : [],
    todayAt: i.todayAt ?? null,
    archived: !!i.archived
  }));
  db.projects = (db.projects || []).map((p: any, idx: number) => ({
    id: p.id || uid('p'),
    name: String(p.name ?? '').trim() || 'Untitled project',
    description: p.description ?? '',
    notes: p.notes ?? '',
    color: p.color || '#DA7B1F',
    order: typeof p.order === 'number' ? p.order : idx,
    createdAt: p.createdAt || nowIso(),
    updatedAt: p.updatedAt || nowIso(),
    dueAt: p.dueAt ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    links: Array.isArray(p.links) ? p.links : [],
    attachments: Array.isArray(p.attachments) ? p.attachments : [],
    archived: !!p.archived,
    completedAt: p.completedAt ?? null
  }));
  db.tags = Array.from(new Set([...(db.tags || []), ...db.items.flatMap((i) => i.tags), ...db.projects.flatMap((p) => p.tags)]));
  db.activity = (db.activity || []).slice(-800);
  return db;
}

export const store = new WulfStore();

export function useStore<T>(selector: (s: WulfStore) => T): T {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return selector(store);
}

export function useDb() {
  return useStore((s) => s.db);
}
export function useSettings() {
  return useStore((s) => s.settings);
}

/* ------------------------------------------------------------------ */
/* domain helpers                                                      */
/* ------------------------------------------------------------------ */

export function logActivity(db: Database, kind: string, text: string, refs: { itemId?: string; projectId?: string } = {}) {
  const entry: ActivityEntry = {
    id: uid('a'),
    at: nowIso(),
    kind,
    text,
    itemId: refs.itemId ?? null,
    projectId: refs.projectId ?? null
  };
  db.activity.push(entry);
  if (db.activity.length > 800) db.activity.splice(0, db.activity.length - 800);
}

export function newItem(partial: Partial<Item>): Item {
  const t = nowIso();
  return {
    id: uid('i'),
    title: 'Untitled',
    bucket: 'queue',
    projectId: null,
    order: 0,
    createdAt: t,
    updatedAt: t,
    completedAt: null,
    notes: '',
    priority: 'none',
    dueAt: null,
    reminderAt: null,
    estimateMinutes: null,
    tags: [],
    subtasks: [],
    links: [],
    attachments: [],
    todayAt: null,
    archived: false,
    ...partial
  };
}

export function newProject(partial: Partial<Project>): Project {
  const t = nowIso();
  return {
    id: uid('p'),
    name: 'New project',
    description: '',
    notes: '',
    color: '#DA7B1F',
    order: 0,
    createdAt: t,
    updatedAt: t,
    dueAt: null,
    tags: [],
    links: [],
    attachments: [],
    archived: false,
    completedAt: null,
    ...partial
  };
}

export function newSubtask(title: string): Subtask {
  return { id: uid('s'), title, done: false };
}

export function newLink(url: string, label?: string): LinkRef {
  return { id: uid('l'), url, label: label || url, addedAt: nowIso() };
}

export function toAttachment(file: any): Attachment {
  return {
    id: uid('f'),
    path: file.path,
    name: file.originalName || file.name,
    ext: file.ext || '',
    size: file.size || 0,
    managed: !!file.managed,
    originalName: file.originalName,
    addedAt: nowIso()
  };
}

/* progress ---------------------------------------------------------- */
export function projectProgress(db: Database, projectId: string) {
  const items = db.items.filter((i) => i.projectId === projectId && !i.archived);
  const done = items.filter((i) => i.completedAt).length;
  return { done, total: items.length, ratio: items.length ? done / items.length : 0 };
}

export function itemProgress(item: Item) {
  if (!item.subtasks.length) return null;
  const done = item.subtasks.filter((s) => s.done).length;
  return { done, total: item.subtasks.length, ratio: done / item.subtasks.length };
}
