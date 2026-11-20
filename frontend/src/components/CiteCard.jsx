import { Quote } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Button from "./ui/Button.jsx";

export function buildCitations(c, url) {
  const authors = [c.uploader?.name, ...(c.coAuthors || [])].filter(Boolean);
  const year = c.year || new Date(c.createdAt).getFullYear();
  const apaNames = authors.length > 1 ? `${authors.slice(0, -1).join(", ")} & ${authors.at(-1)}` : authors[0] || "Unknown";
  const key = `${(authors[0] || "stacks").split(/\s+/).pop().toLowerCase().replace(/[^a-z0-9]/g, "")}${year}${(c.title.split(/\s+/)[0] || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return {
    apa: `${apaNames}. (${year}). ${c.title}${c.university ? `. ${c.university}` : ""}. Stacks. ${c.doi ? `https://doi.org/${c.doi}` : url}`,
    bibtex: `@misc{${key},\n  author = {${authors.join(" and ")}},\n  title = {${c.title}},\n  year = {${year}},\n  howpublished = {Stacks},\n  url = {${c.doi ? `https://doi.org/${c.doi}` : url}}\n}`,
  };
}

export default function CiteCard({ content }) {
  const { t } = useI18n();
  const toast = useToast();
  const cites = buildCitations(content, window.location.href);
  const copy = async (text) => { try { await navigator.clipboard.writeText(text); toast.success(t("ai.copied")); } catch { toast.error(t("err.generic")); } };
  return (
    <div className="rounded-2xl border border-line bg-raised p-4">
      <p className="flex items-center gap-2 font-display font-semibold"><Quote className="size-4" />{t("cite.title")}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => copy(cites.apa)}>APA</Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => copy(cites.bibtex)}>BibTeX</Button>
      </div>
    </div>
  );
}
