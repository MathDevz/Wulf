# Putting Wulf on GitHub — every click

Written for **github.com/MathDevz**. Your repo will end up at:

**https://github.com/MathDevz/Wulf**

There are two routes. Pick one:

- **Route A — website only, no terminal.** Slower to repeat, but zero setup.
- **Route B — Git (recommended).** Ten minutes of setup once, then publishing a new version is three commands forever after.

Both end with the same result: source on GitHub, installer downloadable from a Releases page.

---

# Before you start: what to upload

You upload the **source**, not the build output. The 80 MB installer is *not* committed to the repo — it gets attached to a Release, which is GitHub's file hosting built exactly for this.

Inside your `Wulf` folder:

| Item | Upload? |
|---|---|
| `src/` | ✅ yes |
| `electron/` | ✅ yes |
| `resources/` | ✅ yes |
| `installer/` | ✅ **yes — build fails without it** |
| `.github/` | ✅ **yes — this is the auto-build robot** |
| `index.html` | ✅ yes |
| `package.json` | ✅ yes |
| `package-lock.json` | ✅ yes |
| `tsconfig.json` | ✅ yes |
| `tsconfig.electron.json` | ✅ yes |
| `vite.config.ts` | ✅ yes |
| `README.md` | ✅ yes |
| `PUBLISHING.md` | ✅ yes (this file) |
| `LICENSE` | ✅ yes — CC BY-NC 4.0 |
| `.gitignore` | ✅ yes |
| `node_modules/` | ❌ **no** — ~500 MB, rebuilt automatically |
| `dist/` | ❌ no — build output |
| `dist-electron/` | ❌ no — build output |
| `release/` | ❌ no — contains the installer, uploaded separately |

That's **62 files, about 8 MB**.

> **Already done for you:** your username, repo URL and author name are already filled into `package.json`. You do not need to edit anything before uploading.

---

# License — already set up

Wulf is released under **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

This is already done — the full official license text is in the `LICENSE` file, and `package.json` says `"license": "CC-BY-NC-4.0"`. Nothing to edit.

What it means in practice:

- ✅ People may **use, copy, modify and share** Wulf freely
- ✅ They must **credit you** (MathDevz) and link the license
- ❌ They may **not use it commercially** — no selling it, no bundling it into a paid product, no running it as a paid service

> **Worth knowing:** CC licenses were designed for creative works — writing, art, music — rather than code, and Creative Commons themselves [recommend against using them for software](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software), because they don't address things like source-vs-binary distribution or patent rights. It is still perfectly valid and enforceable, and plenty of projects use it. But if your actual goal is *"free for people, not for companies"*, the more common software equivalents are the [PolyForm Noncommercial License](https://polyformproject.org/licenses/noncommercial/1.0.0/) or the [Business Source License](https://mariadb.com/bsl11/). Your call — say the word and I'll swap it.
>
> Also note GitHub won't show a tidy license badge for CC BY-NC, since its detector focuses on standard open-source licenses. Harmless.

Also decide **Public vs Private** for the repo itself (asked in Step 2):
- **Public** — anyone can see the code and download releases. Needed if you want strangers to install Wulf.
- **Private** — only you. You can still build installers, but nobody else can reach the download page.

You can flip this later in Settings.

---

# ROUTE A — Website only (no terminal)

## Step A1 — Create the repository

1. Go to **https://github.com/new**
2. **Repository name:** type `Wulf`
3. **Description** (optional): `Dump your brain onto a table.`
4. Choose **Public** or **Private**
5. **Leave every checkbox OFF** — do *not* add a README, .gitignore or license. You already have them, and ticking these will cause a conflict.
6. Click the green **Create repository**

You now see an empty repo page with setup instructions. Ignore them.

## Step A2 — Upload the main files

1. On that page click the link **uploading an existing file**
   (or go to `https://github.com/MathDevz/Wulf/upload/main`)
2. Open your `Wulf` folder on your PC in File Explorer
3. Select these and drag them into the browser box:
   - the folders `src`, `electron`, `resources`, `installer`
   - the files `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.electron.json`, `vite.config.ts`, `README.md`, `PUBLISHING.md`, `LICENSE`
4. **Do not drag** `node_modules`, `dist`, `dist-electron`, or `release`
5. Wait for every file to finish uploading (you'll see a list appear)
6. In the **Commit changes** box at the bottom, type: `Wulf 1.0.0`
7. Click **Commit changes**

## Step A3 — Add the two hidden files

Windows and the GitHub uploader both hide files starting with a dot, so `.gitignore` and `.github/` were skipped. Add them by hand.

**The .gitignore:**

1. Go to `https://github.com/MathDevz/Wulf`
2. Click **Add file → Create new file**
3. In the filename box type exactly: `.gitignore`
4. Paste this in the big editor:

```
# dependencies
node_modules/

# build output
dist/
dist-electron/
release/

# editor / os
.vscode/
.idea/
.DS_Store
Thumbs.db
*.log
```

5. Scroll down, click **Commit changes** → **Commit changes**

**The auto-build robot:**

1. Click **Add file → Create new file** again
2. In the filename box type exactly:
   `.github/workflows/release.yml`
   *(as you type each `/` GitHub turns it into a folder — that's correct)*
3. Open `.github/workflows/release.yml` from your `Wulf` folder in Notepad, copy everything, paste it into the editor
4. Click **Commit changes** → **Commit changes**

> If you can't see `.github` in File Explorer: click the **View** tab → tick **Hidden items**.

## Step A4 — Publish the installer

1. Go to `https://github.com/MathDevz/Wulf`
2. On the right-hand side click **Releases** → **Create a new release**
   (or go to `https://github.com/MathDevz/Wulf/releases/new`)
3. Click **Choose a tag**, type `v1.0.0`, then click **+ Create new tag: v1.0.0 on publish**
4. **Release title:** `Wulf 1.0.0`
5. In the description box paste:

```
The first release of Wulf.

**Install:** download `Wulf-Setup-1.0.0.exe` below and double-click it. No terminal, no dependencies.

Windows will warn that the publisher is unknown, because the installer is not
code-signed (certificates cost a few hundred dollars a year). Click
**More info → Run anyway**. The full source is in this repository if you would
like to check it or build it yourself.
```

6. Drag **`Wulf-Setup-1.0.0.exe`** from your `Wulf\release\` folder into the box marked *Attach binaries by dropping them here*
7. **Wait for the upload bar to reach 100%** — it's 80 MB, this takes a minute. The Publish button stays greyed out until it finishes.
8. Click **Publish release**

**Done.** Your download link to share with people:

```
https://github.com/MathDevz/Wulf/releases/latest
```

---

# ROUTE B — Git (recommended)

## Step B1 — Install Git

1. Go to **https://git-scm.com/download/win** — the download starts on its own
2. Run the installer. **Click Next on every screen**; the defaults are correct.
3. When it finishes, open your `Wulf` folder in File Explorer, right-click on empty space, and choose **Open Git Bash here**
   *(on Windows 11 you may need **Show more options** first)*

A black terminal window opens. Type the commands below into it.

## Step B2 — Tell Git who you are

Once per computer. Use the email attached to your GitHub account:

```bash
git config --global user.name "MathDevz"
git config --global user.email "your-github-email@example.com"
```

## Step B3 — Create the repository on GitHub

1. Go to **https://github.com/new**
2. **Repository name:** `Wulf`
3. Choose **Public** or **Private**
4. **Leave every checkbox OFF** — no README, no .gitignore, no license
5. Click **Create repository**
6. Leave this page open

## Step B4 — Push the code

Back in Git Bash, in your `Wulf` folder:

```bash
git init
git add .
git commit -m "Wulf 1.0.0"
git branch -M main
git remote add origin https://github.com/MathDevz/Wulf.git
git push -u origin main
```

A browser window will pop up asking you to sign in to GitHub — do that, and it'll remember you from then on.

`.gitignore` automatically keeps `node_modules`, `dist` and `release` out, so this only uploads ~8 MB.

Refresh your GitHub page. All your code is there.

## Step B5 — Let GitHub build the installer for you

This is the payoff. Push a version tag and GitHub rents a Windows machine, builds Wulf and publishes the installer automatically:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then:

1. Go to `https://github.com/MathDevz/Wulf/actions`
2. You'll see **Build and release Wulf** with a yellow dot — it's running
3. Wait about 5 minutes. Yellow dot → green tick.
4. Go to `https://github.com/MathDevz/Wulf/releases`

Your release is live with `Wulf-Setup-1.0.0.exe` attached — built by GitHub, not uploaded by you.

> If the robot goes red instead of green: click into it, open the failed step, and read the last few red lines. Nine times out of ten it's a missing file — check that `installer/installer.nsh` actually made it into the repo.

## Step B6 — Add the SmartScreen note

GitHub writes the release notes automatically, but you should explain the warning:

1. Go to `https://github.com/MathDevz/Wulf/releases`
2. Click the **pencil icon** on the release
3. Add at the top of the description:

```
**Install:** download `Wulf-Setup-1.0.0.exe` below and double-click it.

Windows will warn that the publisher is unknown, because the installer is not
code-signed. Click **More info → Run anyway**.
```

4. Click **Update release**

---

# Releasing version 1.0.1 later

**Route B (Git) — three commands:**

```bash
# after editing the version in package.json to 1.0.1
git add .
git commit -m "Wulf 1.0.1"
git push
git tag v1.0.1
git push origin v1.0.1
```

GitHub builds and publishes it. That's the whole process.

**Route A (website)** — repeat Step A2 to replace changed files, then Step A4 with tag `v1.0.1`.

The version number in the installer filename, the app's About page and the Windows *Apps* list all read from `package.json`, so bumping it there is enough.

---

# Troubleshooting

**"Repository not found" when pushing**
The repo doesn't exist yet or the name is misspelled. Names are case-sensitive: `Wulf`, not `wulf`. Check with `git remote -v`.

**"Updates were rejected"**
You ticked a checkbox in Step 3 and GitHub made a commit you don't have. Fix:
```bash
git pull --rebase origin main
git push -u origin main
```

**Push is uploading hundreds of megabytes**
`.gitignore` wasn't committed. Check with `git status` — if you see `node_modules` listed, run:
```bash
git rm -r --cached node_modules dist dist-electron release
git commit -m "Remove build output"
git push
```

**The Actions robot never runs**
Tags trigger it, not normal pushes. It only fires on tags starting with `v`. You can also trigger it by hand: **Actions → Build and release Wulf → Run workflow**.

**GitHub rejects the .exe as too large**
Release attachments allow up to 2 GB, so 80 MB is fine — but files inside the *repo* are capped at 100 MB. If you hit this, you accidentally committed the installer. It belongs in a Release only.

---

# Optional, later

- **Auto-updates** — `electron-updater` reads GitHub Releases directly, so users get new versions without revisiting the page. Your build already produces the `latest.yml` this needs.
- **winget** — submit a manifest to [microsoft/winget-pkgs](https://github.com/microsoft/winget-pkgs) so people can run `winget install Wulf`.
- **Code signing** — removes the SmartScreen warning entirely. [Certum](https://shop.certum.eu/) does open-source certificates around $70/year; commercial OV certificates run $200–400/year.
