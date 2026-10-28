import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [topContent, setTopContent] = useState([]);
  const [topAuthors, setTopAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/api/content", { params: { sort: "recent", limit: 8 } }),
      api.get("/api/content/leaderboard", { params: { limit: 5 } }),
      api.get("/api/users/leaderboard", { params: { limit: 5 } }),
    ]).then(([recentResult, contentResult, authorsResult]) => {
      if (recentResult.status === "fulfilled") setRecent(recentResult.value.data.items);
      if (contentResult.status === "fulfilled") setTopContent(contentResult.value.data);
      if (authorsResult.status === "fulfilled") setTopAuthors(authorsResult.value.data);
    }).finally(() => setLoading(false));
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : "/discover");
  }

  return (
    <div>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:py-28">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Schools · Colleges · Universities · Research Institutes
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            Every paper, thesis, and project — in one open shelf.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted">
            Stacks is where students and researchers upload, find, and discuss academic
            work from classrooms around the world.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl">
            <div className="flex overflow-hidden rounded-md border border-line bg-canvas shadow-subtle focus-within:border-accent">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                placeholder="Search by title, author, university, or topic…"
                className="flex-1 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <button type="submit" className="bg-accent px-5 text-sm font-medium text-canvas hover:bg-accent-dark">
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-ink">Recently added</h2>
          <a href="/discover" className="text-sm text-accent hover:underline">
            Browse all →
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : recent.length === 0 ? (
          <EmptyHome />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recent.map((item) => (
              <ContentCard key={item._id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="mb-5 font-display text-2xl text-ink">Community leaderboard</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Most starred work</h3>
            {topContent.length === 0 ? <p className="text-sm text-muted">No ranked uploads yet.</p> : (
              <ol className="divide-y divide-line rounded-md border border-line">
                {topContent.map((item, index) => (
                  <li key={item._id} className="flex items-center gap-3 p-3">
                    <span className="w-6 font-mono text-sm text-muted">{index + 1}.</span>
                    <Link to={`/content/${item.slug}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-accent">{item.title}</Link>
                    <span className="font-mono text-xs text-muted">★ {item.counts?.stars ?? 0}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Top contributors</h3>
            {topAuthors.length === 0 ? <p className="text-sm text-muted">No ranked authors yet.</p> : (
              <ol className="divide-y divide-line rounded-md border border-line">
                {topAuthors.map((author, index) => (
                  <li key={author._id} className="flex items-center gap-3 p-3">
                    <span className="w-6 font-mono text-sm text-muted">{index + 1}.</span>
                    <img src={author.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(author.name)}`} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <Link to={`/profile/${author._id}`} className="min-w-0 flex-1 truncate text-sm font-medium text-ink hover:text-accent">{author.name}</Link>
                    <span className="font-mono text-xs text-muted">★ {author.stats?.starsReceived ?? 0}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyHome() {
  return (
    <div className="rounded-md border border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-lg text-ink">The shelf is empty — for now.</p>
      <p className="mt-1 text-sm text-muted">
        Be the first to upload a paper, thesis, or project once the database is connected.
      </p>
    </div>
  );
}
