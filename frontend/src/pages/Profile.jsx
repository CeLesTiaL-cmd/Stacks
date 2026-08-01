import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";

export default function Profile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get(`/api/users/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.error || "Could not load this profile"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="px-4 py-20 text-center text-muted">Loading…</div>;
  if (error) return <div className="px-4 py-20 text-center text-muted">{error}</div>;

  const { profile, uploads } = data;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-start gap-5">
        <img
          src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`}
          alt=""
          className="h-20 w-20 rounded-full border border-line object-cover"
        />
        <div>
          <h1 className="font-display text-2xl text-ink">{profile.name}</h1>
          <p className="text-sm text-muted">
            {[profile.degree, profile.department, profile.university].filter(Boolean).join(" · ") ||
              "Member of Stacks"}
          </p>
          {profile.bio && <p className="mt-2 max-w-lg text-sm text-ink/90">{profile.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Website
              </a>
            )}
            {profile.github && (
              <a href={profile.github} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                GitHub
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>

      {profile.stats && (
        <div className="mt-8 grid grid-cols-2 gap-4 border-y border-line py-5 font-mono text-sm sm:grid-cols-4">
          <Stat label="Uploads" value={profile.stats.uploadsCount} />
          <Stat label="Stars received" value={profile.stats.starsReceived} />
          <Stat label="Downloads" value={profile.stats.downloadsReceived} />
          <Stat label="Followers" value={profile.stats.followersCount} />
        </div>
      )}

      <h2 className="mt-10 font-display text-xl text-ink">Uploads</h2>
      {uploads.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing public here yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {uploads.map((item) => (
            <ContentCard key={item._id} item={item} />
          ))}
        </div>
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
