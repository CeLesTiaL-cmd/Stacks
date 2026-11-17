import { Check } from "lucide-react";
import { useI18n } from "../i18n/index.jsx";
import GraphMotif from "../components/visuals/GraphMotif.jsx";

export default function AuthShell({ title, subtitle, children }) {
  const { t } = useI18n();
  return (
    <div className="container-x grid grid-cols-1 min-h-[calc(100dvh-4rem)] items-center gap-12 py-10 lg:grid-cols-2 lg:py-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-display sm:text-4xl">{title}</h1>
        <p className="mt-2 text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
      <aside className="hidden lg:block"><div className="mx-auto max-w-md">
        <GraphMotif className="max-w-[300px]" />
        <ul className="mt-6 space-y-2.5 text-sm text-muted">{["auth.pt1", "auth.pt2", "auth.pt3"].map((k) => <li key={k} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-accent-text" />{t(k)}</li>)}</ul>
      </div></aside>
    </div>
  );
}
