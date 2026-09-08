import React, { useMemo, useState } from 'react';
import { Database, Item } from '../types';
import { Icon } from '../components/Icon';
import { Empty } from '../components/Empty';
import { ItemList } from '../components/ItemList';
import { MenuEntry } from '../components/ContextMenu';
import { clearCompleted, toggleComplete, updateItem } from '../lib/actions';
import { itemMenu } from '../lib/menus';
import { daysBetween } from '../lib/util';

interface Props {
  db: Database;
  selection: Set<string>;
  setSelection: (s: Set<string>) => void;
  openItem: (id: string) => void;
  renameItem: (id: string) => void;
  contextMenu: (e: React.MouseEvent, entries: MenuEntry[]) => void;
}

function groupLabel(iso: string) {
  const d = new Date(iso);
  const diff = daysBetween(d, new Date());
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return 'Earlier this week';
  if (diff < 31) return 'This month';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function CompletedView({ db, selection, setSelection, openItem, renameItem, contextMenu }: Props) {
  const [q, setQ] = useState('');
  const projectNames = useMemo(() => new Map(db.projects.map((p) => [p.id, p.name])), [db.projects]);

  const completed = useMemo(
    () =>
      db.items
        .filter((i) => i.completedAt)
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')),
    [db.items]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return completed;
    return completed.filter(
      (i) =>
        i.title.toLowerCase().includes(term) ||
        i.notes.toLowerCase().includes(term) ||
        i.tags.some((t) => t.includes(term))
    );
  }, [completed, q]);

  const groups = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of filtered) {
      const k = groupLabel(i.completedAt!);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(i);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const thisWeek = completed.filter((i) => daysBetween(new Date(i.completedAt!), new Date()) < 7).length;

  return (
    <div className="view-inner">
      <div className="view-head">
        <div>
          <h1 className="page-title">Completed</h1>
          <div className="page-sub">
            {completed.length
              ? `${completed.length} finished · ${thisWeek} in the last seven days.`
              : 'Everything you finish is kept here.'}
          </div>
        </div>
        {completed.length > 0 && (
          <button className="btn danger sm" onClick={clearCompleted}>
            <Icon name="trash" size={13} /> Clear history
          </button>
        )}
      </div>

      {completed.length > 0 && (
        <div className="capture" style={{ height: 44, marginBottom: 16 }}>
          <span className="cap-icon">
            <Icon name="search" size={16} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search what you have finished"
            aria-label="Search completed items"
            style={{ fontSize: 14 }}
          />
          {q && (
            <button className="icon-btn" onClick={() => setQ('')} aria-label="Clear search">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty
          title={completed.length ? 'Nothing matches that.' : 'Nothing finished yet.'}
          body={
            completed.length
              ? 'Try a different word.'
              : 'Completed things are never deleted automatically — they collect here so you can see what you got done.'
          }
        />
      ) : (
        groups.map(([label, items]) => (
          <React.Fragment key={label}>
            <div className="section-head">
              <span>{label}</span>
              <span className="line" />
              <span style={{ letterSpacing: 0, textTransform: 'none', fontWeight: 500 }}>{items.length}</span>
            </div>
            <ItemList
              items={items}
              bucket="queue"
              projectNames={projectNames}
              selection={selection}
              onSelectionChange={setSelection}
              onToggle={toggleComplete}
              onOpen={openItem}
              onContext={(e, id) => {
                const it = db.items.find((x) => x.id === id)!;
                contextMenu(e, itemMenu(db, it, selection, { open: openItem, rename: renameItem }));
              }}
              onRename={(id, title) => updateItem(id, { title }, 'Rename item')}
              reorderable={false}
            />
          </React.Fragment>
        ))
      )}
    </div>
  );
}
