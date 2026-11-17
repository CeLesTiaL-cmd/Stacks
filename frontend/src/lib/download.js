import { ensureExtension } from "./fileTypes.js";

/** Download under the ORIGINAL name (with extension) — fixes ".pptx saved with no extension". */
export async function downloadFile(url, filename, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  const total = Number(res.headers.get("content-length")) || 0;
  let blob;
  if (res.body && total && onProgress) {
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress(Math.min(99, Math.round((received / total) * 100)));
    }
    blob = new Blob(chunks, { type: contentType });
  } else blob = await res.blob();

  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = ensureExtension(filename || "download", url, contentType);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 5000);
  onProgress?.(100);
}
export const openInNewTab = (url) => window.open(url, "_blank", "noopener,noreferrer");
