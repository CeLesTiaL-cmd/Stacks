import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { profile, firebaseUser, logout, isModerator } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : "/discover");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:gap-6">
        <Link to="/" className="shrink-0 font-display text-xl font-semibold tracking-tight text-ink">
          Stacks
        </Link>

        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="search"
              placeholder="Search papers, theses, notes, projects…"
              className="w-full rounded-md border border-line bg-surface px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:bg-canvas focus:outline-none"
            />
          </div>
        </form>

        <nav className="hidden items-center gap-5 text-sm text-muted sm:flex">
          <Link to="/discover" className="hover:text-ink">
            Discover
          </Link>
          {firebaseUser && (
            <Link to="/upload" className="hover:text-ink">
              Upload
            </Link>
          )}
          {isModerator && (
            <Link to="/admin" className="hover:text-ink">
              Admin
            </Link>
          )}
        </nav>

        {firebaseUser ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-line px-1 py-1 pr-3 text-sm hover:border-accent"
            >
              <img
                src={profile?.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=" + (profile?.name || "U")}
                alt=""
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="hidden text-ink sm:inline">{profile?.name?.split(" ")[0]}</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-line bg-canvas py-1 shadow-subtle">
                <Link
                  to={`/profile/${profile?._id}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-ink hover:bg-surface"
                >
                  My profile
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-ink hover:bg-surface"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    navigate("/");
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-ink hover:bg-surface"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <Link to="/login" className="text-ink hover:text-accent">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-accent px-3 py-1.5 text-canvas hover:bg-accent-dark"
            >
              Join
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
