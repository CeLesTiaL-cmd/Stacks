import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { typeLabel } from "../constants.js";

const TABS = ["Uploads", "Bookmarks", "Settings"];

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState("Uploads");
  const [uploads, setUploads] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/users/me/dashboard")
      .then(({ data }) => {
        setUploads(data.uploads);
        setBookmarks(data.bookmarks);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-3xl text-ink">Dashboard</h1>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm ${
              tab === t ? "border-b-2 border-accent text-ink" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <p className="text-sm text-muted">Loading…</p>}

        {!loading && tab === "Uploads" && (
          <div className="space-y-3">
            {uploads.length === 0 && (
              <EmptyState text="You haven't uploaded anything yet." cta="Upload your first paper" to="/upload" />
            )}
            {uploads.map((u) => (
              <div key={u._id} className="flex items-center justify-between rounded-md border border-line p-4">
                <div>
                  <Link to={`/content/${u.slug}`} className="font-medium text-ink hover:text-accent">
                    {u.title}
                  </Link>
                  <p className="font-mono text-xs text-muted">{typeLabel(u.type)}</p>
                </div>
                <StatusBadge status={u.status} />
              </div>
            ))}
          </div>
        )}

        {!loading && tab === "Bookmarks" && (
          <div className="space-y-3">
            {bookmarks.length === 0 && (
              <EmptyState text="No bookmarks yet." cta="Browse the shelf" to="/discover" />
            )}
            {bookmarks.map((b) => (
              <Link
                key={b._id}
                to={`/content/${b.slug}`}
                className="block rounded-md border border-line p-4 hover:border-accent"
              >
                <p className="font-medium text-ink">{b.title}</p>
                <p className="font-mono text-xs text-muted">{typeLabel(b.type)}</p>
              </Link>
            ))}
          </div>
        )}

        {tab === "Settings" && <SettingsForm profile={profile} onSaved={refreshProfile} />}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    approved: "bg-accent-tint text-accent border-accent/30",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs capitalize ${styles[status]}`}>{status}</span>
  );
}

function EmptyState({ text, cta, to }) {
  return (
    <div className="rounded-md border border-dashed border-line px-6 py-12 text-center">
      <p className="text-sm text-muted">{text}</p>
      <Link to={to} className="mt-2 inline-block text-sm text-accent hover:underline">
        {cta} →
      </Link>
    </div>
  );
}

function SettingsForm({ profile, onSaved }) {
  const [form, setForm] = useState({
    bio: profile?.bio || "",
    university: profile?.university || "",
    department: profile?.department || "",
    country: profile?.country || "",
    website: profile?.website || "",
    github: profile?.github || "",
    linkedin: profile?.linkedin || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch("/api/users/me", form);
      await onSaved();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-md space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Bio</span>
        <textarea className="input min-h-[80px]" value={form.bio} onChange={(e) => update("bio", e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">University</span>
        <input className="input" value={form.university} onChange={(e) => update("university", e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Department</span>
        <input className="input" value={form.department} onChange={(e) => update("department", e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Country</span>
        <input className="input" value={form.country} onChange={(e) => update("country", e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Website</span>
        <input className="input" value={form.website} onChange={(e) => update("website", e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">GitHub</span>
        <input className="input" value={form.github} onChange={(e) => update("github", e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">LinkedIn</span>
        <input className="input" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-accent px-4 py-2 text-sm text-canvas hover:bg-accent-dark disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && <p className="text-sm text-accent">Saved.</p>}
    </form>
  );
}
