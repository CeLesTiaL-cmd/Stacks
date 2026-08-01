# Stacks — Universal Academic Repository

A calm, minimal, Linear/Notion/Scholar-inspired platform where students, teachers, and
researchers upload, discover, and discuss academic work — papers, theses, projects,
notes, datasets, source code, and more.

This repo contains a **real, working V1** of the platform (not a mockup): a Node/Express
API backed by MongoDB, and a React + Tailwind frontend, wired together with Firebase
Authentication. It implements exactly the V1 scope from the original product brief:

> Authentication · Upload · Search · Filter · Download · Comments · Stars · Bookmarks ·
> Responsive layout · Admin approval

V2 (followers, recommendations, collections, trending, notifications, leaderboards) and
V3 (AI summaries/tags, semantic search, citation generator, OCR) are designed for in the
schema and API shape below, but intentionally not built yet — see **Roadmap**.

---

## 1. Architecture at a glance

```
academic-repo/
├── backend/     Express API, MongoDB models, Firebase token verification, file uploads
└── frontend/    React (Vite) + Tailwind CSS, Firebase client auth, React Router
```

**Why this stack:** it matches the brief exactly (React/Tailwind/Firebase Auth on the
frontend, Node/Express/MongoDB on the backend) and every piece has a generous free tier,
so you can run the whole platform at zero cost until it has real traffic.

### Request flow
```
Browser (React)
   │  Firebase ID token attached to every request
   ▼
Express API  ──verifies token with Firebase Admin SDK──▶  finds/creates User in MongoDB
   │
   ▼
MongoDB Atlas (Users, Content, Comments, Stars, Bookmarks, Follows)
```

### Core MongoDB collections
| Collection | Purpose |
|---|---|
| `users` | Profile, role, privacy settings, denormalized stats |
| `contents` | Every uploaded item — metadata, files, counts, moderation status |
| `comments` | Flat comments + one level of replies, pinning, author/mod badges |
| `stars` | One row per (user, content) — powers the ★ rating |
| `bookmarks` | One row per (user, content) — powers reading lists |
| `follows` | Social graph, ready for V2 |

`contents` carries a MongoDB **text index** across title/abstract/description/tags/
university/department/course/teacher, plus compound indexes on `(status, createdAt)`,
`(status, counts.downloads)`, and `(status, counts.stars)` — this is what makes search,
filtering, and "most downloaded/most starred" sorts fast even at large scale.

### API surface (REST, all under `/api`)
```
GET    /api/content              search + filter + sort + pagination
GET    /api/content/filters      distinct values for filter dropdowns
POST   /api/content              create upload (multipart, auth required) → status: pending
GET    /api/content/:slug        detail page (increments views)
PATCH  /api/content/:id          owner edits metadata
DELETE /api/content/:id          owner/admin deletes
POST   /api/content/:id/download/:fileIndex
POST   /api/content/:id/star     toggle
POST   /api/content/:id/bookmark toggle

GET    /api/comments/content/:contentId
POST   /api/comments/content/:contentId
PATCH  /api/comments/:id/pin
DELETE /api/comments/:id

GET    /api/users/me
PATCH  /api/users/me
POST   /api/users/me/avatar
GET    /api/users/me/dashboard
GET    /api/users/:id            public profile (privacy-aware)

GET    /api/admin/pending
PATCH  /api/admin/content/:id/approve
PATCH  /api/admin/content/:id/reject
PATCH  /api/admin/users/:id/suspend | /verify | /role
GET    /api/admin/stats
```

### Pages (frontend)
`/` Home · `/discover` search+filters · `/content/:slug` detail · `/upload` ·
`/profile/:id` · `/dashboard` (my uploads / bookmarks / settings) · `/admin` ·
`/login` · `/register`

### Design system
Warm white canvas (`#FAFAF8`), forest-green accent (`#1B4332`), Source Serif 4 for
headings, Inter for body text, IBM Plex Mono for tags/metadata — evoking a library
index card rather than a generic SaaS dashboard. Single accent color, no gradients, no
heavy shadows, per the brief.

---

## 2. Run it locally

You need: Node.js 18+, a free MongoDB Atlas cluster, and a free Firebase project.
(Full account setup is in `DEPLOYMENT.md` — do that first if you haven't already.)

```bash
# Backend
cd backend
cp .env.example .env        # fill in MONGODB_URI and the 3 FIREBASE_* values
npm install
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd frontend
cp .env.example .env        # fill in the 6 VITE_FIREBASE_* values
npm install
npm run dev                 # http://localhost:5173
```

Sign up through the UI, then in MongoDB Atlas open the `users` collection and change
your own `role` field to `"admin"` to unlock `/admin`.

---

## 3. Roadmap (as scoped in the original brief)

**V1 — built in this repo**
Auth · Upload · Search/Filter · Download · Comments · Stars · Bookmarks · Responsive ·
Admin approval.

**V2 — schema-ready, not yet built**
- Follows are already a collection — build the feed + follow/unfollow buttons
- Collections / reading lists — new `collections` collection, many-to-many with `contents`
- Notifications — new `notifications` collection + a bell icon with unread count
- Leaderboards/trending — already computable from `counts.*` and `createdAt`; needs
  cached aggregation queries (don't run them live on every page load at scale)

**V3 — needs an AI/search layer**
- AI summaries & auto-tags — call an LLM on upload, store result on `Content`
- Semantic search — add vector embeddings (e.g. MongoDB Atlas Vector Search)
- Citation generator — pure frontend, format existing metadata as APA/MLA/BibTeX
- OCR / full-text PDF search — extract text on upload, add to the text index

---

## 4. Scaling notes

- **File storage**: V1 stores files on local disk. This works for a demo, but most
  hosts (Render, Railway, Vercel) wipe local disk on redeploy. Before real users sign
  up, swap `backend/middleware/upload.js` for Cloudinary, AWS S3, or Firebase Storage —
  the rest of the app only depends on the resulting `url`, so the change is contained
  to that one file.
- **Database**: indexes are already in place for the V1 query patterns. As collections
  grow past a few million documents, watch Atlas's slow-query log and add indexes for
  whichever filter combinations turn out to be popular in practice.
- **Search**: MongoDB's `$text` index is good for thousands–low millions of documents.
  If you outgrow it, the V3 step is Atlas Search (Lucene-based) or a dedicated engine
  like Algolia/Typesense — both can run alongside MongoDB without a rewrite.
