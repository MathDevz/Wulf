import React, { useState } from 'react';
import { Database } from '../types';
import { Icon } from './Icon';
import { readDrag, setDrag } from '../lib/dnd';
import { moveItem } from '../lib/actions';
import { projectProgress } from '../lib/store';
import { MenuEntry } from './ContextMenu';
import logoFull from '../assets/logo-full.png';
import logoMark from '../assets/logo-mark.png';

export type ViewKey = 'queue' | 'today' | 'projects' | 'later' | 'completed' | 'settings' | 'project';

interface Props {
  db: Database;
  view: ViewKey;
  activeProject: string | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (v: ViewKey) => void;
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
  onSearch: () => void;
  contextMenu: (e: React.MouseEvent, entries: MenuEntry[]) => void;
  projectMenu: (id: string) => MenuEntry[];
}

export function Sidebar({
  db,
  view,
  activeProject,
  collapsed,
  onToggleCollapse,
  onNavigate,
  onOpenProject,
  onNewProject,
  onSearch,
  contextMenu,
  projectMenu
}: Props) {
  const [dropKey, setDropKey] = useState<string | null>(null);

  const counts = {
    queue: db.items.filter((i) => i.bucket === 'queue' && !i.completedAt && !i.archived).length,
    today: db.items.filter((i) => i.bucket === 'today' && !i.completedAt && !i.archived).length,
    later: db.items.filter((i) => i.bucket === 'later' && !i.completedAt && !i.archived).length,
    projects: db.projects.filter((p) => !p.archived).length,
    completed: db.items.filter((i) => i.completedAt).length
  };

  const dropProps = (key: string, onDropItems: (ids: string[]) => void) => ({
    onDragOver: (e: React.DragEvent) => {
      const d = readDrag(e);
      if (d?.kind !== 'item') return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropKey(key);
    },
    onDragLeave: () => setDropKey((k) => (k === key ? null : k)),
    onDrop: (e: React.DragEvent) => {
      const d = readDrag(e);
      setDropKey(null);
      if (d?.kind !== 'item') return;
      e.preventDefault();
      onDropItems(d.ids);
      setDrag(null);
    }
  });

  const NavItem = ({
    id,
    icon,
    label,
    count,
    onClick,
    drop
  }: {
    id: string;
    icon: string;
    label: string;
    count?: number;
    onClick: () => void;
    drop?: ReturnType<typeof dropProps>;
  }) => (
    <button
      className={`nav-item ${view === id ? 'active' : ''} ${dropKey === id ? 'drop-target' : ''}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-current={view === id ? 'page' : undefined}
      {...(drop || {})}
    >
      <Icon name={icon} size={15} />
      {!collapsed && (
        <>
          <span>{label}</span>
          {count ? <span className="count">{count}</span> : null}
        </>
      )}
    </button>
  );

  const projects = db.projects.filter((p) => !p.archived).sort((a, b) => a.order - b.order);

  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Main navigation">
      <div className="brand">
        <img src={collapsed ? logoMark : logoFull} alt="Wulf" style={collapsed ? { height: 24 } : undefined} />
      </div>

      <div className="nav-group">
        <NavItem
          id="queue"
          icon="inbox"
          label="Queue"
          count={counts.queue}
          onClick={() => onNavigate('queue')}
          drop={dropProps('queue', (ids) => ids.forEach((id) => moveItem(id, 'queue', null, ids.length > 1)))}
        />
        <NavItem
          id="today"
          icon="today"
          label="Today"
          count={counts.today}
          onClick={() => onNavigate('today')}
          drop={dropProps('today', (ids) => ids.forEach((id) => moveItem(id, 'today', null, ids.length > 1)))}
        />
        <NavItem id="projects" icon="projects" label="Projects" count={counts.projects} onClick={() => onNavigate('projects')} />
        <NavItem
          id="later"
          icon="later"
          label="Later"
          count={counts.later}
          onClick={() => onNavigate('later')}
          drop={dropProps('later', (ids) => ids.forEach((id) => moveItem(id, 'later', null, ids.length > 1)))}
        />
        <NavItem id="completed" icon="done" label="Completed" count={counts.completed} onClick={() => onNavigate('completed')} />
      </div>

      {!collapsed && (
        <>
          <div className="sidebar-label">
            <span>Projects</span>
            <button onClick={onNewProject} title="New project" aria-label="New project">
              <Icon name="plus" size={13} />
            </button>
          </div>
          <div className="project-list">
            {projects.length === 0 && (
              <div style={{ padding: '2px 10px', fontSize: 12 }} className="dim">
                None yet
              </div>
            )}
            {projects.map((p) => {
              const prog = projectProgress(db, p.id);
              return (
                <button
                  key={p.id}
                  className={`nav-item ${activeProject === p.id ? 'active' : ''} ${dropKey === 'p' + p.id ? 'drop-target' : ''}`}
                  onClick={() => onOpenProject(p.id)}
                  onContextMenu={(e) => contextMenu(e, projectMenu(p.id))}
                  {...dropProps('p' + p.id, (ids) => ids.forEach((id) => moveItem(id, 'project', p.id, ids.length > 1)))}
                >
                  <span className="project-pip" style={{ background: p.color }} />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      textAlign: 'left'
                    }}
                  >
                    {p.name}
                  </span>
                  {prog.total > 0 && (
                    <span className="count">
                      {prog.done}/{prog.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {collapsed && <div className="spacer" />}

      <div className="sidebar-foot">
        <button className="nav-item" onClick={onSearch} title="Search">
          <Icon name="search" size={15} />
          {!collapsed && (
            <>
              <span>Search</span>
              <span className="count">Ctrl K</span>
            </>
          )}
        </button>
        <button
          className={`nav-item ${view === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
          title="Settings"
        >
          <Icon name="settings" size={15} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button className="nav-item" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={15} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  );
}
