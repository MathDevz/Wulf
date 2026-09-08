import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Database } from '../types';
import { search } from '../lib/search';

export interface Command {
  id: string;
  label: string;
  icon: string;
  kb?: string;
  keywords?: string;
  run: () => void;
}

interface Props {
  db: Database;
  commands: Command[];
  initialQuery?: string;
  onClose: () => void;
  onOpenItem: (id: string) => void;
  onOpenProject: (id: string) => void;
}

export function Palette({ db, commands, initialQuery = '', onClose, onOpenItem, onOpenProject }: Props) {
  const [q, setQ] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => search(db, q, 30), [db, q]);
  const cmds = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    return commands.filter((c) => (c.label + ' ' + (c.keywords || '')).toLowerCase().includes(term));
  }, [commands, q]);

  const rows = useMemo(
    () => [
      ...cmds.map((c) => ({ type: 'command' as const, cmd: c })),
      ...hits.map((h) => ({ type: 'hit' as const, hit: h }))
    ],
    [cmds, hits]
  );

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector('.palette-row.active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (i: number) => {
    const r = rows[i];
    if (!r) return;
    if (r.type === 'command') r.cmd.run();
    else if (r.hit.kind === 'item') onOpenItem(r.hit.id);
    else onOpenProject(r.hit.id);
    onClose();
  };

  return (
    <div className="palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-label="Command palette and search">
        <div className="palette-input">
          <Icon name="search" size={17} className="dim" />
          <input
            autoFocus
            value={q}
            placeholder="Search everything, or type a command…"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, rows.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(active);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              }
            }}
            aria-label="Search or run a command"
          />
          {q && (
            <button className="icon-btn" onClick={() => setQ('')} aria-label="Clear">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>

        <div className="palette-results" ref={listRef}>
          {rows.length === 0 && (
            <div style={{ padding: '26px 14px', textAlign: 'center' }} className="dim">
              Nothing found for “{q}”.
            </div>
          )}
          {cmds.length > 0 && <div className="ctx-label">Actions</div>}
          {rows.map((r, i) =>
            r.type === 'command' ? (
              <button
                key={r.cmd.id}
                className={`palette-row ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(i)}
              >
                <Icon name={r.cmd.icon} size={15} />
                <span className="pr-title">{r.cmd.label}</span>
                {r.cmd.kb && <span className="pr-kb">{r.cmd.kb}</span>}
              </button>
            ) : (
              <React.Fragment key={r.hit.kind + r.hit.id}>
                {i === cmds.length && <div className="ctx-label">Results</div>}
                <button
                  className={`palette-row ${i === active ? 'active' : ''} ${r.hit.completed ? 'done' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => run(i)}
                >
                  <Icon name={r.hit.kind === 'project' ? 'folder' : r.hit.completed ? 'done' : 'inbox'} size={15} />
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span className="pr-title" style={{ display: 'block' }}>
                      {r.hit.title}
                    </span>
                    <span className="pr-sub" style={{ display: 'block' }}>
                      {r.hit.subtitle}
                    </span>
                  </span>
                </button>
              </React.Fragment>
            )
          )}
        </div>

        <div className="palette-foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
          <span className="spacer" />
          <span>{hits.length} result{hits.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
