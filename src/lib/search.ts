/**
 * Local search index. Rebuilt incrementally from the database; matching is a
 * simple scored substring/prefix match which stays fast for tens of thousands
 * of records and needs no dependencies.
 */
import { Database, Item, Project } from '../types';

export interface SearchHit {
  kind: 'item' | 'project';
  id: string;
  title: string;
  subtitle: string;
  score: number;
  item?: Item;
  project?: Project;
  completed?: boolean;
}

interface Doc {
  kind: 'item' | 'project';
  id: string;
  title: string;
  hay: string;
  completed: boolean;
  ref: any;
}

let cache: { key: string; docs: Doc[] } | null = null;

function buildKey(db: Database) {
  return `${db.items.length}:${db.projects.length}:${db.items.reduce((a, i) => a + i.updatedAt.length + i.id.charCodeAt(3), 0)}:${db.projects
    .map((p) => p.updatedAt)
    .join('').length}`;
}

function docsFor(db: Database): Doc[] {
  const key = buildKey(db);
  if (cache && cache.key === key) return cache.docs;
  const docs: Doc[] = [];
  const projName = new Map(db.projects.map((p) => [p.id, p.name]));
  for (const i of db.items) {
    docs.push({
      kind: 'item',
      id: i.id,
      title: i.title,
      completed: !!i.completedAt,
      ref: i,
      hay: [
        i.title,
        i.notes,
        i.tags.join(' '),
        i.subtasks.map((s) => s.title).join(' '),
        i.links.map((l) => l.url + ' ' + l.label).join(' '),
        i.attachments.map((a) => a.name).join(' '),
        i.projectId ? projName.get(i.projectId) ?? '' : ''
      ]
        .join(' \u0001 ')
        .toLowerCase()
    });
  }
  for (const p of db.projects) {
    docs.push({
      kind: 'project',
      id: p.id,
      title: p.name,
      completed: !!p.completedAt,
      ref: p,
      hay: [p.name, p.description, p.notes, p.tags.join(' '), p.links.map((l) => l.url).join(' '), p.attachments.map((a) => a.name).join(' ')]
        .join(' \u0001 ')
        .toLowerCase()
    });
  }
  cache = { key, docs };
  return docs;
}

export function search(db: Database, query: string, limit = 40): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const docs = docsFor(db);
  const hits: SearchHit[] = [];
  const projName = new Map(db.projects.map((p) => [p.id, p.name]));

  for (const d of docs) {
    let score = 0;
    let all = true;
    const title = d.title.toLowerCase();
    for (const t of terms) {
      const inTitle = title.indexOf(t);
      const inHay = d.hay.indexOf(t);
      if (inTitle === 0) score += 100;
      else if (inTitle > 0) score += 60;
      else if (inHay >= 0) score += 20;
      else {
        all = false;
        break;
      }
    }
    if (!all) continue;
    if (d.completed) score -= 25;
    if (d.kind === 'project') score += 10;
    let subtitle = '';
    if (d.kind === 'item') {
      const it = d.ref as Item;
      subtitle = it.completedAt
        ? 'Completed'
        : it.projectId
        ? projName.get(it.projectId) ?? 'Project'
        : it.bucket[0].toUpperCase() + it.bucket.slice(1);
      if (it.tags.length) subtitle += ` · ${it.tags.map((t) => '#' + t).join(' ')}`;
    } else {
      const p = d.ref as Project;
      const n = db.items.filter((i) => i.projectId === p.id).length;
      subtitle = `Project · ${n} task${n === 1 ? '' : 's'}${p.archived ? ' · archived' : ''}`;
    }
    hits.push({
      kind: d.kind,
      id: d.id,
      title: d.title,
      subtitle,
      score,
      completed: d.completed,
      item: d.kind === 'item' ? d.ref : undefined,
      project: d.kind === 'project' ? d.ref : undefined
    });
  }

  hits.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return hits.slice(0, limit);
}
