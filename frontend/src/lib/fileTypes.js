import { FileText, FileArchive, FileSpreadsheet, Presentation, FileCode2, Image as ImageIcon, Film, Database, FileQuestion, GraduationCap, Layers, BookOpen, Folder } from "lucide-react";

export const MAX_FILE_MB = 50;
export const MAX_FILES = 10;
export const BLOCKED_EXT = [".exe", ".msi", ".scr", ".com", ".bat", ".cmd", ".vbs", ".dll"];
export const extOf = (name = "") => { const m = String(name).toLowerCase().match(/\.[a-z0-9]{1,8}$/); return m ? m[0] : ""; };

const KINDS = [
  ["pdf", [".pdf"], FileText, "rose"],
  ["doc", [".doc", ".docx", ".odt", ".rtf", ".txt", ".md", ".tex"], FileText, "sky"],
  ["slides", [".ppt", ".pptx", ".odp", ".key"], Presentation, "amber"],
  ["sheet", [".xls", ".xlsx", ".csv", ".ods", ".tsv"], FileSpreadsheet, "mint"],
  ["code", [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".cs", ".go", ".rs", ".php", ".html", ".css", ".ipynb", ".sql", ".sh", ".json", ".xml", ".ino"], FileCode2, "mint"],
  ["archive", [".zip", ".rar", ".7z", ".tar", ".gz"], FileArchive, "lilac"],
  ["image", [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"], ImageIcon, "sky"],
  ["video", [".mp4", ".mov", ".webm", ".mkv", ".avi"], Film, "rose"],
  ["data", [".parquet", ".h5", ".npy", ".mat", ".sav"], Database, "lilac"],
];
export function fileKind(name) {
  const ext = extOf(name);
  for (const [kind, exts, icon, tone] of KINDS) if (exts.includes(ext)) return { kind, icon, tone, ext };
  return { kind: "other", icon: FileQuestion, tone: "muted", ext };
}
export const TYPE_TONE = { research: "sky", thesis: "lilac", project: "mint", assignment: "amber", notes: "amber", ppt: "rose", book: "lilac", lab_report: "sky", dataset: "mint", source_code: "mint", presentation: "rose", question_paper: "amber", solution: "sky", poster: "rose", course_material: "lilac", other: "muted" };
export const TYPE_ICON = { research: FileText, thesis: GraduationCap, project: Layers, assignment: FileText, notes: BookOpen, ppt: Presentation, book: BookOpen, lab_report: FileText, dataset: Database, source_code: FileCode2, presentation: Presentation, question_paper: FileQuestion, solution: FileText, poster: ImageIcon, course_material: Folder, other: FileQuestion };
export const TONE = {
  sky: { bg: "bg-tone-sky/15", text: "text-tone-sky", dot: "bg-tone-sky" },
  mint: { bg: "bg-tone-mint/15", text: "text-tone-mint", dot: "bg-tone-mint" },
  lilac: { bg: "bg-tone-lilac/15", text: "text-tone-lilac", dot: "bg-tone-lilac" },
  amber: { bg: "bg-tone-amber/15", text: "text-tone-amber", dot: "bg-tone-amber" },
  rose: { bg: "bg-tone-rose/15", text: "text-tone-rose", dot: "bg-tone-rose" },
  muted: { bg: "bg-surface", text: "text-muted", dot: "bg-muted" },
};
export const CONTENT_TYPES = Object.keys(TYPE_TONE);
export const LICENSES = ["all_rights_reserved", "cc_by", "cc_by_sa", "cc_by_nc", "cc0", "custom"];
export const VISIBILITIES = ["public", "institutional", "protected"];

const MIME_EXT = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt", "application/msword": ".doc", "application/vnd.ms-excel": ".xls",
  "application/zip": ".zip", "text/plain": ".txt", "text/csv": ".csv",
};
// Old uploads lost their extension; rebuild a sensible file name for the download.
export function ensureExtension(name, url = "", mime = "") {
  if (extOf(name)) return name;
  const fromUrl = extOf(String(url).split("?")[0]);
  if (fromUrl) return name + fromUrl;
  const fromMime = MIME_EXT[String(mime).split(";")[0]];
  return fromMime ? name + fromMime : name;
}
