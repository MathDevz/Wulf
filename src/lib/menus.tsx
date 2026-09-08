import { MenuEntry } from '../components/ContextMenu';
import { Database, Item } from '../types';
import {
  deleteItem,
  deleteItems,
  duplicateItem,
  moveItem,
  setTagOnItem,
  toggleComplete,
  updateItem
} from './actions';
import { addDays, atTime, nextWeekend } from './util';

export function itemMenu(
  db: Database,
  item: Item,
  selection: Set<string>,
  handlers: { open: (id: string) => void; rename: (id: string) => void }
): MenuEntry[] {
  const multi = selection.size > 1 && selection.has(item.id);
  const ids = multi ? Array.from(selection) : [item.id];
  const setDue = (d: Date | null) => ids.forEach((id) => updateItem(id, { dueAt: d ? d.toISOString() : null }, 'Set deadline'));

  if (multi) {
    return [
      { type: 'label', label: `${ids.length} items selected` },
      { label: 'Complete all', icon: 'check', onSelect: () => ids.forEach((id) => {
          const it = db.items.find((x) => x.id === id);
          if (it && !it.completedAt) toggleComplete(id);
        }) },
      { type: 'separator' },
      { label: 'Move to Today', icon: 'today', onSelect: () => ids.forEach((id) => moveItem(id, 'today', null, true)) },
      { label: 'Move to Queue', icon: 'inbox', onSelect: () => ids.forEach((id) => moveItem(id, 'queue', null, true)) },
      { label: 'Move to Later', icon: 'later', onSelect: () => ids.forEach((id) => moveItem(id, 'later', null, true)) },
      {
        label: 'Add to project',
        icon: 'folder',
        submenu: db.projects
          .filter((p) => !p.archived)
          .map((p) => ({ label: p.name, icon: 'folder', onSelect: () => ids.forEach((id) => moveItem(id, 'project', p.id, true)) }))
      },
      { type: 'separator' },
      { label: 'Delete all', icon: 'trash', danger: true, onSelect: () => deleteItems(ids) }
    ];
  }

  const projects = db.projects.filter((p) => !p.archived);

  return [
    {
      label: item.completedAt ? 'Reopen' : 'Complete',
      icon: item.completedAt ? 'refresh' : 'check',
      kb: 'Space',
      onSelect: () => toggleComplete(item.id)
    },
    { label: 'Edit title', icon: 'edit', kb: 'F2', onSelect: () => handlers.rename(item.id) },
    { label: 'Open details', icon: 'panel', kb: 'Enter', onSelect: () => handlers.open(item.id) },
    { type: 'separator' },
    {
      label: 'Move to',
      icon: 'arrowRight',
      submenu: [
        { label: 'Queue', icon: 'inbox', kb: 'Q', disabled: item.bucket === 'queue', onSelect: () => moveItem(item.id, 'queue') },
        { label: 'Today', icon: 'today', kb: 'T', disabled: item.bucket === 'today', onSelect: () => moveItem(item.id, 'today') },
        { label: 'Later', icon: 'later', kb: 'L', disabled: item.bucket === 'later', onSelect: () => moveItem(item.id, 'later') }
      ]
    },
    {
      label: 'Add to project',
      icon: 'folder',
      disabled: projects.length === 0,
      submenu: [
        ...projects.map((p) => ({
          label: p.name,
          icon: 'folder',
          disabled: item.projectId === p.id,
          onSelect: () => moveItem(item.id, 'project', p.id)
        })),
        ...(item.projectId
          ? [
              { type: 'separator' as const },
              { label: 'Remove from project', icon: 'x', onSelect: () => moveItem(item.id, 'queue') }
            ]
          : [])
      ]
    },
    {
      label: 'Set deadline',
      icon: 'today',
      submenu: [
        { label: 'Today', onSelect: () => setDue(atTime(new Date(), 18)) },
        { label: 'Tomorrow', onSelect: () => setDue(atTime(addDays(new Date(), 1), 9)) },
        { label: 'This weekend', onSelect: () => setDue(atTime(nextWeekend(), 10)) },
        { label: 'Next week', onSelect: () => setDue(atTime(addDays(new Date(), 7), 9)) },
        { type: 'separator' },
        { label: 'Clear deadline', disabled: !item.dueAt, onSelect: () => setDue(null) },
        { type: 'separator' },
        { label: 'Pick exact date…', onSelect: () => handlers.open(item.id) }
      ]
    },
    {
      label: 'Priority',
      icon: 'flag',
      submenu: (['high', 'medium', 'low', 'none'] as const).map((p) => ({
        label: p === 'none' ? 'None' : p[0].toUpperCase() + p.slice(1),
        disabled: item.priority === p,
        onSelect: () => updateItem(item.id, { priority: p }, 'Set priority')
      }))
    },
    {
      label: 'Tags',
      icon: 'tag',
      submenu: db.tags.length
        ? db.tags.map((t) => ({
            label: (item.tags.includes(t) ? '✓ ' : '') + '#' + t,
            onSelect: () => setTagOnItem(item.id, t, !item.tags.includes(t))
          }))
        : [{ label: 'No tags yet', disabled: true }]
    },
    { type: 'separator' },
    { label: 'Duplicate', icon: 'copy', kb: 'Ctrl+D', onSelect: () => duplicateItem(item.id) },
    { label: 'Delete', icon: 'trash', kb: 'Del', danger: true, onSelect: () => deleteItem(item.id) }
  ];
}
