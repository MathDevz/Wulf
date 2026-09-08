import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface MenuEntry {
  type?: 'item' | 'separator' | 'label';
  label?: string;
  icon?: string;
  kb?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  submenu?: MenuEntry[];
}

interface Props {
  x: number;
  y: number;
  entries: MenuEntry[];
  onClose: () => void;
}

export function ContextMenu({ x, y, entries, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });
  const [openSub, setOpenSub] = useState<number | null>(null);
  const [subPos, setSubPos] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let nx = x;
    let ny = y;
    if (x + r.width > window.innerWidth - 8) nx = Math.max(8, window.innerWidth - r.width - 8);
    if (y + r.height > window.innerHeight - 8) ny = Math.max(8, window.innerHeight - r.height - 8);
    setPos({ x: nx, y: ny });
  }, [x, y, entries]);

  useEffect(() => {
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('mousedown', down, true);
    window.addEventListener('keydown', key, true);
    window.addEventListener('resize', onClose);
    window.addEventListener('blur', onClose);
    return () => {
      window.removeEventListener('mousedown', down, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', onClose);
      window.removeEventListener('blur', onClose);
    };
  }, [onClose]);

  const renderEntries = (list: MenuEntry[], isSub = false) =>
    list.map((e, i) => {
      if (e.type === 'separator') return <div className="ctx-sep" key={i} />;
      if (e.type === 'label')
        return (
          <div className="ctx-label" key={i}>
            {e.label}
          </div>
        );
      const hasSub = !!e.submenu?.length;
      return (
        <button
          key={i}
          className={`ctx-item ${e.danger ? 'danger' : ''} ${openSub === i && !isSub ? 'active' : ''}`}
          disabled={e.disabled}
          onMouseEnter={(ev) => {
            if (isSub) return;
            if (hasSub) {
              const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
              setSubPos({ x: r.right + 2, y: r.top - 5 });
              setOpenSub(i);
            } else setOpenSub(null);
          }}
          onClick={() => {
            if (hasSub) return;
            e.onSelect?.();
            onClose();
          }}
        >
          {e.icon ? <Icon name={e.icon} size={14} /> : <span style={{ width: 14 }} />}
          <span style={{ opacity: e.disabled ? 0.45 : 1 }}>{e.label}</span>
          {e.kb && <span className="kb">{e.kb}</span>}
          {hasSub && <Icon name="chevronRight" size={12} className="kb" />}
        </button>
      );
    });

  const sub = openSub !== null ? entries[openSub]?.submenu : null;

  return (
    <>
      <div
        className="ctx"
        ref={ref}
        style={{ left: pos.x, top: pos.y }}
        role="menu"
        onContextMenu={(e) => e.preventDefault()}
      >
        {renderEntries(entries)}
      </div>
      {sub && (
        <div
          className="ctx"
          style={{
            left: Math.min(subPos.x, window.innerWidth - 220),
            top: Math.min(subPos.y, window.innerHeight - Math.min(sub.length * 30 + 20, 400))
          }}
          role="menu"
          onMouseLeave={() => setOpenSub(null)}
        >
          {sub.map((e, i) =>
            e.type === 'separator' ? (
              <div className="ctx-sep" key={i} />
            ) : e.type === 'label' ? (
              <div className="ctx-label" key={i}>
                {e.label}
              </div>
            ) : (
              <button
                key={i}
                className={`ctx-item ${e.danger ? 'danger' : ''}`}
                disabled={e.disabled}
                onClick={() => {
                  e.onSelect?.();
                  onClose();
                }}
              >
                {e.icon ? <Icon name={e.icon} size={14} /> : <span style={{ width: 14 }} />}
                <span>{e.label}</span>
                {e.kb && <span className="kb">{e.kb}</span>}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

export function useContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number; entries: MenuEntry[] } | null>(null);
  const open = (e: React.MouseEvent, entries: MenuEntry[]) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, entries });
  };
  const openAt = (x: number, y: number, entries: MenuEntry[]) => setMenu({ x, y, entries });
  const node = menu ? <ContextMenu {...menu} onClose={() => setMenu(null)} /> : null;
  return { open, openAt, node, close: () => setMenu(null) };
}
