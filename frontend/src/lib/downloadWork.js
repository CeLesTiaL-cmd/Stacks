import { downloadFile, openInNewTab } from "./download.js";

/** Count the download on the server, then save the file under its ORIGINAL name. */
export async function downloadWorkFile(api, contentId, index, fallbackName, onProgress) {
  const { data } = await api.post(`/api/content/${contentId}/download/${index}`);
  try { await downloadFile(data.url, data.originalName || fallbackName, onProgress); }
  catch { openInNewTab(data.url); } // browser blocked the fetch (CORS) — fall back to the plain link
}

export function saveTextFile(name, text) {
  const href = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 3000);
}
