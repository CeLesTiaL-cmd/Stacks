import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Ban, Check, ExternalLink, FileWarning, Search, Sparkles, Trash2, X } from "lucide-react";
import api, { errorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cn } from "../lib/cn.js";
import Avatar from "../components/ui/Avatar.jsx";
import Button from "../components/ui/Button.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Pagination from "../components/Pagination.jsx";
import { Input, Select, Textarea } from "../components/ui/form.jsx";
import { Alert, Badge, EmptyState, Skeleton } from "../components/ui/feedback.jsx";
import { ConfirmDialog, Modal } from "../components/ui/Modal.jsx";

const STATUS_TONE = { pending: "warn", approved: "accent", rejected: "danger" };
const ROLES = ["student", "researcher", "teacher", "organization", "university_admin", "moderator", "admin"];

function Tile({ label, value, tone }) {
  const { n } = useI18n();
  return <div className="rounded-2xl border border-line bg-raised px-4 py-4"><dd className={cn("font-display text-3xl font-bold tabular-nums", tone)}>{n(value ?? 0)}</dd><dt className="mt-0.5 text-xs capitalize text-muted">{label}</dt></div>;
}
function Bars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-36 items-end gap-1.5" role="img" aria-label="chart">
      {data.map((d) => <div key={d.date} className="flex h-full flex-1 flex-col justify-end" title={`${d.date}: ${d.count}`}><div className="w-full rounded-t bg-accent/80 transition-all" style={{ height: `${Math.max(d.count ? 6 : 2, (d.count / max) * 100)}%` }} /></div>)}
    </div>
  );
}
function HBars({ rows, label }) {
  const { n } = useI18n();
  const max = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="text-sm text-muted">—</p>;
  return (
    <ul className="space-y-2.5">{rows.map((r) => (
      <li key={r._id}>
        <div className="flex justify-between gap-3 text-sm"><span className="truncate">{label ? label(r._id) : r._id}</span><span className="tabular-nums text-muted">{n(r.count)}</span></div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-accent" style={{ width: `${(r.count / max) * 100}%` }} /></div>
      </li>))}</ul>
  );
}

function Overview() {
  const { t, d } = useI18n();
  const [o, setO] = useState(null); const [err, setErr] = useState(false);
  useEffect(() => { api.get("/api/admin/overview").then((r) => setO(r.data)).catch(() => setErr(true)); }, []);
  if (err) return <Alert tone="danger">{t("err.generic")}</Alert>;
  if (!o) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  const T = o.totals;
  const box = "rounded-2xl border border-line bg-raised p-5";
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label={t("adm.users")} value={T.users} /><Tile label={t("adm.content")} value={T.content} />
        <Tile label={t("adm.pending")} value={T.pending} tone={T.pending ? "text-warn" : ""} /><Tile label={t("adm.approved")} value={T.approved} />
        <Tile label={t("stat.views")} value={T.views} /><Tile label={t("stat.downloads")} value={T.downloads} /><Tile label={t("stat.stars")} value={T.stars} />
        <Tile label={t("adm.broken")} value={T.broken} tone={T.broken ? "text-danger" : ""} />
      </dl>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={box}><h3 className="mb-4 font-display text-lg font-semibold">{t("adm.uploads14")}</h3><Bars data={o.series.uploads} /></section>
        <section className={box}><h3 className="mb-4 font-display text-lg font-semibold">{t("adm.signups14")}</h3><Bars data={o.series.users} /></section>
        <section className={box}><h3 className="mb-4 font-display text-lg font-semibold">{t("adm.byType")}</h3><HBars rows={o.byType} label={(k) => t(`type.${k}`)} /></section>
        <section className={box}><h3 className="mb-4 font-display text-lg font-semibold">{t("adm.topUnis")}</h3><HBars rows={o.topUniversities} /></section>
      </div>
      <section className={box}>
        <h3 className="mb-3 font-display text-lg font-semibold">{t("adm.recent")}</h3>
        <ul className="divide-y divide-line text-sm">{o.recent.map((r) => (
          <li key={`${r.kind}-${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <Badge tone={r.kind === "upload" ? "sky" : r.kind === "user" ? "mint" : "lilac"}>{t(`adm.k.${r.kind}`)}</Badge>
            <span className="min-w-0 flex-1 truncate">{r.text}</span>
            <span className="text-xs text-muted">{d(r.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </li>))}</ul>
      </section>
    </div>
  );
}

function useList(url, params) {
  const [state, setState] = useState({ items: [], pages: 1, total: 0, loading: true });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(params);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    api.get(url, { params }).then((r) => alive && setState({ items: r.data.items, pages: r.data.pages, total: r.data.total, loading: false })).catch(() => alive && setState((s) => ({ ...s, loading: false })));
    return () => { alive = false; };
  }, [url, key, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  return [state, () => setTick((x) => x + 1)];
}
function Toolbar({ q, setQ, children }) {
  const { t } = useI18n();
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1"><Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("nav.search")} className="ps-10" aria-label={t("nav.search")} /></div>
      {children}
    </div>
  );
}
function RejectModal({ item, onClose, onDone }) {
  const { t } = useI18n();
  const toast = useToast();
  const [reason, setReason] = useState(""); const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await api.patch(`/api/admin/content/${item._id}/reject`, { reason }); onDone(); } catch (e) { toast.error(errorMessage(e, t)); } finally { setBusy(false); } };
  return (
    <Modal open={!!item} onClose={onClose} title={t("adm.reject")} footer={<><Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button><Button variant="danger" loading={busy} onClick={go}>{t("adm.reject")}</Button></>}>
      <p className="mb-3 text-sm text-muted">{item?.title}</p>
      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("adm.reasonPh")} aria-label={t("adm.reasonPh")} />
    </Modal>
  );
}

function ContentRow({ item, onChanged }) {
  const { t, d } = useI18n();
  const toast = useToast();
  const [reject, setReject] = useState(false); const [del, setDel] = useState(false);
  const act = async (fn) => { try { await fn(); onChanged(); } catch (e) { toast.error(errorMessage(e, t)); } };
  const canFeature = item.status === "approved" && item.visibility === "public";
  return (
    <li className="rounded-2xl border border-line bg-raised p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/content/${item.slug}`} target="_blank" className="inline-flex max-w-full items-center gap-1.5 break-words font-medium hover:text-accent-text">{item.title}<ExternalLink className="size-3.5 shrink-0" /></Link>
          <p className="mt-0.5 text-xs text-muted">{item.uploader?.name || "—"} · {item.uploader?.email || ""} · {t(`type.${item.type}`)} · {d(item.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={STATUS_TONE[item.status]}>{t(`status.${item.status}`)}</Badge><Badge>{t(`vis.${item.visibility}`)}</Badge>
          {item.isFeatured && <Badge tone="amber" icon={Sparkles}>{t("adm.featured")}</Badge>}
          {item.hasBrokenFiles && <Badge tone="danger" icon={FileWarning}>{t("adm.brokenFile")}</Badge>}
        </div>
      </div>
      {item.abstract && <p className="mt-2 line-clamp-2 text-sm text-muted">{item.abstract}</p>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
        {item.status !== "approved" && <Button size="sm" onClick={() => act(() => api.patch(`/api/admin/content/${item._id}/approve`))} iconStart={<Check className="size-3.5" />}>{t("adm.approve")}</Button>}
        {item.status !== "rejected" && <Button size="sm" variant="secondary" onClick={() => setReject(true)} iconStart={<X className="size-3.5" />}>{t("adm.reject")}</Button>}
        {canFeature && <Button size="sm" variant="secondary" onClick={() => act(() => api.post(`/api/admin/features/${item._id}`))} iconStart={<Sparkles className="size-3.5" />}>{item.isFeatured ? t("adm.unfeature") : t("adm.feature")}</Button>}
        <Button size="sm" variant="outlineDanger" className="ms-auto" onClick={() => setDel(true)} iconStart={<Trash2 className="size-3.5" />}>{t("common.delete")}</Button>
      </div>
      {reject && <RejectModal item={item} onClose={() => setReject(false)} onDone={() => { setReject(false); onChanged(); }} />}
      <ConfirmDialog open={del} onClose={() => setDel(false)} onConfirm={() => act(async () => { await api.delete(`/api/admin/content/${item._id}`); setDel(false); })} title={t("dash.deleteTitle")} text={t("dash.deleteText", { title: item.title })} confirmLabel={t("common.delete")} />
    </li>
  );
}
function Moderation() {
  const { t } = useI18n();
  const [list, setList] = useState(null); const [tick, setTick] = useState(0);
  useEffect(() => { api.get("/api/admin/pending").then((r) => setList(r.data)); }, [tick]);
  if (!list) return <Skeleton className="h-40" />;
  if (!list.length) return <EmptyState icon={BadgeCheck} title={t("adm.queueEmpty")} />;
  return <ul className="space-y-3">{list.map((it) => <ContentRow key={it._id} item={it} onChanged={() => setTick((x) => x + 1)} />)}</ul>;
}
function ContentManager() {
  const { t } = useI18n();
  const [q, setQ] = useState(""); const [dq, setDq] = useState(""); const [status, setStatus] = useState(""); const [visibility, setVisibility] = useState(""); const [page, setPage] = useState(1);
  useEffect(() => { const id = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(id); }, [q]);
  const [s, reload] = useList("/api/admin/manage/content", { q: dq, status, visibility, page });
  return (
    <>
      <Toolbar q={q} setQ={setQ}>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t("adm.status")}><option value="">{t("adm.allStatus")}</option>{["pending", "approved", "rejected"].map((x) => <option key={x} value={x}>{t(`status.${x}`)}</option>)}</Select>
          <Select value={visibility} onChange={(e) => { setVisibility(e.target.value); setPage(1); }} aria-label={t("detail.visibility")}><option value="">{t("adm.allVis")}</option>{["public", "institutional", "protected"].map((x) => <option key={x} value={x}>{t(`vis.${x}`)}</option>)}</Select>
        </div>
      </Toolbar>
      {s.loading && !s.items.length ? <Skeleton className="h-40" /> : s.items.length === 0 ? <EmptyState icon={Search} title={t("discover.none")} /> : <ul className="space-y-3">{s.items.map((it) => <ContentRow key={it._id} item={it} onChanged={reload} />)}</ul>}
      <Pagination page={page} pages={s.pages} onChange={setPage} />
    </>
  );
}
function UserRow({ u, me, isAdmin, onChanged }) {
  const { t, d } = useI18n();
  const toast = useToast();
  const act = async (fn) => { try { await fn(); onChanged(); } catch (e) { toast.error(errorMessage(e, t)); } };
  const self = String(u._id) === String(me?._id);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-raised p-4">
      <Avatar src={u.avatarUrl} name={u.name} size={40} />
      <div className="min-w-0 flex-1 basis-48">
        <p className="flex flex-wrap items-center gap-1.5 font-medium"><span className="truncate">{u.name}</span>{u.isVerified && <BadgeCheck className="size-4 text-accent-text" />}{u.isSuspended && <Badge tone="danger">{t("adm.suspended")}</Badge>}</p>
        <p className="truncate text-xs text-muted">{u.email} · {d(u.createdAt)}{u.institution ? ` · ${u.institution}` : ""}</p>
      </div>
      {isAdmin ? (<>
        <div className="w-44"><Select value={u.role} disabled={self} onChange={(e) => act(() => api.patch(`/api/admin/users/${u._id}/role`, { role: e.target.value }))} aria-label={t("adm.role")}>{ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</Select></div>
        <Button size="sm" variant="secondary" onClick={() => act(() => api.patch(`/api/admin/users/${u._id}/verify`, { verified: !u.isVerified }))}>{u.isVerified ? t("adm.unverify") : t("adm.verify")}</Button>
        {!self && u.role !== "admin" && <Button size="sm" variant={u.isSuspended ? "secondary" : "outlineDanger"} onClick={() => act(() => api.patch(`/api/admin/users/${u._id}/suspend`, { suspended: !u.isSuspended }))} iconStart={<Ban className="size-3.5" />}>{u.isSuspended ? t("adm.unsuspend") : t("adm.suspend")}</Button>}
      </>) : <Badge>{t(`role.${u.role}`)}</Badge>}
    </li>
  );
}
function Users() {
  const { t } = useI18n();
  const { profile, isAdmin } = useAuth();
  const [q, setQ] = useState(""); const [dq, setDq] = useState(""); const [role, setRole] = useState(""); const [page, setPage] = useState(1);
  useEffect(() => { const id = setTimeout(() => { setDq(q); setPage(1); }, 350); return () => clearTimeout(id); }, [q]);
  const [s, reload] = useList("/api/admin/users", { q: dq, role, page });
  return (
    <>
      <Toolbar q={q} setQ={setQ}><div className="sm:w-52"><Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label={t("adm.role")}><option value="">{t("adm.allRoles")}</option>{ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}</Select></div></Toolbar>
      {!isAdmin && <Alert tone="info" className="mb-4">{t("adm.adminOnly")}</Alert>}
      {s.loading && !s.items.length ? <Skeleton className="h-40" /> : <ul className="space-y-3">{s.items.map((u) => <UserRow key={u._id} u={u} me={profile} isAdmin={isAdmin} onChanged={reload} />)}</ul>}
      <Pagination page={page} pages={s.pages} onChange={setPage} />
    </>
  );
}
function Comments() {
  const { t, d } = useI18n();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [s, reload] = useList("/api/admin/comments", { page });
  const [del, setDel] = useState(null);
  const remove = async () => { try { await api.delete(`/api/comments/${del._id}`); setDel(null); reload(); } catch (e) { toast.error(errorMessage(e, t)); } };
  if (s.loading && !s.items.length) return <Skeleton className="h-40" />;
  if (!s.items.length) return <EmptyState title={t("comment.none")} />;
  return (
    <>
      <ul className="space-y-3">{s.items.map((c) => (
        <li key={c._id} className="flex flex-wrap items-start gap-3 rounded-2xl border border-line bg-raised p-4">
          <Avatar src={c.author?.avatarUrl} name={c.author?.name} size={36} />
          <div className="min-w-0 flex-1 basis-56">
            <p className="text-sm"><span className="font-medium">{c.author?.name}</span> <span className="text-xs text-muted">{d(c.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span></p>
            <p className="mt-1 break-words text-sm text-ink/90">{c.body}</p>
            {c.content && <Link to={`/content/${c.content.slug}`} className="mt-1 inline-block text-xs text-accent-text hover:underline">{c.content.title}</Link>}
          </div>
          <Button size="sm" variant="outlineDanger" onClick={() => setDel(c)} iconStart={<Trash2 className="size-3.5" />}>{t("common.delete")}</Button>
        </li>))}</ul>
      <Pagination page={page} pages={s.pages} onChange={setPage} />
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} title={t("comment.deleteTitle")} text={t("comment.deleteText")} confirmLabel={t("common.delete")} />
    </>
  );
}

export default function Admin() {
  const { t } = useI18n();
  const [tab, setTab] = useState("overview");
  const [pending, setPending] = useState(0);
  const refresh = useCallback(() => api.get("/api/admin/stats").then((r) => setPending(r.data.pendingCount)).catch(() => {}), []);
  useEffect(() => { refresh(); }, [refresh, tab]);
  const tabs = [{ id: "overview", label: t("adm.overview") }, { id: "queue", label: t("adm.queue"), badge: pending }, { id: "content", label: t("adm.content") }, { id: "users", label: t("adm.users") }, { id: "comments", label: t("adm.comments") }];
  return (
    <div className="container-x py-8 sm:py-12">
      <p className="eyebrow mb-2">{t("adm.eyebrow")}</p>
      <h1 className="font-display text-3xl font-bold tracking-display sm:text-4xl">{t("nav.admin")}</h1>
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mt-6" />
      <div className="mt-8">
        {tab === "overview" && <Overview />}{tab === "queue" && <Moderation />}{tab === "content" && <ContentManager />}{tab === "users" && <Users />}{tab === "comments" && <Comments />}
      </div>
    </div>
  );
}
