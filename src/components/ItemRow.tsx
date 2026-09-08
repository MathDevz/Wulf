import React, { useEffect, useRef, useState } from 'react';
import { Item } from '../types';
import { Icon } from './Icon';
import { formatDue, formatEstimate } from '../lib/util';
import { itemProgress } from '../lib/store';

interface Props {
  item: Item;
  projectName?: string | null;
  selected?: boolean;
  showProject?: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onContext: (e: React.MouseEvent) => void;
  onRename: (title: string) => void;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging?: boolean;
  registerRef?: (el: HTMLDivElement | null) => void;
  editingSignal?: number;
}

export const ItemRow = React.memo(function ItemRow({
  item,
  projectName,
  selected,
  showProject = true,
  onToggle,
  onOpen,
  onContext,
  onRename,
  onSelect,
  onDragStart,
  onDragEnd,
  dragging,
  registerRef,
  editingSignal
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSignal) {
      setDraft(item.title);
      setEditing(true);
    }
  }, [editingSignal]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== item.title) onRename(t);
    setEditing(false);
  };

  const due = formatDue(item.dueAt);
  const prog = itemProgress(item);
  const done = !!item.completedAt;

  return (
    <div
      ref={registerRef}
      className={`row ${done ? 'done' : ''} ${selected ? 'selected' : ''} ${dragging ? 'dragging' : ''}`}
      onContextMenu={onContext}
      onMouseDown={onSelect}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      draggable={!editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-item-id={item.id}
      role="listitem"
      aria-label={item.title}
    >
      <span className="grip" aria-hidden="true">
        <Icon name="grip" size={13} />
      </span>
      <span className={`prio ${item.priority}`} aria-hidden="true" />
      <button
        className={`check ${done ? 'done' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-pressed={done}
        aria-label={done ? `Mark ${item.title} as not done` : `Complete ${item.title}`}
        title={done ? 'Reopen' : 'Complete'}
      >
        {done && <Icon name="check" size={11} strokeWidth={2.4} />}
      </button>

      <div className="row-main">
        {editing ? (
          <input
            ref={inputRef}
            className="row-title-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(item.title);
                setEditing(false);
              }
            }}
            aria-label="Task title"
          />
        ) : (
          <div className="row-title" onClick={() => setEditing(true)}>
            {item.title}
          </div>
        )}

        {(showProject && projectName) ||
        due.label ||
        item.tags.length ||
        prog ||
        item.notes ||
        item.links.length ||
        item.attachments.length ||
        item.estimateMinutes ||
        item.reminderAt ? (
          <div className="meta">
            {showProject && projectName && (
              <span className="proj">
                <Icon name="folder" size={11} /> {projectName}
              </span>
            )}
            {due.label && (
              <span className={`due ${due.state}`}>
                <Icon name="today" size={11} /> {due.label}
              </span>
            )}
            {item.reminderAt && !done && (
              <span title={`Reminder ${new Date(item.reminderAt).toLocaleString()}`}>
                <Icon name="bell" size={11} />
              </span>
            )}
            {item.estimateMinutes ? (
              <span>
                <Icon name="clock" size={11} /> {formatEstimate(item.estimateMinutes)}
              </span>
            ) : null}
            {prog && (
              <span title={`${prog.done} of ${prog.total} subtasks done`}>
                <span className="mini-progress">
                  <span style={{ width: `${prog.ratio * 100}%` }} />
                </span>
                {prog.done}/{prog.total}
              </span>
            )}
            {item.notes && (
              <span title="Has notes">
                <Icon name="note" size={11} />
              </span>
            )}
            {item.links.length > 0 && (
              <span title={`${item.links.length} link(s)`}>
                <Icon name="link" size={11} /> {item.links.length}
              </span>
            )}
            {item.attachments.length > 0 && (
              <span title={`${item.attachments.length} attachment(s)`}>
                <Icon name="paperclip" size={11} /> {item.attachments.length}
              </span>
            )}
            {item.tags.map((t) => (
              <span className="tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="row-actions">
        <button
          className="icon-btn"
          title="Details"
          aria-label={`Open details for ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
        >
          <Icon name="panel" size={14} />
        </button>
        <button
          className="icon-btn"
          title="More actions"
          aria-label={`More actions for ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onContext(e);
          }}
        >
          <Icon name="more" size={14} />
        </button>
      </div>
    </div>
  );
});
