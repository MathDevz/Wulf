export type Bucket = 'queue' | 'today' | 'later' | 'project';
export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Attachment {
  id: string;
  path: string;
  name: string;
  ext: string;
  size: number;
  managed: boolean;
  originalName?: string;
  addedAt: string;
}

export interface LinkRef {
  id: string;
  url: string;
  label: string;
  addedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Item {
  id: string;
  title: string;
  bucket: Bucket;
  projectId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  notes: string;
  priority: Priority;
  dueAt: string | null;
  reminderAt: string | null;
  reminderFired?: boolean;
  estimateMinutes: number | null;
  tags: string[];
  subtasks: Subtask[];
  links: LinkRef[];
  attachments: Attachment[];
  todayAt: string | null;
  archived?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  notes: string;
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  dueAt: string | null;
  tags: string[];
  links: LinkRef[];
  attachments: Attachment[];
  archived: boolean;
  completedAt: string | null;
}

export interface ActivityEntry {
  id: string;
  at: string;
  kind: string;
  text: string;
  itemId?: string | null;
  projectId?: string | null;
}

export interface Database {
  schemaVersion: number;
  items: Item[];
  projects: Project[];
  tags: string[];
  activity: ActivityEntry[];
}

export interface Settings {
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
}

export const emptyDatabase = (): Database => ({
  schemaVersion: 1,
  items: [],
  projects: [],
  tags: [],
  activity: []
});
