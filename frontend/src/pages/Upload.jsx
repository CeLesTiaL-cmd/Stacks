import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2, Check, CircleCheck, CloudUpload, Globe, Lock, X } from "lucide-react";
import api, { errorMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useI18n } from "../i18n/index.jsx";
import { cn } from "../lib/cn.js";
import { BLOCKED_EXT, CONTENT_TYPES, extOf, fileKind, LICENSES, MAX_FILES, MAX_FILE_MB, TONE } from "../lib/fileTypes.js";
import { formatBytes } from "../lib/format.js";
import Button from "../components/ui/Button.jsx";
import { Field, Input, Select, Textarea } from "../components/ui/form.jsx";
import { Alert, ProgressBar } from "../components/ui/feedback.jsx";

const INITIAL = { title: "", type: "", category: "", abstract: "", description: "", tags: "", language: "English", country: "", university: "", department: "", course: "", teacher: "", semester: "", year: "", coAuthors: "", githubRepo: "", youtubeUrl: "", doi: "", publication: "", license: "all_rights_reserved", visibility: "public", authorizedEmails: "" };
const VIS = [{ id: "public", icon: Globe }, { id: "institutional", icon: Building2 }, { id: "protected", icon: Lock }];

export default function Upload() {
  const { t, n } = useI18n();
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [files, setFiles] = useState([]);
  const [thumb, setThumb] = useState(null);
  const [errors, setErrors] = useState({});
  const [fileMsg, setFileMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);
  const input = useRef(null);
  const ctrl = useRef(null);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const verified = !!profile?.isInstitutionalVerified;

  const addFiles = useCallback((list) => {
    const problems = [];
    setFiles((current) => {
      const next = [...current];
      for (const f of Array.from(list)) {
        if (BLOCKED_EXT.includes(extOf(f.name))) { problems.push(t("up.err.blocked", { name: f.name })); continue; }
        if (f.size > MAX_FILE_MB * 1024 * 1024) { problems.push(t("up.err.big", { name: f.name, max: MAX_FILE_MB })); continue; }
        if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
        if (next.length >= MAX_FILES) { problems.push(t("up.err.count", { max: MAX_FILES })); break; }
        next.push(f);
      }
      return next;
    });
    setFileMsg(problems.join(" "));
  }, [t]);
  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const validate = (s) => {
    const e = {};
    if (s === 0 && files.length === 0) e.files = t("up.err.noFiles");
    if (s === 1) {
      if (!form.title.trim()) e.title = t("up.err.required");
      if (!form.type) e.type = t("up.err.required");
      if (!form.category.trim()) e.category = t("up.err.required");
    }
    if (s === 2 && form.visibility === "institutional" && !verified) e.visibility = t("up.err.verify");
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => validate(step) && setStep((s) => s + 1);

  const submit = async () => {
    if (!validate(2)) return;
    setBusy(true); setProgress(0); setServerError("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append("files", f));
    if (thumb) fd.append("thumbnail", thumb);
    ctrl.current = new AbortController();
    try {
      await api.post("/api/content", fd, { timeout: 0, signal: ctrl.current.signal, onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)) });
      setDone(true);
    } catch (err) { if (err.code !== "ERR_CANCELED") setServerError(errorMessage(err, t)); }
    finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="container-x flex max-w-xl flex-col items-center py-24 text-center">
        <CircleCheck className="size-14 text-accent-text" strokeWidth={1.5} />
        <h1 className="mt-5 font-display text-3xl font-bold tracking-display">{t("up.doneTitle")}</h1>
        <p className="mt-2 text-muted">{t("up.doneText")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/dashboard">{t("up.viewMine")}</Button>
          <Button variant="secondary" onClick={() => { setDone(false); setStep(0); setForm(INITIAL); setFiles([]); setThumb(null); }}>{t("up.another")}</Button>
        </div>
      </div>
    );
  }
  const steps = [t("up.step1"), t("up.step2"), t("up.step3")];
  const F = (id, key, label, extra = {}) => <Field label={label} {...extra}>{(i) => <Input id={i} value={form[key]} onChange={(e) => set(key, e.target.value)} />}</Field>;

  return (
    <div className="container-x max-w-3xl py-8 sm:py-12">
      <h1 className="font-display text-3xl font-bold tracking-display sm:text-4xl">{t("up.title")}</h1>
      <p className="mt-2 text-muted">{t("up.sub")}</p>
      <ol className="relative mt-8 flex justify-between" aria-label="Progress">
        <span aria-hidden className="absolute inset-x-5 top-5 h-0.5 bg-line" />
        <span aria-hidden className="absolute start-5 top-5 h-0.5 bg-ink transition-[width] duration-500" style={{ width: `calc((100% - 2.5rem) * ${step / 2})` }} />
        {steps.map((label, i) => (
          <li key={label} className="relative z-10 flex w-24 flex-col items-center gap-2 text-center">
            <span className={cn("inline-flex size-10 items-center justify-center rounded-full border-[3px] border-ink text-sm font-semibold transition", i < step ? "bg-accent text-accent-ink" : i === step ? "bg-raised" : "bg-canvas text-muted")}>{i < step ? <Check className="size-4" /> : n(i + 1)}</span>
            <span className={cn("text-xs", i === step ? "font-medium text-ink" : "text-muted")}>{label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-3xl border border-line bg-raised p-5 sm:p-8">
        {step === 0 && (
          <div className="space-y-5">
            <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
              onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
              className={cn("flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition", drag ? "border-accent bg-accent-tint" : "border-line hover:border-ink/40 hover:bg-surface")}>
              <CloudUpload className="size-9 text-muted" strokeWidth={1.5} />
              <p className="mt-3 font-medium">{t("up.drop")}</p>
              <p className="mt-1 text-xs text-muted">{t("up.limits", { count: MAX_FILES, max: MAX_FILE_MB })}</p>
              <input ref={input} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </div>
            {errors.files && <p role="alert" className="text-sm text-danger">{errors.files}</p>}
            {fileMsg && <Alert tone="warn">{fileMsg}</Alert>}
            {files.length > 0 && (<>
              <ul className="divide-y divide-line rounded-2xl border border-line">{files.map((f, i) => { const k = fileKind(f.name); const Icon = k.icon; return (
                <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg", TONE[k.tone].bg)}><Icon className={cn("size-4", TONE[k.tone].text)} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm">{f.name}</span><span className="text-xs text-muted tabular-nums">{formatBytes(f.size)}</span></span>
                  <button onClick={() => setFiles((c) => c.filter((_, x) => x !== i))} className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-danger" aria-label={t("common.remove")}><X className="size-4" /></button>
                </li>); })}</ul>
              <p className="text-xs text-muted tabular-nums">{t("up.total", { count: n(files.length), size: formatBytes(totalSize) })}</p>
            </>)}
            <Field label={t("up.thumb")} hint={t("up.thumbHint")}>{(id) => <input id={id} type="file" accept="image/*" onChange={(e) => setThumb(e.target.files[0] || null)} className="block w-full text-sm text-muted file:me-3 file:rounded-full file:border-0 file:bg-surface file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink" />}</Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("up.f.title")} required error={errors.title} className="sm:col-span-2">{(id) => <Input id={id} value={form.title} maxLength={200} invalid={!!errors.title} onChange={(e) => set("title", e.target.value)} />}</Field>
            <Field label={t("up.f.type")} required error={errors.type}>{(id) => <Select id={id} value={form.type} onChange={(e) => set("type", e.target.value)}><option value="">{t("up.choose")}</option>{CONTENT_TYPES.map((v) => <option key={v} value={v}>{t(`type.${v}`)}</option>)}</Select>}</Field>
            <Field label={t("up.f.category")} required error={errors.category} hint={t("up.f.categoryHint")}>{(id) => <Input id={id} value={form.category} invalid={!!errors.category} onChange={(e) => set("category", e.target.value)} />}</Field>
            <Field label={t("up.f.abstract")} hint={`${form.abstract.length}/1000`} className="sm:col-span-2">{(id) => <Textarea id={id} value={form.abstract} maxLength={1000} onChange={(e) => set("abstract", e.target.value)} />}</Field>
            <Field label={t("up.f.description")} className="sm:col-span-2">{(id) => <Textarea id={id} value={form.description} onChange={(e) => set("description", e.target.value)} />}</Field>
            {F(null, "tags", t("up.f.tags"), { hint: t("up.f.tagsHint"), className: "sm:col-span-2" })}
            {F(null, "university", t("filter.university"))}{F(null, "department", t("filter.department"))}
            {F(null, "country", t("filter.country"))}{F(null, "language", t("filter.language"))}
            {F(null, "course", t("detail.course"))}{F(null, "teacher", t("detail.teacher"))}
            {F(null, "semester", t("detail.semester"))}
            <Field label={t("filter.year")}>{(id) => <Input id={id} type="number" inputMode="numeric" value={form.year} onChange={(e) => set("year", e.target.value)} />}</Field>
            {F(null, "coAuthors", t("up.f.coAuthors"), { hint: t("up.f.tagsHint"), className: "sm:col-span-2" })}
            {F(null, "githubRepo", "GitHub")}{F(null, "youtubeUrl", "YouTube")}{F(null, "doi", "DOI")}{F(null, "publication", t("detail.publication"))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <fieldset>
              <legend className="mb-3 text-sm font-medium">{t("detail.visibility")}</legend>
              <div className="grid grid-cols-1 gap-3">{VIS.map(({ id, icon: Icon }) => { const active = form.visibility === id; return (
                <label key={id} className={cn("flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition", active ? "border-accent bg-accent-tint/60" : "border-line hover:border-ink/30", id === "institutional" && !verified && "opacity-70")}>
                  <input type="radio" name="visibility" className="sr-only" checked={active} onChange={() => set("visibility", id)} />
                  <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-ink", active ? "bg-accent text-accent-ink" : "bg-raised")}><Icon className="size-4" /></span>
                  <span className="min-w-0"><span className="block font-medium">{t(`vis.${id}`)}</span><span className="block text-sm text-muted">{t(`vis.${id}.d`)}</span></span>
                </label>); })}</div>
              {errors.visibility && <p role="alert" className="mt-2 text-sm text-danger">{errors.visibility}</p>}
              {form.visibility === "institutional" && !verified && <Alert tone="warn" className="mt-3">{t("up.needVerify")} <Link className="underline" to="/dashboard">{t("up.verifyLink")}</Link></Alert>}
              {form.visibility === "institutional" && verified && <p className="mt-3 text-sm text-muted">{t("up.onlyInst", { name: profile.institution })}</p>}
            </fieldset>
            {form.visibility === "protected" && <Field label={t("up.f.authorized")} hint={t("up.f.authorizedHint")}>{(id) => <Input id={id} placeholder="advisor@university.edu, teammate@gmail.com" value={form.authorizedEmails} onChange={(e) => set("authorizedEmails", e.target.value)} />}</Field>}
            <Field label={t("detail.license")}>{(id) => <Select id={id} value={form.license} onChange={(e) => set("license", e.target.value)}>{LICENSES.map((l) => <option key={l} value={l}>{t(`license.${l}`)}</option>)}</Select>}</Field>
            <dl className="divide-y divide-line rounded-2xl border border-line text-sm">{[[t("up.step1"), t("up.total", { count: n(files.length), size: formatBytes(totalSize) })], [t("up.f.title"), form.title], [t("up.f.type"), form.type && t(`type.${form.type}`)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="min-w-0 truncate text-end font-medium">{v}</dd></div>)}</dl>
            {busy && <div><ProgressBar value={progress} /><p className="mt-2 text-sm text-muted tabular-nums">{t("up.uploading", { pct: n(progress) })}</p></div>}
            {serverError && <Alert tone="danger">{serverError}</Alert>}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || busy} iconStart={<ArrowLeft className="size-4 rtl:rotate-180" />}>{t("common.back")}</Button>
          {step < 2 ? <Button onClick={next} iconEnd={<ArrowRight className="size-4 rtl:rotate-180" />}>{t("common.next")}</Button>
            : busy ? <Button variant="secondary" onClick={() => ctrl.current?.abort()}>{t("common.cancel")}</Button>
            : <Button onClick={submit} iconStart={<CloudUpload className="size-4" />}>{t("up.submit")}</Button>}
        </div>
      </div>
    </div>
  );
}
