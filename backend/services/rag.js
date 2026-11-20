// RAG building blocks: split text into chunks, then rank chunks by meaning (embeddings) or, as a fallback, by keywords.
import crypto from "crypto";

export function chunkText(text, size = 1200, overlap = 150) {
  const paras = String(text).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let cur = "";
  const push = () => { if (cur.trim()) chunks.push(cur.trim()); };
  for (const p of paras) {
    if (p.length > size) { // very long paragraph: hard-split with overlap
      push(); cur = "";
      for (let i = 0; i < p.length; i += size - overlap) chunks.push(p.slice(i, i + size).trim());
    } else if ((cur + "\n\n" + p).length > size) { push(); cur = p; }
    else cur = cur ? `${cur}\n\n${p}` : p;
  }
  push();
  return chunks;
}

export const dot = (a, b) => { let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i += 1) s += a[i] * b[i]; return s; };

export function rankByEmbedding(chunks, qvec, k = 6) {
  return chunks.map((c, i) => ({ c, i, score: dot(c.embedding || [], qvec) })).sort((x, y) => y.score - x.score).slice(0, k);
}

const STOP = new Set("the a an and or of to in on for with is are was were be this that it as at by from what how why who which can you your about into over under".split(" "));
const words = (s) => String(s).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)?.filter((w) => !STOP.has(w)) || [];
export function rankByKeywords(chunks, question, k = 6) {
  const q = new Set(words(question));
  return chunks.map((c, i) => { const w = words(c.text); let hit = 0; for (const x of w) if (q.has(x)) hit += 1; return { c, i, score: hit / Math.sqrt(w.length + 1) }; }).sort((x, y) => y.score - x.score).slice(0, k);
}

export const fingerprintOf = (files = []) =>
  crypto.createHash("sha1").update(files.map((f) => `${f.url}|${f.sizeBytes}`).join(";")).digest("hex");
