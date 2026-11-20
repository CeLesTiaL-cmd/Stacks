// Pull plain text out of uploaded files so the AI can read them (this is the "R" in RAG's data).
const MAX_BYTES = 15 * 1024 * 1024;
const MAX_CHARS = 300000;
const TEXT_EXT = new Set([".txt", ".md", ".csv", ".tsv", ".json", ".xml", ".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".cs", ".go", ".rs", ".php", ".sql", ".sh", ".ino", ".tex", ".ipynb"]);

export const extOf = (name = "") => { const m = String(name).toLowerCase().match(/\.[a-z0-9]{1,8}$/); return m ? m[0] : ""; };

/** SSRF guard: only ever fetch files that live on our own Cloudinary storage over HTTPS. */
export function isAllowedUrl(u) {
  try { const x = new URL(u); return x.protocol === "https:" && /(^|\.)cloudinary\.com$/i.test(x.hostname); } catch { return false; }
}

export async function fetchBuffer(url) {
  if (!isAllowedUrl(url)) throw new Error("File location not allowed");
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`File download failed (${res.status})`);
  const len = Number(res.headers.get("content-length")) || 0;
  if (len > MAX_BYTES) throw new Error("File too large to read");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("File too large to read");
  return buf;
}

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&");
const tagsToText = (xml, re) => decode([...xml.matchAll(re)].map((m) => m[1]).join(" "));

async function zip(buf) {
  try { const { default: JSZip } = await import("jszip"); return await JSZip.loadAsync(buf); }
  catch (e) { if (e.code === "ERR_MODULE_NOT_FOUND") throw new Error("Office support isn't installed on the server (npm install jszip)."); throw e; }
}

export async function extractFromBuffer(buf, ext) {
  let text = "";
  if (ext === ".pdf") {
    let mod;
    try { mod = await import("unpdf"); } catch { throw new Error("PDF support isn't installed on the server (npm install unpdf)."); }
    const pdf = await mod.getDocumentProxy(new Uint8Array(buf));
    ({ text } = await mod.extractText(pdf, { mergePages: true }));
  } else if (ext === ".docx") {
    const z = await zip(buf);
    const xml = await z.file("word/document.xml")?.async("string");
    text = xml ? decode(xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")) : "";
  } else if (ext === ".pptx") {
    const z = await zip(buf);
    const slides = Object.keys(z.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/(\d+)\.xml/)[1]) - Number(b.match(/(\d+)\.xml/)[1]));
    const parts = [];
    for (const [i, name] of slides.entries()) {
      const xml = await z.file(name).async("string");
      const t = tagsToText(xml.replace(/<\/a:p>/g, "</a:t><a:t>\n"), /<a:t[^>]*>([^<]*)<\/a:t>/g).replace(/\s*\n\s*/g, "\n").trim();
      if (t) parts.push(`Slide ${i + 1}:\n${t}`);
    }
    text = parts.join("\n\n");
  } else if (ext === ".xlsx") {
    const z = await zip(buf);
    const xml = await z.file("xl/sharedStrings.xml")?.async("string");
    text = xml ? tagsToText(xml, /<t[^>]*>([^<]*)<\/t>/g).replace(/ {2,}/g, " ") : "";
  } else if (TEXT_EXT.has(ext)) {
    text = buf.toString("utf8");
  } else {
    return "";
  }
  return text.replace(/\u0000/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").slice(0, MAX_CHARS).trim();
}

export async function extractFile(file) {
  const ext = extOf(file.originalName) || extOf(String(file.url).split("?")[0]);
  if (!isAllowedUrl(file.url)) return "";
  return extractFromBuffer(await fetchBuffer(file.url), ext);
}
