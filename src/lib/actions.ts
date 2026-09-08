/** All user-facing mutations live here so views stay presentational. */
import { Bucket, Database, Item, Project } from '../types';
import { parseCapture } from './capture';
import { logActivity, newItem, newLink, newProject, newSubtask, store, toAttachment } from './store';
import { nowIso, normalizeUrl, reindex, uid } from './util';

const api = () => (window as any).wulf as any;

function bucketList(db: Database, bucket: Bucket, projectId: string | null = null) {
  return db.items
    .filter((i) => !i.archived && !i.completedAt && i.bucket === bucket && (bucket !== 'project' || i.projectId === projectId))
    .sort((a, b) => a.order - b.order);
}

function placeInBucket(db: Database, item: Item, position: 'top' | 'bottom') {
  const siblings = bucketList(db, item.bucket, item.projectId).filter((i) => i.id !== item.id);
  const ordered = position === 'top' ? [item, ...siblings] : [...siblings, item];
  reindex(ordered);
}

/* ---------------------------------------------------------------- */
/* capture                                                           */
/* ---------------------------------------------------------------- */
export function captureItem(raw: string, opts: { bucket?: Bucket; projectId?: string | null } = {}) {
  const text = raw.trim();
  if (!text) return null;
  const parsed = parseCapture(text);
  const position = store.settings?.newTaskPosition ?? 'top';
  const bucket: Bucket = opts.projectId ? 'project' : parsed.bucket || opts.bucket || 'queue';
  let created: Item | undefined;

  store.commit('Add item', (db) => {
    const item = newItem({
      title: parsed.title,
      bucket,
      projectId: opts.projectId ?? null,
      tags: parsed.tags,
      priority: parsed.priority,
      estimateMinutes: parsed.estimateMinutes,
      dueAt: parsed.dueAt,
      todayAt: bucket === 'today' ? nowIso() : null
    });
    db.items.push(item);
    placeInBucket(db, item, position);
    for (const t of parsed.tags) if (!db.tags.includes(t)) db.tags.push(t);
    logActivity(db, 'create', `Added “${item.title}”`, { itemId: item.id, projectId: item.projectId ?? undefined });
    created = item;
  });
  return created ?? null;
}

export function updateItem(id: string, patch: Partial<Item>, label = 'Edit item') {
  store.commit(label, (db) => {
    const it = db.items.find((i) => i.id === id);
    if (!it) return;
    Object.assign(it, patch, { updatedAt: nowIso() });
    for (const t of it.tags) if (!db.tags.includes(t)) db.tags.push(t);
  });
}

export function toggleComplete(id: string) {
  const item = store.db.items.find((i) => i.id === id);
  if (!item) return;
  const completing = !item.completedAt;
  store.commit(completing ? 'Complete item' : 'Reopen item', (db) => {
    const it = db.items.find((i) => i.id === id);
    if (!it) return;
    it.completedAt = completing ? nowIso() : null;
    it.updatedAt = nowIso();
    if (completing) {
      it.subtasks.forEach((s) => (s.done = true));
    }
    logActivity(db, completing ? 'complete' : 'reopen', `${completing ? 'Completed' : 'Reopened'} “${it.title}”`, {
      itemId: it.id,
      projectId: it.projectId ?? undefined
    });
  });
  if (completing) {
    store.toast({
      message: `Completed “${truncate(item.title)}”`,
      tone: 'success',
      actionLabel: 'Undo',
      action: () => store.undo()
    });
  }
}

export function toggleSubtask(itemId: string, subId: string) {
  store.commit('Toggle subtask', (db) => {
    const it = db.items.find((i) => i.id === itemId);
    const st = it?.subtasks.find((s) => s.id === subId);
    if (!it || !st) return;
    st.done = !st.done;
    it.updatedAt = nowIso();
  });
}

export function addSubtask(itemId: string, title: string) {
  const t = title.trim();
  if (!t) return;
  store.commit('Add subtask', (db) => {
    const it = db.items.find((i) => i.id === itemId);
    if (!it) return;
    it.subtasks.push(newSubtask(t));
    it.updatedAt = nowIso();
  });
}

export function updateSubtask(itemId: string, subId: string, title: string) {
  store.commit('Edit subtask', (db) => {
    const it = db.items.find((i) => i.id === itemId);
    const st = it?.subtasks.find((s) => s.id === subId);
    if (st) st.title = title;
  });
}

export function removeSubtask(itemId: string, subId: string) {
  store.commit('Remove subtask', (db) => {
    const it = db.items.find((i) => i.id === itemId);
    if (!it) return;
    it.subtasks = it.subtasks.filter((s) => s.id !== subId);
  });
}

export function moveItem(id: string, bucket: Bucket, projectId: string | null = null, silent = false) {
  const item = store.db.items.find((i) => i.id === id);
  if (!item) return;
  const label =
    bucket === 'project'
      ? `Moved to ${store.db.projects.find((p) => p.id === projectId)?.name ?? 'project'}`
      : `Moved to ${bucket[0].toUpperCase() + bucket.slice(1)}`;
  store.commit('Move item', (db) => {
    const it = db.items.find((i) => i.id === id);
    if (!it) return;
    it.bucket = bucket;
    it.projectId = bucket === 'project' ? projectId : null;
    it.todayAt = bucket === 'today' ? nowIso() : null;
    it.updatedAt = nowIso();
    placeInBucket(db, it, 'top');
    logActivity(db, 'move', `${label}: “${it.title}”`, { itemId: it.id, projectId: it.projectId ?? undefined });
  });
  if (!silent) {
    store.toast({ message: `${label}`, tone: 'default', actionLabel: 'Undo', action: () => store.undo() });
  }
}

export function reorderItem(id: string, targetBucket: Bucket, projectId: string | null, targetIndex: number) {
  store.commit('Reorder', (db) => {
    const it = db.items.find((i) => i.id === id);
    if (!it) return;
    const movingBucket = it.bucket !== targetBucket || (it.projectId ?? null) !== (projectId ?? null);
    it.bucket = targetBucket;
    it.projectId = targetBucket === 'project' ? projectId : null;
    if (targetBucket === 'today' && !it.todayAt) it.todayAt = nowIso();
    if (targetBucket !== 'today') it.todayAt = null;
    it.updatedAt = nowIso();
    const siblings = bucketList(db, targetBucket, projectId).filter((i) => i.id !== id);
    const idx = Math.max(0, Math.min(targetIndex, siblings.length));
    siblings.splice(idx, 0, it);
    reindex(siblings);
    if (movingBucket) {
      logActivity(db, 'move', `Moved “${it.title}”`, { itemId: it.id, projectId: it.projectId ?? undefined });
    }
  });
}

export function duplicateItem(id: string) {
  store.act(
    'Duplicate item',
    (db) => {
      const it = db.items.find((i) => i.id === id);
      if (!it) return;
      const copy = structuredClone(it);
      copy.id = uid('i');
      copy.title = `${it.title} (copy)`;
      copy.createdAt = copy.updatedAt = nowIso();
      copy.completedAt = null;
      copy.subtasks = copy.subtasks.map((s) => ({ ...s, id: uid('s'), done: false }));
      db.items.push(copy);
      placeInBucket(db, copy, 'top');
    },
    'Duplicated'
  );
}

export async function deleteItem(id: string) {
  const item = store.db.items.find((i) => i.id === id);
  if (!item) return;
  if (store.settings?.confirmDelete) {
    const ok = await api().dialog.confirm({
      title: 'Delete item',
      message: `Delete “${item.title}”?`,
      detail: 'You can undo this immediately afterwards.',
      confirmLabel: 'Delete',
      destructive: true
    });
    if (!ok) return;
  }
  store.act(
    'Delete item',
    (db) => {
      db.items = db.items.filter((i) => i.id !== id);
      logActivity(db, 'delete', `Deleted “${item.title}”`, { itemId: id });
    },
    `Deleted “${truncate(item.title)}”`
  );
}

export function deleteItems(ids: string[]) {
  if (!ids.length) return;
  store.act(
    'Delete items',
    (db) => {
      db.items = db.items.filter((i) => !ids.includes(i.id));
    },
    `Deleted ${ids.length} item${ids.length > 1 ? 's' : ''}`
  );
}

export function setTagOnItem(id: string, tag: string, on: boolean) {
  const t = tag.trim().toLowerCase();
  if (!t) return;
  store.commit(on ? 'Add tag' : 'Remove tag', (db) => {
    const it = db.items.find((i) => i.id === id);
    if (!it) return;
    it.tags = on ? Array.from(new Set([...it.tags, t])) : it.tags.filter((x) => x !== t);
    it.updatedAt = nowIso();
    if (on && !db.tags.includes(t)) db.tags.push(t);
  });
}

export function addLinkToItem(id: string, url: string) {
  const u = normalizeUrl(url);
  if (!u) return;
  store.commit('Add link', (db) => {
    const it = db.items.find((i) => i.id === id);
    if (!it) return;
    it.links.push(newLink(u));
    it.updatedAt = nowIso();
  });
}

export function removeLinkFromItem(id: string, linkId: string) {
  store.commit('Remove link', (db) => {
    const it = db.items.find((i) => i.id === id);
    if (it) it.links = it.links.filter((l) => l.id !== linkId);
  });
}

export function addLinkToProject(id: string, url: string) {
  const u = normalizeUrl(url);
  if (!u) return;
  store.commit('Add link', (db) => {
    const p = db.projects.find((x) => x.id === id);
    if (p) p.links.push(newLink(u));
  });
}

export function removeLinkFromProject(id: string, linkId: string) {
  store.commit('Remove link', (db) => {
    const p = db.projects.find((x) => x.id === id);
    if (p) p.links = p.links.filter((l) => l.id !== linkId);
  });
}

/* attachments ------------------------------------------------------ */
export async function attachFilesToItem(id: string, paths: string[]) {
  const files: any[] = [];
  for (const p of paths) {
    try {
      files.push(await api().attach.copyIn(p));
    } catch (e: any) {
      store.toast({ message: `Could not attach ${p.split(/[\\/]/).pop()}.`, tone: 'error' });
    }
  }
  if (!files.length) return;
  store.act(
    'Attach files',
    (db) => {
      const it = db.items.find((i) => i.id === id);
      if (!it) return;
      it.attachments.push(...files.map(toAttachment));
      it.updatedAt = nowIso();
    },
    `Attached ${files.length} file${files.length > 1 ? 's' : ''}`
  );
}

export async function attachFilesToProject(id: string, paths: string[]) {
  const files: any[] = [];
  for (const p of paths) {
    try {
      files.push(await api().attach.copyIn(p));
    } catch {}
  }
  if (!files.length) return;
  store.act(
    'Attach files',
    (db) => {
      const p = db.projects.find((x) => x.id === id);
      if (p) p.attachments.push(...files.map(toAttachment));
    },
    `Attached ${files.length} file${files.length > 1 ? 's' : ''}`
  );
}

export async function removeAttachment(kind: 'item' | 'project', ownerId: string, attId: string) {
  const owner: any =
    kind === 'item' ? store.db.items.find((i) => i.id === ownerId) : store.db.projects.find((p) => p.id === ownerId);
  const att = owner?.attachments.find((a: any) => a.id === attId);
  store.act(
    'Remove attachment',
    (db) => {
      const o: any = kind === 'item' ? db.items.find((i) => i.id === ownerId) : db.projects.find((p) => p.id === ownerId);
      if (o) o.attachments = o.attachments.filter((a: any) => a.id !== attId);
    },
    'Attachment removed'
  );
  if (att?.managed) {
    try {
      await api().attach.remove(att.path);
    } catch {}
  }
}

/* projects --------------------------------------------------------- */
export function createProject(name: string, description = '') {
  let created: Project | undefined;
  store.commit('Create project', (db) => {
    const p = newProject({ name: name.trim() || 'New project', description });
    db.projects.forEach((x) => (x.order += 1));
    p.order = 0;
    db.projects.push(p);
    logActivity(db, 'project', `Created project “${p.name}”`, { projectId: p.id });
    created = p;
  });
  return created ?? null;
}

export function updateProject(id: string, patch: Partial<Project>, label = 'Edit project') {
  store.commit(label, (db) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return;
    Object.assign(p, patch, { updatedAt: nowIso() });
    for (const t of p.tags) if (!db.tags.includes(t)) db.tags.push(t);
  });
}

export function duplicateProject(id: string) {
  store.act(
    'Duplicate project',
    (db) => {
      const p = db.projects.find((x) => x.id === id);
      if (!p) return;
      const copy = structuredClone(p);
      copy.id = uid('p');
      copy.name = `${p.name} (copy)`;
      copy.createdAt = copy.updatedAt = nowIso();
      db.projects.push(copy);
      const tasks = db.items.filter((i) => i.projectId === id && !i.archived);
      tasks.forEach((t) => {
        const c = structuredClone(t);
        c.id = uid('i');
        c.projectId = copy.id;
        c.completedAt = null;
        c.createdAt = c.updatedAt = nowIso();
        c.subtasks = c.subtasks.map((s) => ({ ...s, id: uid('s'), done: false }));
        db.items.push(c);
      });
    },
    'Project duplicated'
  );
}

export function archiveProject(id: string, archived = true) {
  const p = store.db.projects.find((x) => x.id === id);
  store.act(
    archived ? 'Archive project' : 'Restore project',
    (db) => {
      const proj = db.projects.find((x) => x.id === id);
      if (proj) {
        proj.archived = archived;
        proj.updatedAt = nowIso();
      }
    },
    archived ? `Archived “${truncate(p?.name || '')}”` : 'Project restored'
  );
}

export async function deleteProject(id: string, alsoTasks: boolean) {
  const p = store.db.projects.find((x) => x.id === id);
  if (!p) return;
  const count = store.db.items.filter((i) => i.projectId === id).length;
  const ok = await api().dialog.confirm({
    title: 'Delete project',
    message: `Delete “${p.name}”?`,
    detail: count
      ? alsoTasks
        ? `${count} task${count > 1 ? 's' : ''} inside will also be deleted. You can undo this immediately afterwards.`
        : `${count} task${count > 1 ? 's' : ''} will be moved back to your Queue.`
      : 'You can undo this immediately afterwards.',
    confirmLabel: 'Delete',
    destructive: true
  });
  if (!ok) return;
  store.act(
    'Delete project',
    (db) => {
      db.projects = db.projects.filter((x) => x.id !== id);
      if (alsoTasks) {
        db.items = db.items.filter((i) => i.projectId !== id);
      } else {
        db.items.forEach((i) => {
          if (i.projectId === id) {
            i.projectId = null;
            i.bucket = 'queue';
          }
        });
      }
      logActivity(db, 'delete', `Deleted project “${p.name}”`);
    },
    `Deleted “${truncate(p.name)}”`
  );
}

export function reorderProjects(id: string, targetIndex: number) {
  store.commit('Reorder projects', (db) => {
    const list = db.projects.filter((p) => !p.archived).sort((a, b) => a.order - b.order);
    const cur = list.findIndex((p) => p.id === id);
    if (cur < 0) return;
    const [moved] = list.splice(cur, 1);
    list.splice(Math.max(0, Math.min(targetIndex, list.length)), 0, moved);
    reindex(list);
  });
}

/* misc ------------------------------------------------------------- */
export function renameTag(oldTag: string, next: string) {
  const t = next.trim().toLowerCase();
  if (!t) return;
  store.act('Rename tag', (db) => {
    db.items.forEach((i) => (i.tags = i.tags.map((x) => (x === oldTag ? t : x))));
    db.projects.forEach((p) => (p.tags = p.tags.map((x) => (x === oldTag ? t : x))));
    db.tags = Array.from(new Set(db.tags.map((x) => (x === oldTag ? t : x))));
  });
}

export function deleteTag(tag: string) {
  store.act(
    'Delete tag',
    (db) => {
      db.items.forEach((i) => (i.tags = i.tags.filter((x) => x !== tag)));
      db.projects.forEach((p) => (p.tags = p.tags.filter((x) => x !== tag)));
      db.tags = db.tags.filter((x) => x !== tag);
    },
    `Removed tag “${tag}”`
  );
}

export function clearCompleted() {
  const count = store.db.items.filter((i) => i.completedAt).length;
  if (!count) return;
  store.act(
    'Clear completed',
    (db) => {
      db.items = db.items.filter((i) => !i.completedAt);
    },
    `Cleared ${count} completed item${count > 1 ? 's' : ''}`
  );
}

function truncate(s: string, n = 34) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
