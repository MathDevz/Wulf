# Wulf

**Dump your brain onto a table.**

A local-first personal backlog app for Windows. Capture first, organize second, act third.

---

## Install (no terminal, no dev tools)

1. Download **`release/Wulf-Setup-1.0.0.exe`**
2. Double-click it.
3. Windows SmartScreen will warn that the publisher is unknown — the installer is unsigned (code-signing requires a paid certificate). Click **More info → Run anyway**.
4. Choose an install folder, tick the Desktop shortcut if you want one, and finish. Wulf launches automatically.

It installs per-user (no admin prompt), adds a Start Menu entry and an optional Desktop shortcut, and registers a normal entry in **Settings → Apps**.

### Uninstalling

The uninstaller asks what should happen to your data instead of guessing:

- **Uninstall Wulf, keep my data** *(default)* — removes the program only. Every task, project, note, attachment and snapshot stays on disk, so reinstalling later picks up exactly where you left off.
- **Uninstall Wulf and permanently delete all of my data** — erases everything, including settings and backups. Requires a second confirmation (defaulting to *No*) because it cannot be undone.

The page shows the real path and size of your data folder, and follows it even if you moved it via Settings → Data. Either way the Windows startup entry is always cleaned up.

**Your data lives at** `%APPDATA%\Wulf\data\wulf.json` (movable in Settings → Data).

---

## First launch

A short launch animation, then five quick screens: welcome → pick a theme → a four-part animated tour of how Wulf works → choose whether Wulf starts with Windows (on by default, one click to turn off) → dump your first few things. Skippable at any point, no account, no configuration.

## How it works

| Section | What it is |
|---|---|
| **Queue** | The pile. Everything lands here. |
| **Today** | Only what you deliberately dragged in. Nothing arrives on its own. |
| **Projects** | Bigger things, with tasks, notes, files, deadlines, progress and history. |
| **Later** | Kept but out of the way. |
| **Completed** | Full searchable history; restore anything. |

### Capture syntax
Type and press Enter. Everything is optional.

```
buy solder #electronics
finish school project !1 @tomorrow
print enclosure ~45m
play Crimson Desert @later
```

- `#tag` — tag · `!1 !2 !3` — high/medium/low priority
- `~30m` `~2h` — estimate · `@today` `@later` `@tomorrow` `@weekend`

### Keyboard
`N` capture · `Ctrl+K` command palette & search · `Ctrl+1…5` sections · `↑↓` navigate · `Space` complete · `Enter` details · `F2` rename · `T`/`Q`/`L` move to Today/Queue/Later · `Ctrl+D` duplicate · `Del` delete · `Ctrl+Z` undo · `Ctrl+Shift+N` new project · `Ctrl+B` collapse sidebar · `Ctrl+,` settings

### Drag and drop
Reorder anything, drag items into Today / Later / Queue / any project (sidebar or cards), drop files onto an item to attach them, drop files onto empty space to capture them as new items, drop URLs to attach links.

---

## Data, privacy, safety

- 100% local. No account, no cloud, no telemetry, no network calls of any kind.
- Atomic writes (temp file + fsync + rename) with a rolling `.bak`, so a crash mid-save cannot corrupt the database.
- Versioned schema with forward migrations; a pre-migration copy is kept if anything goes wrong.
- Automatic daily snapshots (last 10 kept), manual snapshots, and JSON export/import — all in Settings → Data.
- Attachments under 25 MB are copied into the vault; larger files are referenced in place so nothing is duplicated.

---

## Building from source

```bash
npm install
npm run dist:win      # → release/Wulf-Setup-<version>.exe
```

Other scripts: `npm run dev` (Vite renderer), `npm run start` (build + run Electron), `npm run dist:portable` (single portable .exe).

### Architecture

```
electron/          main process
  main.ts          window, tray, IPC, reminders, backups, dialogs
  preload.ts       typed contextBridge API (no node in the renderer)
  store.ts         atomic JSON persistence + migrations
  settings.ts      settings schema and data-dir resolution
src/
  lib/             store (observable + undo stack), actions, search,
                   capture parser, dnd, menus, utils
  components/      Icon set, ItemRow/ItemList, DetailPanel, Sidebar,
                   TitleBar, Palette, ContextMenu, Toasts, Onboarding,
                   ErrorBoundary
  views/           Queue/Today/Later, Projects, Project, Completed, Settings
resources/         logo assets, icon.ico, installer bitmaps, League Spartan
```

Context isolation on, node integration off, CSP locked down, external links forced through the default browser.

## License

**Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** — see [`LICENSE`](LICENSE).

You are free to use, share and modify Wulf, provided you give appropriate credit and do not use it for commercial purposes.

Copyright © 2026 MathDevz.
