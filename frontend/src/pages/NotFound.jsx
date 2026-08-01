import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="px-4 py-24 text-center">
      <p className="font-display text-5xl text-ink">404</p>
      <p className="mt-2 text-muted">This page isn't on the shelf.</p>
      <Link to="/" className="mt-4 inline-block text-accent hover:underline">
        Back home
      </Link>
    </div>
  );
}
