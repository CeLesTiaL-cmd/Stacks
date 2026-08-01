import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-base text-ink">Stacks</p>
        <nav className="flex flex-wrap gap-5">
          <Link to="/discover" className="hover:text-ink">
            Discover
          </Link>
          <Link to="/register" className="hover:text-ink">
            Join
          </Link>
          <a href="mailto:hello@example.com" className="hover:text-ink">
            Contact
          </a>
        </nav>
        <p>© {new Date().getFullYear()} Stacks. Built for the world's classrooms.</p>
      </div>
    </footer>
  );
}
