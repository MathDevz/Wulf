/**
 * Wulf — persistence layer.
 *
 * Data is stored as a single JSON document, written atomically (temp file +
 * rename) with a rolling backup so a crash mid-write can never lose the
 * database. A schema version drives forward migrations.
 */
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export const SCHEMA_VERSION = 1;

export type WulfData = Record<string, any>;

export interface StoreOptions {
  fileName: string;
  defaults: WulfData;
  migrate?: (data: WulfData, from: number) => WulfData;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

export class JsonStore {
  private filePath: string;
  private bakPath: string;
  private tmpPath: string;
  private defaults: WulfData;
  private migrate?: (data: WulfData, from: number) => WulfData;
  private cache: WulfData;
  private writeTimer: NodeJS.Timeout | null = null;
  private dirty = false;

  constructor(dir: string, opts: StoreOptions) {
    ensureDir(dir);
    this.filePath = path.join(dir, opts.fileName);
    this.bakPath = this.filePath + '.bak';
    this.tmpPath = this.filePath + '.tmp';
    this.defaults = opts.defaults;
    this.migrate = opts.migrate;
    this.cache = this.load();
  }

  get path() {
    return this.filePath;
  }

  private readJson(p: string): WulfData | null {
    try {
      if (!fs.existsSync(p)) return null;
      const raw = fs.readFileSync(p, 'utf8');
      if (!raw.trim()) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private load(): WulfData {
    let data = this.readJson(this.filePath);
    let recovered = false;
    if (!data) {
      data = this.readJson(this.bakPath);
      if (data) recovered = true;
    }
    if (!data) return { ...structuredClone(this.defaults), schemaVersion: SCHEMA_VERSION };

    const from = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
    if (from < SCHEMA_VERSION && this.migrate) {
      try {
        data = this.migrate(data, from);
      } catch (e) {
        // Migration failed: keep a copy of the original so nothing is lost.
        try {
          fs.copyFileSync(this.filePath, this.filePath + `.premigration-${Date.now()}`);
        } catch {}
        data = { ...structuredClone(this.defaults), schemaVersion: SCHEMA_VERSION };
      }
    }
    data.schemaVersion = SCHEMA_VERSION;
    if (recovered) this.writeNow(data);
    return { ...structuredClone(this.defaults), ...data };
  }

  read(): WulfData {
    return this.cache;
  }

  /** Replace the whole document and schedule a debounced atomic write. */
  write(data: WulfData) {
    this.cache = { ...data, schemaVersion: SCHEMA_VERSION };
    this.dirty = true;
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => this.flush(), 180);
  }

  private writeNow(data: WulfData) {
    const json = JSON.stringify(data, null, 0);
    const fd = fs.openSync(this.tmpPath, 'w');
    try {
      fs.writeFileSync(fd, json, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    if (fs.existsSync(this.filePath)) {
      try {
        fs.copyFileSync(this.filePath, this.bakPath);
      } catch {}
    }
    fs.renameSync(this.tmpPath, this.filePath);
  }

  /** Force a synchronous flush (used on quit). */
  flush() {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    if (!this.dirty) return;
    this.writeNow(this.cache);
    this.dirty = false;
  }
}

export function userDataDir() {
  return app.getPath('userData');
}
