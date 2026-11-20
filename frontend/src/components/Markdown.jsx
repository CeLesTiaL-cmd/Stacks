import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { saveTextFile } from "../lib/downloadWork.js";
import { useI18n } from "../i18n/index.jsx";

// A tiny, SAFE markdown renderer: builds React elements only (never raw HTML), so AI output can't inject scripts.
const EXT = { javascript: "js", js: "js", jsx: "jsx", typescript: "ts", ts: "ts", python: "py", py: "py", html: "html", css: "css", java: "java", cpp: "cpp", c: "c", sql: "sql", bash: "sh", sh: "sh", json: "json", cs: "cs", php: "php", go: "go", rust: "rs", markdown: "md", md: "md" };

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i} className="rounded bg-surface px-1 py-0.5 font-mono text-[0.85em]">{p.slice(1, -1)}</code>;
    return <span key={i}>{p}</span>;
  });
}

function CodeBlock({ raw }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const nl = raw.indexOf("\n");
  const first = nl === -1 ? "" : raw.slice(0, nl).trim();
  const lang = /^[\w+#-]{1,15}$/.test(first) ? first.toLowerCase() : "";
  const code = (lang ? raw.slice(nl + 1) : raw).replace(/\n$/, "");
  const named = code.match(/^(?:\/\/|#|<!--|\/\*|--)\s*([\w.-]+\.[a-z0-9]{1,5})/i);
  const filename = named?.[1] || `stacks-code.${EXT[lang] || "txt"}`;
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-ink text-canvas">
      <div className="flex items-center justify-between gap-2 border-b border-canvas/15 px-3 py-1.5 text-xs">
        <span className="truncate font-mono opacity-70">{lang || "code"} · {filename}</span>
        <span className="flex shrink-0 gap-1">
          <button onClick={copy} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-canvas/10">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? t("ai.copied") : t("ai.copy")}</button>
          <button onClick={() => saveTextFile(filename, code)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-canvas/10"><Download className="size-3.5" />{t("ai.download")}</button>
        </span>
      </div>
      <pre className="max-h-96 overflow-auto p-3 text-xs leading-relaxed" data-lenis-prevent><code>{code}</code></pre>
    </div>
  );
}

function Prose({ text }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    const lines = b.split("\n");
    if (/^#{1,4}\s/.test(b)) return <p key={i} className="mt-3 font-display font-semibold"><Inline text={b.replace(/^#{1,4}\s+/, "")} /></p>;
    if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
      const ordered = /^\s*\d/.test(lines[0]);
      const Tag = ordered ? "ol" : "ul";
      return <Tag key={i} className={`my-2 space-y-1 ps-5 ${ordered ? "list-decimal" : "list-disc"}`}>{lines.map((l, j) => <li key={j}><Inline text={l.replace(/^\s*([-*•]|\d+[.)])\s+/, "")} /></li>)}</Tag>;
    }
    return <p key={i} className="my-2 whitespace-pre-line break-words"><Inline text={b} /></p>;
  });
}

export default function Markdown({ text }) {
  return String(text).split("```").map((part, i) => (i % 2 ? <CodeBlock key={i} raw={part} /> : <Prose key={i} text={part} />));
}
