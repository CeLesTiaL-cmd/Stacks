# Stacks — patch_update_1

## Apply
1. git add -A && git commit -m "before patch 1"        (so you can undo with: git reset --hard)
2. Extract this zip INTO the academic-repo folder (replace files when asked)
3. cd frontend && npm install        (adds: motion, lenis, lucide-react)
4. Test locally: backend `npm run dev`, frontend `npm run dev`
5. git add -A && git commit -m "UI overhaul, i18n, admin panel, upload/download fixes" && git push

No new backend packages and no new environment variables are needed.

## What changed
- NEW design system: light/dark, responsive, motion, smooth scroll, 6 languages (en, bn, fr, es, hi, ar + RTL)
- FIX: .pptx/.docx downloads (extension was lost) — backend/middleware/upload.js + frontend/src/lib/download.js
- FIX: Bangla file names no longer turn into garbage
- FIX: server crash on bad ids (async errors), shared rate-limit bucket behind Render, NoSQL operator injection, gzip, caching
- NEW: Upload wizard with progress, drag & drop, validation; Dashboard edit/delete/privacy; admin overview, queue, content, users, comments
