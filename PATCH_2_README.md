# Stacks — patch_update_2 (v2)  — includes EVERYTHING from patch 1

## Apply
1. git add -A && git commit -m "before patch 2"
2. Extract this zip INTO the academic-repo folder (Replace when asked)
3. cd frontend && npm install
4. cd ../backend && npm install unpdf jszip      (lets the AI read PDF / Word / PowerPoint files)
5. git add -A && git commit -m "v2" && git push   (commit package.json + package-lock.json too)

## Render -> Environment  (the AI key stays on the SERVER only, never in the browser)
GEMINI_API_KEY      = (free key from Google AI Studio)
CLIENT_ORIGIN       = https://stacks-seven-henna.vercel.app,https://YOUR-DOMAIN.com
Optional:
AI_DAILY_LIMIT      = 400   (shared daily AI questions)      AI_PER_USER_HOUR = 15      AI_PER_USER_DAY = 60
REQUIRE_VERIFIED_EMAIL = true   (only verified emails can upload / comment / use AI)
GEMINI_MODEL / GEMINI_EMBED_MODEL  (leave empty: the server picks a current model automatically)

## New in v2
- Files open in a page viewer (PPTX/DOCX/XLSX/PDF/images/text) instead of downloading
- Stacks AI on every public work: summary, Q&A grounded in the file (RAG), code generation, download generated files
- Comments: upvotes ("Agree"), emoji picker, sort; staff replies show as "Stacks Admin" / "Stacks Moderator"
- GitHub repo card, "Cite this work" (APA/BibTeX), Resource Hub page (/resources)
- Security: private/institutional/pending work is never sent to the AI; SSRF guard; per-user + global AI limits;
  security headers + CSP (report-only) in frontend/vercel.json; optional verified-email gate
- Footer "built by" link removed
