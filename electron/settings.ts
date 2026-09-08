import { app } from 'electron';
import path from 'path';
import { JsonStore } from './store';

export interface WulfSettings {
  theme: 'midnight' | 'ember' | 'paper';
  accent: string;
  launchOnStartup: boolean;
  startMinimized: boolean;
  minimizeToTray: boolean;
  notificationsEnabled: boolean;
  reminderSound: boolean;
  newTaskPosition: 'top' | 'bottom';
  confirmDelete: boolean;
  showCompletedInQueue: boolean;
  autoBackup: boolean;
  autoBackupKeep: number;
  dataDir: string | null;
  onboarded: boolean;
  windowBounds: { width: number; height: number; x?: number; y?: number; maximized?: boolean };
}

export const defaultSettings = (): WulfSettings => ({
  theme: 'midnight',
  accent: '#DA7B1F',
  launchOnStartup: true,
  startMinimized: false,
  minimizeToTray: false,
  notificationsEnabled: true,
  reminderSound: true,
  newTaskPosition: 'top',
  confirmDelete: false,
  showCompletedInQueue: false,
  autoBackup: true,
  autoBackupKeep: 10,
  dataDir: null,
  onboarded: false,
  windowBounds: { width: 1280, height: 840 }
});

export function createSettingsStore() {
  return new JsonStore(app.getPath('userData'), {
    fileName: 'settings.json',
    defaults: defaultSettings() as unknown as Record<string, any>
  });
}

export function resolveDataDir(settings: WulfSettings) {
  return settings.dataDir && settings.dataDir.trim()
    ? settings.dataDir
    : path.join(app.getPath('userData'), 'data');
}
