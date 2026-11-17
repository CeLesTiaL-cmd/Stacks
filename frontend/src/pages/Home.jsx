import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Globe, Lock, Search, ShieldCheck, Upload as UploadIcon, Trophy } from "lucide-react";
import api, { cachedGet } from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { TONE, TYPE_ICON, TYPE_TONE } from "../lib/fileTypes.js";
import { cn } from "../lib/cn.js";
import Button from "../components/ui/Button.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { CardSkeleton, EmptyState } from "../components/ui/feedback.jsx";
import { CountUp, Magnetic, Reveal } from "../components/ui/Motion.jsx";
import ContentCard from "../components/ContentCard.jsx";
import GraphMotif from "../components/visuals/GraphMotif.jsx";
import ShelfIllustration from "../components/visuals/ShelfIllustration.jsx";

function SectionHead({ eyebrow, title, to, cta }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h2 className="font-display text-3xl font-bold tracking-display sm:text-4xl">{title}</h2></div>
      {to && <Link to={to} className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent-text">{cta}<ArrowRight className="size-4 transition group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" /></Link>}
    </div>
  );
}
function Grid({ items, loading, empty }) {
  if (loading) return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>;
  if (!items.length) return empty;
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((it, i) => <Reveal key={it._id} delay={i * 0.05}><ContentCard item={it} /></Reveal>)}</div>;
}

export default function Home() {
  const { t, n } = useI18n();
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [ph, setPh] = useState(0);
  const [data, setData] = useState({ stats: null, featured: [], trending: [], recent: [], authors: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      cachedGet("/api/stats", { ttl: 120000 }),
      cachedGet("/api/stats/featured", { ttl: 120000 }),
      cachedGet("/api/content/leaderboard", { params: { limit: 4 }, ttl: 120000 }),
      api.get("/api/content", { params: { sort: "recent", limit: 8 } }),
      cachedGet("/api/users/leaderboard", { params: { limit: 5 }, ttl: 120000 }),
    ]).then(([s, f, tr, r, a]) => {
      if (!alive) return;
      setData({ stats: s.value || null, featured: f.value || [], trending: tr.value || [], recent: r.value?.data?.items || [], authors: a.value || [] });
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => { const id = setInterval(() => setPh((p) => (p + 1) % 3), 3200); return () => clearInterval(id); }, []);

  const submit = (e) => { e.preventDefault(); navigate(q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : "/discover"); };
  const stats = data.stats;
  const statItems = stats ? [{ v: stats.uploads, l: t("stat.uploads") }, { v: stats.authors, l: t("stat.authors") }, { v: stats.universities, l: t("stat.universities") }, { v: stats.downloads, l: t("stat.downloads") }] : [];
  const steps = [{ icon: UploadIcon, k: "1" }, { icon: ShieldCheck, k: "2" }, { icon: Search, k: "3" }];
  const tiers = [{ icon: Globe, k: "public", tone: "sky" }, { icon: Building2, k: "institutional", tone: "mint" }, { icon: Lock, k: "protected", tone: "lilac" }];
  const quickTypes = ["research", "thesis", "notes", "source_code", "dataset"];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="container-x grid grid-cols-1 items-center gap-10 pt-10 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8 lg:pt-20">
          <div className="min-w-0 pb-10 sm:pb-16">
            <p className="eyebrow mb-4">{t("hero.eyebrow")}</p>
            <h1 className="font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-display sm:text-6xl lg:text-7xl">{t("hero.title1")} <span className="text-accent-text">{t("hero.title2")}</span></h1>
            <p className="mt-5 max-w-xl text-lg text-muted">{t("hero.sub")}</p>
            <form onSubmit={submit} role="search" className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-raised p-1.5 ps-5 shadow-soft transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
              <Search className="size-5 shrink-0 text-subtle" />
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder={t(`hero.ph${ph + 1}`)} aria-label={t("nav.search")} className="h-11 min-w-0 flex-1 bg-transparent text-ink placeholder:text-subtle focus:outline-none" />
              <Magnetic><Button type="submit">{t("hero.search")}</Button></Magnetic>
            </form>
            <p className="mt-3 text-sm text-muted">{t("hero.noAccount")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {quickTypes.map((ty) => { const Icon = TYPE_ICON[ty]; return (
                <Link key={ty} to={`/discover?type=${ty}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-3.5 py-1.5 text-sm transition hover:border-ink/40"><Icon className={cn("size-4", TONE[TYPE_TONE[ty]].text)} />{t(`type.${ty}`)}</Link>
              ); })}
            </div>
            {statItems.length > 0 && (
              <dl className="mt-8 flex flex-wrap gap-2.5">
                {statItems.map((s) => <div key={s.l} className="rounded-full border border-line bg-raised px-4 py-2 text-sm"><dd className="inline font-semibold tabular-nums"><CountUp value={s.v} format={n} /></dd>{" "}<dt className="inline text-muted">{s.l}</dt></div>)}
              </dl>
            )}
          </div>
          <GraphMotif className="max-w-[300px] pb-8 sm:max-w-[360px] lg:max-w-[420px] lg:pb-16" />
        </div>
        <ShelfIllustration />
      </section>

      <section className="section"><div className="container-x">
        <SectionHead eyebrow={t("how.eyebrow")} title={t("how.title")} />
        <ol className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <span aria-hidden className="absolute start-[22px] top-3 hidden h-[calc(100%-1.5rem)] w-px bg-ink/80 max-md:block" />
          <span aria-hidden className="absolute inset-x-0 top-[22px] hidden h-px bg-ink/80 md:block" />
          {steps.map(({ icon: Icon, k }, i) => (
            <Reveal key={k} delay={i * 0.1}><li className="relative ps-14 md:ps-0 md:pt-14">
              <span className="absolute start-0 top-0 inline-flex size-11 items-center justify-center rounded-full border-[3px] border-ink bg-raised md:top-0.5"><Icon className="size-5" /></span>
              <h3 className="font-display text-xl font-semibold tracking-display">{t(`how.s${k}.t`)}</h3><p className="mt-1.5 text-muted">{t(`how.s${k}.d`)}</p>
            </li></Reveal>
          ))}
        </ol>
      </div></section>

      {(loading || data.featured.length > 0) && (
        <section className="pb-14"><div className="container-x"><SectionHead eyebrow={t("home.featuredEyebrow")} title={t("home.featured")} /><Grid items={data.featured.slice(0, 4)} loading={loading} empty={null} /></div></section>
      )}

      <section className="section border-y border-line bg-surface/60"><div className="container-x">
        <SectionHead eyebrow={t("home.trendingEyebrow")} title={t("home.trending")} to="/leaderboard" cta={t("home.viewAll")} />
        <Grid items={data.trending} loading={loading} empty={<EmptyState icon={Trophy} title={t("home.noStars")} text={t("home.noStarsText")} />} />
      </div></section>

      <section className="section"><div className="container-x">
        <SectionHead eyebrow={t("home.recentEyebrow")} title={t("home.recent")} to="/discover" cta={t("home.browseAll")} />
        <Grid items={data.recent} loading={loading} empty={<EmptyState icon={UploadIcon} title={t("home.emptyTitle")} text={t("home.emptyText")} action={<Button to="/upload">{t("nav.upload")}</Button>} />} />
      </div></section>

      <section className="section border-y border-line bg-surface/60"><div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div><p className="eyebrow mb-2">{t("tier.eyebrow")}</p><h2 className="font-display text-3xl font-bold tracking-display sm:text-4xl">{t("tier.title")}</h2><p className="mt-3 max-w-md text-muted">{t("tier.sub")}</p></div>
        <ul className="space-y-5">
          {tiers.map(({ icon: Icon, k, tone }, i) => (
            <Reveal key={k} delay={i * 0.08}><li className="flex gap-4">
              <span className={cn("inline-flex size-12 shrink-0 items-center justify-center rounded-full border-[3px] border-ink", TONE[tone].bg)}><Icon className="size-5" /></span>
              <div className="min-w-0"><h3 className="font-display text-xl font-semibold tracking-display">{t(`vis.${k}`)}</h3><p className="mt-1 text-muted">{t(`vis.${k}.d`)}</p></div>
            </li></Reveal>
          ))}
        </ul>
      </div></section>

      {data.authors.length > 0 && (
        <section className="section"><div className="container-x">
          <SectionHead eyebrow={t("home.authorsEyebrow")} title={t("home.authors")} to="/leaderboard" cta={t("home.viewAll")} />
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.authors.map((u, i) => (
              <li key={u._id}><Link to={`/profile/${u._id}`} className="flex items-center gap-3 rounded-2xl border border-line bg-raised p-3 transition hover:border-ink/30 hover:shadow-soft">
                <span className="font-mono text-sm text-subtle">{n(i + 1)}</span><Avatar src={u.avatarUrl} name={u.name} size={40} />
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{u.name}</span><span className="block text-xs tabular-nums text-muted">★ {n(u.stats?.starsReceived ?? 0)}</span></span>
              </Link></li>
            ))}
          </ol>
        </div></section>
      )}

      <section className="pb-6"><div className="container-x"><Reveal>
        <div className="rounded-3xl bg-ink px-6 py-12 text-center text-canvas sm:px-12 sm:py-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-display sm:text-5xl">{t("cta.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-canvas/70">{t("cta.sub")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to={firebaseUser ? "/upload" : "/register"} size="lg" className="!bg-accent !text-accent-ink" iconEnd={<ArrowRight className="size-4 rtl:rotate-180" />}>{firebaseUser ? t("nav.upload") : t("cta.join")}</Button>
            <Button to="/discover" size="lg" variant="ghost" className="!text-canvas hover:!bg-canvas/10">{t("nav.discover")}</Button>
          </div>
        </div>
      </Reveal></div></section>
    </>
  );
}
