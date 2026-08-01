import { Link } from "react-router-dom";
import { typeLabel } from "../constants.js";

export default function ContentCard({ item }) {
  return (
    <Link
      to={`/content/${item.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-line bg-canvas transition-colors hover:border-accent"
    >
      <div className="h-1 w-full bg-accent/0 group-hover:bg-accent" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wide text-muted">
          <span>{typeLabel(item.type)}</span>
          <span>{item.year || ""}</span>
        </div>

        <h3 className="font-display text-lg leading-snug text-ink line-clamp-2">{item.title}</h3>

        {item.abstract && (
          <p className="text-sm text-muted line-clamp-3">{item.abstract}</p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-muted">
          <span className="line-clamp-1 pr-2">
            {item.university || item.uploader?.university || "Independent"}
          </span>
          <span className="flex shrink-0 gap-3">
            <span title="Stars">★ {item.counts?.stars ?? 0}</span>
            <span title="Downloads">↓ {item.counts?.downloads ?? 0}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
