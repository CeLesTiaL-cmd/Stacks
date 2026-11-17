import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import api, { cachedGet } from "../api/client.js";
import { useI18n } from "../i18n/index.jsx";
import ContentCard from "../components/ContentCard.jsx";
import FilterPanel, { FILTER_KEYS } from "../components/FilterPanel.jsx";
import Pagination from "../components/Pagination.jsx";
import Button from "../components/ui/Button.jsx";
import { Modal } from "../components/ui/Modal.jsx";
import { Select } from "../components/ui/form.jsx";
import { CardSkeleton, EmptyState, Alert } from "../components/ui/feedback.jsx";
import { cn } from "../lib/cn.js";

export default function Discover() {
  const { t, n } = useI18n();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(params.entries()), [params]);
  const [q, setQ] = useState(filters.q || "");
  const [options, setOptions] = useState({});
  const [state, setState] = useState({ items: [], total: 0, pages: 1, loading: true, error: false });
  const [sheet, setSheet] = useState(false);
  const abort = useRef(null);

  useEffect(() => { cachedGet("/api/content/filters", { ttl: 120000 }).then(setOptions).catch(() => {}); }, []);
  const update = useCallback((next) => {
    setParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== "")), { replace: true });
  }, [setParams]);

  useEffect(() => {
    if ((filters.q || "") === q) return undefined;
    const id = setTimeout(() => update({ ...filters, q, page: undefined }), 350);
    return () => clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState((s) => ({ ...s, loading: true, error: false }));
    api.get("/api/content", { params: { ...filters, limit: 12 }, signal: ctrl.signal })
      .then(({ data }) => setState({ items: data.items, total: data.total, pages: data.pages, loading: false, error: false }))
      .catch((err) => { if (err.code !== "ERR_CANCELED") setState((s) => ({ ...s, loading: false, error: true })); });
    return () => ctrl.abort();
  }, [filters]);

  const page = Number(filters.page) || 1;
  const active = FILTER_KEYS.filter((k) => filters[k]);
  const clear = () => { setQ(""); update({ sort: filters.sort }); };
  const panel = <FilterPanel filters={filters} options={options} onChange={update} onClear={clear} />;

  return (
    <div className="container-x py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold tracking-display sm:text-5xl">{filters.q ? t("discover.resultsFor", { q: filters.q }) : t("nav.discover")}</h1>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder={t("nav.searchPlaceholder")} aria-label={t("nav.search")} className="h-12 w-full rounded-full border border-line bg-raised ps-11 pe-4 text-ink placeholder:text-subtle transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25" />
        </div>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 sm:w-48 sm:flex-none">
            <Select value={filters.sort || "recent"} onChange={(e) => update({ ...filters, sort: e.target.value, page: undefined })} aria-label={t("filter.sort")} className="!h-12 !rounded-full">
              {["recent", "stars", "downloads", "views"].map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
            </Select>
          </div>
          <Button variant="secondary" className="lg:hidden" onClick={() => setSheet(true)} iconStart={<SlidersHorizontal className="size-4" />}>{t("filter.title")}{active.length ? ` (${active.length})` : ""}</Button>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {active.map((k) => <button key={k} onClick={() => update({ ...filters, [k]: undefined, page: undefined })} className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-3 py-1 text-sm text-accent-text transition hover:opacity-80">{k === "type" ? t(`type.${filters[k]}`) : filters[k]} <X className="size-3.5" /></button>)}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-24 rounded-2xl border border-line bg-raised p-4">{panel}</div></aside>
        <div className="min-w-0">
          <p className="mb-4 text-sm text-muted" aria-live="polite">{state.loading ? t("common.loading") : t("discover.count", { count: n(state.total) })}</p>
          {state.error && <Alert tone="danger">{t("err.generic")}</Alert>}
          {state.loading && state.items.length === 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}</div>
          ) : state.items.length === 0 && !state.error ? (
            <EmptyState icon={Search} title={t("discover.none")} text={t("discover.noneText")} action={<Button variant="secondary" onClick={clear}>{t("filter.clear")}</Button>} />
          ) : (
            <div className={cn("grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 xl:grid-cols-3", state.loading && "opacity-50")} aria-busy={state.loading}>{state.items.map((it) => <ContentCard key={it._id} item={it} />)}</div>
          )}
          <Pagination page={page} pages={state.pages} onChange={(p) => { update({ ...filters, page: p > 1 ? p : undefined }); window.scrollTo({ top: 0 }); }} />
        </div>
      </div>
      <Modal open={sheet} onClose={() => setSheet(false)} title={t("filter.title")} footer={<Button onClick={() => setSheet(false)}>{t("filter.show", { count: n(state.total) })}</Button>}>{panel}</Modal>
    </div>
  );
}
