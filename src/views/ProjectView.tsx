import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Database } from '../types';
import { Icon } from '../components/Icon';
import { Capture } from '../components/Capture';
import { ItemList } from '../components/ItemList';
import { Empty } from '../components/Empty';
import { MenuEntry } from '../components/ContextMenu';
import { projectProgress } from '../lib/store';
import {
  addLinkToProject,
  archiveProject,
  attachFilesToProject,
  captureItem,
  deleteProject,
  duplicateProject,
  removeAttachment,
  removeLinkFromProject,
  toggleComplete,
  updateItem,
  updateProject
} from '../lib/actions';
import { itemMenu } from '../lib/menus';
import { formatBytes, formatDue, isoToLocalInput, localInputToIso, relativeTime } from '../lib/util';

const api = () => (window as any).wulf as any;

interface Props {
  db: Database;
  projectId: string;
  back: () => void;
  selection: Set<string>;
  setSelection: (s: Set<string>) => void;
  openItem: (id: string) => void;
  renameItem: (id: string) => void;
  editSignals: Record<string, number>;
  contextMenu: (e: React.MouseEvent, entries: MenuEntry[]) => void;
  captureFocus: number;
}

export function ProjectView({
  db,
  projectId,
  back,
  selection,
  setSelection,
  openItem,
  renameItem,
  editSignals,
  contextMenu,
  captureFocus
}: Props) {
  const project = db.projects.find((p) => p.id === projectId);
  const [tab, setTab] = useState<'tasks' | 'notes' | 'files' | 'activity'>('tasks');
  const [name, setName] = useState(project?.name ?? '');
  const [desc, setDesc] = useState(project?.description ?? '');
  const [notes, setNotes] = useState(project?.notes ?? '');
  const [linkDraft, setLinkDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [dropOver, setDropOver] = useState(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setName(project?.name ?? '');
    setDesc(project?.description ?? '');
    setNotes(project?.notes ?? '');
    setTab('tasks');
  }, [projectId]);

  useEffect(() => {
    const el = descRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [desc, tab]);

  useEffect(() => {
    if (!project || name === project.name) return;
    const t = setTimeout(() => updateProject(projectId, { name: name.trim() || 'Untitled project' }, 'Rename project'), 420);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    if (!project || desc === project.description) return;
    const t = setTimeout(() => updateProject(projectId, { description: desc }, 'Edit description'), 480);
    return () => clearTimeout(t);
  }, [desc]);

  useEffect(() => {
    if (!project || notes === project.notes) return;
    const t = setTimeout(() => updateProject(projectId, { notes }, 'Edit project notes'), 500);
    return () => clearTimeout(t);
  }, [notes]);

  const tasks = useMemo(
    () => db.items.filter((i) => i.projectId === projectId && !i.archived).sort((a, b) => a.order - b.order),
    [db.items, projectId]
  );
  const open = tasks.filter((t) => !t.completedAt);
  const done = tasks.filter((t) => t.completedAt);
  const activity = useMemo(
    () => db.activity.filter((a) => a.projectId === projectId).slice(-60).reverse(),
    [db.activity, projectId]
  );

  if (!project) {
    return (
      <div className="view-inner">
        <Empty title="That project is gone." body="It may have been deleted. Everything else is untouched." action={
          <button className="btn" onClick={back}>Back to projects</button>
        } />
      </div>
    );
  }

  const prog = projectProgress(db, projectId);
  const due = formatDue(project.dueAt);

  const projectMenu: MenuEntry[] = [
    { label: 'Duplicate project', icon: 'copy', onSelect: () => duplicateProject(projectId) },
    {
      label: project.archived ? 'Restore project' : 'Archive project',
      icon: 'archive',
      onSelect: () => archiveProject(projectId, !project.archived)
    },
    { type: 'separator' },
    {
      label: 'Delete project',
      icon: 'trash',
      danger: true,
      submenu: [
        { label: 'Delete, keep tasks in Queue', onSelect: () => { deleteProject(projectId, false); back(); } },
        { label: 'Delete project and its tasks', danger: true, onSelect: () => { deleteProject(projectId, true); back(); } }
      ]
    }
  ];

  const dropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      const paths = files.map((f) => api().attach.pathForFile(f)).filter(Boolean);
      if (paths.length) await attachFilesToProject(projectId, paths);
      return;
    }
    const text = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (text && /^https?:\/\//i.test(text.trim())) addLinkToProject(projectId, text.trim());
  };

  return (
    <div className="view-inner">
      <div className="rowflex" style={{ marginBottom: 14 }}>
        <button className="btn ghost sm" onClick={back}>
          <Icon name="chevronLeft" size={13} /> Projects
        </button>
        <span className="spacer" />
        {project.archived && <span className="chip">Archived</span>}
        <button className="icon-btn" onClick={(e) => contextMenu(e, projectMenu)} title="Project actions" aria-label="Project actions">
          <Icon name="more" size={16} />
        </button>
      </div>

      <div className="project-hero">
        <input
          className="project-name-input"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.018em', border: 'none', padding: 0, background: 'transparent', width: '100%' }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Project name"
        />
        <textarea
          ref={descRef}
          className="desc"
          value={desc}
          rows={1}
          placeholder="What is this project, in one line?"
          onChange={(e) => setDesc(e.target.value)}
          aria-label="Project description"
        />
        <div className="rowflex wrap" style={{ gap: 14 }}>
          <div className="rowflex" style={{ gap: 10, minWidth: 200, flex: 1 }}>
            <div className="progress">
              <span style={{ width: `${prog.ratio * 100}%` }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
              {prog.total ? `${prog.done} of ${prog.total} complete` : 'No tasks yet'}
            </span>
          </div>
          <div className="rowflex" style={{ gap: 6 }}>
            <Icon name="today" size={13} className="dim" />
            <input
              type="date"
              className="input"
              style={{ width: 150, padding: '4px 8px', fontSize: 12.5 }}
              value={isoToLocalInput(project.dueAt, false)}
              onChange={(e) =>
                updateProject(projectId, { dueAt: e.target.value ? localInputToIso(e.target.value + 'T12:00') : null }, 'Set project deadline')
              }
              aria-label="Project deadline"
            />
            {due.label && (
              <span style={{ fontSize: 12, color: due.state === 'overdue' ? 'var(--danger)' : 'var(--text-3)' }}>{due.label}</span>
            )}
          </div>
        </div>
        <div className="pill-row">
          {project.tags.map((t) => (
            <span className="pill on" key={t}>
              #{t}
              <button
                className="x"
                onClick={() => updateProject(projectId, { tags: project.tags.filter((x) => x !== t) }, 'Remove tag')}
                aria-label={`Remove tag ${t}`}
              >
                <Icon name="x" size={10} />
              </button>
            </span>
          ))}
          <input
            className="input"
            style={{ width: 130, height: 24, padding: '0 8px', fontSize: 12 }}
            placeholder="+ tag"
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagDraft.trim()) {
                const t = tagDraft.trim().toLowerCase().replace(/^#/, '');
                updateProject(projectId, { tags: Array.from(new Set([...project.tags, t])) }, 'Add tag');
                setTagDraft('');
              }
            }}
            aria-label="Add project tag"
          />
        </div>
      </div>

      <div className="tabs" role="tablist">
        {(['tasks', 'notes', 'files', 'activity'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'tasks' ? `Tasks${tasks.length ? ` · ${tasks.length}` : ''}` : t[0].toUpperCase() + t.slice(1)}
            {t === 'files' && project.attachments.length + project.links.length > 0
              ? ` · ${project.attachments.length + project.links.length}`
              : ''}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <div style={{ marginTop: 16 }}>
          <Capture
            placeholder="Add a task to this project"
            focusSignal={captureFocus}
            showHints={false}
            onSubmit={(t) => captureItem(t, { projectId })}
          />
          {open.length === 0 && done.length === 0 ? (
            <Empty title="No tasks in here yet." body="Add them above, or drag things in from your Queue." />
          ) : (
            <>
              <ItemList
                items={open}
                bucket="project"
                projectId={projectId}
                showProject={false}
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
              {done.length > 0 && (
                <>
                  <div className="section-head">
                    <span>Completed · {done.length}</span>
                    <span className="line" />
                  </div>
                  <ItemList
                    items={done}
                    bucket="project"
                    projectId={projectId}
                    showProject={false}
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
            </>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div style={{ marginTop: 16 }} className="field">
          <textarea
            className="textarea"
            style={{ minHeight: 320 }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering about this project — decisions, part numbers, measurements…"
            aria-label="Project notes"
          />
          <div className="dim" style={{ fontSize: 11.5 }}>Saved automatically.</div>
        </div>
      )}

      {tab === 'files' && (
        <div
          style={{ marginTop: 16 }}
          className="stack"
          onDragOver={(e) => {
            if (Array.from(e.dataTransfer.types).includes('Files')) {
              e.preventDefault();
              setDropOver(true);
            }
          }}
          onDragLeave={() => setDropOver(false)}
          onDrop={dropFiles}
        >
          <div className="field">
            <div className="field-label">Links</div>
            {project.links.map((l) => (
              <div className="link-row" key={l.id}>
                <Icon name="link" size={13} className="dim" />
                <a onClick={() => api().shell.openExternal(l.url)} title={l.url} tabIndex={0}>
                  {l.label}
                </a>
                <button className="icon-btn" onClick={() => removeLinkFromProject(projectId, l.id)} aria-label="Remove link">
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
            <input
              className="input"
              placeholder="Paste a URL and press Enter"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkDraft.trim()) {
                  addLinkToProject(projectId, linkDraft);
                  setLinkDraft('');
                }
              }}
              aria-label="Add project link"
            />
          </div>

          <div className="field">
            <div className="field-label">Attachments</div>
            {project.attachments.map((a) => (
              <div className="file-row" key={a.id}>
                <span className="file-ext">{a.ext ? a.ext.slice(0, 4) : 'file'}</span>
                <span className="fname" title={a.path} onClick={() => api().shell.openPath(a.path)} role="button" tabIndex={0}>
                  {a.name}
                </span>
                <span className="fsize">{formatBytes(a.size)}</span>
                <button className="icon-btn" onClick={() => api().shell.showItemInFolder(a.path)} title="Show in folder">
                  <Icon name="external" size={12} />
                </button>
                <button className="icon-btn" onClick={() => removeAttachment('project', projectId, a.id)} title="Remove">
                  <Icon name="x" size={12} />
                </button>
              </div>
            ))}
            <div
              className={`dropzone ${dropOver ? 'over' : ''}`}
              role="button"
              tabIndex={0}
              onClick={async () => {
                const files = await api().attach.pick();
                if (files?.length) await attachFilesToProject(projectId, files.map((f: any) => f.path));
              }}
            >
              Drop files here or click to browse
            </div>
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div style={{ marginTop: 16 }}>
          {activity.length === 0 ? (
            <Empty title="No history yet." body="Everything you do in this project shows up here." />
          ) : (
            activity.map((a) => (
              <div className="activity-row" key={a.id}>
                <time>{relativeTime(a.at)}</time>
                <span>{a.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
