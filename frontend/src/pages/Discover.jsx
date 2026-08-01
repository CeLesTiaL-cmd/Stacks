import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client.js";
import ContentCard from "../components/ContentCard.jsx";
import FilterSidebar from "../components/FilterSidebar.jsx";

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({});

  const filters = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    api.get("/api/content/filters").then(({ data }) => setOptions(data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get("/api/content", { params: { ...filters, page } })
      .then(({ data }) => {
        setItems(data.items);
        setTotal(data.total);
        setPages(data.pages);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, page]);

  useEffect(() => {
    load();
  }, [load]);

  function updateFilters(next) {
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v));
    setPage(1);
    setSearchParams(cleaned);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl text-ink">
          {filters.q ? `Results for “${filters.q}”` : "Discover"}
        </h1>
        <p className="text-sm text-muted">{loading ? "Searching…" : `${total} item${total === 1 ? "" : "s"}`}</p>
      </div>

      <div className="flex flex-col gap-8 sm:flex-row">
        <FilterSidebar filters={filters} options={options} onChange={updateFilters} />

        <div className="flex-1">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : items.length === 0 ? (
            <div className="rounded-md border border-dashed border-line px-6 py-16 text-center">
              <p className="font-display text-lg text-ink">Nothing matches yet.</p>
              <p className="mt-1 text-sm text-muted">Try a broader search or clear a filter.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ContentCard key={item._id} item={item} />
                ))}
              </div>

              {pages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3 text-sm">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-muted">
                    Page {page} of {pages}
                  </span>
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-md border border-line px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
