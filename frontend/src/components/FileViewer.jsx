import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { fileKind } from "../lib/fileTypes.js";
import { Modal } from "./ui/Modal.jsx";
import Button from "./ui/Button.jsx";
import { Alert, Spinner } from "./ui/feedback.jsx";

const IMG = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"];
const OFFICE = [".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"];
const TEXT = [".txt", ".md", ".csv", ".json", ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".c", ".cpp", ".h", ".html", ".css", ".sql", ".sh", ".ino", ".tex", ".xml"];

/** How can this file be shown inside the page instead of being downloaded? */
export function previewMode(file, isPublic) {
  const { ext } = fileKind(file.originalName);
  let urlExt = "";
  try { urlExt = (new URL(file.url).pathname.toLowerCase().match(/\.[a-z0-9]{1,8}$/) || [""])[0]; } catch { /* relative or invalid url */ }
  if (!String(file.url || "").startsWith("http")) return "none";
  if (IMG.includes(ext)) return "image";
  if (TEXT.includes(ext)) return "text";
  const touch = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  if (ext === ".pdf") return touch ? (isPublic ? "gview" : "private") : "pdf";
  if (OFFICE.includes(ext)) {
    if (urlExt !== ext) return "legacy"; // older uploads have no extension in the link; online viewers can't open those
    return isPublic ? "office" : "private";
  }
  return "none";
}

export default function FileViewer({ file, isPublic, onClose, onDownload }) {
  const { t } = useI18n();
  const [text, setText] = useState(null);
  const mode = file ? previewMode(file, isPublic) : "none";

  useEffect(() => {
    setText(null);
    if (!file || mode !== "text") return undefined;
    let alive = true;
    fetch(file.url).then((r) => r.text()).then((x) => alive && setText(x.slice(0, 200000))).catch(() => alive && setText(""));
    return () => { alive = false; };
  }, [file, mode]);

  if (!file) return null;
  const url = encodeURIComponent(file.url);
  const frame = "h-[68dvh] w-full rounded-xl border border-line bg-surface";
  return (
    <Modal open onClose={onClose} title={file.originalName} size="xl"
      footer={<><Button variant="secondary" href={file.url} target="_blank" rel="noopener noreferrer" iconStart={<ExternalLink className="size-4" />}>{t("view.openTab")}</Button><Button onClick={onDownload} iconStart={<Download className="size-4" />}>{t("file.download")}</Button></>}>
      {mode === "pdf" && <iframe title={file.originalName} src={file.url} className={frame} />}
      {mode === "gview" && <iframe title={file.originalName} src={`https://docs.google.com/gview?embedded=1&url=${url}`} sandbox="allow-scripts allow-same-origin allow-popups" className={frame} />}
      {mode === "office" && <iframe title={file.originalName} src={`https://view.officeapps.live.com/op/embed.aspx?src=${url}`} sandbox="allow-scripts allow-same-origin allow-popups" className={frame} />}
      {mode === "image" && <img src={file.url} alt={file.originalName} className="mx-auto max-h-[68dvh] rounded-xl" />}
      {mode === "text" && (text === null ? <div className="flex justify-center py-16"><Spinner /></div> : <pre className="max-h-[68dvh] overflow-auto rounded-xl border border-line bg-surface p-4 text-xs" data-lenis-prevent>{text}</pre>)}
      {mode === "private" && <Alert tone="info">{t("view.privateNo")}</Alert>}
      {mode === "legacy" && <Alert tone="info">{t("view.legacy")}</Alert>}
      {mode === "none" && <Alert tone="info">{t("view.noPreview")}</Alert>}
      {(mode === "office" || mode === "gview") && <p className="mt-3 text-xs text-muted">{t("view.trouble")}</p>}
    </Modal>
  );
}
