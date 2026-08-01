import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { typeLabel } from "../constants.js";

export default function Admin() {
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  function load() {
    setLoading(true);
    Promise.all([api.get("/api/admin/pending"), api.get("/api/admin/stats")])
      .then(([p, s]) => {
        setPending(p.data);
        setStats(s.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function approve(id) {
    await api.patch(`/api/admin/content/${id}/approve`);
    load();
  }

  async function reject(id) {
    await api.patch(`/api/admin/content/${id}/reject`, { reason });
    setRejecting(null);
    setReason("");
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl text-ink">Admin</h1>

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 border-y border-line py-5 font-mono text-sm sm:grid-cols-4">
          <Stat label="Users" value={stats.totalUsers} />
          <Stat label="Total uploads" value={stats.totalContent} />
          <Stat label="Pending review" value={stats.pendingCount} />
          <Stat label="Approved" value={stats.approvedCount} />
        </div>
      )}

      <h2 className="mt-10 font-display text-xl text-ink">Approval queue</h2>

      {loading ? (
        <p className="mt-4 text-sm text-muted">Loading…</p>
      ) : pending.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing waiting for review. 🎉</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {pending.map((item) => (
            <li key={item._id} className="rounded-md border border-line p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="font-mono text-xs text-muted">
                    {typeLabel(item.type)} · {item.uploader?.name} ({item.uploader?.email})
                  </p>
                  {item.abstract && <p className="mt-1 text-sm text-muted line-clamp-2">{item.abstract}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/content/${item.slug}`}
                    target="_blank"
                    className="rounded-md border border-line px-3 py-1.5 text-sm text-ink"
                  >
                    Preview
                  </Link>
                  <button
                    onClick={() => approve(item._id)}
                    className="rounded-md bg-accent px-3 py-1.5 text-sm text-canvas hover:bg-accent-dark"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setRejecting(item._id)}
                    className="rounded-md border border-line px-3 py-1.5 text-sm text-ink"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {rejecting === item._id && (
                <div className="mt-3 flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Reason for rejection (shown to the uploader)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <button onClick={() => reject(item._id)} className="rounded-md bg-ink px-3 py-1.5 text-sm text-canvas">
                    Confirm
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-lg text-ink">{value ?? 0}</p>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
