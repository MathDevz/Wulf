<div align="center">

<img src="docs/img/hero.png" alt="Wulf — Dump your brain onto a table." width="100%">

<br>

<a href="https://github.com/MathDevz/Wulf/releases/latest/download/Wulf-Setup-1.0.0.exe">
<img src="https://img.shields.io/badge/⬇%20Download%20for%20Windows-Wulf%20Setup%201.0.0-DA7B1F?style=for-the-badge&labelColor=020202&color=DA7B1F" alt="Download for Windows" height="42">
</a>
&nbsp;
<a href="https://github.com/MathDevz/Wulf/releases/latest">
<img src="https://img.shields.io/badge/All%20releases-453A29?style=for-the-badge&labelColor=020202&color=453A29" alt="All releases" height="42">
</a>

<br><br>

![Platform](https://img.shields.io/badge/Windows%2010%20%2F%2011-64--bit-F4DEBC?style=flat-square&labelColor=020202)
![Version](https://img.shields.io/badge/version-1.0.0-DA7B1F?style=flat-square&labelColor=020202)
![Size](https://img.shields.io/badge/download-77%20MB-453A29?style=flat-square&labelColor=020202)
![Offline](https://img.shields.io/badge/100%25%20offline-no%20account-DA7B1F?style=flat-square&labelColor=020202)
![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-453A29?style=flat-square&labelColor=020202)

<br>

**A local-first personal backlog for Windows.**
Capture first, organize second, act third — and nothing moves unless you move it.

</div>

---

<div align="center">

<img src="docs/img/queue.png" alt="The Queue — everything you have dumped, in the order you decided" width="92%">

<sub><i>The Queue. One field, one keypress, no forms.</i></sub>

</div>

<br>

## Why Wulf exists

Most task apps want you to file things properly the moment you think of them: pick a project, set a priority, choose a date. So you don't write it down at all, and you lose it.

Wulf inverts that. There is one field at the top of the Queue. You type the thing and press Enter, and it's captured — no project, no date, no category required. Sorting it out is a **separate job you do later, if you feel like it**.

**Wulf never decides anything for you.** Nothing is auto-scheduled, auto-prioritized, or auto-sorted. Today only ever contains what you personally dragged there. There is no AI, no assistant, no suggestions, and no telemetry.

---

## Install

> ### [⬇ Download Wulf-Setup-1.0.0.exe](https://github.com/MathDevz/Wulf/releases/latest/download/Wulf-Setup-1.0.0.exe)
>
> Windows 10 or 11, 64-bit · 77 MB · no terminal, no dependencies, no account

1. **Download** the installer with the button above.
2. **Double-click** it.
3. Windows will say *"Windows protected your PC"* — click **More info** → **Run anyway**.
   <sub>This appears because the installer isn't code-signed; certificates cost a few hundred dollars a year. The full source is in this repository if you'd rather build it yourself.</sub>
4. Pick a folder, tick the desktop shortcut if you want one, done. Wulf opens itself.

Installs per-user, so there's no admin prompt. Adds a Start Menu entry and a normal listing in **Settings → Apps**.

<details>
<summary><b>Uninstalling — it asks before touching your data</b></summary>

<br>

The uninstaller opens on a choice rather than a progress bar:

- **Uninstall Wulf, keep my data** *(default)* — removes the program only. Every task, project, note, attachment and snapshot stays put, so reinstalling later picks up exactly where you left off.
- **Uninstall Wulf and permanently delete all of my data** — erases everything. Requires a second confirmation, defaulting to *No*, because it can't be undone.

The page shows the real path and size of your data folder, and follows it even if you moved it in Settings. Either way, the Windows startup entry is cleaned up.

</details>

---

## The five places things live

<table>
<tr>
<td width="50%" valign="top">

### Queue
The pile. Everything lands here first, in the order you decided. It never rearranges itself.

</td>
<td width="50%" valign="top">

### Today
Only what you deliberately dragged in. Nothing ever arrives on its own.

</td>
</tr>
<tr>
<td valign="top">

### Projects
Bigger things — tasks, subtasks, notes, files, links, deadlines, progress and a full history.

</td>
<td valign="top">

### Later
Kept, but out of your face. Not deleted, not nagging you.

</td>
</tr>
<tr>
<td colspan="2" valign="top">

### Completed
Everything you've finished, fully searchable, restorable with one click.

</td>
</tr>
</table>

<div align="center">
<img src="docs/img/today.png" alt="Today — what you decided to work on" width="92%">
<br><sub><i>Today. It stays empty until you put something in it.</i></sub>
</div>

---

## Capture syntax

Type naturally and press Enter. **Every token is optional** — plain text is a perfectly good task.

```
buy solder #electronics
finish the OLED driver !1 @tomorrow
design the enclosure ~3h #cad
read the LoRa datasheet @later
```

| Token | Does |
|:--|:--|
| `#tag` | Adds a tag |
| `!1` `!2` `!3` | High / medium / low priority |
| `~30m` `~2h` | Time estimate |
| `@today` `@later` | Drops it straight into that section |
| `@tomorrow` `@weekend` | Sets a deadline |

---

## Projects that actually track themselves

<div align="center">
<img src="docs/img/project.png" alt="A project with tasks, subtasks, progress and deadlines" width="92%">
</div>

<br>

Progress is a simple count of what's done — **2 of 6 complete** — not a guess, a velocity score, or a burndown chart. Subtasks roll up into their parent task, tasks roll up into the project, and the bar in the sidebar reflects it live.

Each project holds its own notes, files, links, tags, deadline and a complete activity log of what changed and when.

---

## Find anything instantly

<div align="center">
<img src="docs/img/palette.png" alt="Command palette searching across everything" width="92%">
</div>

<br>

`Ctrl+K` searches **everything at once** — tasks, projects, notes, tags, links, and completed history — and doubles as a command palette. Results are ranked and keyboard-navigable, so you never touch the mouse.

---

## Every detail, only when you want it

<div align="center">
<img src="docs/img/detail.png" alt="The detail panel for a single task" width="92%">
</div>

<br>

Nothing above is mandatory. A task can stay four words forever. But when something grows, the panel is there: where it lives, deadline, reminder, priority, estimate, subtasks, notes, tags, links and attachments.

---

## Keyboard and mouse, both first-class

<table>
<tr><td width="34%"><code>N</code></td><td>Jump to capture</td></tr>
<tr><td><code>Ctrl</code> + <code>K</code></td><td>Search &amp; command palette</td></tr>
<tr><td><code>Ctrl</code> + <code>1…5</code></td><td>Switch section</td></tr>
<tr><td><code>↑</code> <code>↓</code></td><td>Move through the list</td></tr>
<tr><td><code>Space</code></td><td>Complete / reopen</td></tr>
<tr><td><code>Enter</code></td><td>Open details</td></tr>
<tr><td><code>F2</code></td><td>Rename inline</td></tr>
<tr><td><code>T</code> / <code>Q</code> / <code>L</code></td><td>Send to Today / Queue / Later</td></tr>
<tr><td><code>Ctrl</code> + <code>Z</code></td><td>Undo — including deletes</td></tr>
<tr><td><code>Del</code></td><td>Delete</td></tr>
</table>

**Drag and drop works everywhere.** Reorder within a list, drag between Queue / Today / Later, drop onto a project in the sidebar, drop files onto a task to attach them, drop files onto empty space to capture them as new tasks, drop a URL to attach a link.

Right-click anything for a context menu. Destructive actions raise a small undo toast rather than a modal asking if you're sure.

---

## Your data is yours

<div align="center">
<img src="docs/img/settings.png" alt="Settings — data, backups, export and import" width="92%">
</div>

<br>

- **100% offline.** No account, no cloud, no telemetry, no network calls of any kind.
- **Crash-safe writes.** Temp file → fsync → atomic rename, with a rolling `.bak`. Losing power mid-save can't corrupt the file.
- **Versioned schema** with forward migrations, and a pre-migration copy kept in case anything goes sideways.
- **Automatic daily snapshots** (last 10 kept), manual snapshots on demand, and plain JSON export/import.
- **Attachments** under 25 MB are copied into the vault; larger files are referenced in place so nothing is silently duplicated.
- **Move the whole vault** anywhere in Settings → Data, and Wulf follows it — including at uninstall time.

Everything lives in one readable file:

```
%APPDATA%\Wulf\data\wulf.json
```

---

## Three themes

| Midnight | Ember | Paper |
|:--|:--|:--|
| True black `#020202`. The default. | Warmer, slightly softer. | Lifted charcoal, easier at night. |

Chosen during onboarding, changeable any time in Settings.

---

## Building from source

```bash
npm install
npm run dist:win      # → release/Wulf-Setup-<version>.exe
```

Requires Node 20+. Other scripts: `npm run dev` (Vite renderer with HMR), `npm run start` (build and run Electron), `npm run dist:portable` (single portable `.exe`).

<details>
<summary><b>Architecture</b></summary>

<br>

```
electron/            main process
  main.ts            window, tray, IPC, reminders, backups, dialogs
  preload.ts         typed contextBridge API (no node in the renderer)
  store.ts           atomic JSON persistence + migrations
  settings.ts        settings schema and data-dir resolution

src/
  lib/               observable store with undo stack, actions, search,
                     capture parser, drag-and-drop, menus, utils
  components/        Icon set, ItemRow/ItemList, DetailPanel, Sidebar,
                     TitleBar, Palette, ContextMenu, Toasts, Splash,
                     Tutorial, Onboarding, ErrorBoundary
  views/             Queue/Today/Later, Projects, Project, Completed, Settings

installer/           NSIS script for the custom uninstaller page
resources/           icons, installer bitmaps, League Spartan
```

Built with Electron, React and TypeScript. Context isolation on, node integration off, CSP locked down, and external links forced out to the default browser.

</details>

---

## License

**Creative Commons Attribution-NonCommercial 4.0 International** — see [`LICENSE`](LICENSE).

Free to use, share and modify with credit. **Not for commercial use.**

<div align="center">
<br>
<sub>Copyright © 2026 <a href="https://github.com/MathDevz">MathDevz</a></sub>
<br><br>
<a href="https://github.com/MathDevz/Wulf/releases/latest/download/Wulf-Setup-1.0.0.exe">
<img src="https://img.shields.io/badge/⬇%20Download%20Wulf%20for%20Windows-DA7B1F?style=for-the-badge&labelColor=020202&color=DA7B1F" alt="Download Wulf" height="38">
</a>
</div>
