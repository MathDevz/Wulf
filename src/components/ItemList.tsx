import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Bucket, Item } from '../types';
import { ItemRow } from './ItemRow';
import { DND_MIME, getDrag, hasFiles, readDrag, setDrag } from '../lib/dnd';
import { reorderItem } from '../lib/actions';

interface Props {
  items: Item[];
  bucket: Bucket;
  projectId?: string | null;
  projectNames?: Map<string, string>;
  showProject?: boolean;
  selection: Set<string>;
  onSelectionChange: (s: Set<string>) => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onContext: (e: React.MouseEvent, id: string) => void;
  onRename: (id: string, title: string) => void;
  reorderable?: boolean;
  editSignals?: Record<string, number>;
}

export function ItemList({
  items,
  bucket,
  projectId = null,
  projectNames,
  showProject = true,
  selection,
  onSelectionChange,
  onToggle,
  onOpen,
  onContext,
  onRename,
  reorderable = true,
  editSignals
}: Props) {
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClicked = useRef<string | null>(null);

  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const handleSelect = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (e.button === 2 && selection.has(id)) return;
      const next = new Set(selection);
      if (e.shiftKey && lastClicked.current) {
        const a = ids.indexOf(lastClicked.current);
        const b = ids.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          for (let i = lo; i <= hi; i++) next.add(ids[i]);
          onSelectionChange(next);
          return;
        }
      }
      if (e.ctrlKey || e.metaKey) {
        next.has(id) ? next.delete(id) : next.add(id);
        onSelectionChange(next);
        lastClicked.current = id;
        return;
      }
      onSelectionChange(new Set([id]));
      lastClicked.current = id;
    },
    [ids, selection, onSelectionChange]
  );

  const startDrag = (e: React.DragEvent, id: string) => {
    const dragIds = selection.has(id) && selection.size > 1 ? Array.from(selection) : [id];
    setDraggingIds(dragIds);
    const payload = { kind: 'item' as const, ids: dragIds };
    setDrag(payload);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData(DND_MIME, JSON.stringify(payload));
      e.dataTransfer.setData('text/plain', items.filter((i) => dragIds.includes(i.id)).map((i) => i.title).join('\n'));
    } catch {}
  };

  const endDrag = () => {
    setDraggingIds([]);
    setDropIndex(null);
    setDrag(null);
  };

  const computeIndex = (e: React.DragEvent) => {
    const el = containerRef.current;
    if (!el) return 0;
    const rows = Array.from(el.querySelectorAll<HTMLElement>('[data-item-id]'));
    const y = e.clientY;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return rows.length;
  };

  const onDragOver = (e: React.DragEvent) => {
    const payload = readDrag(e);
    if (!payload || payload.kind !== 'item') return;
    if (!reorderable) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(computeIndex(e));
  };

  const onDrop = (e: React.DragEvent) => {
    const payload = readDrag(e);
    if (!payload || payload.kind !== 'item') return;
    e.preventDefault();
    e.stopPropagation();
    const idx = dropIndex ?? computeIndex(e);
    // Move in reverse so multi-select keeps its visual order.
    [...payload.ids].reverse().forEach((id) => reorderItem(id, bucket, projectId, idx));
    endDrag();
  };

  return (
    <div
      className={`list ${dropIndex !== null ? 'drop-active' : ''}`}
      ref={containerRef}
      onDragOver={onDragOver}
      onDragLeave={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setDropIndex(null);
      }}
      onDrop={onDrop}
      role="list"
    >
      {items.map((item, i) => (
        <React.Fragment key={item.id}>
          {dropIndex === i && <div className="drop-line" />}
          <ItemRow
            item={item}
            projectName={item.projectId ? projectNames?.get(item.projectId) ?? null : null}
            showProject={showProject}
            selected={selection.has(item.id)}
            dragging={draggingIds.includes(item.id)}
            editingSignal={editSignals?.[item.id]}
            onToggle={() => onToggle(item.id)}
            onOpen={() => onOpen(item.id)}
            onContext={(e) => onContext(e, item.id)}
            onRename={(t) => onRename(item.id, t)}
            onSelect={(e) => handleSelect(e, item.id)}
            onDragStart={(e) => startDrag(e, item.id)}
            onDragEnd={endDrag}
          />
        </React.Fragment>
      ))}
      {dropIndex === items.length && <div className="drop-line" />}
    </div>
  );
}
