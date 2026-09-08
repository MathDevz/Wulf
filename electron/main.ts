import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  Notification,
  Menu,
  Tray,
  nativeImage,
  protocol,
  net
} from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { JsonStore, SCHEMA_VERSION } from './store';
import { createSettingsStore, defaultSettings, resolveDataDir, WulfSettings } from './settings';

const isDev = !app.isPackaged && process.env.WULF_DEV === '1';
const RESOURCES = app.isPackaged
  ? process.resourcesPath
  : path.join(__dirname, '..', 'resources');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let settingsStore: JsonStore;
let dataStore: JsonStore;
let quitting = false;

/* ------------------------------------------------------------------ */
/* single instance                                                     */
/* ------------------------------------------------------------------ */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */
const emptyDatabase = () => ({
  schemaVersion: SCHEMA_VERSION,
  items: [],
  projects: [],
  tags: [],
  activity: []
});

function migrate(data: Record<string, any>, _from: number) {
  // v0 -> v1: guarantee the core collections exist.
  data.items ||= [];
  data.projects ||= [];
  data.tags ||= [];
  data.activity ||= [];
  return data;
}

function settings(): WulfSettings {
  return { ...defaultSettings(), ...(settingsStore.read() as any) } as WulfSettings;
}

function openDataStore() {
  const dir = resolveDataDir(settings());
  dataStore = new JsonStore(dir, {
    fileName: 'wulf.json',
    defaults: emptyDatabase(),
    migrate
  });
  writeDataDirPointer(dir);
  return dataStore;
}

/**
 * The Windows uninstaller needs to know where the data actually lives, since
 * the user can move it anywhere. Keep a plain-text pointer next to the
 * settings file so the uninstaller can read it without parsing JSON.
 */
function writeDataDirPointer(dir: string) {
  if (process.platform !== 'win32') return;
  try {
    const userData = app.getPath('userData');
    const target = path.resolve(dir);
    const isDefault = target === path.resolve(path.join(userData, 'data'));
    const pointer = path.join(userData, 'datadir.txt');
    if (isDefault) {
      if (fs.existsSync(pointer)) fs.unlinkSync(pointer);
    } else {
      fs.writeFileSync(pointer, target, 'utf8');
    }
  } catch {}
}

function attachmentsDir() {
  const dir = path.join(resolveDataDir(settings()), 'attachments');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function backupsDir() {
  const dir = path.join(resolveDataDir(settings()), 'backups');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function runAutoBackup() {
  const s = settings();
  if (!s.autoBackup) return;
  try {
    const dir = backupsDir();
    const stamp = new Date().toISOString().slice(0, 10);
    const target = path.join(dir, `wulf-${stamp}.json`);
    if (fs.existsSync(target)) return; // one per day
    fs.writeFileSync(target, JSON.stringify(dataStore.read()), 'utf8');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('wulf-') && f.endsWith('.json'))
      .sort();
    const keep = Math.max(1, s.autoBackupKeep || 10);
    while (files.length > keep) {
      const f = files.shift()!;
      try {
        fs.unlinkSync(path.join(dir, f));
      } catch {}
    }
  } catch {}
}

/* ------------------------------------------------------------------ */
/* window                                                              */
/* ------------------------------------------------------------------ */
function createWindow() {
  const s = settings();
  const b = s.windowBounds || { width: 1280, height: 840 };

  mainWindow = new BrowserWindow({
    width: b.width,
    height: b.height,
    x: b.x,
    y: b.y,
    minWidth: 880,
    minHeight: 600,
    show: false,
    backgroundColor: '#020202',
    title: 'Wulf',
    icon: path.join(RESOURCES, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true
    }
  });

  Menu.setApplicationMenu(null);

  if (b.maximized) mainWindow.maximize();

  mainWindow.once('ready-to-show', () => {
    if (!(s.startMinimized && s.launchOnStartup)) mainWindow?.show();
  });

  const saveBounds = () => {
    if (!mainWindow) return;
    const cur = settings();
    const bounds = mainWindow.isMaximized() ? cur.windowBounds : mainWindow.getBounds();
    settingsStore.write({
      ...cur,
      windowBounds: { ...bounds, maximized: mainWindow.isMaximized() }
    });
  };
  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);
  mainWindow.on('maximize', () => {
    saveBounds();
    mainWindow?.webContents.send('window:state', { maximized: true });
  });
  mainWindow.on('unmaximize', () => {
    saveBounds();
    mainWindow?.webContents.send('window:state', { maximized: false });
  });

  mainWindow.on('close', (e) => {
    if (!quitting && settings().minimizeToTray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // External links always go to the default browser, never in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      e.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5273');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

function createTray() {
  // Prefer the pre-scaled 32px PNG (crisper in the notification area than a
  // downscaled .ico), falling back through the other shipped icon files.
  const candidates = [
    path.join(RESOURCES, 'tray.png'),
    path.join(RESOURCES, process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    path.join(RESOURCES, 'icon.png')
  ];
  let img = nativeImage.createEmpty();
  for (const c of candidates) {
    const candidate = nativeImage.createFromPath(c);
    if (!candidate.isEmpty()) {
      img = candidate;
      break;
    }
  }
  if (img.isEmpty()) return;
  tray = new Tray(img.resize({ width: 16, height: 16 }));
  tray.setToolTip('Wulf');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Wulf', click: () => showWindow() },
      {
        label: 'Quick capture',
        click: () => {
          showWindow();
          mainWindow?.webContents.send('shortcut', 'capture');
        }
      },
      { type: 'separator' },
      { label: 'Quit', click: () => { quitting = true; app.quit(); } }
    ])
  );
  tray.on('click', () => showWindow());
}

function showWindow() {
  if (!mainWindow) createWindow();
  mainWindow?.show();
  mainWindow?.focus();
}

/* ------------------------------------------------------------------ */
/* reminders                                                           */
/* ------------------------------------------------------------------ */
const firedReminders = new Set<string>();

function checkReminders() {
  if (!settings().notificationsEnabled) return;
  const db = dataStore.read();
  const now = Date.now();
  const items: any[] = db.items || [];
  let changed = false;
  for (const it of items) {
    if (!it.reminderAt || it.completedAt || it.reminderFired) continue;
    const t = new Date(it.reminderAt).getTime();
    if (isNaN(t) || t > now || now - t > 1000 * 60 * 60 * 24) continue;
    if (firedReminders.has(it.id)) continue;
    firedReminders.add(it.id);
    it.reminderFired = true;
    changed = true;
    try {
      const n = new Notification({
        title: 'Wulf reminder',
        body: it.title,
        icon: path.join(RESOURCES, 'icon.png'),
        silent: !settings().reminderSound
      });
      n.on('click', () => {
        showWindow();
        mainWindow?.webContents.send('reminder:open', it.id);
      });
      n.show();
    } catch {}
  }
  if (changed) {
    dataStore.write(db);
    mainWindow?.webContents.send('data:external-change');
  }
}

/* ------------------------------------------------------------------ */
/* ipc                                                                 */
/* ------------------------------------------------------------------ */
function safeHandle(channel: string, fn: (...a: any[]) => any) {
  ipcMain.handle(channel, async (_e, ...args) => {
    try {
      return { ok: true, value: await fn(...args) };
    } catch (err: any) {
      return {
        ok: false,
        error: {
          message: err?.message || String(err),
          code: err?.code || null,
          channel
        }
      };
    }
  });
}

function registerIpc() {
  safeHandle('data:read', () => dataStore.read());
  safeHandle('data:write', (payload: any) => {
    dataStore.write(payload);
    return true;
  });
  safeHandle('data:flush', () => {
    dataStore.flush();
    return true;
  });

  safeHandle('settings:read', () => settings());
  safeHandle('settings:write', (patch: Partial<WulfSettings>) => {
    const next = { ...settings(), ...patch };
    settingsStore.write(next as any);
    settingsStore.flush();
    if (patch.launchOnStartup !== undefined && process.platform === 'win32') {
      app.setLoginItemSettings({
        openAtLogin: !!patch.launchOnStartup,
        args: next.startMinimized ? ['--minimized'] : []
      });
    }
    if (patch.minimizeToTray !== undefined) {
      if (patch.minimizeToTray && !tray) createTray();
      if (!patch.minimizeToTray && tray) {
        tray.destroy();
        tray = null;
      }
    }
    return next;
  });

  safeHandle('app:info', () => ({
    version: app.getVersion(),
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    platform: process.platform,
    arch: process.arch,
    dataDir: resolveDataDir(settings()),
    dataFile: dataStore.path,
    userData: app.getPath('userData')
  }));

  safeHandle('shell:openExternal', (url: string) => {
    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) throw new Error('Blocked URL scheme.');
    return shell.openExternal(url);
  });
  safeHandle('shell:openPath', (p: string) => shell.openPath(p));
  safeHandle('shell:showItemInFolder', (p: string) => {
    shell.showItemInFolder(p);
    return true;
  });

  /* window controls */
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:toggleMaximize', () => {
    if (!mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.close());
  safeHandle('window:isMaximized', () => !!mainWindow?.isMaximized());

  /* attachments */
  safeHandle('attach:pick', async () => {
    const r = await dialog.showOpenDialog(mainWindow!, {
      title: 'Attach files',
      properties: ['openFile', 'multiSelections']
    });
    if (r.canceled) return [];
    return r.filePaths.map(describeFile);
  });

  safeHandle('attach:copyIn', (filePath: string) => {
    const stat = fs.statSync(filePath);
    // Only copy modest files into the vault; large files stay referenced.
    const LIMIT = 25 * 1024 * 1024;
    if (stat.size > LIMIT) return describeFile(filePath);
    const dir = attachmentsDir();
    const id = crypto.randomBytes(8).toString('hex');
    const target = path.join(dir, `${id}${path.extname(filePath)}`);
    fs.copyFileSync(filePath, target);
    return { ...describeFile(target), managed: true, originalName: path.basename(filePath) };
  });

  safeHandle('attach:exists', (p: string) => fs.existsSync(p));
  safeHandle('attach:remove', (p: string) => {
    const dir = attachmentsDir();
    if (path.resolve(p).startsWith(path.resolve(dir)) && fs.existsSync(p)) fs.unlinkSync(p);
    return true;
  });

  /* export / import / backup */
  safeHandle('data:export', async () => {
    const r = await dialog.showSaveDialog(mainWindow!, {
      title: 'Export Wulf data',
      defaultPath: path.join(
        app.getPath('documents'),
        `wulf-backup-${new Date().toISOString().slice(0, 10)}.json`
      ),
      filters: [{ name: 'Wulf backup', extensions: ['json'] }]
    });
    if (r.canceled || !r.filePath) return null;
    dataStore.flush();
    const payload = {
      wulf: true,
      exportedAt: new Date().toISOString(),
      appVersion: app.getVersion(),
      schemaVersion: SCHEMA_VERSION,
      data: dataStore.read()
    };
    fs.writeFileSync(r.filePath, JSON.stringify(payload, null, 2), 'utf8');
    return r.filePath;
  });

  safeHandle('data:import', async () => {
    const r = await dialog.showOpenDialog(mainWindow!, {
      title: 'Import Wulf data',
      properties: ['openFile'],
      filters: [{ name: 'Wulf backup', extensions: ['json'] }]
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const raw = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8'));
    const incoming = raw?.data ?? raw;
    if (!incoming || !Array.isArray(incoming.items)) {
      throw new Error('That file does not look like a Wulf backup.');
    }
    // Safety copy of the current database before replacing it.
    try {
      const dir = backupsDir();
      fs.writeFileSync(
        path.join(dir, `pre-import-${Date.now()}.json`),
        JSON.stringify(dataStore.read()),
        'utf8'
      );
    } catch {}
    const merged = migrate({ ...emptyDatabase(), ...incoming }, incoming.schemaVersion ?? 0);
    dataStore.write(merged);
    dataStore.flush();
    return merged;
  });

  safeHandle('data:backupNow', () => {
    dataStore.flush();
    const dir = backupsDir();
    const p = path.join(dir, `wulf-manual-${Date.now()}.json`);
    fs.writeFileSync(p, JSON.stringify(dataStore.read(), null, 2), 'utf8');
    return p;
  });

  safeHandle('data:listBackups', () => {
    const dir = backupsDir();
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const st = fs.statSync(path.join(dir, f));
        return { name: f, path: path.join(dir, f), size: st.size, mtime: st.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
  });

  safeHandle('data:restoreBackup', (p: string) => {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
    const incoming = raw?.data ?? raw;
    if (!incoming || !Array.isArray(incoming.items)) throw new Error('Backup file is unreadable.');
    dataStore.write(migrate({ ...emptyDatabase(), ...incoming }, incoming.schemaVersion ?? 0));
    dataStore.flush();
    return dataStore.read();
  });

  safeHandle('data:revealFolder', () => {
    shell.openPath(resolveDataDir(settings()));
    return true;
  });

  safeHandle('data:chooseFolder', async () => {
    const r = await dialog.showOpenDialog(mainWindow!, {
      title: 'Choose where Wulf stores your data',
      properties: ['openDirectory', 'createDirectory']
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const newDir = r.filePaths[0];
    const oldDir = resolveDataDir(settings());
    if (path.resolve(newDir) === path.resolve(oldDir)) return newDir;
    dataStore.flush();
    fs.mkdirSync(newDir, { recursive: true });
    // Move the database and attachments across.
    const copyRec = (src: string, dst: string) => {
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dst, { recursive: true });
      for (const e of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, e.name);
        const d = path.join(dst, e.name);
        e.isDirectory() ? copyRec(s, d) : fs.copyFileSync(s, d);
      }
    };
    copyRec(oldDir, newDir);
    settingsStore.write({ ...settings(), dataDir: newDir } as any);
    settingsStore.flush();
    openDataStore();
    return newDir;
  });

  safeHandle('notify:test', () => {
    new Notification({
      title: 'Wulf',
      body: 'Notifications are working.',
      icon: path.join(RESOURCES, 'icon.png')
    }).show();
    return true;
  });

  safeHandle('notify:send', (title: string, body: string) => {
    if (!settings().notificationsEnabled) return false;
    new Notification({ title, body, icon: path.join(RESOURCES, 'icon.png') }).show();
    return true;
  });

  safeHandle('dialog:confirm', async (opts: { title: string; message: string; detail?: string; confirmLabel?: string; destructive?: boolean }) => {
    const r = await dialog.showMessageBox(mainWindow!, {
      type: opts.destructive ? 'warning' : 'question',
      buttons: [opts.confirmLabel || 'Confirm', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      title: opts.title,
      message: opts.message,
      detail: opts.detail,
      noLink: true
    });
    return r.response === 0;
  });
}

function describeFile(p: string) {
  let size = 0;
  try {
    size = fs.statSync(p).size;
  } catch {}
  return {
    path: p,
    name: path.basename(p),
    ext: path.extname(p).replace('.', '').toLowerCase(),
    size,
    managed: false
  };
}

/* ------------------------------------------------------------------ */
/* lifecycle                                                           */
/* ------------------------------------------------------------------ */
protocol.registerSchemesAsPrivileged([
  { scheme: 'wulf-file', privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: false } }
]);

app.whenReady().then(() => {
  if (process.platform === 'win32') app.setAppUserModelId('app.wulf.desktop');

  settingsStore = createSettingsStore();
  openDataStore();
  runAutoBackup();

  protocol.handle('wulf-file', (request) => {
    const url = new URL(request.url);
    const filePath = decodeURIComponent(url.pathname).replace(/^\/([a-zA-Z]:)/, '$1');
    return net.fetch('file://' + filePath);
  });

  registerIpc();

  // Keep the Windows login item in sync with the stored preference on every
  // launch, so a fresh install (which defaults to on) is registered properly
  // and a user who turned it off elsewhere stays off.
  if (process.platform === 'win32') {
    try {
      const s = settings();
      const current = app.getLoginItemSettings();
      if (current.openAtLogin !== s.launchOnStartup) {
        app.setLoginItemSettings({
          openAtLogin: s.launchOnStartup,
          args: s.startMinimized ? ['--minimized'] : []
        });
      }
    } catch {}
  }

  createWindow();
  if (settings().minimizeToTray) createTray();

  setInterval(checkReminders, 30_000);
  setTimeout(checkReminders, 4_000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  quitting = true;
  try {
    dataStore?.flush();
    settingsStore?.flush();
  } catch {}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (err) => {
  try {
    dataStore?.flush();
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(
      path.join(logDir, 'main.log'),
      `\n[${new Date().toISOString()}] ${err.stack || err}\n`
    );
  } catch {}
  if (mainWindow) {
    mainWindow.webContents.send('app:error', {
      message: 'Wulf hit an unexpected problem in the background.',
      detail: String(err?.message || err)
    });
  } else {
    dialog.showErrorBox('Wulf', 'Wulf hit an unexpected problem. Your data has been saved.');
  }
});

export { os };
