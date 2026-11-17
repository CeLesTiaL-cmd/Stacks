import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, ExternalLink, Lock } from "lucide-react";
import api from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";
import ContentCard from "../components/ContentCard.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { Badge, EmptyState, PageSkeleton } from "../components/ui/feedback.jsx";

export default function Profile() {
  const { id } = useParams();
  const { t, n } = useI18n();
  const [data, setData] = useState(null); const [error, setError] = useState(null);
  useEffect(() => { setData(null); setError(null); api.get(`/api/users/${id}`).then((r) => setData(r.data)).catch((e) => setError(e.response?.status || 500)); }, [id]);

  if (error) return <div className="container-x py-24"><EmptyState icon={Lock} title={error === 403 ? t("profile.private") : t("profile.notFound")} action={<Link to="/discover" className="text-accent-text underline">{t("nav.discover")}</Link>} /></div>;
  if (!data) return <PageSkeleton />;
  const { profile, uploads = [] } = data;
  if (!profile) return <div className="container-x py-24"><EmptyState icon={Lock} title={t("profile.notFound")} /></div>;
  const links = [["website", profile.website], ["GitHub", profile.github], ["LinkedIn", profile.linkedin]].filter(([, v]) => v);
  const stats = profile.stats && [[t("stat.uploads"), profile.stats.uploadsCount], [t("stat.stars"), profile.stats.starsReceived], [t("stat.downloads"), profile.stats.downloadsReceived], [t("stat.followers"), profile.stats.followersCount]];

  return (
    <div>
      <div className="grid-paper h-32 border-b border-line bg-accent-tint/50 sm:h-44" />
      <div className="container-x -mt-12 pb-16 sm:-mt-16">
        <Avatar src={profile.avatarUrl} name={profile.name} size={104} className="border-4 border-canvas" />
        <div className="mt-4 flex flex-wrap items-center gap-2"><h1 className="font-display text-3xl font-bold tracking-display sm:text-4xl">{profile.name}</h1>{profile.isInstitutionalVerified && <Badge tone="accent" icon={BadgeCheck}>{profile.institution}</Badge>}</div>
        <p className="mt-1 text-muted">{[profile.degree, profile.department, profile.university].filter(Boolean).join(" · ")}</p>
        {profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-line break-words">{profile.bio}</p>}
        {links.length > 0 && <div className="mt-4 flex flex-wrap gap-4 text-sm">{links.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-text hover:underline">{label === "website" ? t("profile.website") : label}<ExternalLink className="size-3.5" /></a>)}</div>}
        {stats && <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-raised px-4 py-3"><dd className="font-display text-2xl font-bold tabular-nums">{n(value ?? 0)}</dd><dt className="text-xs text-muted">{label}</dt></div>)}</dl>}
        <h2 className="mb-5 mt-12 font-display text-2xl font-semibold tracking-display">{t("profile.uploads")}</h2>
        {uploads.length === 0 ? <EmptyState title={t("profile.noUploads")} /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{uploads.map((u) => <ContentCard key={u._id} item={u} />)}</div>}
      </div>
    </div>
  );
}
