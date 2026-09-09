<div align="center">

<img src="https://github.com/MathDevz/Wulf/blob/main/resources/logo-full.png?raw=true" alt="Wulf" width="290">

### Dump your brain onto a table.

A local-first personal backlog for Windows.<br>
Capture first, organize second, act third.

<br>

<a href="https://github.com/MathDevz/Wulf/releases/latest/download/Wulf-Setup-1.0.0.exe">
<img src="https://img.shields.io/badge/⬇%20%20Download%20for%20Windows-DA7B1F?style=for-the-badge&labelColor=DA7B1F" alt="Download for Windows" height="44">
</a>

<br><br>

![Windows](https://img.shields.io/badge/Windows%2010%20%2F%2011-453A29?style=flat-square&labelColor=020202&logo=windows&logoColor=F4DEBC)
![Version](https://img.shields.io/badge/version-1.0.0-DA7B1F?style=flat-square&labelColor=020202)
![Size](https://img.shields.io/badge/installer-77%20MB-453A29?style=flat-square&labelColor=020202)
![Offline](https://img.shields.io/badge/100%25-offline-DA7B1F?style=flat-square&labelColor=020202)
![License](https://img.shields.io/badge/license-CC%20BY--NC%204.0-453A29?style=flat-square&labelColor=020202)

</div>

---

Most task apps make you file a thought properly before they'll accept it — pick a project, a priority, a date. So you don't write it down, and you lose it.

Wulf has one field. Type the thing, press Enter, it's captured. Sorting it out is a separate job you do later, if you feel like it.

Nothing is auto-scheduled, auto-prioritized or auto-sorted. Today only contains what you dragged there yourself. No AI, no account, no telemetry.

---

## &nbsp;Where things live

|  |  |
|:--|:--|
| ![Queue](https://img.shields.io/badge/Queue-DA7B1F?style=flat-square&labelColor=020202) | The pile. Everything lands here, in the order you decided. |
| ![Today](https://img.shields.io/badge/Today-DA7B1F?style=flat-square&labelColor=020202) | Only what you deliberately dragged in. |
| ![Projects](https://img.shields.io/badge/Projects-DA7B1F?style=flat-square&labelColor=020202) | Tasks, subtasks, notes, files, deadlines, progress, history. |
| ![Later](https://img.shields.io/badge/Later-453A29?style=flat-square&labelColor=020202) | Kept, but out of the way. |
| ![Completed](https://img.shields.io/badge/Completed-453A29?style=flat-square&labelColor=020202) | Searchable, restorable. |

Progress is a plain count of what's done — *2 of 6 complete*. Subtasks roll into tasks, tasks roll into the project.

## &nbsp;Capture syntax

Type naturally and press Enter. Every token is optional.

```
buy solder #electronics
finish the OLED driver !1 @tomorrow
design the enclosure ~3h
```

![tag](https://img.shields.io/badge/%23tag-DA7B1F?style=flat-square&labelColor=020202)
![priority](https://img.shields.io/badge/!1%20!2%20!3-priority-453A29?style=flat-square&labelColor=020202)
![estimate](https://img.shields.io/badge/~30m%20~2h-estimate-453A29?style=flat-square&labelColor=020202)
![when](https://img.shields.io/badge/@today%20@later%20@tomorrow%20@weekend-when-453A29?style=flat-square&labelColor=020202)

## &nbsp;Keyboard

![N](https://img.shields.io/badge/N-capture-DA7B1F?style=flat-square&labelColor=020202)
![Ctrl K](https://img.shields.io/badge/Ctrl%20K-search%20everything-DA7B1F?style=flat-square&labelColor=020202)
![Ctrl 1-5](https://img.shields.io/badge/Ctrl%201–5-sections-453A29?style=flat-square&labelColor=020202)
![Space](https://img.shields.io/badge/Space-complete-453A29?style=flat-square&labelColor=020202)
![Enter](https://img.shields.io/badge/Enter-details-453A29?style=flat-square&labelColor=020202)
![F2](https://img.shields.io/badge/F2-rename-453A29?style=flat-square&labelColor=020202)
![TQL](https://img.shields.io/badge/T%20Q%20L-move-453A29?style=flat-square&labelColor=020202)
![Ctrl Z](https://img.shields.io/badge/Ctrl%20Z-undo-453A29?style=flat-square&labelColor=020202)

Drag and drop works everywhere — reorder, move between sections, drop onto a project, drop files to attach.

## &nbsp;Your data

Everything lives in one readable file:

```
%APPDATA%\Wulf\data\wulf.json
```

Fully offline. Atomic writes with a rolling backup, versioned schema with migrations, automatic daily snapshots, and JSON export/import. Move the vault anywhere in Settings and Wulf follows it.

## &nbsp;Install

Download, double-click, done. Windows will warn that the publisher is unknown because the installer isn't code-signed — click **More info → Run anyway**.

Uninstalling asks whether to keep or delete your data, and defaults to keeping it.

## &nbsp;Build from source

```bash
npm install
npm run dist:win
```

---

<div align="center">

<img src="https://github.com/MathDevz/Wulf/blob/main/resources/tray.png?raw=true" alt="" width="26">

[![License](https://img.shields.io/badge/CC%20BY--NC%204.0-453A29?style=flat-square&labelColor=020202)](LICENSE)

<sub>Free to use, share and modify with credit. Not for commercial use.</sub><br>
<sub>© 2026 <a href="https://github.com/MathDevz">MathDevz</a></sub>

</div>
