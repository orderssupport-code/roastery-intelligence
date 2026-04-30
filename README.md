# Roastery Intelligence — Deployment Guide

A free, fast deployment of your B2B sales dashboard using **GitHub Pages**. Globally cached on a CDN, automatically gzipped, no credit card required.

---

## What you get

- ⚡ **Fast**: Hosted on GitHub's global CDN. The 1.1 MB `data.json` is auto-gzipped to ~130 KB on transfer. After first load, browsers cache it.
- 💸 **Free forever**: GitHub Pages has no bandwidth charges for public repos.
- 🔒 **HTTPS by default**: Automatic certificate.
- 🌍 **Custom domain optional**: Point your own domain at it later if you want.

---

## Prerequisites (one-time)

Install on your computer if you don't already have them:

1. **Node.js 18+** — https://nodejs.org (LTS version)
2. **Git** — https://git-scm.com
3. **A GitHub account** — https://github.com (free)

Verify with:
```bash
node --version   # should print v18 or higher
git --version
```

---

## Step 1 — Get the code on your machine

Unzip this folder anywhere on your computer (e.g. `~/Documents/roastery-dashboard`).

Open a terminal in that folder. On macOS/Linux: right-click → "Open in Terminal". On Windows: Shift+right-click → "Open PowerShell here".

```bash
cd path/to/roastery-dashboard
npm install
```

This downloads React, Tailwind, Recharts, etc. (takes 1–2 minutes).

---

## Step 2 — Test it locally

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`). You should see the dashboard with all your data. **Confirm everything works before deploying.**

When you're done testing, press `Ctrl+C` in the terminal to stop the dev server.

---

## Step 3 — Create the GitHub repository

1. Go to https://github.com/new
2. **Repository name**: `roastery-intelligence` (must match exactly, or change `base` in `vite.config.js` to match your chosen name)
3. Make it **Public** (required for free GitHub Pages)
4. **Don't** check "Add a README" — we already have files
5. Click **Create repository**

GitHub will show you a page with commands. Use **these** instead, run from inside your project folder:

```bash
git init
git add .
git commit -m "Initial dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/roastery-intelligence.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

> First time using Git? When pushing, GitHub will ask you to authenticate. The easiest way is to install [GitHub CLI](https://cli.github.com) and run `gh auth login`, or use a [Personal Access Token](https://github.com/settings/tokens) as your password.

---

## Step 4 — Deploy

```bash
npm run deploy
```

This command:
1. Runs `vite build` → produces an optimized `dist/` folder
2. Pushes `dist/` to a special `gh-pages` branch on your repo

Wait ~30 seconds, then go to:

```
https://github.com/YOUR_USERNAME/roastery-intelligence/settings/pages
```

Under **Build and deployment**:
- **Source**: Deploy from a branch
- **Branch**: `gh-pages` / `(root)`
- Click **Save**

Wait another 1–2 minutes. Your dashboard is now live at:

```
https://YOUR_USERNAME.github.io/roastery-intelligence/
```

🎉 Done.

---

## Updating the dashboard later

Made changes? Just run:

```bash
git add .
git commit -m "Updated something"
git push
npm run deploy
```

Changes appear on the live site within a minute.

### Updating the data only

If you have new sales data, replace `public/data.json` with your new file (same shape) and run `npm run deploy`. No code changes needed.

---

## ⚠️ Important: project name must match

The `base` setting in `vite.config.js` is `/roastery-intelligence/`. If you named your GitHub repo something different (say `coffee-dashboard`), edit `vite.config.js`:

```js
base: "/coffee-dashboard/",
```

Then redeploy. Without this, CSS and JS files will 404.

---

## Other free hosting options

If GitHub Pages isn't your style, this same project works on:

| Host | How |
|---|---|
| **Vercel** | Connect repo at vercel.com → auto-deploys. Set `base: "/"` in `vite.config.js` |
| **Netlify** | Drag-and-drop the `dist/` folder at netlify.com/drop. Set `base: "/"` first |
| **Cloudflare Pages** | Connect repo at pages.cloudflare.com. Set `base: "/"` |

All three are free for personal/small projects, support custom domains, and have global CDNs.

---

## Project structure

```
roastery-dashboard/
├── public/
│   └── data.json          ← Your aggregated sales data (1.1 MB → ~130 KB gzipped)
├── src/
│   ├── Dashboard.jsx      ← The React component
│   ├── main.jsx           ← Entry point
│   └── index.css          ← Tailwind base
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Performance notes

- **First load**: ~250 KB JS bundle + ~130 KB data (gzipped) = ~380 KB total
- **Subsequent loads**: ~0 KB (everything cached by the browser)
- **Time to interactive**: under 1 second on broadband
- **Cost**: $0 forever
