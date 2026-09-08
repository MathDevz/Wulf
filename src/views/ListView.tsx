import React, { useMemo, useState } from 'react';
import { Bucket, Database, Item } from '../types';
import { Capture } from '../components/Capture';
import { ItemList } from '../components/ItemList';
import { Empty } from '../components/Empty';
import { Icon } from '../components/Icon';
import { captureItem, toggleComplete, updateItem, clearCompleted } from '../lib/actions';
import { formatDue, formatEstimate } from '../lib/util';
import { itemMenu } from '../lib/menus';
import { MenuEntry } from '../components/ContextMenu';

export type QueueFilter =
  | { kind: 'all' }
  | { kind: 'due' }
  | { kind: 'nodue' }
  | { kind: 'priority' }
  | { kind: 'tag'; tag: string };

interface Props {
  bucket: Bucket;
  db: Database;
  selection: Set<string>;
  setSelection: (s: Set<string>) => void;
  openItem: (id: string) => void;
  renameItem: (id: string) => void;
  editSignals: Record<string, number>;
  contextMenu: (e: React.MouseEvent, entries: MenuEntry[]) => void;
  captureFocus: number;
  showCompletedInQueue: boolean;
}

const COPY: Record<string, { title: string; sub: string; emptyTitle: string; emptyBody: string; placeholder: string }> = {
  queue: {
    title: 'Queue',
    sub: 'Everything you have dumped, in the order you decided.',
    emptyTitle: 'Your head is clear.',
    emptyBody: "Drop something here whenever it isn't.",
    placeholder: 'What do you want to do?'
  },
  today: {
    title: 'Today',
    sub: 'What you decided to work on. Nothing lands here on its own.',
    emptyTitle: 'Nothing picked for today.',
    emptyBody: 'Drag something over from Queue, or type it straight in.',
    placeholder: 'What are you doing today?'
  },
  later: {
    title: 'Later',
    sub: 'Kept, not forgotten. Out of the way until you want it.',
    emptyTitle: 'Nothing parked here.',
    emptyBody: 'Later is where things wait without cluttering your Queue.',
    placeholder: 'Something for another day…'
  }
};

export function ListView({
  bucket,
  db,
  selection,
  setSelection,
  openItem,
  renameItem,
  editSignals,
  contextMenu,
  captureFocus,
  showCompletedInQueue
}: Props) {
  const [filter, setFilter] = useState<QueueFilter>({ kind: 'all' });
  const copy = COPY[bucket];

  const projectNames = useMemo(() => new Map(db.projects.map((p) => [p.id, p.name])), [db.projects]);

  const base = useMemo(
    () =>
      db.items
        .filter((i) => !i.archived && i.bucket === bucket)
        .sort((a, b) => a.order - b.order),
    [db.items, bucket]
  );

  const active = base.filter((i) => !i.completedAt);
  const completedHere = base.filter((i) => i.completedAt);

  const tagsInView = useMemo(() => {
    const s = new Set<string>();
    active.forEach((i) => i.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [active]);

  const filtered = useMemo(() => {
    switch (filter.kind) {
      case 'due':
        return active.filter((i) => {
          if (!i.dueAt) return false;
          const d = formatDue(i.dueAt).state;
          return d === 'overdue' || d === 'today' || d === 'soon';
        });
      case 'nodue':
        return active.filter((i) => !i.dueAt);
      case 'priority':
        return active.filter((i) => i.priority === 'high');
      case 'tag':
        return active.filter((i) => i.tags.includes(filter.tag));
      default:
        return active;
    }
  }, [active, filter]);

  const totalEstimate = filtered.reduce((a, i) => a + (i.estimateMinutes || 0), 0);
  const todayDone = bucket === 'today' ? completedHere.length : 0;
  const todayTotal = bucket === 'today' ? completedHere.length + active.length : 0;

  const chip = (label: string, f: QueueFilter, count?: number) => {
    const on = JSON.stringify(f) === JSON.stringify(filter);
    return (
      <button key={label} className={`chip ${on ? 'active' : ''}`} onClick={() => setFilter(f)} aria-pressed={on}>
        {label}
        {count !== undefined && <span className="chip-count">{count}</span>}
      </button>
    );
  };

  return (
    <div className="view-inner">
      <div className="view-head">
        <div>
          <h1 className="page-title">{copy.title}</h1>
          <div className="page-sub">{copy.sub}</div>
        </div>
        {bucket === 'today' && todayTotal > 0 && (
          <div style={{ minWidth: 150, textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 5, fontWeight: 600 }}>
              {todayDone} of {todayTotal} done
            </div>
            <div className="progress">
              <span style={{ width: `${todayTotal ? (todayDone / todayTotal) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      <Capture
        placeholder={copy.placeholder}
        focusSignal={captureFocus}
        onSubmit={(t) => {
          const created = captureItem(t, { bucket });
          if (created) setSelection(new Set([created.id]));
        }}
      />

      {active.length > 0 && (
        <div className="toolbar">
          {chip('All', { kind: 'all' }, active.length)}
          {chip('Due soon', { kind: 'due' })}
          {chip('No deadline', { kind: 'nodue' })}
          {chip('High priority', { kind: 'priority' })}
          {tagsInView.length > 0 && <span className="chip-divider" />}
          {tagsInView.slice(0, 8).map((t) => chip('#' + t, { kind: 'tag', tag: t }))}
          <span className="spacer" />
          {totalEstimate > 0 && (
            <span className="chip" style={{ pointerEvents: 'none' }}>
              <Icon name="clock" size={12} /> {formatEstimate(totalEstimate)}
            </span>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        active.length === 0 ? (
          <Empty title={copy.emptyTitle} body={copy.emptyBody} />
        ) : (
          <Empty title="Nothing matches that filter." body="Try another filter, or go back to everything." action={
            <button className="btn" onClick={() => setFilter({ kind: 'all' })}>Show everything</button>
          } />
        )
      ) : (
        <ItemList
          items={filtered}
          bucket={bucket}
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
          editSignals={editSignals}
        />
      )}

      {completedHere.length > 0 && (showCompletedInQueue || bucket === 'today') && (
        <>
          <div className="section-head">
            <span>Done {bucket === 'today' ? 'today' : 'here'}</span>
            <span className="line" />
            <button className="chip" onClick={clearCompleted} title="Remove completed items everywhere">
              Clear completed
            </button>
          </div>
          <ItemList
            items={completedHere}
            bucket={bucket}
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
        </>
      )}
    </div>
  );
}
