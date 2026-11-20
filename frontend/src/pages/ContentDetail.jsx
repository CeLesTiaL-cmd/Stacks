import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Bookmark, Clock, Download, ExternalLink, Eye, Link2, MessageSquare, Pin, Reply, Share2, Sparkles, Star, ThumbsUp, Trash2, TriangleAlert } from "lucide-react";
import api, { cachedGet, errorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { cn } from "../lib/cn.js";
import { downloadWorkFile } from "../lib/downloadWork.js";
import { optimizedImage } from "../lib/cloud.js";
import { fileKind, TONE, TYPE_TONE } from "../lib/fileTypes.js";
import { formatBytes, timeAgo } from "../lib/format.js";
import Avatar from "../components/ui/Avatar.jsx";
import Button from "../components/ui/Button.jsx";
import { Textarea } from "../components/ui/form.jsx";
import { Alert, Badge, EmptyState, PageSkeleton, ProgressBar } from "../components/ui/feedback.jsx";
import { ConfirmDialog } from "../components/ui/Modal.jsx";
import { LogoMark } from "../components/visuals/Logo.jsx";
import FileViewer, { previewMode } from "../components/FileViewer.jsx";
import AiPanel from "../components/AiPanel.jsx";
import EmojiPicker from "../components/EmojiPicker.jsx";
import GithubCard, { parseGithub } from "../components/GithubCard.jsx";
import CiteCard from "../components/CiteCard.jsx";

function FileRow({ file, index, contentId, isPublic, onPreview, onError }) {
  const { t } = useI18n();
  const [progress, setProgress] = useState(null);
  const k = fileKind(file.originalName);
  const tone = TONE[k.tone];
  const Icon = k.icon;
  const valid = String(file.url || "").startsWith("http");
  const canPreview = previewMode(file, isPublic) !== "none";

  const download = async () => {
    setProgress(0);
    try { await downloadWorkFile(api, contentId, index, file.originalName, setProgress); }
    catch (err) { onError(err); } finally { setTimeout(() => setProgress(null), 600); }
  };

  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className={cn("inline-flex size-11 shrink-0 items-center justify-center rounded-xl", tone.bg)}><Icon className={cn("size-5", tone.text)} /></span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={file.originalName}>{file.originalName}</p>
          <p className="text-xs text-muted tabular-nums">{[k.ext.replace(".", "").toUpperCase(), formatBytes(file.sizeBytes)].filter(Boolean).join(" · ")}</p>
        </div>
      </div>
      {valid ? (
        <div className="flex shrink-0 items-center gap-2">
          {canPreview && <Button variant="secondary" size="sm" onClick={() => onPreview(file, index)} iconStart={<Eye className="size-4" />}>{t("file.preview")}</Button>}
          <Button size="sm" onClick={download} loading={progress !== null} iconStart={<Download className="size-4" />}>{progress !== null && progress > 0 && progress < 100 ? `${progress}%` : t("file.download")}</Button>
        </div>
      ) : <Badge tone="danger" icon={TriangleAlert}>{t("file.unavailable")}</Badge>}
      {progress !== null && progress > 0 && <ProgressBar value={progress} className="sm:hidden" />}
    </li>
  );
}

function Comment({ c, replies, canReply, canDelete, canPin, onReply, onDelete, onPin, onVote, depth = 0 }) {
  const { t, n, locale } = useI18n();
  const staff = c.author?.isStaff;
  return (
    <li className={cn(depth && "ms-8 border-s border-line ps-4")}>
      <div className="flex gap-3 py-4">
        {staff ? <LogoMark className="size-9 shrink-0" /> : <Avatar src={c.author?.avatarUrl} name={c.author?.name} size={36} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{c.author?.name}</span>
            {staff && <Badge tone="accent">{t("comment.staff")}</Badge>}
            {c.isAuthorReply && !staff && <Badge tone="accent">{t("comment.author")}</Badge>}
            {c.isPinned && <Badge tone="amber" icon={Pin}>{t("comment.pinned")}</Badge>}
            <span className="text-xs text-muted">{timeAgo(c.createdAt, locale)}</span>
          </div>
          <p className="mt-1 whitespace-pre-line break-words text-sm text-ink/90">{c.body}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <button onClick={() => onVote(c)} aria-pressed={!!c.viewerUpvoted} title={t("comment.agree")} className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 tabular-nums transition", c.viewerUpvoted ? "border-accent bg-accent-tint text-accent-text" : "border-line hover:border-ink/40 hover:text-ink")}>
              <ThumbsUp className={cn("size-3.5", c.viewerUpvoted && "fill-current")} />{t("comment.agree")}{c.upvotes > 0 && <span>· {n(c.upvotes)}</span>}
            </button>
            {canReply && depth === 0 && <button onClick={() => onReply(c)} className="inline-flex items-center gap-1 hover:text-ink"><Reply className="size-3.5" />{t("comment.reply")}</button>}
            {canPin && <button onClick={() => onPin(c)} className="inline-flex items-center gap-1 hover:text-ink"><Pin className="size-3.5" />{c.isPinned ? t("comment.unpin") : t("comment.pin")}</button>}
            {canDelete(c) && <button onClick={() => onDelete(c)} className="inline-flex items-center gap-1 hover:text-danger"><Trash2 className="size-3.5" />{t("common.delete")}</button>}
          </div>
        </div>
      </div>
      {replies.length > 0 && <ul>{replies.map((r) => <Comment key={r._id} c={r} replies={[]} depth={1} canReply={false} canDelete={canDelete} canPin={false} onDelete={onDelete} onVote={onVote} />)}</ul>}
    </li>
  );
}

export default function ContentDetail() {
  const { slug } = useParams();
  const { t, n, d } = useI18n();
  const toast = useToast();
  const { firebaseUser, profile, isModerator } = useAuth();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [posting, setPosting] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [sort, setSort] = useState("top");
  const [viewing, setViewing] = useState(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    api.get(`/api/content/${slug}`).then((r) => { if (alive) { setData(r.data); setStatus("ok"); } }).catch((e) => alive && setStatus(e.response?.status === 404 ? "missing" : "error"));
    return () => { alive = false; };
  }, [slug]);
  useEffect(() => { cachedGet("/api/ai/status", { ttl: 300000 }).then((r) => setAiEnabled(!!r.enabled)).catch(() => {}); }, []);

  const contentId = data?.content?._id;
  const loadComments = useCallback(() => { if (contentId) api.get(`/api/comments/content/${contentId}`).then((r) => setComments(r.data)).catch(() => {}); }, [contentId]);
  useEffect(loadComments, [loadComments]);

  const tree = useMemo(() => {
    const ids = new Set(comments.map((c) => c._id));
    const top = comments.filter((c) => !c.parentComment || !ids.has(c.parentComment));
    top.sort((a, b) => Number(!!b.isPinned) - Number(!!a.isPinned) || (sort === "top" ? (b.upvotes || 0) - (a.upvotes || 0) : 0) || new Date(a.createdAt) - new Date(b.createdAt));
    return top.map((c) => ({ c, replies: comments.filter((r) => r.parentComment === c._id) }));
  }, [comments, sort]);

  if (status === "loading") return <PageSkeleton />;
  if (status !== "ok") return <div className="container-x py-24"><EmptyState icon={Link2} title={status === "missing" ? t("detail.missing") : t("err.generic")} text={status === "missing" ? t("detail.missingText") : undefined} action={<Button to="/discover">{t("nav.discover")}</Button>} /></div>;

  const { content, viewerHasStarred, viewerHasBookmarked } = data;
  const isOwner = profile && String(content.uploader?._id) === String(profile._id);
  const toneName = TYPE_TONE[content.type] || "muted";
  const isPublicWork = content.visibility === "public" && content.status === "approved";
  const showAi = aiEnabled && isPublicWork;

  const toggle = async (kind) => {
    if (!firebaseUser) return toast.info(t("detail.signInFirst"));
    try {
      const { data: r } = await api.post(`/api/content/${content._id}/${kind}`);
      setData((p) => kind === "star"
        ? { ...p, viewerHasStarred: r.starred, content: { ...p.content, counts: { ...p.content.counts, stars: r.starCount } } }
        : { ...p, viewerHasBookmarked: r.bookmarked, content: { ...p.content, counts: { ...p.content.counts, bookmarks: r.bookmarkCount } } });
    } catch (err) { toast.error(errorMessage(err, t)); }
  };
  const share = async () => {
    const url = window.location.href;
    try { if (navigator.share) await navigator.share({ title: content.title, url }); else { await navigator.clipboard.writeText(url); toast.success(t("detail.copied")); } } catch { /* cancelled */ }
  };
  const post = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try { await api.post(`/api/comments/content/${content._id}`, { body, parentComment: replyTo?._id }); setBody(""); setReplyTo(null); loadComments(); }
    catch (err) { toast.error(errorMessage(err, t)); } finally { setPosting(false); }
  };
  const vote = async (c) => {
    if (!firebaseUser) return toast.info(t("detail.signInFirst"));
    try {
      const { data: r } = await api.post(`/api/comments/${c._id}/upvote`);
      setComments((list) => list.map((x) => (x._id === c._id ? { ...x, upvotes: r.count, viewerUpvoted: r.upvoted } : x)));
    } catch (err) { toast.error(errorMessage(err, t)); }
  };
  const addEmoji = (emoji) => {
    const el = box.current;
    const at = el?.selectionStart ?? body.length;
    setBody((b) => `${b.slice(0, at)}${emoji}${b.slice(at)}`);
    requestAnimationFrame(() => { el?.focus(); const pos = at + emoji.length; el?.setSelectionRange?.(pos, pos); });
  };
  const removeComment = async () => { try { await api.delete(`/api/comments/${toDelete._id}`); setToDelete(null); loadComments(); } catch (err) { toast.error(errorMessage(err, t)); } };
  const pin = async (c) => { try { await api.patch(`/api/comments/${c._id}/pin`); loadComments(); } catch (err) { toast.error(errorMessage(err, t)); } };
  const downloadViewing = async () => {
    const i = content.files.indexOf(viewing);
    try { await downloadWorkFile(api, content._id, i, viewing.originalName); } catch (err) { toast.error(errorMessage(err, t)); }
  };

  const meta = [
    [t("detail.category"), content.category], [t("filter.university"), content.university], [t("filter.department"), content.department],
    [t("detail.course"), content.course], [t("detail.teacher"), content.teacher], [t("detail.semester"), content.semester],
    [t("filter.year"), content.year], [t("filter.language"), content.language], [t("detail.license"), t(`license.${content.license}`)],
    [t("detail.visibility"), t(`vis.${content.visibility}`)],
    ["DOI", content.doi && <a key="doi" href={`https://doi.org/${content.doi}`} target="_blank" rel="noopener noreferrer" className="text-accent-text hover:underline">{content.doi}</a>],
    [t("detail.publication"), content.publication],
  ].filter(([, v]) => v);
  const ghOk = !!parseGithub(content.githubRepo);
  const links = [!ghOk && content.githubRepo, content.youtubeUrl, ...(content.externalLinks || [])].filter(Boolean);
  const canDelete = (x) => profile && (String(x.author?._id) === String(profile._id) || isModerator);

  return (
    <article className="container-x py-8 sm:py-12">
      {content.status !== "approved" && (isOwner || isModerator) && (
        <Alert tone={content.status === "rejected" ? "danger" : "warn"} className="mb-6 flex items-start gap-2">
          <Clock className="mt-0.5 size-4 shrink-0" />
          <span>{content.status === "rejected" ? `${t("detail.rejected")}${content.rejectionReason ? `: ${content.rejectionReason}` : ""}` : t("detail.pending")}</span>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0">
          <Badge tone={toneName}>{t(`type.${content.type}`)}</Badge>
          <h1 className="mt-3 break-words font-display text-3xl font-bold leading-tight tracking-display sm:text-5xl">{content.title}</h1>
          {content.subtitle && <p className="mt-2 text-lg text-muted">{content.subtitle}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
            <Link to={`/profile/${content.uploader?._id}`} className="inline-flex items-center gap-2 font-medium text-ink hover:text-accent-text"><Avatar src={content.uploader?.avatarUrl} name={content.uploader?.name} size={28} />{content.uploader?.name}</Link>
            <span>{d(content.createdAt)}</span>
          </div>
          {content.thumbnailUrl && <img src={optimizedImage(content.thumbnailUrl, 1200)} alt="" decoding="async" className="mt-6 max-h-[28rem] w-full rounded-2xl border border-line object-cover" />}
          {content.tags?.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{content.tags.map((tag) => <Link key={tag} to={`/discover?tag=${encodeURIComponent(tag)}`} className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted transition hover:border-accent hover:text-accent-text">#{tag}</Link>)}</div>}
          {content.abstract && <section className="mt-8"><h2 className="mb-2 font-display text-xl font-semibold tracking-display">{t("detail.abstract")}</h2><p className="whitespace-pre-line break-words leading-relaxed">{content.abstract}</p></section>}
          {content.description && <section className="mt-8"><h2 className="mb-2 font-display text-xl font-semibold tracking-display">{t("detail.description")}</h2><p className="whitespace-pre-line break-words leading-relaxed text-ink/90">{content.description}</p></section>}
          {content.files?.length > 0 && (
            <section className="mt-10"><h2 className="mb-3 font-display text-xl font-semibold tracking-display">{t("detail.files")}</h2>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-raised">{content.files.map((f, i) => <FileRow key={i} file={f} index={i} contentId={content._id} isPublic={isPublicWork} onPreview={setViewing} onError={(err) => toast.error(errorMessage(err, t))} />)}</ul>
            </section>
          )}
          {ghOk && <GithubCard url={content.githubRepo} />}
          {links.length > 0 && <section className="mt-6 flex flex-wrap gap-3 text-sm">{links.map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 text-accent-text hover:underline"><span className="truncate">{u.replace(/^https?:\/\//, "")}</span><ExternalLink className="size-3.5 shrink-0" /></a>)}</section>}

          <section className="mt-12">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-display"><MessageSquare className="size-5" />{t("detail.discussion")} <span className="text-muted tabular-nums">({n(comments.length)})</span></h2>
              {comments.length > 1 && (
                <div className="inline-flex rounded-full border border-line p-0.5 text-xs" role="group">
                  {["top", "old"].map((s) => <button key={s} onClick={() => setSort(s)} aria-pressed={sort === s} className={cn("rounded-full px-3 py-1 transition", sort === s ? "bg-surface font-medium text-ink" : "text-muted")}>{t(`comment.sort.${s}`)}</button>)}
                </div>
              )}
            </div>
            {firebaseUser ? (
              <form onSubmit={post} className="mt-4 space-y-2">
                {replyTo && <p className="text-xs text-muted">{t("comment.replyingTo", { name: replyTo.author?.name })} <button type="button" className="underline" onClick={() => setReplyTo(null)}>{t("common.cancel")}</button></p>}
                <Textarea ref={box} value={body} onChange={(e) => setBody(e.target.value)} placeholder={t("comment.placeholder")} maxLength={2000} className="min-h-24" aria-label={t("detail.discussion")} />
                <div className="flex items-center justify-between"><EmojiPicker onPick={addEmoji} /><Button type="submit" size="sm" loading={posting} disabled={!body.trim()}>{t("comment.post")}</Button></div>
              </form>
            ) : <p className="mt-4 text-sm text-muted"><Link to="/login" className="text-accent-text underline">{t("nav.signin")}</Link> {t("comment.toJoin")}</p>}
            {tree.length === 0 ? <p className="mt-6 text-sm text-muted">{t("comment.none")}</p> : (
              <ul className="mt-4 divide-y divide-line">{tree.map(({ c, replies }) => <Comment key={c._id} c={c} replies={replies} canReply={!!firebaseUser} canPin={isOwner || isModerator} canDelete={canDelete} onReply={setReplyTo} onDelete={setToDelete} onPin={pin} onVote={vote} />)}</ul>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          {showAi && <Button className="w-full" size="lg" onClick={() => setAiOpen(true)} iconStart={<Sparkles className="size-4" />}>{t("ai.button")}</Button>}
          <div className="flex gap-2">
            <Button variant={viewerHasStarred ? "primary" : "secondary"} className="flex-1" onClick={() => toggle("star")} iconStart={<Star className={cn("size-4", viewerHasStarred && "fill-current")} />} aria-pressed={viewerHasStarred}>{n(content.counts?.stars ?? 0)}</Button>
            <Button variant={viewerHasBookmarked ? "primary" : "secondary"} className="flex-1" onClick={() => toggle("bookmark")} iconStart={<Bookmark className={cn("size-4", viewerHasBookmarked && "fill-current")} />} aria-pressed={viewerHasBookmarked}>{t("detail.save")}</Button>
            <Button variant="secondary" size="icon" onClick={share} aria-label={t("detail.share")}><Share2 className="size-4" /></Button>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[Eye, content.counts?.views, t("stat.views")], [Download, content.counts?.downloads, t("stat.downloads")], [MessageSquare, content.counts?.comments, t("stat.comments")]].map(([Icon, v, l]) => (
              <div key={l} className="rounded-xl border border-line bg-raised px-2 py-3"><Icon className="mx-auto size-4 text-muted" /><p className="mt-1 font-display text-lg font-bold tabular-nums">{n(v ?? 0)}</p><p className="text-[11px] text-muted">{l}</p></div>
            ))}
          </div>
          {meta.length > 0 && <dl className="divide-y divide-line rounded-2xl border border-line bg-raised text-sm">{meta.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="shrink-0 text-muted">{k}</dt><dd className="min-w-0 break-words text-end font-medium">{v}</dd></div>)}</dl>}
          <CiteCard content={content} />
        </aside>
      </div>

      {showAi && <button onClick={() => setAiOpen(true)} className="fixed bottom-4 end-4 z-30 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-accent-ink shadow-lift lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}><Sparkles className="size-4" />{t("ai.button")}</button>}
      <FileViewer file={viewing} isPublic={isPublicWork} onClose={() => setViewing(null)} onDownload={downloadViewing} />
      {showAi && <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} content={content} signedIn={!!firebaseUser} />}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={removeComment} title={t("comment.deleteTitle")} text={t("comment.deleteText")} confirmLabel={t("common.delete")} />
    </article>
  );
}
