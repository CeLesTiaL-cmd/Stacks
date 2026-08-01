import { CONTENT_TYPES, SORT_OPTIONS } from "../constants.js";

export default function FilterSidebar({ filters, options, onChange }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="w-full shrink-0 space-y-6 sm:w-56">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
          Sort by
        </label>
        <select
          value={filters.sort || "recent"}
          onChange={(e) => set("sort", e.target.value)}
          className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-sm"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Filter label="Type" value={filters.type} onChange={(v) => set("type", v)}>
        <option value="">All types</option>
        {CONTENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </Filter>

      <Filter label="Category" value={filters.category} onChange={(v) => set("category", v)}>
        <option value="">All categories</option>
        {(options.categories || []).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Filter>

      <Filter label="Country" value={filters.country} onChange={(v) => set("country", v)}>
        <option value="">All countries</option>
        {(options.countries || []).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Filter>

      <Filter label="University" value={filters.university} onChange={(v) => set("university", v)}>
        <option value="">All universities</option>
        {(options.universities || []).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Filter>

      <Filter label="Department" value={filters.department} onChange={(v) => set("department", v)}>
        <option value="">All departments</option>
        {(options.departments || []).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Filter>

      <Filter label="Year" value={filters.year} onChange={(v) => set("year", v)}>
        <option value="">All years</option>
        {(options.years || []).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Filter>

      <Filter label="Language" value={filters.language} onChange={(v) => set("language", v)}>
        <option value="">All languages</option>
        {(options.languages || []).map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </Filter>

      <button
        onClick={() => onChange({ sort: "recent" })}
        className="text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
      >
        Clear all filters
      </button>
    </aside>
  );
}

function Filter({ label, value, onChange, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-sm"
      >
        {children}
      </select>
    </div>
  );
}
