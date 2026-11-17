import { Link } from "react-router-dom";
import { Download, Star } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import { cn } from "../lib/cn.js";
import { optimizedImage } from "../lib/cloud.js";
import { TONE, TYPE_ICON, TYPE_TONE } from "../lib/fileTypes.js";
import { Badge } from "./ui/feedback.jsx";

export default function ContentCard({ item }) {
  const { t, n } = useI18n();
  const toneName = TYPE_TONE[item.type] || "muted";
  const tone = TONE[toneName];
  const Icon = TYPE_ICON[item.type] || TYPE_ICON.other;
  const where = [item.university || item.uploader?.university || t("common.independent"), item.year].filter(Boolean).join(" · ");
  return (
    <Link to={`/content/${item.slug}`} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-raised transition duration-300 hover:-translate-y-0.5 hover:border-ink/30 hover:shadow-lift">
      <div className={cn("relative aspect-[16/9] overflow-hidden", tone.bg)}>
        {item.thumbnailUrl ? (
          <img src={optimizedImage(item.thumbnailUrl, 640)} alt="" loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid-paper flex size-full items-center justify-center"><Icon className={cn("size-12 opacity-80 transition duration-500 group-hover:scale-110", tone.text)} strokeWidth={1.5} /></div>
        )}
        <Badge tone={toneName} className="absolute start-3 top-3 bg-raised/90 backdrop-blur">{t(`type.${item.type}`)}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 break-words font-display text-lg font-semibold leading-snug tracking-display text-ink">{item.title}</h3>
        {item.abstract && <p className="line-clamp-2 break-words text-sm text-muted">{item.abstract}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-muted">
          <span className="min-w-0 truncate">{where}</span>
          <span className="flex shrink-0 items-center gap-3 tabular-nums">
            <span className="inline-flex items-center gap-1" title={t("stat.stars")}><Star className="size-3.5" />{n(item.counts?.stars ?? 0)}</span>
            <span className="inline-flex items-center gap-1" title={t("stat.downloads")}><Download className="size-3.5" />{n(item.counts?.downloads ?? 0)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
