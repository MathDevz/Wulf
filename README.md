<div align="center">

<img src="https://github.com/MathDevz/Wulf/blob/main/resources/logo-full.png?raw=true" alt="Wulf" width="300">

**A local-first personal backlog for Windows.**<br>
Capture first, organize second, act third.

<a href="https://github.com/MathDevz/Wulf/releases/latest/download/Wulf-Setup-1.0.0.exe">
<img src="https://img.shields.io/badge/Download%20for%20Windows-77%20MB-DA7B1F?style=for-the-badge&labelColor=020202&logo=windows&logoColor=F4DEBC" alt="Download for Windows" height="40">
</a>

</div>

---

Most task apps make you file a thought properly before they'll accept it — pick a project, a priority, a date. So you don't write it down, and you lose it.

Wulf has one field. Type the thing, press Enter, it's captured. Sorting it out is a separate job you do later, if you feel like it.

Nothing is auto-scheduled, auto-prioritized or auto-sorted. Today only contains what you dragged there yourself. No AI, no account, no telemetry.

## The five sections

| Section | What it holds |
|:--|:--|
| **Queue** | The pile. Everything lands here, in the order you decided. |
| **Today** | Only what you deliberately dragged in. |
| **Projects** | Tasks, subtasks, notes, files, deadlines, progress, history. |
| **Later** | Kept, but out of the way. |
| **Completed** | Searchable, restorable. |

## Capture syntax

Type naturally. Every token is optional.

```
buy solder #electronics
finish the OLED driver !1 @tomorrow
design the enclosure ~3h
```

`#tag` · `!1 !2 !3` priority · `~30m ~2h` estimate · `@today @later @tomorrow @weekend`

Progress is a plain count of what's done — *2 of 6 complete*. Subtasks roll into tasks, tasks roll into the project.

## Keyboard

`N` capture · `Ctrl K` search everything · `Ctrl 1–5` sections · `Space` complete · `Enter` details · `F2` rename · `T` `Q` `L` move · `Ctrl Z` undo · `Del` delete

Drag and drop works everywhere — reorder, move between sections, drop onto a project, drop files to attach.

## Your data

Everything lives in one readable file at `%APPDATA%\Wulf\data\wulf.json`.

Fully offline. Atomic writes with a rolling backup, versioned schema with migrations, automatic daily snapshots, and JSON export/import. Move the vault anywhere in Settings and Wulf follows it.

## Install

Download, double-click, done. Windows will warn that the publisher is unknown because the installer isn't code-signed — click **More info → Run anyway**.

Uninstalling asks whether to keep or delete your data, and defaults to keeping it.

## Build from source

```bash
npm install
npm run dist:win
```

## License

[CC BY-NC 4.0](LICENSE) — free to use, share and modify with credit, not for commercial use.

<div align="center">
<img src="https://github.com/MathDevz/Wulf/blob/main/resources/tray.png?raw=true" alt="" width="28"><br>
<sub>© 2026 <a href="https://github.com/MathDevz">MathDevz</a></sub>
</div>
