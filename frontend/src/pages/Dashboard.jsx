import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Bookmark as BookmarkIcon, CloudUpload, Eye, Mail, Pencil, Trash2 } from "lucide-react";
import api, { errorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { VISIBILITIES } from "../lib/fileTypes.js";
import Avatar from "../components/ui/Avatar.jsx";
import Button from "../components/ui/Button.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import ContentCard from "../components/ContentCard.jsx";
import { Field, Input, Select, Switch, Textarea } from "../components/ui/form.jsx";
import { Alert, Badge, CardSkeleton, EmptyState } from "../components/ui/feedback.jsx";
import { ConfirmDialog, Modal } from "../components/ui/Modal.jsx";

const STATUS_TONE = { pending: "warn", approved: "accent", rejected: "danger" };

function EditModal({ item, onClose, onSaved }) {
  const { t } = useI18n();
  const toast = useToast();
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (item) setF({ title: item.title || "", abstract: item.abstract || "", description: item.description || "", tags: (item.tags || []).join(", "), visibility: item.visibility || "public", authorizedEmails: (item.authorizedEmails || []).join(", ") }); }, [item]);
  if (!item || !f) return null;
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    try { await api.patch(`/api/content/${item._id}`, f); toast.success(t("dash.saved")); onSaved(); }
    catch (err) { toast.error(errorMessage(err, t)); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={t("dash.edit")} size="lg" footer={<><Button variant="secondary" onClick={onClose}>{t("common.cancel")}</Button><Button loading={busy} onClick={save}>{t("common.save")}</Button></>}>
      <div className="space-y-4">
        {item.status === "approved" && <Alert tone="info">{t("dash.reReview")}</Alert>}
        <Field label={t("up.f.title")}>{(id) => <Input id={id} value={f.title} maxLength={200} onChange={(e) => set("title", e.target.value)} />}</Field>
        <Field label={t("up.f.abstract")}>{(id) => <Textarea id={id} value={f.abstract} maxLength={1000} onChange={(e) => set("abstract", e.target.value)} />}</Field>
        <Field label={t("up.f.description")}>{(id) => <Textarea id={id} value={f.description} onChange={(e) => set("description", e.target.value)} />}</Field>
        <Field label={t("up.f.tags")} hint={t("up.f.tagsHint")}>{(id) => <Input id={id} value={f.tags} onChange={(e) => set("tags", e.target.value)} />}</Field>
        <Field label={t("detail.visibility")}>{(id) => <Select id={id} value={f.visibility} onChange={(e) => set("visibility", e.target.value)}>{VISIBILITIES.map((v) => <option key={v} value={v}>{t(`vis.${v}`)}</option>)}</Select>}</Field>
        {f.visibility === "protected" && <Field label={t("up.f.authorized")} hint={t("up.f.authorizedHint")}>{(id) => <Input id={id} value={f.authorizedEmails} onChange={(e) => set("authorizedEmails", e.target.value)} />}</Field>}
      </div>
    </Modal>
  );
}

function UploadsTab({ uploads, onChanged }) {
  const { t, n, d } = useI18n();
  const toast = useToast();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/api/content/${deleting._id}`); setDeleting(null); toast.success(t("dash.deleted")); onChanged(); }
    catch (err) { toast.error(errorMessage(err, t)); } finally { setBusy(false); }
  };
  if (!uploads.length) return <EmptyState icon={CloudUpload} title={t("dash.noUploads")} action={<Button to="/upload">{t("nav.upload")}</Button>} />;
  return (
    <>
      <ul className="space-y-3">
        {uploads.map((u) => (
          <li key={u._id} className="rounded-2xl border border-line bg-raised p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><Link to={`/content/${u.slug}`} className="break-words font-medium hover:text-accent-text">{u.title}</Link><p className="mt-0.5 text-xs text-muted">{t(`type.${u.type}`)} · {d(u.createdAt)}</p></div>
              <div className="flex flex-wrap gap-1.5"><Badge tone={STATUS_TONE[u.status]}>{t(`status.${u.status}`)}</Badge><Badge>{t(`vis.${u.visibility}`)}</Badge></div>
            </div>
            {u.status === "rejected" && u.rejectionReason && <p className="mt-2 text-sm text-danger">{t("detail.rejected")}: {u.rejectionReason}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-xs text-muted tabular-nums">
              <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{n(u.counts?.views ?? 0)}</span><span>★ {n(u.counts?.stars ?? 0)}</span><span>↓ {n(u.counts?.downloads ?? 0)}</span>
              <span className="ms-auto flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditing(u)} iconStart={<Pencil className="size-3.5" />}>{t("common.edit")}</Button>
                <Button size="sm" variant="outlineDanger" onClick={() => setDeleting(u)} iconStart={<Trash2 className="size-3.5" />}>{t("common.delete")}</Button>
              </span>
            </div>
          </li>
        ))}
      </ul>
      {editing && <EditModal item={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title={t("dash.deleteTitle")} text={t("dash.deleteText", { title: deleting?.title || "" })} confirmLabel={t("common.delete")} />
    </>
  );
}

function Settings() {
  const { t } = useI18n();
  const toast = useToast();
  const { profile, firebaseUser, refreshProfile, sendVerificationEmail, refreshFirebaseUser } = useAuth();
  const [form, setForm] = useState({ name: profile?.name || "", bio: profile?.bio || "", university: profile?.university || "", department: profile?.department || "", country: profile?.country || "", website: profile?.website || "", github: profile?.github || "", linkedin: profile?.linkedin || "" });
  const [privacy, setPrivacy] = useState({ profileVisibility: "public", hideUploadHistory: false, hideStatistics: false, hideFollowers: false, ...(profile?.privacy || {}) });
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(profile?.avatarUrl || "");
  const [busy, setBusy] = useState("");
  const [instError, setInstError] = useState("");

  const run = async (key, fn, ok) => { setBusy(key); try { await fn(); if (ok) toast.success(ok); } catch (err) { toast.error(errorMessage(err, t)); } finally { setBusy(""); } };
  const saveProfile = (e) => { e.preventDefault(); run("profile", async () => { await api.patch("/api/users/me", { ...form, privacy }); await refreshProfile(); }, t("dash.saved")); };
  const uploadAvatar = () => run("avatar", async () => { const fd = new FormData(); fd.append("avatar", avatar); await api.post("/api/users/me/avatar", fd); await refreshProfile(); setAvatar(null); }, t("dash.avatarSaved"));
  const confirmInstitution = async () => {
    setInstError(""); setBusy("inst");
    try { await refreshFirebaseUser(); await api.post("/api/users/me/verify-institution", { email: profile.email }); await refreshProfile(); toast.success(t("dash.instOk")); }
    catch (err) { setInstError(errorMessage(err, t)); } finally { setBusy(""); }
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const card = "rounded-3xl border border-line bg-raised p-5 sm:p-6";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className={card}>
        <h2 className="font-display text-xl font-semibold tracking-display">{t("dash.photo")}</h2>
        <div className="mt-4 flex items-center gap-4">
          <Avatar src={preview} name={profile?.name} size={72} />
          <div className="min-w-0 flex-1">
            <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { setAvatar(f); setPreview(URL.createObjectURL(f)); } }} className="block w-full text-sm text-muted file:me-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink" />
            {avatar && <Button size="sm" className="mt-3" loading={busy === "avatar"} onClick={uploadAvatar}>{t("dash.savePhoto")}</Button>}
          </div>
        </div>
      </section>
      <section className={card}>
        <h2 className="font-display text-xl font-semibold tracking-display">{t("dash.institution")}</h2>
        <p className="mt-1 text-sm text-muted">{t("dash.institutionSub")}</p>
        {profile?.isInstitutionalVerified ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent-tint px-3 py-2 text-sm text-accent-text"><BadgeCheck className="size-4" />{profile.institution} · {profile.institutionalEmail}</p>
        ) : (
          <div className="mt-4 space-y-3">
            <p className="flex flex-wrap items-center gap-2 text-sm"><Mail className="size-4 text-muted" /><span className="min-w-0 break-all">{firebaseUser?.email}</span><Badge tone={firebaseUser?.emailVerified ? "accent" : "warn"}>{firebaseUser?.emailVerified ? t("dash.mailVerified") : t("dash.mailUnverified")}</Badge></p>
            <div className="flex flex-wrap gap-2">
              {!firebaseUser?.emailVerified && <Button size="sm" variant="secondary" loading={busy === "mail"} onClick={() => run("mail", sendVerificationEmail, t("dash.mailSent"))}>{t("dash.sendMail")}</Button>}
              <Button size="sm" loading={busy === "inst"} onClick={confirmInstitution}>{t("dash.confirmInst")}</Button>
            </div>
            {instError && <Alert tone="danger">{instError}</Alert>}
          </div>
        )}
      </section>
      <form onSubmit={saveProfile} className={`${card} space-y-4 lg:col-span-2`}>
        <h2 className="font-display text-xl font-semibold tracking-display">{t("dash.details")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("auth.name")}>{(id) => <Input id={id} value={form.name} onChange={(e) => set("name", e.target.value)} />}</Field>
          <Field label={t("filter.university")}>{(id) => <Input id={id} value={form.university} onChange={(e) => set("university", e.target.value)} />}</Field>
          <Field label={t("filter.department")}>{(id) => <Input id={id} value={form.department} onChange={(e) => set("department", e.target.value)} />}</Field>
          <Field label={t("filter.country")}>{(id) => <Input id={id} value={form.country} onChange={(e) => set("country", e.target.value)} />}</Field>
          <Field label={t("up.f.bio")} className="sm:col-span-2">{(id) => <Textarea id={id} value={form.bio} maxLength={500} onChange={(e) => set("bio", e.target.value)} />}</Field>
          <Field label={t("profile.website")}>{(id) => <Input id={id} type="url" value={form.website} onChange={(e) => set("website", e.target.value)} />}</Field>
          <Field label="GitHub">{(id) => <Input id={id} type="url" value={form.github} onChange={(e) => set("github", e.target.value)} />}</Field>
          <Field label="LinkedIn" className="sm:col-span-2">{(id) => <Input id={id} type="url" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} />}</Field>
        </div>
        <div className="divide-y divide-line border-t border-line pt-2">
          <Switch checked={privacy.profileVisibility === "public"} onChange={(v) => setPrivacy((p) => ({ ...p, profileVisibility: v ? "public" : "private" }))} label={t("dash.pubProfile")} hint={t("dash.pubProfileHint")} />
          <Switch checked={privacy.hideUploadHistory} onChange={(v) => setPrivacy((p) => ({ ...p, hideUploadHistory: v }))} label={t("dash.hideUploads")} />
          <Switch checked={privacy.hideStatistics} onChange={(v) => setPrivacy((p) => ({ ...p, hideStatistics: v }))} label={t("dash.hideStats")} />
        </div>
        <Button type="submit" loading={busy === "profile"}>{t("common.save")}</Button>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { t, n } = useI18n();
  const { profile } = useAuth();
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState({ uploads: [], bookmarks: [] });
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => { api.get("/api/users/me/dashboard").then((r) => setData(r.data)).finally(() => setLoading(false)); }, []);
  useEffect(load, [load]);

  const pending = data.uploads.filter((u) => u.status === "pending").length;
  const tabs = [{ id: "overview", label: t("dash.overview") }, { id: "uploads", label: t("dash.uploads"), badge: pending }, { id: "bookmarks", label: t("dash.bookmarks") }, { id: "settings", label: t("dash.settings") }];
  const stats = [[t("stat.uploads"), data.uploads.length], [t("stat.stars"), profile?.stats?.starsReceived ?? 0], [t("stat.downloads"), profile?.stats?.downloadsReceived ?? 0], [t("dash.pending"), pending]];

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="flex items-center gap-4"><Avatar src={profile?.avatarUrl} name={profile?.name} size={56} /><div className="min-w-0"><h1 className="truncate font-display text-3xl font-bold tracking-display">{profile?.name}</h1><p className="truncate text-sm text-muted">{profile?.email}</p></div></div>
      <Tabs tabs={tabs} value={tab} onChange={setTab} className="mt-8" />
      <div className="mt-8">
        {tab === "overview" && (
          <div className="space-y-8">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([l, v]) => <div key={l} className="rounded-2xl border border-line bg-raised px-4 py-4"><dd className="font-display text-3xl font-bold tabular-nums">{n(v)}</dd><dt className="text-xs text-muted">{l}</dt></div>)}</dl>
            {!profile?.isInstitutionalVerified && <Alert tone="info">{t("dash.verifyPrompt")} <button className="underline" onClick={() => setTab("settings")}>{t("dash.settings")}</button></Alert>}
            <div className="flex flex-wrap gap-3"><Button to="/upload" iconStart={<CloudUpload className="size-4" />}>{t("nav.upload")}</Button><Button variant="secondary" onClick={() => setTab("uploads")}>{t("dash.uploads")}</Button></div>
          </div>
        )}
        {tab === "uploads" && (loading ? <CardSkeleton /> : <UploadsTab uploads={data.uploads} onChanged={load} />)}
        {tab === "bookmarks" && (loading ? <CardSkeleton /> : data.bookmarks.length === 0
          ? <EmptyState icon={BookmarkIcon} title={t("dash.noBookmarks")} action={<Button to="/discover">{t("nav.discover")}</Button>} />
          : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.bookmarks.map((b) => <ContentCard key={b._id} item={b} />)}</div>)}
        {tab === "settings" && <Settings />}
      </div>
    </div>
  );
}
