import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { typeLabel } from "../constants.js";

export default function ContentDetail() {
  const { slug } = useParams();
  const { firebaseUser, profile } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/api/content/${slug}`)
      .then(({ data }) => setData(data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data?.content?._id) return;
    api
      .get(`/api/comments/content/${data.content._id}`)
      .then(({ data }) => setComments(data))
      .catch(() => setComments([]));
  }, [data?.content?._id]);

  if (loading) return <div className="px-4 py-20 text-center text-muted">Loading…</div>;
  if (!data) {
    return (
      <div className="px-4 py-20 text-center">
        <p className="font-display text-xl text-ink">We couldn't find that upload.</p>
        <Link to="/discover" className="mt-2 inline-block text-accent hover:underline">
          Back to discover
        </Link>
      </div>
    );
  }

  const { content, viewerHasStarred, viewerHasBookmarked } = data;

  async function toggleStar() {
    if (!firebaseUser) return;
    setBusy(true);
    try {
      await api.post(`/api/content/${content._id}/star`);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleBookmark() {
    if (!firebaseUser) return;
    setBusy(true);
    try {
      await api.post(`/api/content/${content._id}/bookmark`);
      load();
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(fileIndex) {
    const { data: result } = await api.post(`/api/content/${content._id}/download/${fileIndex}`);
    const apiUrl = api.defaults.baseURL;
    window.open(`${apiUrl}${result.url}`, "_blank");
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!commentBody.trim()) return;
    const { data: created } = await api.post(`/api/comments/content/${content._id}`, {
      body: commentBody,
    });
    setComments((c) => [...c, created]);
    setCommentBody("");
  }

  async function handleShare() {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <p className="font-mono text-xs uppercase tracking-wide text-muted">{typeLabel(content.type)}</p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink">{content.title}</h1>
      {content.subtitle && <p className="mt-1 text-lg text-muted">{content.subtitle}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        <Link to={`/profile/${content.uploader._id}`} className="font-medium text-ink hover:text-accent">
          {content.uploader.name}
        </Link>
        {content.university && <span>· {content.university}</span>}
        {content.year && <span>· {content.year}</span>}
      </div>

      {content.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {content.tags.map((tag) => (
            <Link
              key={tag}
              to={`/discover?tag=${encodeURIComponent(tag)}`}
              className="rounded-full border border-line px-3 py-1 font-mono text-xs text-muted hover:border-accent hover:text-accent"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 border-y border-line py-3">
        <button
          onClick={toggleStar}
          disabled={busy || !firebaseUser}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            viewerHasStarred ? "border-accent bg-accent-tint text-accent" : "border-line text-ink"
          }`}
        >
          ★ {content.counts.stars}
        </button>
        <button
          onClick={toggleBookmark}
          disabled={busy || !firebaseUser}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            viewerHasBookmarked ? "border-accent bg-accent-tint text-accent" : "border-line text-ink"
          }`}
        >
          {viewerHasBookmarked ? "Bookmarked" : "Bookmark"}
        </button>
        <button onClick={handleShare} className="rounded-md border border-line px-3 py-1.5 text-sm text-ink">
          Share
        </button>
        <span className="ml-auto font-mono text-xs text-muted">
          {content.counts.views} views · {content.counts.downloads} downloads
        </span>
      </div>

      {content.abstract && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-ink">Abstract</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">{content.abstract}</p>
        </section>
      )}

      {content.description && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-ink">Description</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/90">{content.description}</p>
        </section>
      )}

      {content.files?.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-ink">Files</h2>
          <ul className="mt-3 divide-y divide-line rounded-md border border-line">
            {content.files.map((file, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink">{file.originalName}</span>
                <button onClick={() => handleDownload(i)} className="text-accent hover:underline">
                  Download
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(content.githubRepo || content.youtubeUrl || content.doi) && (
        <section className="mt-8 space-y-1 text-sm">
          {content.githubRepo && (
            <p>
              <span className="text-muted">GitHub: </span>
              <a href={content.githubRepo} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                {content.githubRepo}
              </a>
            </p>
          )}
          {content.youtubeUrl && (
            <p>
              <span className="text-muted">Video: </span>
              <a href={content.youtubeUrl} className="text-accent hover:underline" target="_blank" rel="noreferrer">
                {content.youtubeUrl}
              </a>
            </p>
          )}
          {content.doi && (
            <p>
              <span className="text-muted">DOI: </span>
              <span className="font-mono">{content.doi}</span>
            </p>
          )}
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl text-ink">
          Discussion ({comments.length})
        </h2>

        {firebaseUser ? (
          <form onSubmit={submitComment} className="mt-4 flex gap-2">
            <input
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Ask a question or share a thought…"
              className="input flex-1"
            />
            <button type="submit" className="rounded-md bg-accent px-4 text-sm text-canvas hover:bg-accent-dark">
              Post
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        )}

        <ul className="mt-6 space-y-4">
          {comments.map((c) => (
            <li key={c._id} className="border-b border-line pb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-ink">{c.author?.name}</span>
                {c.isAuthorReply && (
                  <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs text-accent">Author</span>
                )}
                {c.isPinned && <span className="text-xs text-muted">· Pinned</span>}
              </div>
              <p className="mt-1 text-sm text-ink/90">{c.body}</p>
            </li>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted">No comments yet — be the first to ask a question.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
