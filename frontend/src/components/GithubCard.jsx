import { useEffect, useState } from "react";
import { GitFork, Star } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { GitHubIcon } from "./ui/BrandIcons.jsx";

export const parseGithub = (url = "") => { const m = String(url).match(/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i); return m ? { owner: m[1], repo: m[2] } : null; };

/** Live repo card from GitHub's public API (no key needed; cached per tab so we stay within GitHub's free limit). */
export default function GithubCard({ url }) {
  const { t, n, d } = useI18n();
  const gh = parseGithub(url);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!gh) return undefined;
    const key = `gh:${gh.owner}/${gh.repo}`;
    try { const hit = JSON.parse(sessionStorage.getItem(key) || "null"); if (hit && Date.now() - hit.at < 600000) { setInfo(hit.data); return undefined; } } catch { /* ignore */ }
    let alive = true;
    fetch(`https://api.github.com/repos/${gh.owner}/${gh.repo}`, { headers: { Accept: "application/vnd.github+json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j?.full_name) { const data = { name: j.full_name, description: j.description, language: j.language, stars: j.stargazers_count, forks: j.forks_count, updated: j.pushed_at, url: j.html_url }; setInfo(data); try { sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ } } })
      .catch(() => {});
    return () => { alive = false; };
  }, [gh?.owner, gh?.repo]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gh) return null;
  return (
    <a href={info?.url || url} target="_blank" rel="noopener noreferrer" className="mt-8 flex items-start gap-4 rounded-2xl border border-line bg-raised p-4 transition hover:border-ink/30 hover:shadow-soft">
      <GitHubIcon className="mt-0.5 size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted">{t("gh.title")}</p>
        <p className="truncate font-display text-lg font-semibold">{info?.name || `${gh.owner}/${gh.repo}`}</p>
        {info?.description && <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted">{info.description}</p>}
        {info && (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
            {info.language && <span>{info.language}</span>}
            <span className="inline-flex items-center gap-1"><Star className="size-3.5" />{n(info.stars)}</span>
            <span className="inline-flex items-center gap-1"><GitFork className="size-3.5" />{n(info.forks)}</span>
            <span>{t("gh.updated")} {d(info.updated)}</span>
          </p>
        )}
      </div>
    </a>
  );
}
