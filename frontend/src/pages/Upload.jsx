import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { CONTENT_TYPES, LICENSES, VISIBILITY_OPTIONS } from "../constants.js";

const initialState = {
  title: "",
  subtitle: "",
  abstract: "",
  description: "",
  type: "",
  category: "",
  subcategory: "",
  tags: "",
  keywords: "",
  language: "English",
  country: "",
  university: "",
  department: "",
  course: "",
  teacher: "",
  semester: "",
  year: "",
  coAuthors: "",
  license: "all_rights_reserved",
  visibility: "public",
  githubRepo: "",
  youtubeUrl: "",
  doi: "",
  publication: "",
};

export default function Upload() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [files, setFiles] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);
  const [authorizedEmails, setAuthorizedEmails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title || !form.type || !form.category) {
      setError("Title, type, and category are required.");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, value));
      if (form.visibility === "protected") fd.append("authorizedEmails", authorizedEmails);
      files.forEach((f) => fd.append("files", f));
      if (thumbnail) fd.append("thumbnail", thumbnail);

      const { data } = await api.post("/api/content", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate(`/content/${data.slug}`);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong submitting your upload.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl text-ink">Share your work</h1>
      <p className="mt-1 text-sm text-muted">
        Uploads are reviewed before they appear publicly. That usually takes less than a day.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-10">
        <Section title="Basics">
          <Field label="Title" required>
            <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} />
          </Field>
          <Field label="Subtitle">
            <input className="input" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
          </Field>
          <Field label="Abstract" hint="A short summary shown on cards and previews (max 1000 characters).">
            <textarea
              className="input min-h-[90px]"
              value={form.abstract}
              onChange={(e) => update("abstract", e.target.value)}
              maxLength={1000}
            />
          </Field>
          <Field label="Full description">
            <textarea
              className="input min-h-[140px]"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
        </Section>

        <Section title="Classification">
          <Field label="Type" required>
            <select className="input" value={form.type} onChange={(e) => update("type", e.target.value)}>
              <option value="">Select a type…</option>
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category" required hint="e.g. Computer Science, Mechanical Engineering, Economics">
            <input className="input" value={form.category} onChange={(e) => update("category", e.target.value)} />
          </Field>
          <Field label="Subcategory">
            <input className="input" value={form.subcategory} onChange={(e) => update("subcategory", e.target.value)} />
          </Field>
          <Field label="Tags" hint="Comma separated, e.g. machine-learning, nlp, computer-vision">
            <input className="input" value={form.tags} onChange={(e) => update("tags", e.target.value)} />
          </Field>
          <Field label="Keywords" hint="Comma separated">
            <input className="input" value={form.keywords} onChange={(e) => update("keywords", e.target.value)} />
          </Field>
          <Field label="Language">
            <input className="input" value={form.language} onChange={(e) => update("language", e.target.value)} />
          </Field>
        </Section>

        <Section title="Academic context">
          <Field label="Country">
            <input className="input" value={form.country} onChange={(e) => update("country", e.target.value)} />
          </Field>
          <Field label="University / School">
            <input className="input" value={form.university} onChange={(e) => update("university", e.target.value)} />
          </Field>
          <Field label="Department">
            <input className="input" value={form.department} onChange={(e) => update("department", e.target.value)} />
          </Field>
          <Field label="Course">
            <input className="input" value={form.course} onChange={(e) => update("course", e.target.value)} />
          </Field>
          <Field label="Teacher / Professor">
            <input className="input" value={form.teacher} onChange={(e) => update("teacher", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Semester">
              <input className="input" value={form.semester} onChange={(e) => update("semester", e.target.value)} />
            </Field>
            <Field label="Year">
              <input
                className="input"
                type="number"
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Authorship & license">
          <Field label="Co-authors" hint="Comma separated names">
            <input className="input" value={form.coAuthors} onChange={(e) => update("coAuthors", e.target.value)} />
          </Field>
          <Field label="License">
            <select className="input" value={form.license} onChange={(e) => update("license", e.target.value)}>
              {LICENSES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Visibility">
            <select className="input" value={form.visibility} onChange={(e) => update("visibility", e.target.value)}>
              {VISIBILITY_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>
          {form.visibility === "institutional" && (
            <p className="text-xs text-muted">
              Only users with a verified email from your institution can view this upload.
            </p>
          )}
          {form.visibility === "protected" && (
            <Field label="Advisor / team emails (optional)" hint="Comma separated. Leave blank for only you; added recipients need a verified account email.">
              <input
                className="input"
                type="text"
                value={authorizedEmails}
                onChange={(e) => setAuthorizedEmails(e.target.value)}
                placeholder="advisor@university.edu, teammate@example.com"
              />
            </Field>
          )}
        </Section>

        <Section title="Files & links">
          <Field label="Thumbnail image">
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0] || null)}
            />
          </Field>
          <Field label="Files" required hint="PDF, DOCX, PPT, XLSX, ZIP, or any other format — up to 10 files.">
            <input
              className="input"
              type="file"
              multiple
              required
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
          </Field>
          <Field label="GitHub repository">
            <input className="input" value={form.githubRepo} onChange={(e) => update("githubRepo", e.target.value)} />
          </Field>
          <Field label="YouTube link">
            <input className="input" value={form.youtubeUrl} onChange={(e) => update("youtubeUrl", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="DOI">
              <input className="input" value={form.doi} onChange={(e) => update("doi", e.target.value)} />
            </Field>
            <Field label="Publication">
              <input className="input" value={form.publication} onChange={(e) => update("publication", e.target.value)} />
            </Field>
          </div>
        </Section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent py-3 text-sm font-medium text-canvas hover:bg-accent-dark disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset>
      <legend className="mb-4 border-b border-line pb-2 font-display text-lg text-ink">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
