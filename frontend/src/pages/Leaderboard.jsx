import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import { cachedGet } from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";
import ContentCard from "../components/ContentCard.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { CardSkeleton, EmptyState } from "../components/ui/feedback.jsx";
import { cn } from "../lib/cn.js";

export default function Leaderboard() {
  const { t, n } = useI18n();
  const [content, setContent] = useState([]); const [authors, setAuthors] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.allSettled([cachedGet("/api/content/leaderboard", { params: { limit: 12 }, ttl: 60000 }), cachedGet("/api/users/leaderboard", { params: { limit: 10 }, ttl: 60000 })])
      .then(([c, a]) => { setContent(c.value || []); setAuthors(a.value || []); setLoading(false); });
  }, []);
  return (
    <div className="container-x py-8 sm:py-12">
      <p className="eyebrow mb-2">{t("home.trendingEyebrow")}</p>
      <h1 className="font-display text-3xl font-bold tracking-display sm:text-5xl">{t("nav.leaderboard")}</h1>
      <p className="mt-2 max-w-xl text-muted">{t("lb.sub")}</p>
      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <section className="min-w-0">
          <h2 className="mb-4 font-display text-2xl font-semibold tracking-display">{t("lb.content")}</h2>
          {loading ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <CardSkeleton key={i} />)}</div>
            : content.length === 0 ? <EmptyState icon={Trophy} title={t("home.noStars")} text={t("home.noStarsText")} />
            : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{content.map((item, i) => (
                <div key={item._id} className="relative">
                  <span className={cn("absolute -start-2 -top-2 z-10 inline-flex size-8 items-center justify-center rounded-full border-[3px] border-ink bg-raised font-mono text-xs font-semibold tabular-nums", i === 0 && "bg-tone-amber/30")}>{n(i + 1)}</span>
                  <ContentCard item={item} />
                </div>))}</div>}
        </section>
        <aside>
          <h2 className="mb-4 font-display text-2xl font-semibold tracking-display">{t("lb.authors")}</h2>
          <ol className="divide-y divide-line rounded-2xl border border-line bg-raised">
            {authors.length === 0 && !loading && <li className="p-4 text-sm text-muted">{t("lb.noAuthors")}</li>}
            {authors.map((u, i) => (
              <li key={u._id}><Link to={`/profile/${u._id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface">
                <span className="w-5 font-mono text-sm text-subtle tabular-nums">{n(i + 1)}</span><Avatar src={u.avatarUrl} name={u.name} size={36} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{u.name}</span>{u.university && <span className="block truncate text-xs text-muted">{u.university}</span>}</span>
                <span className="text-sm tabular-nums">★ {n(u.stats?.starsReceived ?? 0)}</span>
              </Link></li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
