# Stacks — patch_update_2_fix1  (small overlay on top of patch 2)

Extract into academic-repo (Replace), then commit + push. No npm install needed.

1) AI "high demand" errors: the server now retries and falls back across several Gemini models, prefers the
   stable embedding model, and retries embeddings that failed earlier.
2) Old uploads without a file extension (cannot be previewed): run ONCE from the backend folder
      node scripts/fix-file-extensions.js --dry     (preview the list)
      node scripts/fix-file-extensions.js           (apply)
   Until then the viewer shows a clear message instead of Microsoft's "File not found".
