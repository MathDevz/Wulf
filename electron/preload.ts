import { contextBridge, ipcRenderer, webUtils } from 'electron';

type Result<T> = { ok: true; value: T } | { ok: false; error: { message: string; code?: string | null; channel?: string } };

async function call<T>(channel: string, ...args: any[]): Promise<T> {
  const res: Result<T> = await ipcRenderer.invoke(channel, ...args);
  if (!res || (res as any).ok !== true) {
    const err = (res as any)?.error ?? { message: 'Unknown error' };
    const e = new Error(err.message);
    (e as any).code = err.code;
    (e as any).channel = err.channel;
    throw e;
  }
  return (res as any).value;
}

const api = {
  data: {
    read: () => call<any>('data:read'),
    write: (payload: any) => call<boolean>('data:write', payload),
    flush: () => call<boolean>('data:flush'),
    export: () => call<string | null>('data:export'),
    import: () => call<any>('data:import'),
    backupNow: () => call<string>('data:backupNow'),
    listBackups: () => call<any[]>('data:listBackups'),
    restoreBackup: (p: string) => call<any>('data:restoreBackup'),
    revealFolder: () => call<boolean>('data:revealFolder'),
    chooseFolder: () => call<string | null>('data:chooseFolder')
  },
  settings: {
    read: () => call<any>('settings:read'),
    write: (patch: any) => call<any>('settings:write', patch)
  },
  app: {
    info: () => call<any>('app:info')
  },
  shell: {
    openExternal: (url: string) => call<void>('shell:openExternal', url),
    openPath: (p: string) => call<string>('shell:openPath', p),
    showItemInFolder: (p: string) => call<boolean>('shell:showItemInFolder', p)
  },
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    toggleMaximize: () => ipcRenderer.send('window:toggleMaximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => call<boolean>('window:isMaximized'),
    onState: (cb: (s: { maximized: boolean }) => void) => {
      const h = (_e: any, s: any) => cb(s);
      ipcRenderer.on('window:state', h);
      return () => ipcRenderer.removeListener('window:state', h);
    }
  },
  attach: {
    pick: () => call<any[]>('attach:pick'),
    copyIn: (p: string) => call<any>('attach:copyIn', p),
    exists: (p: string) => call<boolean>('attach:exists', p),
    remove: (p: string) => call<boolean>('attach:remove', p),
    /** Resolve a dropped File object to an absolute path (Electron 30+). */
    pathForFile: (file: File) => {
      try {
        return webUtils.getPathForFile(file);
      } catch {
        return (file as any).path || '';
      }
    }
  },
  notify: {
    test: () => call<boolean>('notify:test'),
    send: (title: string, body: string) => call<boolean>('notify:send', title, body)
  },
  dialog: {
    confirm: (opts: any) => call<boolean>('dialog:confirm', opts)
  },
  on: {
    shortcut: (cb: (name: string) => void) => {
      const h = (_e: any, n: string) => cb(n);
      ipcRenderer.on('shortcut', h);
      return () => ipcRenderer.removeListener('shortcut', h);
    },
    reminderOpen: (cb: (id: string) => void) => {
      const h = (_e: any, id: string) => cb(id);
      ipcRenderer.on('reminder:open', h);
      return () => ipcRenderer.removeListener('reminder:open', h);
    },
    externalChange: (cb: () => void) => {
      const h = () => cb();
      ipcRenderer.on('data:external-change', h);
      return () => ipcRenderer.removeListener('data:external-change', h);
    },
    appError: (cb: (e: { message: string; detail?: string }) => void) => {
      const h = (_e: any, p: any) => cb(p);
      ipcRenderer.on('app:error', h);
      return () => ipcRenderer.removeListener('app:error', h);
    }
  }
};

contextBridge.exposeInMainWorld('wulf', api);
export type WulfApi = typeof api;
