import React, { useEffect, useRef, useState } from 'react';
import { Item, Priority } from '../types';
import { Icon } from './Icon';
import { store, itemProgress } from '../lib/store';
import {
  addLinkToItem,
  addSubtask,
  attachFilesToItem,
  deleteItem,
  moveItem,
  removeAttachment,
  removeLinkFromItem,
  removeSubtask,
  setTagOnItem,
  toggleComplete,
  toggleSubtask,
  updateItem,
  updateSubtask
} from '../lib/actions';
import {
  addDays,
  atTime,
  formatBytes,
  formatDue,
  isoToLocalInput,
  localInputToIso,
  nextWeekend,
  relativeTime
} from '../lib/util';

const api = () => (window as any).wulf as any;

const PRIORITIES: { v: Priority; label: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'low', label: 'Low' },
  { v: 'medium', label: 'Medium' },
  { v: 'high', label: 'High' }
];

function AutoTextarea({
  value,
  onChange,
  className,
  placeholder,
  minRows = 1,
  ...rest
}: any) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      className={className}
      rows={minRows}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

export function DetailPanel({ item, onClose }: { item: Item; onClose: () => void }) {
  const db = store.db;
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes);
  const [subDraft, setSubDraft] = useState('');
  const [linkDraft, setLinkDraft] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [dropOver, setDropOver] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitle(item.title);
    setNotes(item.notes);
  }, [item.id]);

  // Debounced persistence for free-text fields.
  useEffect(() => {
    if (title === item.title) return;
    const t = setTimeout(() => updateItem(item.id, { title: title.trim() || 'Untitled' }, 'Rename item'), 420);
    return () => clearTimeout(t);
  }, [title]);

  useEffect(() => {
    if (notes === item.notes) return;
    const t = setTimeout(() => updateItem(item.id, { notes }, 'Edit notes'), 500);
    return () => clearTimeout(t);
  }, [notes]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') (e.target as HTMLElement).blur();
        else onClose();
      }
    };
    const el = panelRef.current;
    el?.addEventListener('keydown', h as any);
    return () => el?.removeEventListener('keydown', h as any);
  }, [onClose]);

  const project = item.projectId ? db.projects.find((p) => p.id === item.projectId) : null;
  const prog = itemProgress(item);
  const due = formatDue(item.dueAt);

  const quickDue = (d: Date | null) =>
    updateItem(item.id, { dueAt: d ? d.toISOString() : null }, 'Set deadline');

  const onDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) {
      const paths = files.map((f) => api().attach.pathForFile(f)).filter(Boolean);
      if (paths.length) await attachFilesToItem(item.id, paths);
      return;
    }
    const text = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (text && /^https?:\/\//i.test(text.trim())) addLinkToItem(item.id, text.trim());
  };

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <aside
        className="detail"
        ref={panelRef}
        role="dialog"
        aria-label="Task details"
        onDragOver={(e) => {
          if (Array.from(e.dataTransfer.types).includes('Files')) {
            e.preventDefault();
            setDropOver(true);
          }
        }}
        onDragLeave={() => setDropOver(false)}
        onDrop={onDropFiles}
      >
        <div className="detail-head">
          <button
            className={`check ${item.completedAt ? 'done' : ''}`}
            style={{ marginTop: 5 }}
            onClick={() => toggleComplete(item.id)}
            aria-pressed={!!item.completedAt}
            aria-label="Toggle complete"
          >
            {item.completedAt && <Icon name="check" size={11} strokeWidth={2.4} />}
          </button>
          <AutoTextarea
            className="detail-title"
            value={title}
            onChange={setTitle}
            placeholder="Untitled"
            aria-label="Title"
          />
          <button className="icon-btn" onClick={onClose} title="Close details" aria-label="Close details">
            <Icon name="x" size={15} />
          </button>
        </div>

        <div className="detail-body">
          {/* placement -------------------------------------------------- */}
          <div className="field">
            <div className="field-label">Where it lives</div>
            <div className="pill-row">
              {(['queue', 'today', 'later'] as const).map((b) => (
                <button
                  key={b}
                  className={`pill ${item.bucket === b ? 'on' : ''}`}
                  onClick={() => moveItem(item.id, b, null, true)}
                >
                  <Icon name={b === 'queue' ? 'inbox' : b === 'today' ? 'today' : 'later'} size={12} />
                  {b[0].toUpperCase() + b.slice(1)}
                </button>
              ))}
            </div>
            <select
              className="select"
              value={item.projectId ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                if (v) moveItem(item.id, 'project', v, true);
                else moveItem(item.id, 'queue', null, true);
              }}
              aria-label="Project"
            >
              <option value="">No project</option>
              {db.projects
                .filter((p) => !p.archived)
                .sort((a, b) => a.order - b.order)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* deadline / reminder ---------------------------------------- */}
          <div className="field">
            <div className="field-label">
              <span>Deadline</span>
              {item.dueAt && <button onClick={() => quickDue(null)}>Clear</button>}
            </div>
            <div className="pill-row">
              <button className="pill" onClick={() => quickDue(atTime(new Date(), 18))}>
                Today
              </button>
              <button className="pill" onClick={() => quickDue(atTime(addDays(new Date(), 1), 9))}>
                Tomorrow
              </button>
              <button className="pill" onClick={() => quickDue(atTime(nextWeekend(), 10))}>
                Weekend
              </button>
              <button className="pill" onClick={() => quickDue(atTime(addDays(new Date(), 7), 9))}>
                Next week
              </button>
            </div>
            <input
              type="datetime-local"
              className="input"
              value={isoToLocalInput(item.dueAt)}
              onChange={(e) => updateItem(item.id, { dueAt: localInputToIso(e.target.value) }, 'Set deadline')}
              aria-label="Deadline date and time"
            />
            {due.label && (
              <div style={{ fontSize: 12 }} className={due.state === 'overdue' ? '' : 'dim'}>
                <span style={{ color: due.state === 'overdue' ? 'var(--danger)' : undefined }}>{due.label}</span>
              </div>
            )}
          </div>

          <div className="field">
            <div className="field-label">
              <span>Reminder</span>
              {item.reminderAt && (
                <button onClick={() => updateItem(item.id, { reminderAt: null, reminderFired: false }, 'Clear reminder')}>
                  Clear
                </button>
              )}
            </div>
            <input
              type="datetime-local"
              className="input"
              value={isoToLocalInput(item.reminderAt)}
              onChange={(e) =>
                updateItem(item.id, { reminderAt: localInputToIso(e.target.value), reminderFired: false }, 'Set reminder')
              }
              aria-label="Reminder date and time"
            />
            {item.reminderAt && (
              <div className="dim" style={{ fontSize: 11.5 }}>
                Wulf will notify you at that time while it is running.
              </div>
            )}
          </div>

          {/* priority / estimate ---------------------------------------- */}
          <div className="grid-2">
            <div className="field">
              <div className="field-label">Priority</div>
              <select
                className="select"
                value={item.priority}
                onChange={(e) => updateItem(item.id, { priority: e.target.value as Priority }, 'Set priority')}
                aria-label="Priority"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.v} value={p.v}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <div className="field-label">Estimate</div>
              <select
                className="select"
                value={item.estimateMinutes ?? ''}
                onChange={(e) =>
                  updateItem(item.id, { estimateMinutes: e.target.value ? Number(e.target.value) : null }, 'Set estimate')
                }
                aria-label="Time estimate"
              >
                <option value="">None</option>
                {[5, 10, 15, 30, 45, 60, 90, 120, 180, 240, 480].map((m) => (
                  <option key={m} value={m}>
                    {m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? 's' : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* subtasks ---------------------------------------------------- */}
          <div className="field">
            <div className="field-label">
              <span>Subtasks {prog ? `· ${prog.done}/${prog.total}` : ''}</span>
            </div>
            {prog && (
              <div className="progress" style={{ marginBottom: 4 }}>
                <span style={{ width: `${prog.ratio * 100}%` }} />
              </div>
            )}
            <div className="sub-list">
              {item.subtasks.map((s) => (
                <div className={`sub-row ${s.done ? 'done' : ''}`} key={s.id}>
                  <button
                    className={`check ${s.done ? 'done' : ''}`}
                    onClick={() => toggleSubtask(item.id, s.id)}
                    aria-pressed={s.done}
                    aria-label={`Toggle ${s.title}`}
                  >
                    {s.done && <Icon name="check" size={10} strokeWidth={2.6} />}
                  </button>
                  <input
                    defaultValue={s.title}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== s.title) updateSubtask(item.id, s.id, v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    aria-label="Subtask title"
                  />
                  <button
                    className="icon-btn"
                    onClick={() => removeSubtask(item.id, s.id)}
                    title="Remove subtask"
                    aria-label={`Remove ${s.title}`}
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="rowflex">
              <Icon name="plus" size={13} className="dim" />
              <input
                className="input"
                style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
                placeholder="Add a subtask"
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && subDraft.trim()) {
                    addSubtask(item.id, subDraft);
                    setSubDraft('');
                  }
                }}
                aria-label="Add a subtask"
              />
            </div>
          </div>

          {/* notes ------------------------------------------------------- */}
          <div className="field">
            <div className="field-label">Notes</div>
            <textarea
              className="textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Context, gotchas, anything worth remembering…"
              aria-label="Notes"
            />
          </div>

          {/* tags -------------------------------------------------------- */}
          <div className="field">
            <div className="field-label">Tags</div>
            <div className="pill-row">
              {item.tags.map((t) => (
                <span className="pill on" key={t}>
                  #{t}
                  <button className="x" onClick={() => setTagOnItem(item.id, t, false)} aria-label={`Remove tag ${t}`}>
                    <Icon name="x" size={10} />
                  </button>
                </span>
              ))}
            </div>
            <input
              className="input"
              placeholder="Add tag and press Enter"
              value={tagDraft}
              list="wulf-tags"
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagDraft.trim()) {
                  setTagOnItem(item.id, tagDraft.replace(/^#/, ''), true);
                  setTagDraft('');
                }
              }}
              aria-label="Add tag"
            />
            <datalist id="wulf-tags">
              {db.tags.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* links ------------------------------------------------------- */}
          <div className="field">
            <div className="field-label">Links</div>
            <div className="stack">
              {item.links.map((l) => (
                <div className="link-row" key={l.id}>
                  <Icon name="link" size={13} className="dim" />
                  <a
                    onClick={() => api().shell.openExternal(l.url).catch(() => {})}
                    title={l.url}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && api().shell.openExternal(l.url)}
                  >
                    {l.label}
                  </a>
                  <button className="icon-btn" onClick={() => removeLinkFromItem(item.id, l.id)} aria-label="Remove link">
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
            <input
              className="input"
              placeholder="Paste a URL and press Enter"
              value={linkDraft}
              onChange={(e) => setLinkDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkDraft.trim()) {
                  addLinkToItem(item.id, linkDraft);
                  setLinkDraft('');
                }
              }}
              aria-label="Add link"
            />
          </div>

          {/* attachments -------------------------------------------------- */}
          <div className="field">
            <div className="field-label">Attachments</div>
            <div className="stack">
              {item.attachments.map((a) => (
                <div className="file-row" key={a.id}>
                  <span className="file-ext">{a.ext ? a.ext.slice(0, 4) : 'file'}</span>
                  <span
                    className="fname"
                    title={a.path}
                    onClick={() => api().shell.openPath(a.path)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && api().shell.openPath(a.path)}
                  >
                    {a.name}
                  </span>
                  <span className="fsize">{formatBytes(a.size)}</span>
                  <button
                    className="icon-btn"
                    onClick={() => api().shell.showItemInFolder(a.path)}
                    title="Show in folder"
                    aria-label="Show in folder"
                  >
                    <Icon name="external" size={12} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => removeAttachment('item', item.id, a.id)}
                    title="Remove"
                    aria-label="Remove attachment"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div
              className={`dropzone ${dropOver ? 'over' : ''}`}
              role="button"
              tabIndex={0}
              onClick={async () => {
                const files = await api().attach.pick();
                if (files?.length) await attachFilesToItem(item.id, files.map((f: any) => f.path));
              }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const files = await api().attach.pick();
                  if (files?.length) await attachFilesToItem(item.id, files.map((f: any) => f.path));
                }
              }}
            >
              Drop files here or click to browse
            </div>
          </div>

          {/* footer ------------------------------------------------------- */}
          <div className="field">
            <div className="dim" style={{ fontSize: 11.5, lineHeight: 1.7 }}>
              Created {relativeTime(item.createdAt)}
              {item.updatedAt !== item.createdAt && <> · Updated {relativeTime(item.updatedAt)}</>}
              {item.completedAt && <> · Completed {relativeTime(item.completedAt)}</>}
              {project && <> · In {project.name}</>}
            </div>
            <div className="rowflex" style={{ marginTop: 6 }}>
              <button
                className="btn danger sm"
                onClick={async () => {
                  await deleteItem(item.id);
                  onClose();
                }}
              >
                <Icon name="trash" size={13} /> Delete
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
