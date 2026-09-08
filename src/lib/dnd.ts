/** Lightweight HTML5 drag-and-drop coordination shared across views. */
export const DND_MIME = 'application/x-wulf-item';

export interface DragPayload {
  kind: 'item' | 'project';
  ids: string[];
}

let current: DragPayload | null = null;

export function setDrag(p: DragPayload | null) {
  current = p;
}
export function getDrag() {
  return current;
}

export function readDrag(e: React.DragEvent): DragPayload | null {
  if (current) return current;
  try {
    const raw = e.dataTransfer.getData(DND_MIME);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasFiles(e: React.DragEvent) {
  return Array.from(e.dataTransfer.types || []).includes('Files');
}
