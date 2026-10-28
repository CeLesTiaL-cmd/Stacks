import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { typeLabel, VISIBILITY_OPTIONS } from "../constants.js";

const TABS = ["Uploads", "Bookmarks", "Settings"];

export default function Dashboard() {
  const { profile, refreshProfile, firebaseUser, sendVerificationEmail, refreshFirebaseUser } = useAuth();
  const [tab, setTab] = useState("Uploads");
  const [uploads, setUploads] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadDashboard() {
    try {
      const { data } = await api.get("/api/users/me/dashboard");
      setUploads(data.uploads);
      setBookmarks(data.bookmarks);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
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
            {uploads.map((u) => <UploadRow key={u._id} item={u} onChanged={loadDashboard} />)}
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

        {tab === "Settings" && (
          <SettingsForm
            profile={profile}
            firebaseUser={firebaseUser}
            onSaved={refreshProfile}
            sendVerificationEmail={sendVerificationEmail}
            refreshFirebaseUser={refreshFirebaseUser}
          />
        )}
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

function UploadRow({ item, onChanged }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: item.title || "",
    abstract: item.abstract || "",
    description: item.description || "",
    tags: (item.tags || []).join(", "),
    visibility: item.visibility || "public",
    authorizedEmails: (item.authorizedEmails || []).join(", "),
  });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/api/content/${item._id}`, form);
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update this upload.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/content/${item._id}`);
      await onChanged();
    } catch (err) {
      setError(err.response?.data?.error || "Could not delete this upload.");
    }
  }

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/content/${item.slug}`} className="font-medium text-ink hover:text-accent">{item.title}</Link>
          <p className="mt-1 font-mono text-xs text-muted">{typeLabel(item.type)} · {item.visibility || "public"}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <button type="button" onClick={() => setEditing((value) => !value)} className="rounded border border-line px-3 py-1.5 text-sm hover:border-accent">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button type="button" onClick={remove} className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50">
            Delete
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {editing && (
        <form onSubmit={save} className="mt-4 space-y-3 border-t border-line pt-4">
          <label className="block text-sm">Title<input className="input mt-1" required maxLength={200} value={form.title} onChange={(e) => update("title", e.target.value)} /></label>
          <label className="block text-sm">Abstract<textarea className="input mt-1 min-h-20" maxLength={1000} value={form.abstract} onChange={(e) => update("abstract", e.target.value)} /></label>
          <label className="block text-sm">Description<textarea className="input mt-1 min-h-24" value={form.description} onChange={(e) => update("description", e.target.value)} /></label>
          <label className="block text-sm">Tags <span className="text-muted">(comma separated)</span><input className="input mt-1" value={form.tags} onChange={(e) => update("tags", e.target.value)} /></label>
          <label className="block text-sm">Visibility<select className="input mt-1" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>{VISIBILITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {form.visibility === "protected" && <label className="block text-sm">Advisor / team emails (optional) <input className="input mt-1" value={form.authorizedEmails} onChange={(e) => update("authorizedEmails", e.target.value)} placeholder="Leave blank for only you" /></label>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="rounded-md bg-accent px-4 py-2 text-sm text-canvas disabled:opacity-50">{saving ? "Saving…" : "Save upload"}</button>
        </form>
      )}
    </div>
  );
}

function SettingsForm({ profile, firebaseUser, onSaved, sendVerificationEmail, refreshFirebaseUser }) {
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
  const [avatar, setAvatar] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");

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
      setSettingsError("");
    } catch (err) {
      setSettingsError(err.response?.data?.error || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload() {
    if (!avatar) return;
    const fd = new FormData();
    fd.append("avatar", avatar);
    setSettingsError("");
    try {
      await api.post("/api/users/me/avatar", fd);
      setAvatar(null);
      await onSaved();
    } catch (err) {
      setSettingsError(err.response?.data?.error || "Could not upload profile photo.");
    }
  }

  async function handleInstitutionVerification() {
    setSettingsError("");
    setVerificationMessage("");
    try {
      await refreshFirebaseUser();
      const { data } = await api.post("/api/users/me/verify-institution", { email: profile.email });
      setVerificationMessage(`Verified for ${data.institution}.`);
      await onSaved();
    } catch (err) {
      setSettingsError(err.response?.data?.error || "Could not verify this institution email.");
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <section className="space-y-3 border-b border-line pb-6">
        <h2 className="font-display text-lg text-ink">Profile photo</h2>
        <div className="flex items-center gap-4">
          <img src={profile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || "User"}`} alt="" className="h-16 w-16 rounded-full border border-line object-cover" />
          <div className="space-y-2">
            <input className="block max-w-full text-sm" type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
            <button type="button" disabled={!avatar} onClick={handleAvatarUpload} className="rounded border border-line px-3 py-1.5 text-sm disabled:opacity-50">Upload photo</button>
          </div>
        </div>
      </section>

      <section className="space-y-3 border-b border-line pb-6">
        <h2 className="font-display text-lg text-ink">Institution access</h2>
        <p className="text-sm text-muted">Your account email must be verified and use a recognized institutional domain to open institutional uploads.</p>
        <p className="text-sm text-ink">Account email: {profile?.email || "Not available"}</p>
        {profile?.isInstitutionalVerified ? (
          <p className="text-sm text-accent">Verified: {profile.institution}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {!firebaseUser?.emailVerified && <button type="button" onClick={async () => { try { await sendVerificationEmail(); setVerificationMessage("Verification email sent. Verify it, then return here and confirm."); } catch { setSettingsError("Could not send the verification email."); } }} className="rounded border border-line px-3 py-2 text-sm">Send email verification</button>}
            <button type="button" onClick={handleInstitutionVerification} className="rounded border border-line px-3 py-2 text-sm hover:border-accent">Confirm institution email</button>
          </div>
        )}
        {verificationMessage && <p className="text-sm text-accent">{verificationMessage}</p>}
      </section>

      <form onSubmit={handleSave} className="space-y-4">
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
      {settingsError && <p className="text-sm text-red-600">{settingsError}</p>}
    </div>
  );
}
