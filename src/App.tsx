import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, ViewKey } from './components/Sidebar';
import { ListView } from './views/ListView';
import { ProjectsView } from './views/ProjectsView';
import { ProjectView } from './views/ProjectView';
import { CompletedView } from './views/CompletedView';
import { SettingsView } from './views/SettingsView';
import { DetailPanel } from './components/DetailPanel';
import { Palette, Command } from './components/Palette';
import { Toasts } from './components/Toasts';
import { Onboarding } from './components/Onboarding';
import { Splash } from './components/Splash';
import { useContextMenu, MenuEntry } from './components/ContextMenu';
import { Icon } from './components/Icon';
import { store, useStore } from './lib/store';
import {
  archiveProject,
  attachFilesToItem,
  captureItem,
  createProject,
  deleteItem,
  deleteItems,
  deleteProject,
  duplicateItem,
  duplicateProject,
  moveItem,
  toggleComplete
} from './lib/actions';

const api = () => (window as any).wulf as any;

export default function App() {
  useStore((s) => s.ready);
  const db = store.db;
  const settings = store.settings;

  const [view, setView] = useState<ViewKey>('queue');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [editSignals, setEditSignals] = useState<Record<string, number>>({});
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [captureFocus, setCaptureFocus] = useState(0);
  const [newProjectSignal, setNewProjectSignal] = useState(0);
  const [globalDrop, setGlobalDrop] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [splash, setSplash] = useState(true);
  const ctx = useContextMenu();

  /* theme ---------------------------------------------------------- */
  useEffect(() => {
    document.documentElement.dataset.theme = settings?.theme ?? 'midnight';
  }, [settings?.theme]);

  /* main-process events -------------------------------------------- */
  useEffect(() => {
    const offs = [
      api().on.shortcut((n: string) => {
        if (n === 'capture') {
          setView('queue');
          setCaptureFocus((v) => v + 1);
        }
      }),
      api().on.reminderOpen((id: string) => {
        setDetailId(id);
        setSelection(new Set([id]));
      }),
      api().on.externalChange(async () => {
        const fresh = await api().data.read();
        store.db = fresh;
        store.toast({ message: 'Reminder fired.', tone: 'default', duration: 2000 });
      }),
      api().on.appError((e: any) => setBanner(e.message))
    ];
    return () => offs.forEach((o: any) => o?.());
  }, []);

  /* visible items for keyboard navigation --------------------------- */
  const visibleItems = useMemo(() => {
    if (view === 'projects' || view === 'settings') return [];
    if (view === 'project' && activeProject)
      return db.items.filter((i) => i.projectId === activeProject && !i.archived).sort((a, b) => a.order - b.order);
    if (view === 'completed')
      return db.items.filter((i) => i.completedAt).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    return db.items
      .filter((i) => !i.archived && i.bucket === view && (settings?.showCompletedInQueue || view === 'today' || !i.completedAt))
      .sort((a, b) => a.order - b.order);
  }, [db.items, view, activeProject, settings?.showCompletedInQueue]);

  const navigate = useCallback((v: ViewKey) => {
    setView(v);
    setActiveProject(null);
    setSelection(new Set());
    setDetailId(null);
  }, []);

  const openProject = useCallback((id: string) => {
    setActiveProject(id);
    setView('project');
    setSelection(new Set());
    setDetailId(null);
  }, []);

  const renameItem = useCallback((id: string) => {
    setEditSignals((s) => ({ ...s, [id]: (s[id] || 0) + 1 }));
  }, []);

  const projectMenu = useCallback(
    (id: string): MenuEntry[] => {
      const p = db.projects.find((x) => x.id === id);
      if (!p) return [];
      return [
        { label: 'Open', icon: 'chevronRight', onSelect: () => openProject(id) },
        { label: 'Duplicate', icon: 'copy', onSelect: () => duplicateProject(id) },
        { label: p.archived ? 'Restore' : 'Archive', icon: 'archive', onSelect: () => archiveProject(id, !p.archived) },
        { type: 'separator' },
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
    },
    [db.projects, openProject]
  );

  /* keyboard -------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName) || t?.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (typing) return;
        e.preventDefault();
        store.undo();
        return;
      }
      if (mod && ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y')) {
        if (typing) return;
        e.preventDefault();
        store.redo();
        return;
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        navigate('settings');
        return;
      }
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setCollapsed((c) => !c);
        return;
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setView('projects');
        setNewProjectSignal((v) => v + 1);
        return;
      }
      if (mod && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        navigate((['queue', 'today', 'projects', 'later', 'completed'] as ViewKey[])[Number(e.key) - 1]);
        return;
      }

      if (typing) return;

      if (e.key === 'Escape') {
        if (detailId) setDetailId(null);
        else if (selection.size) setSelection(new Set());
        return;
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setCaptureFocus((v) => v + 1);
        return;
      }

      const ids = Array.from(selection);
      const first = ids[0];

      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && visibleItems.length) {
        e.preventDefault();
        const idx = first ? visibleItems.findIndex((i) => i.id === first) : -1;
        const next = e.key === 'ArrowDown' ? Math.min(idx + 1, visibleItems.length - 1) : Math.max(idx - 1, 0);
        const target = visibleItems[idx < 0 ? 0 : next];
        if (target) {
          setSelection(new Set([target.id]));
          document.querySelector(`[data-item-id="${target.id}"]`)?.scrollIntoView({ block: 'nearest' });
        }
        return;
      }

      if (!ids.length) return;

      if (e.key === ' ') {
        e.preventDefault();
        ids.forEach(toggleComplete);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setDetailId(first);
      } else if (e.key === 'F2') {
        e.preventDefault();
        renameItem(first);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        ids.length > 1 ? deleteItems(ids) : deleteItem(first);
        setSelection(new Set());
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        ids.forEach(duplicateItem);
      } else if (e.key.toLowerCase() === 't') {
        ids.forEach((id) => moveItem(id, 'today', null, ids.length > 1));
      } else if (e.key.toLowerCase() === 'q') {
        ids.forEach((id) => moveItem(id, 'queue', null, ids.length > 1));
      } else if (e.key.toLowerCase() === 'l') {
        ids.forEach((id) => moveItem(id, 'later', null, ids.length > 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, visibleItems, detailId, navigate, renameItem]);

  /* global file drop → capture as attachment on selected, else new items */
  useEffect(() => {
    let depth = 0;
    const over = (e: DragEvent) => {
      if (!Array.from(e.dataTransfer?.types || []).includes('Files')) return;
      e.preventDefault();
      depth++;
      setGlobalDrop(true);
    };
    const leave = () => {
      depth = Math.max(0, depth - 1);
      if (!depth) setGlobalDrop(false);
    };
    const drop = async (e: DragEvent) => {
      if (!Array.from(e.dataTransfer?.types || []).includes('Files')) return;
      e.preventDefault();
      depth = 0;
      setGlobalDrop(false);
      const files = Array.from(e.dataTransfer!.files);
      if (!files.length) return;
      const paths = files.map((f) => api().attach.pathForFile(f)).filter(Boolean);
      const target = detailId || Array.from(selection)[0];
      if (target) {
        await attachFilesToItem(target, paths);
      } else {
        // Turn each dropped file into a captured item with the file attached.
        for (const p of paths) {
          const name = p.split(/[\\/]/).pop() || 'File';
          const created = captureItem(name.replace(/\.[^.]+$/, ''));
          if (created) await attachFilesToItem(created.id, [p]);
        }
        store.toast({ message: `Captured ${paths.length} file${paths.length > 1 ? 's' : ''}`, tone: 'success' });
      }
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [detailId, selection]);

  /* flush on unload -------------------------------------------------- */
  useEffect(() => {
    const h = () => api().data.flush().catch(() => {});
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const commands: Command[] = useMemo(
    () => [
      { id: 'capture', label: 'Capture a new item', icon: 'plus', kb: 'N', run: () => { navigate('queue'); setCaptureFocus((v) => v + 1); } },
      { id: 'project', label: 'Create a project', icon: 'folder', kb: 'Ctrl+Shift+N', run: () => { setView('projects'); setNewProjectSignal((v) => v + 1); } },
      { id: 'queue', label: 'Open Queue', icon: 'inbox', kb: 'Ctrl+1', run: () => navigate('queue') },
      { id: 'today', label: 'Open Today', icon: 'today', kb: 'Ctrl+2', run: () => navigate('today') },
      { id: 'projects', label: 'Open Projects', icon: 'projects', kb: 'Ctrl+3', run: () => navigate('projects') },
      { id: 'later', label: 'Open Later', icon: 'later', kb: 'Ctrl+4', run: () => navigate('later') },
      { id: 'completed', label: 'Open Completed', icon: 'done', kb: 'Ctrl+5', run: () => navigate('completed') },
      ...(selection.size
        ? [
            { id: 'sel-complete', label: `Complete ${selection.size} selected`, icon: 'check', run: () => Array.from(selection).forEach(toggleComplete) },
            { id: 'sel-today', label: 'Move selected to Today', icon: 'today', run: () => Array.from(selection).forEach((id) => moveItem(id, 'today', null, true)) },
            { id: 'sel-later', label: 'Move selected to Later', icon: 'later', run: () => Array.from(selection).forEach((id) => moveItem(id, 'later', null, true)) }
          ]
        : []),
      { id: 'undo', label: `Undo${store.canUndo() ? ` ${store.lastUndoLabel().toLowerCase()}` : ''}`, icon: 'undo', kb: 'Ctrl+Z', run: () => store.undo() },
      { id: 'export', label: 'Export a backup', icon: 'download', run: () => api().data.export().catch(() => {}) },
      { id: 'settings', label: 'Open Settings', icon: 'settings', kb: 'Ctrl+,', run: () => navigate('settings') }
    ],
    [navigate, selection]
  );

  const splashNode = splash ? <Splash onDone={() => setSplash(false)} /> : null;

  if (!store.ready) {
    return (
      <div className="app">
        <TitleBar />
        <div className="body" style={{ alignItems: 'center', justifyContent: 'center' }} />
        {splashNode}
      </div>
    );
  }

  if (store.loadError) {
    return (
      <div className="app">
        <TitleBar />
        <div className="error-screen">
          <div className="error-card">
            <Icon name="info" size={26} style={{ color: 'var(--primary)' }} />
            <h2>Wulf could not open your data.</h2>
            <p>
              The file may be in use by another copy of Wulf, or the folder may not be writable. Nothing has been
              overwritten — your last good copy is still on disk.
            </p>
            <div className="rowflex">
              <button className="btn primary" onClick={() => window.location.reload()}>Try again</button>
              <button className="btn" onClick={() => api().data.revealFolder()}>Open data folder</button>
            </div>
            <div className="mono">{store.loadError}</div>
          </div>
        </div>
        {splashNode}
      </div>
    );
  }

  if (settings && !settings.onboarded) {
    return (
      <>
        <TitleBar />
        <Onboarding onDone={() => store.setSettings({ onboarded: true })} />
        <Toasts />
        {splashNode}
      </>
    );
  }

  const detailItem = detailId ? db.items.find((i) => i.id === detailId) : null;
  const currentProject = activeProject ? db.projects.find((p) => p.id === activeProject) : null;

  return (
    <div className={`app ${splash ? 'booting' : ''}`}>
      <TitleBar subtitle={view === 'project' ? currentProject?.name : undefined} />
      <div className="body">
        <Sidebar
          db={db}
          view={view}
          activeProject={activeProject}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onNavigate={navigate}
          onOpenProject={openProject}
          onNewProject={() => {
            setView('projects');
            setNewProjectSignal((v) => v + 1);
          }}
          onSearch={() => setPaletteOpen(true)}
          contextMenu={ctx.open}
          projectMenu={projectMenu}
        />

        <main className="main">
          <div className="view" onMouseDown={(e) => {
            if ((e.target as HTMLElement).classList.contains('view') || (e.target as HTMLElement).classList.contains('view-inner')) {
              setSelection(new Set());
            }
          }}>
            {banner && (
              <div style={{ maxWidth: 880, margin: '14px auto 0', width: '100%', padding: '0 32px' }}>
                <div className="banner">
                  <Icon name="info" size={16} />
                  <span style={{ flex: 1 }}>{banner} Your data has been saved.</span>
                  <button className="icon-btn" onClick={() => setBanner(null)} aria-label="Dismiss">
                    <Icon name="x" size={14} />
                  </button>
                </div>
              </div>
            )}

            {(view === 'queue' || view === 'today' || view === 'later') && (
              <ListView
                bucket={view}
                db={db}
                selection={selection}
                setSelection={setSelection}
                openItem={setDetailId}
                renameItem={renameItem}
                editSignals={editSignals}
                contextMenu={ctx.open}
                captureFocus={captureFocus}
                showCompletedInQueue={!!settings?.showCompletedInQueue}
              />
            )}

            {view === 'projects' && (
              <ProjectsView db={db} openProject={openProject} contextMenu={ctx.open} newProjectSignal={newProjectSignal} />
            )}

            {view === 'project' && activeProject && (
              <ProjectView
                db={db}
                projectId={activeProject}
                back={() => navigate('projects')}
                selection={selection}
                setSelection={setSelection}
                openItem={setDetailId}
                renameItem={renameItem}
                editSignals={editSignals}
                contextMenu={ctx.open}
                captureFocus={captureFocus}
              />
            )}

            {view === 'completed' && (
              <CompletedView
                db={db}
                selection={selection}
                setSelection={setSelection}
                openItem={setDetailId}
                renameItem={renameItem}
                contextMenu={ctx.open}
              />
            )}

            {view === 'settings' && settings && <SettingsView settings={settings} db={db} />}
          </div>
        </main>
      </div>

      {detailItem && <DetailPanel item={detailItem} onClose={() => setDetailId(null)} />}

      {paletteOpen && (
        <Palette
          db={db}
          commands={commands}
          onClose={() => setPaletteOpen(false)}
          onOpenItem={(id) => {
            setDetailId(id);
            setSelection(new Set([id]));
          }}
          onOpenProject={openProject}
        />
      )}

      {globalDrop && (
        <div className="global-drop">
          <div className="gd-card">
            {detailId || selection.size ? 'Drop to attach to the selected item' : 'Drop files to capture them'}
          </div>
        </div>
      )}

      {ctx.node}
      <Toasts />
      {splashNode}
    </div>
  );
}
