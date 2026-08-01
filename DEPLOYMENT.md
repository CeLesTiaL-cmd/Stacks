# Deployment Guide

Deploy in this order — each step depends on the one before it.

1. MongoDB Atlas (database)
2. Firebase (authentication)
3. GitHub (host the code)
4. Render (backend API)
5. Vercel (frontend)
6. Wire the two together + go live

Total cost on the free tiers of all five: **$0**, until you outgrow them.

---

## Step 1 — MongoDB Atlas (database)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a new **Project** (e.g. "Stacks").
3. Click **Build a Database** → choose the **M0 Free** tier → pick any cloud region
   close to your users → **Create**.
4. **Database Access** (left sidebar) → **Add New Database User**. Create a username
   and password (autogenerate one and save it somewhere safe) with role
   "Read and write to any database".
5. **Network Access** (left sidebar) → **Add IP Address** → **Allow Access from
   Anywhere** (`0.0.0.0/0`). This is fine for now; you can tighten it later once you
   know your hosting provider's IP range.
6. Go back to **Database** → click **Connect** on your cluster → **Drivers** → copy
   the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Edit it: replace `<username>` and `<password>` with what you created in step 4, and
   add a database name before the `?`, e.g. `.../academic-repo?retryWrites=true...`.
   **Save this full string** — it's your `MONGODB_URI`.

---

## Step 2 — Firebase (authentication)

1. Go to https://console.firebase.google.com → **Add project** → name it "Stacks" (or
   anything) → you can skip Google Analytics → **Create project**.
2. In the left sidebar: **Build → Authentication** → **Get started**.
3. Under **Sign-in method**, enable:
   - **Email/Password**
   - **Google** (just toggle it on, pick a support email)
   - **GitHub** — this one needs two extra steps:
     a. Go to https://github.com/settings/developers → **New OAuth App**.
     b. Homepage URL: your future frontend URL (use `http://localhost:5173` for now,
        you'll add the real one after Step 5). Authorization callback URL: copy it
        from the Firebase GitHub sign-in popup (Firebase shows you the exact URL to
        paste here).
     c. Copy the generated **Client ID** and **Client Secret** back into Firebase's
        GitHub provider screen → **Save**.
4. **Get the frontend config**: ⚙️ **Project settings** (top left, next to "Project
   Overview") → scroll to **Your apps** → click the **</>** (Web) icon → register an
   app (nickname: "Stacks web") → copy the `firebaseConfig` object shown. These six
   values map directly to `frontend/.env`'s `VITE_FIREBASE_*` variables.
5. **Get the backend service account key**: ⚙️ **Project settings** → **Service
   accounts** tab → **Generate new private key** → a JSON file downloads. Open it —
   you need three fields from it for `backend/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (paste the whole thing in quotes, keep the
     `\n` characters exactly as they appear in the JSON file — don't convert them to
     real line breaks)

   **Keep this JSON file private — never commit it to GitHub.**

---

## Step 3 — Push the code to GitHub

```bash
cd academic-repo
git init
git add .
git commit -m "Initial commit — Stacks V1"
```
Create a new empty repository on https://github.com/new (don't initialize it with a
README), then:
```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

---

## Step 4 — Backend on Render

1. Go to https://render.com → sign up (you can sign in with GitHub) → **New** →
   **Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Under **Environment Variables**, add every key from `backend/.env.example`:
   `MONGODB_URI`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
   `FIREBASE_PRIVATE_KEY`, `MAX_FILE_SIZE_MB`, and `NODE_ENV=production`. Leave
   `CLIENT_ORIGIN` as `http://localhost:5173` for now — you'll update it in Step 6.
5. Click **Create Web Service**. Wait for the build/deploy log to finish.
6. Copy the live URL Render gives you, e.g. `https://stacks-api.onrender.com`.
7. Sanity check: open `https://stacks-api.onrender.com/api/health` in your browser —
   you should see `{"ok":true,"time":"..."}`.

> Free Render web services sleep after ~15 minutes of no traffic and take ~30–60
> seconds to wake back up on the next request. That's expected on the free tier —
> upgrade to a paid instance later to remove the sleep.

---

## Step 5 — Frontend on Vercel

1. Go to https://vercel.com → sign up with GitHub → **Add New** → **Project** →
   import the same repo.
2. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (should be auto-detected)
   - Build Command / Output Directory: leave the Vite defaults (`vite build` /
     `dist`)
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = the Render URL from Step 4 (e.g. `https://stacks-api.onrender.com`)
   - The 6 `VITE_FIREBASE_*` values from Step 2.4
4. Click **Deploy**. Copy the live URL Vercel gives you, e.g.
   `https://stacks.vercel.app`.

---

## Step 6 — Wire everything together

1. **Render** → your backend service → **Environment** → update `CLIENT_ORIGIN` to
   your real Vercel URL (e.g. `https://stacks.vercel.app`) → save (this redeploys
   automatically). This is what allows the frontend's API calls past CORS.
2. **Firebase Console** → **Authentication** → **Settings** → **Authorized domains**
   → **Add domain** → add your Vercel domain (and your custom domain later, if any).
3. **GitHub OAuth App** (from Step 2.3) → update the Homepage URL and Authorization
   callback URL to use your real Vercel domain instead of localhost.

---

## Step 7 — Go live and become admin

1. Visit your Vercel URL → **Join** → create an account (or sign in with Google/GitHub).
2. In MongoDB Atlas → **Browse Collections** → `academic-repo` database → `users`
   collection → find your user document → edit the `role` field from `"student"` to
   `"admin"` → save.
3. Refresh the site — you'll now see an **Admin** link in the navbar.
4. Try the full loop: upload something on `/upload` → approve it from `/admin` → it
   appears on `/discover` → star it, bookmark it, comment on it, download it.

---

## Custom domain (optional)

- **Vercel**: Project → **Settings** → **Domains** → add your domain, follow the DNS
  instructions it gives you (usually a CNAME).
- **Render**: Service → **Settings** → **Custom Domains** → same idea, if you want
  `api.yourdomain.com` instead of the `onrender.com` URL.
- Remember to update `CLIENT_ORIGIN` (Render), `VITE_API_URL` (Vercel), and Firebase's
  **Authorized domains** every time a public-facing URL changes.

---

## Safe upgrades — moving V1 → V2 → V3 without losing anything

Your **database** (MongoDB Atlas) and your **code** (GitHub → Render/Vercel) are two
separate systems. Deploying new code never deletes or touches existing data by
itself — it only runs the code you pushed. Data loss in practice almost always comes
from one of: no backup before a risky change, testing directly on the live site, or a
schema change that removes something old code still needs. Five habits remove all
four risks:

1. **Back up before every big change — non-negotiable on the free tier.**
   MongoDB Atlas's M0 free cluster has **no automatic backups**. Before adding a V2/V3
   feature, take a manual snapshot:
   - Easiest (no install): Atlas → **Browse Collections** → pick a collection → **⋯**
     → **Export Collection** → saves a JSON file to your computer. Do this for each
     collection (`users`, `contents`, `comments`, `stars`, `bookmarks`) before a big
     change.
   - Or, if you install MongoDB's command line tools:
     ```bash
     mongodump --uri="<your MONGODB_URI>" --out=backup-2026-06-28
     ```
     Keep that backup folder somewhere safe. To restore it later if anything ever
     goes wrong: `mongorestore --uri="<your MONGODB_URI>" backup-2026-06-28`

2. **Never edit code on the live site.** Always: change code on your own computer →
   run it locally and click through it → only then `git push`. Render and Vercel
   redeploy automatically from GitHub — you never touch the live server directly.

3. **One git branch per version in progress.**
   ```bash
   git checkout -b v2-features     # branch off from main
   # ...build V2 features here, commit as you go...
   git push -u origin v2-features
   ```
   `main` stays exactly what's live and stable. Render/Vercel only redeploy when
   `main` changes (check this in each platform's project settings — "Branch to
   deploy"), so you can work on `v2-features` for days without affecting the live
   site. When it's tested and ready: open a Pull Request on GitHub, merge it into
   `main`, and *that* push is what goes live.

4. **In the database, add — don't remove or rename.** This is the single biggest
   rule. Going from V1 to V2 (followers, collections, notifications) only means new
   collections and new optional fields on existing documents — completely safe,
   because old documents simply don't have that field yet until they're touched. The
   dangerous move is renaming or deleting a field that old code still reads, or
   changing a field's type (e.g. string → number) on documents that already exist.
   If you ever genuinely need to restructure existing data, write a small one-off
   script that reads documents, transforms them, and writes them back — test it
   against your local copy (or a backup restored into a throwaway test cluster)
   before ever running it against the real data.

5. **Test on your own machine first, every time.** Before pushing anything: run
   `npm run dev` in both `backend` and `frontend` locally (Step in this guide above),
   click through the feature you just built, and only push once it works locally.
   Optional next level: point your local `.env` at a **second, free Atlas cluster**
   used only for testing, so you're never experimenting against real user data at
   all.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Frontend shows network errors calling the API | `VITE_API_URL` is wrong, or `CLIENT_ORIGIN` on the backend doesn't match the frontend's real URL (CORS) |
| "Invalid or expired token" on every request | `FIREBASE_PRIVATE_KEY` on Render is malformed — re-copy it from the JSON file, keeping the `\n` sequences literal |
| Sign-in works but nothing after | Backend can't reach MongoDB — re-check the Atlas connection string, password, and that Network Access allows `0.0.0.0/0` |
| Uploaded files disappear after a while | Expected on Render's free tier — local disk is wiped on redeploy/restart. Move file storage to Cloudinary/S3/Firebase Storage (see `README.md` → Scaling notes) before relying on this for real users |
| GitHub sign-in fails | The OAuth App's callback URL doesn't match what's configured in Firebase — copy it exactly from Firebase's GitHub provider screen |
