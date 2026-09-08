import React, { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { Settings } from '../types';
import { store } from '../lib/store';
import { deleteTag, renameTag } from '../lib/actions';
import { SHORTCUTS } from '../lib/shortcuts';
import { formatBytes, relativeTime } from '../lib/util';
import logoFull from '../assets/logo-full.png';

const api = () => (window as any).wulf as any;

function Row({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <div className="sr-main">
        <div className="sr-title">{title}</div>
        {desc && <div className="sr-desc">{desc}</div>}
      </div>
      <div className="sr-control">{children}</div>
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      className={`switch ${on ? 'on' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
    />
  );
}

export function SettingsView({ settings, db }: { settings: Settings; db: any }) {
  const [tab, setTab] = useState<'general' | 'data' | 'shortcuts' | 'tags' | 'about'>('general');
  const [info, setInfo] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);

  useEffect(() => {
    api().app.info().then(setInfo).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'data') api().data.listBackups().then(setBackups).catch(() => {});
  }, [tab]);

  const set = (patch: Partial<Settings>) => store.setSettings(patch);

  return (
    <div className="view-inner">
      <div className="view-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Only the things worth deciding.</div>
        </div>
      </div>

      <div className="tabs" role="tablist">
        {(['general', 'data', 'shortcuts', 'tags', 'about'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div style={{ marginTop: 8 }}>
          <Row title="Theme" desc="Three shades of dark. Wulf stays quiet in all of them.">
            <div className="seg">
              {(['midnight', 'ember', 'paper'] as const).map((t) => (
                <button key={t} className={settings.theme === t ? 'on' : ''} onClick={() => set({ theme: t })}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </Row>
          <Row title="New items go" desc="Where a freshly captured item lands in the list.">
            <div className="seg">
              <button className={settings.newTaskPosition === 'top' ? 'on' : ''} onClick={() => set({ newTaskPosition: 'top' })}>
                Top
              </button>
              <button className={settings.newTaskPosition === 'bottom' ? 'on' : ''} onClick={() => set({ newTaskPosition: 'bottom' })}>
                Bottom
              </button>
            </div>
          </Row>
          <Row title="Show completed items in lists" desc="Otherwise finished things move quietly to Completed.">
            <Switch on={settings.showCompletedInQueue} onChange={(v) => set({ showCompletedInQueue: v })} label="Show completed in lists" />
          </Row>
          <Row title="Confirm before deleting" desc="Off by default — deletes can always be undone.">
            <Switch on={settings.confirmDelete} onChange={(v) => set({ confirmDelete: v })} label="Confirm before deleting" />
          </Row>

          <div className="section-head">
            <span>Windows</span>
            <span className="line" />
          </div>
          <Row title="Start Wulf when I sign in" desc="Adds Wulf to your Windows startup items.">
            <Switch on={settings.launchOnStartup} onChange={(v) => set({ launchOnStartup: v })} label="Launch on startup" />
          </Row>
          <Row title="Start hidden" desc="When launched at sign-in, open in the background instead of on screen.">
            <Switch on={settings.startMinimized} onChange={(v) => set({ startMinimized: v })} label="Start minimized" />
          </Row>
          <Row title="Keep running in the tray" desc="Closing the window keeps Wulf alive for reminders.">
            <Switch on={settings.minimizeToTray} onChange={(v) => set({ minimizeToTray: v })} label="Minimize to tray" />
          </Row>

          <div className="section-head">
            <span>Notifications</span>
            <span className="line" />
          </div>
          <Row title="Reminder notifications" desc="Wulf notifies you at the time you set. Nothing else.">
            <Switch on={settings.notificationsEnabled} onChange={(v) => set({ notificationsEnabled: v })} label="Notifications" />
          </Row>
          <Row title="Play a sound" desc="Use the standard Windows notification sound.">
            <Switch on={settings.reminderSound} onChange={(v) => set({ reminderSound: v })} label="Reminder sound" />
          </Row>
          <Row title="Test it" desc="Send yourself a notification right now.">
            <button className="btn sm" onClick={() => api().notify.test()}>
              <Icon name="bell" size={13} /> Send test
            </button>
          </Row>
        </div>
      )}

      {tab === 'data' && (
        <div style={{ marginTop: 8 }}>
          <Row title="Where your data lives" desc={info?.dataDir || 'Loading…'}>
            <div className="rowflex">
              <button className="btn sm" onClick={() => api().data.revealFolder()}>
                <Icon name="folder" size={13} /> Open folder
              </button>
              <button
                className="btn sm"
                onClick={async () => {
                  const p = await api().data.chooseFolder();
                  if (p) {
                    const fresh = await api().data.read();
                    store.replaceDatabase(fresh, 'Move data');
                    setInfo(await api().app.info());
                    store.toast({ message: 'Data folder moved.', tone: 'success' });
                  }
                }}
              >
                Change…
              </button>
            </div>
          </Row>
          <Row title="Export a backup" desc="A single portable JSON file containing everything.">
            <button
              className="btn sm"
              onClick={async () => {
                try {
                  const p = await api().data.export();
                  if (p) store.toast({ message: 'Backup exported.', tone: 'success' });
                } catch (e: any) {
                  store.toast({ message: 'Export failed. Your data is unchanged.', tone: 'error' });
                }
              }}
            >
              <Icon name="download" size={13} /> Export
            </button>
          </Row>
          <Row title="Import a backup" desc="Replaces what is currently in Wulf. A safety copy is made first.">
            <button
              className="btn sm"
              onClick={async () => {
                try {
                  const data = await api().data.import();
                  if (data) {
                    store.replaceDatabase(data, 'Import');
                    store.toast({ message: 'Backup imported.', tone: 'success', actionLabel: 'Undo', action: () => store.undo() });
                  }
                } catch (e: any) {
                  store.toast({ message: e.message || 'That file could not be imported.', tone: 'error', duration: 7000 });
                }
              }}
            >
              <Icon name="upload" size={13} /> Import
            </button>
          </Row>
          <Row title="Automatic daily backup" desc={`Keeps the last ${settings.autoBackupKeep} copies inside your data folder.`}>
            <Switch on={settings.autoBackup} onChange={(v) => set({ autoBackup: v })} label="Automatic backup" />
          </Row>
          <Row title="Back up now" desc="Write an extra snapshot immediately.">
            <button
              className="btn sm"
              onClick={async () => {
                await api().data.backupNow();
                setBackups(await api().data.listBackups());
                store.toast({ message: 'Snapshot saved.', tone: 'success' });
              }}
            >
              <Icon name="archive" size={13} /> Snapshot
            </button>
          </Row>

          <div className="section-head">
            <span>Snapshots</span>
            <span className="line" />
          </div>
          {backups.length === 0 ? (
            <div className="dim" style={{ fontSize: 13, padding: '10px 0' }}>No snapshots yet.</div>
          ) : (
            backups.slice(0, 12).map((b) => (
              <div className="settings-row" key={b.path}>
                <div className="sr-main">
                  <div className="sr-title" style={{ fontWeight: 500 }}>{b.name}</div>
                  <div className="sr-desc">
                    {relativeTime(new Date(b.mtime).toISOString())} · {formatBytes(b.size)}
                  </div>
                </div>
                <button
                  className="btn sm"
                  onClick={async () => {
                    const ok = await api().dialog.confirm({
                      title: 'Restore snapshot',
                      message: `Restore ${b.name}?`,
                      detail: 'Your current data will be replaced. You can undo this immediately afterwards.',
                      confirmLabel: 'Restore'
                    });
                    if (!ok) return;
                    const data = await api().data.restoreBackup(b.path);
                    store.replaceDatabase(data, 'Restore snapshot');
                    store.toast({ message: 'Snapshot restored.', tone: 'success', actionLabel: 'Undo', action: () => store.undo() });
                  }}
                >
                  Restore
                </button>
              </div>
            ))
          )}

          <div className="section-head">
            <span>What is in Wulf</span>
            <span className="line" />
          </div>
          <div className="dim" style={{ fontSize: 13, lineHeight: 1.9 }}>
            {db.items.length} items · {db.items.filter((i: any) => i.completedAt).length} completed ·{' '}
            {db.projects.length} projects · {db.tags.length} tags
          </div>
        </div>
      )}

      {tab === 'shortcuts' && (
        <div style={{ marginTop: 14 }} className="kbd-table">
          {SHORTCUTS.map((s) => (
            <React.Fragment key={s.keys}>
              <div>{s.label}</div>
              <div>
                {s.keys.split('+').map((k, i) => (
                  <React.Fragment key={k + i}>
                    {i > 0 && <span className="dim" style={{ margin: '0 3px' }}>+</span>}
                    <kbd>{k}</kbd>
                  </React.Fragment>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {tab === 'tags' && (
        <div style={{ marginTop: 14 }}>
          {db.tags.length === 0 ? (
            <div className="dim" style={{ fontSize: 13 }}>
              No tags yet. Type <code style={{ color: 'var(--primary)' }}>#electronics</code> while capturing to make one.
            </div>
          ) : (
            db.tags.map((t: string) => {
              const count = db.items.filter((i: any) => i.tags.includes(t)).length;
              return (
                <div className="settings-row" key={t}>
                  <div className="sr-main rowflex" style={{ gap: 10 }}>
                    <Icon name="hash" size={13} className="dim" />
                    <input
                      className="input"
                      style={{ maxWidth: 240 }}
                      defaultValue={t}
                      onBlur={(e) => {
                        const v = e.target.value.trim().toLowerCase();
                        if (v && v !== t) renameTag(t, v);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                      aria-label={`Rename tag ${t}`}
                    />
                    <span className="dim" style={{ fontSize: 12 }}>
                      {count} item{count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <button className="btn sm danger" onClick={() => deleteTag(t)}>
                    Remove
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'about' && (
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
          <img src={logoFull} alt="Wulf" style={{ width: 170 }} />
          <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 380, lineHeight: 1.6 }}>
            Dump your brain onto a table. Wulf keeps it all in one place and stays out of your way while you work through it.
          </div>
          <div className="dim" style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.9 }}>
            Version {info?.version ?? '—'}
            <br />
            Electron {info?.electron ?? '—'} · Chromium {info?.chrome ?? '—'} · Node {info?.node ?? '—'}
            <br />
            {info?.platform} {info?.arch}
          </div>
          <div className="mono" style={{ marginTop: 10, maxWidth: 420 }}>{info?.dataFile}</div>
          <div className="dim" style={{ fontSize: 12, marginTop: 16, maxWidth: 400, lineHeight: 1.7 }}>
            Wulf runs entirely on your machine. No account, no cloud, no telemetry, nothing sent anywhere. Your data is a
            plain JSON file you can copy, back up, or read yourself.
          </div>
        </div>
      )}
    </div>
  );
}
