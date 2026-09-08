import React, { useMemo, useState } from 'react';
import { Database } from '../types';
import { Icon } from '../components/Icon';
import { Empty } from '../components/Empty';
import { projectProgress } from '../lib/store';
import { archiveProject, createProject, deleteProject, duplicateProject, moveItem, reorderProjects } from '../lib/actions';
import { MenuEntry } from '../components/ContextMenu';
import { DND_MIME, readDrag, setDrag } from '../lib/dnd';
import { formatDue } from '../lib/util';

interface Props {
  db: Database;
  openProject: (id: string) => void;
  contextMenu: (e: React.MouseEvent, entries: MenuEntry[]) => void;
  newProjectSignal: number;
}

export function ProjectsView({ db, openProject, contextMenu, newProjectSignal }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  React.useEffect(() => {
    if (newProjectSignal) setCreating(true);
  }, [newProjectSignal]);

  const projects = useMemo(
    () => db.projects.filter((p) => (showArchived ? p.archived : !p.archived)).sort((a, b) => a.order - b.order),
    [db.projects, showArchived]
  );
  const archivedCount = db.projects.filter((p) => p.archived).length;

  const submit = () => {
    const n = name.trim();
    if (n) {
      const p = createProject(n);
      setName('');
      setCreating(false);
      if (p) openProject(p.id);
    } else {
      setCreating(false);
    }
  };

  const menuFor = (id: string): MenuEntry[] => {
    const p = db.projects.find((x) => x.id === id)!;
    return [
      { label: 'Open', icon: 'chevronRight', onSelect: () => openProject(id) },
      { label: 'Rename', icon: 'edit', onSelect: () => openProject(id) },
      { label: 'Duplicate', icon: 'copy', onSelect: () => duplicateProject(id) },
      { type: 'separator' },
      {
        label: p.archived ? 'Restore' : 'Archive',
        icon: 'archive',
        onSelect: () => archiveProject(id, !p.archived)
      },
      {
        label: 'Delete',
        icon: 'trash',
        danger: true,
        submenu: [
          { label: 'Delete, keep tasks in Queue', onSelect: () => deleteProject(id, false) },
          { label: 'Delete project and its tasks', danger: true, onSelect: () => deleteProject(id, true) }
        ]
      }
    ];
  };

  return (
    <div className="view-inner wide">
      <div className="view-head">
        <div>
          <h1 className="page-title">Projects</h1>
          <div className="page-sub">Bigger things, broken into tasks you can actually finish.</div>
        </div>
        <div className="rowflex">
          {archivedCount > 0 && (
            <button className={`chip ${showArchived ? 'active' : ''}`} onClick={() => setShowArchived((v) => !v)}>
              <Icon name="archive" size={12} /> Archived <span className="chip-count">{archivedCount}</span>
            </button>
          )}
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} /> New project
          </button>
        </div>
      </div>

      {creating && (
        <div className="capture" style={{ marginBottom: 16 }}>
          <span className="cap-icon">
            <Icon name="folder" size={17} />
          </span>
          <input
            autoFocus
            value={name}
            placeholder="Name your project"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') submit();
              if (e.key === 'Escape') {
                setName('');
                setCreating(false);
              }
            }}
            onBlur={submit}
            aria-label="Project name"
          />
          <span className="enter-hint">ENTER</span>
        </div>
      )}

      {projects.length === 0 ? (
        <Empty
          title={showArchived ? 'No archived projects.' : 'No projects yet.'}
          body={
            showArchived
              ? 'Archived projects stay here until you restore or delete them.'
              : 'A project is just a bag for related tasks. Make one when a single line stops being enough.'
          }
          action={
            !showArchived && (
              <button className="btn primary" onClick={() => setCreating(true)}>
                <Icon name="plus" size={14} /> Create a project
              </button>
            )
          }
        />
      ) : (
        <div className="project-grid">
          {projects.map((p, index) => {
            const prog = projectProgress(db, p.id);
            const due = formatDue(p.dueAt);
            return (
              <div
                key={p.id}
                className={`project-card ${dropTarget === p.id ? 'drop-target' : ''}`}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={(e) => {
                  const payload = { kind: 'project' as const, ids: [p.id] };
                  setDrag(payload);
                  e.dataTransfer.effectAllowed = 'move';
                  try {
                    e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
                  } catch {}
                }}
                onDragEnd={() => {
                  setDrag(null);
                  setDropTarget(null);
                }}
                onDragOver={(e) => {
                  const d = readDrag(e);
                  if (!d) return;
                  e.preventDefault();
                  setDropTarget(p.id);
                }}
                onDragLeave={() => setDropTarget((t) => (t === p.id ? null : t))}
                onDrop={(e) => {
                  const d = readDrag(e);
                  setDropTarget(null);
                  if (!d) return;
                  e.preventDefault();
                  if (d.kind === 'item') d.ids.forEach((id) => moveItem(id, 'project', p.id, d.ids.length > 1));
                  else if (d.kind === 'project' && d.ids[0] !== p.id) reorderProjects(d.ids[0], index);
                  setDrag(null);
                }}
                onClick={() => openProject(p.id)}
                onKeyDown={(e) => e.key === 'Enter' && openProject(p.id)}
                onContextMenu={(e) => contextMenu(e, menuFor(p.id))}
                aria-label={`Project ${p.name}, ${prog.done} of ${prog.total} complete`}
              >
                <div className="rowflex" style={{ gap: 9 }}>
                  <span className="project-pip" style={{ background: p.color }} />
                  <h3 style={{ flex: 1 }}>{p.name}</h3>
                  {p.archived && <Icon name="archive" size={13} className="dim" />}
                </div>
                {p.description && <p>{p.description}</p>}
                {due.label && (
                  <div style={{ fontSize: 11.5, color: due.state === 'overdue' ? 'var(--danger)' : 'var(--text-3)' }}>
                    <Icon name="today" size={11} /> {due.label}
                  </div>
                )}
                <div className="foot">
                  <div className="progress">
                    <span style={{ width: `${prog.ratio * 100}%` }} />
                  </div>
                  <span>
                    {prog.total ? `${prog.done} of ${prog.total}` : 'Empty'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
