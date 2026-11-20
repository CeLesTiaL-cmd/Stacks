import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { cn } from "../lib/cn.js";
import { Input } from "../components/ui/form.jsx";
import { EmptyState } from "../components/ui/feedback.jsx";
import { Reveal } from "../components/ui/Motion.jsx";

// Curated, free, well-known sources. Descriptions stay short; add more any time.
const R = [
  ["research", "arXiv", "arxiv.org", "Free preprints in physics, maths, computer science and more."],
  ["research", "Google Scholar", "scholar.google.com", "Search scholarly papers, theses, books and citations."],
  ["research", "Semantic Scholar", "www.semanticscholar.org", "AI-assisted paper search with citation graphs."],
  ["research", "OpenAlex", "openalex.org", "Open catalogue of papers, authors and institutions."],
  ["research", "CORE", "core.ac.uk", "The world's largest collection of open-access research papers."],
  ["research", "DOAJ", "doaj.org", "Directory of open-access journals."],
  ["research", "Zenodo", "zenodo.org", "Share and find research data, software and reports."],
  ["code", "GitHub", "github.com", "Host code, collaborate and explore open-source projects."],
  ["code", "Stack Overflow", "stackoverflow.com", "Answers to programming questions from developers."],
  ["code", "Kaggle", "www.kaggle.com", "Free datasets, notebooks and data-science courses."],
  ["code", "Hugging Face", "huggingface.co", "Open models and datasets for machine learning."],
  ["code", "MDN Web Docs", "developer.mozilla.org", "The reference for HTML, CSS and JavaScript."],
  ["code", "freeCodeCamp", "www.freecodecamp.org", "Free coding courses and projects."],
  ["learn", "MIT OpenCourseWare", "ocw.mit.edu", "Free lecture notes and videos from MIT courses."],
  ["learn", "Khan Academy", "www.khanacademy.org", "Free lessons in maths, science, economics and more."],
  ["learn", "CS50", "cs50.harvard.edu", "Harvard's free introduction to computer science."],
  ["learn", "NPTEL", "nptel.ac.in", "Engineering and science lecture courses."],
  ["learn", "10 Minute School", "10minuteschool.com", "Bangla learning platform for students."],
  ["science", "PubMed", "pubmed.ncbi.nlm.nih.gov", "Biomedical and life-science literature."],
  ["science", "WHO", "www.who.int", "Global health data and guidance."],
  ["science", "PhET Simulations", "phet.colorado.edu", "Interactive science and maths simulations."],
  ["science", "Desmos", "www.desmos.com", "Free graphing calculator."],
  ["bd", "University Grants Commission", "www.ugc.gov.bd", "Bangladesh higher-education regulator and data."],
  ["bd", "Bangladesh Bureau of Statistics", "bbs.gov.bd", "Official national statistics."],
  ["bd", "Banglapedia", "en.banglapedia.org", "National encyclopedia of Bangladesh."],
  ["bd", "BdREN", "www.bdren.net.bd", "Bangladesh Research & Education Network."],
  ["bd", "Bangladesh Laws", "bdlaws.minlaw.gov.bd", "Official collection of Bangladesh laws."],
  ["bd", "Bangladesh Bank", "www.bb.org.bd", "Central bank publications and economic data."],
  ["tools", "Zotero", "www.zotero.org", "Free reference manager for citations."],
  ["tools", "Overleaf", "www.overleaf.com", "Online LaTeX editor for papers and theses."],
  ["tools", "diagrams.net", "app.diagrams.net", "Free diagrams, flowcharts and UML."],
  ["tools", "Wikipedia", "www.wikipedia.org", "A good starting point for any topic."],
];
const CATS = ["research", "code", "learn", "science", "bd", "tools"];

export default function Resources() {
  const { t } = useI18n();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => R.filter(([c, name, host, d]) => (cat === "all" || c === cat) && `${name} ${host} ${d}`.toLowerCase().includes(q.trim().toLowerCase())), [cat, q]);
  const chip = (active) => cn("shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition", active ? "border-accent bg-accent-tint text-accent-text" : "border-line bg-raised text-muted hover:text-ink");
  return (
    <div className="container-x py-8 sm:py-12">
      <p className="eyebrow mb-2">{t("res.eyebrow")}</p>
      <h1 className="font-display text-3xl font-bold tracking-display sm:text-5xl">{t("res.title")}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t("res.sub")}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72"><Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("res.search")} aria-label={t("res.search")} className="ps-10" /></div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button className={chip(cat === "all")} onClick={() => setCat("all")}>{t("filter.all")}</button>
          {CATS.map((c) => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{t(`res.cat.${c}`)}</button>)}
        </div>
      </div>
      {list.length === 0 ? <div className="mt-8"><EmptyState icon={Search} title={t("discover.none")} /></div> : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(([c, name, host, d], i) => (
            <Reveal key={host} delay={(i % 6) * 0.04}>
              <a href={`https://${host}`} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col rounded-2xl border border-line bg-raised p-4 transition hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lift">
                <span className="text-xs text-accent-text">{t(`res.cat.${c}`)}</span>
                <span className="mt-1 flex items-center justify-between gap-2 font-display text-lg font-semibold tracking-display">{name}<ExternalLink className="size-4 shrink-0 text-subtle transition group-hover:text-ink" /></span>
                <span className="mt-1 break-words text-sm text-muted">{d}</span>
                <span className="mt-auto pt-3 font-mono text-xs text-subtle">{host.replace(/^www\./, "")}</span>
              </a>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
