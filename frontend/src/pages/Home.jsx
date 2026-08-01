import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";

export default function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/content", { params: { sort: "recent", limit: 8 } })
      .then(({ data }) => setRecent(data.items))
      .catch(() => setRecent([]))
      .finally(() => setLoading(false));
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
