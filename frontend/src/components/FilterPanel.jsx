import { useI18n } from "../i18n/index.jsx";
import { CONTENT_TYPES } from "../lib/fileTypes.js";
import { Field, Select } from "./ui/form.jsx";
import Button from "./ui/Button.jsx";

export const FILTER_KEYS = ["type", "category", "country", "university", "department", "year", "language"];

export default function FilterPanel({ filters, options, onChange, onClear }) {
  const { t } = useI18n();
  const set = (k, v) => onChange({ ...filters, [k]: v, page: undefined });
  const list = (arr = []) => arr.map((v) => <option key={v} value={v}>{v}</option>);
  const sel = (key, label, opts) => (
    <Field label={label}>{(id) => <Select id={id} value={filters[key] || ""} onChange={(e) => set(key, e.target.value)}><option value="">{t("filter.all")}</option>{opts}</Select>}</Field>
  );
  return (
    <div className="space-y-4">
      {sel("type", t("filter.type"), CONTENT_TYPES.map((v) => <option key={v} value={v}>{t(`type.${v}`)}</option>))}
      {sel("category", t("filter.category"), list(options.categories))}
      {sel("country", t("filter.country"), list(options.countries))}
      {sel("university", t("filter.university"), list(options.universities))}
      {sel("department", t("filter.department"), list(options.departments))}
      {sel("year", t("filter.year"), list(options.years))}
      {sel("language", t("filter.language"), list(options.languages))}
      <Button variant="ghost" size="sm" onClick={onClear} className="w-full">{t("filter.clear")}</Button>
    </div>
  );
}
